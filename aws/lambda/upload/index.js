const AWS = require('aws-sdk');
const Busboy = require('busboy');
const { fromBuffer } = require('file-type');
const { withRateLimit, uploadRateLimiter } = require('../shared/rate-limiter');
const { withSecurity, defaultSecurityMiddleware, LambdaInputSanitizer } = require('../shared/security');

const s3 = new AWS.S3();

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'scam-hunt-uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
];

// Utility function to parse multipart form data
const parseMultipartData = (event) => {
    return new Promise((resolve, reject) => {
        const contentType = event.headers['content-type'] || event.headers['Content-Type'];
        
        if (!contentType || !contentType.includes('multipart/form-data')) {
            reject(new Error('Content-Type must be multipart/form-data'));
            return;
        }

        const body = event.isBase64Encoded ? 
            Buffer.from(event.body, 'base64') : 
            Buffer.from(event.body);

        const busboy = Busboy({ 
            headers: { 'content-type': contentType },
            limits: {
                fileSize: MAX_FILE_SIZE,
                files: 1
            }
        });

        let fileBuffer = null;
        let fileName = null;
        let mimeType = null;
        let fileSize = 0;

        busboy.on('file', (fieldname, file, info) => {
            const { filename, mimeType: detectedMimeType } = info;
            fileName = filename;
            mimeType = detectedMimeType;
            
            const chunks = [];
            
            file.on('data', (chunk) => {
                chunks.push(chunk);
                fileSize += chunk.length;
                
                if (fileSize > MAX_FILE_SIZE) {
                    file.destroy();
                    reject(new Error('File too large. Maximum size is 10MB.'));
                    return;
                }
            });
            
            file.on('end', () => {
                fileBuffer = Buffer.concat(chunks);
            });
            
            file.on('error', (err) => {
                reject(err);
            });
        });

        busboy.on('finish', () => {
            if (!fileBuffer) {
                reject(new Error('No file uploaded'));
                return;
            }
            
            resolve({
                buffer: fileBuffer,
                fileName,
                mimeType,
                size: fileSize
            });
        });

        busboy.on('error', (err) => {
            reject(err);
        });

        busboy.write(body);
        busboy.end();
    });
};

// Validate file type using file-type library
const validateFileType = async (buffer, declaredMimeType) => {
    try {
        const detectedType = await fromBuffer(buffer);
        
        if (!detectedType) {
            throw new Error('Unable to detect file type');
        }
        
        const detectedMimeType = detectedType.mime;
        
        // Check if detected type is allowed
        if (!ALLOWED_MIME_TYPES.includes(detectedMimeType)) {
            throw new Error(`File type ${detectedMimeType} not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
        }
        
        // Verify declared type matches detected type (security check)
        if (declaredMimeType && declaredMimeType !== detectedMimeType) {
            console.warn(`Declared MIME type (${declaredMimeType}) doesn't match detected type (${detectedMimeType})`);
        }
        
        return {
            mimeType: detectedMimeType,
            extension: detectedType.ext
        };
    } catch (error) {
        throw new Error(`File validation failed: ${error.message}`);
    }
};

// Generate secure filename
const generateSecureFilename = (originalName, extension) => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const sanitizedName = originalName ? 
        LambdaInputSanitizer.sanitizeText(originalName, 50).replace(/[^a-zA-Z0-9.-]/g, '_') : 
        'upload';
    
    return `uploads/${timestamp}_${randomId}_${sanitizedName}.${extension}`;
};

const handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        console.log('Processing upload request');
        
        // Parse multipart form data
        const fileData = await parseMultipartData(event);
        console.log(`File received: ${fileData.fileName}, size: ${fileData.size} bytes`);
        
        // Validate file type
        const validation = await validateFileType(fileData.buffer, fileData.mimeType);
        console.log(`File validated: ${validation.mimeType}`);
        
        // Generate secure filename
        const secureFilename = generateSecureFilename(fileData.fileName, validation.extension);
        
        // Upload to S3 with streaming
        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: secureFilename,
            Body: fileData.buffer,
            ContentType: validation.mimeType,
            ServerSideEncryption: 'AES256',
            Metadata: {
                'original-name': fileData.fileName || 'unknown',
                'upload-timestamp': new Date().toISOString(),
                'file-size': fileData.size.toString()
            }
        };

        console.log(`Uploading to S3: ${secureFilename}`);
        const result = await s3.upload(uploadParams).promise();
        
        // Generate presigned URL for secure access
        const signedUrl = s3.getSignedUrl('getObject', {
            Bucket: BUCKET_NAME,
            Key: secureFilename,
            Expires: 3600, // 1 hour
            ResponseContentType: validation.mimeType
        });

        console.log('Upload successful');
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                url: signedUrl,
                key: secureFilename,
                size: fileData.size,
                contentType: validation.mimeType,
                originalName: fileData.fileName,
                uploadedAt: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Upload error:', error);
        
        // Log security event for upload errors
        await defaultSecurityMiddleware.logSecurityEvent(
            event,
            'suspicious_activity',
            'medium',
            `Upload error: ${error.message}`,
            { 
                error: error.stack,
                contentType: event.headers?.['content-type']
            }
        );
        
        // Return appropriate error status codes
        let statusCode = 500;
        if (error.message.includes('File too large')) {
            statusCode = 413;
        } else if (error.message.includes('not allowed') || error.message.includes('validation failed')) {
            statusCode = 400;
        } else if (error.message.includes('multipart/form-data')) {
            statusCode = 400;
        }
        
        return {
            statusCode,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Upload failed',
                message: error.message,
                retryable: statusCode >= 500
            })
        };
    }
};

// Export handler with security and rate limiting middleware
exports.handler = withSecurity(
    defaultSecurityMiddleware,
    withRateLimit(uploadRateLimiter, handler)
);