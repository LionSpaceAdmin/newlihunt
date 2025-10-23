// WebSocket message handler for streaming analysis
const AWS = require('aws-sdk');
const GeminiClient = require('../analyze/gemini-client');
const https = require('https');
const http = require('http');

const apiGateway = new AWS.ApiGatewayManagementApi({
    endpoint: process.env.WEBSOCKET_ENDPOINT
});

// Fetch image from URL and convert to base64
const fetchImageAsBase64 = async (imageUrl) => {
    return new Promise((resolve, reject) => {
        const url = new URL(imageUrl);
        const client = url.protocol === 'https:' ? https : http;
        
        const request = client.get(imageUrl, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to fetch image: HTTP ${response.statusCode}`));
                return;
            }
            
            const contentType = response.headers['content-type'];
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.some(type => contentType?.includes(type))) {
                reject(new Error(`Invalid image type: ${contentType}`));
                return;
            }
            
            const contentLength = parseInt(response.headers['content-length'] || '0');
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (contentLength > maxSize) {
                reject(new Error(`Image too large: ${contentLength} bytes`));
                return;
            }
            
            const chunks = [];
            let totalSize = 0;
            
            response.on('data', (chunk) => {
                chunks.push(chunk);
                totalSize += chunk.length;
                
                if (totalSize > maxSize) {
                    request.destroy();
                    reject(new Error(`Image too large: ${totalSize} bytes`));
                    return;
                }
            });
            
            response.on('end', () => {
                try {
                    const buffer = Buffer.concat(chunks);
                    const base64 = buffer.toString('base64');
                    
                    resolve({
                        base64,
                        mimeType: contentType,
                        size: totalSize
                    });
                } catch (error) {
                    reject(new Error(`Failed to convert image: ${error.message}`));
                }
            });
            
            response.on('error', (error) => {
                reject(new Error(`Download error: ${error.message}`));
            });
        });
        
        request.on('error', (error) => {
            reject(new Error(`Request error: ${error.message}`));
        });
        
        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error('Image download timeout'));
        });
    });
};

// Streaming analysis with real-time updates
exports.handler = async (event) => {
    const connectionId = event.requestContext.connectionId;
    const body = JSON.parse(event.body || '{}');
    
    console.log('WebSocket message received:', { connectionId, action: body.action });
    
    try {
        if (body.action === 'analyze') {
            await handleAnalysisRequest(connectionId, body);
        } else {
            await sendMessage(connectionId, {
                type: 'error',
                message: 'Unknown action'
            });
        }
        
        return { statusCode: 200 };
        
    } catch (error) {
        console.error('WebSocket message error:', error);
        
        try {
            await sendMessage(connectionId, {
                type: 'error',
                message: 'Analysis failed',
                details: error.message
            });
        } catch (sendError) {
            console.error('Failed to send error message:', sendError);
        }
        
        return { statusCode: 500 };
    }
};

async function handleAnalysisRequest(connectionId, body) {
    const { message, imageBase64, imageMimeType, imageUrl } = body;
    
    // Validate input
    if (!message && !imageBase64 && !imageUrl) {
        await sendMessage(connectionId, {
            type: 'error',
            message: 'Either message text, image data, or image URL is required'
        });
        return;
    }
    
    // Send analysis started message
    await sendMessage(connectionId, {
        type: 'analysis_started',
        message: 'Scam Hunter is analyzing your content...'
    });
    
    try {
        // Process image if provided
        let processedImageData = null;
        
        // Handle image URL (preferred method for S3 uploads)
        if (imageUrl) {
            try {
                await sendMessage(connectionId, {
                    type: 'progress',
                    message: 'Downloading image...',
                    progress: 15
                });
                
                const imageData = await fetchImageAsBase64(imageUrl);
                processedImageData = GeminiClient.processImageData(imageData.base64, imageData.mimeType);
                
                await sendMessage(connectionId, {
                    type: 'progress',
                    message: 'Image processed successfully...',
                    progress: 30
                });
            } catch (error) {
                await sendMessage(connectionId, {
                    type: 'error',
                    message: 'Failed to process image',
                    details: error.message
                });
                return;
            }
        }
        // Fallback to base64 data (for backward compatibility)
        else if (imageBase64 && imageMimeType) {
            processedImageData = GeminiClient.processImageData(imageBase64, imageMimeType);
            
            await sendMessage(connectionId, {
                type: 'progress',
                message: 'Processing image...',
                progress: 25
            });
        }
        
        // Send progress update
        await sendMessage(connectionId, {
            type: 'progress',
            message: 'Analyzing content for scam patterns...',
            progress: 50
        });
        
        // Initialize Gemini client and generate analysis
        const geminiClient = new GeminiClient(process.env.GEMINI_API_KEY);
        
        // Send progress update
        await sendMessage(connectionId, {
            type: 'progress',
            message: 'Generating risk assessment...',
            progress: 75
        });
        
        const analysisResult = await geminiClient.generateAnalysis(message, processedImageData);
        
        // Send final result
        await sendMessage(connectionId, {
            type: 'analysis_complete',
            result: {
                ...analysisResult,
                metadata: {
                    timestamp: new Date().toISOString(),
                    model: "gemini-2.5-pro",
                    hasImage: !!processedImageData,
                    inputLength: message ? message.length : 0,
                    version: "2.1.0"
                }
            },
            progress: 100
        });
        
    } catch (error) {
        console.error('Analysis error in WebSocket:', error);
        
        await sendMessage(connectionId, {
            type: 'analysis_error',
            message: 'Analysis failed',
            details: error.message
        });
    }
}

async function sendMessage(connectionId, data) {
    try {
        await apiGateway.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(data)
        }).promise();
        
    } catch (error) {
        if (error.statusCode === 410) {
            console.log('Connection no longer exists:', connectionId);
        } else {
            console.error('Failed to send message:', error);
            throw error;
        }
    }
}