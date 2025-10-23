/**
 * Upload service for handling secure image uploads to AWS S3
 */

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  size?: number;
  contentType?: string;
  originalName?: string;
  uploadedAt?: string;
  error?: string;
  message?: string;
  retryable?: boolean;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  timeout?: number;
  apiUrl?: string;
}

const DEFAULT_OPTIONS: Required<Omit<UploadOptions, 'onProgress'>> = {
  timeout: 30000, // 30 seconds
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.scamhunt.com'
};

/**
 * Upload an image file to the secure S3 storage
 */
export const uploadImage = async (
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  const config = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Validate file before upload
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Invalid file',
        message: validation.error || 'File validation failed',
        retryable: false
      };
    }

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('file', file);

    // Create XMLHttpRequest for progress tracking
    return new Promise<UploadResult>((resolve) => {
      const xhr = new XMLHttpRequest();

      // Set up progress tracking
      if (options.onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100)
            };
            options.onProgress!(progress);
          }
        });
      }

      // Set up timeout
      xhr.timeout = config.timeout;

      // Handle response
      xhr.addEventListener('load', () => {
        try {
          const response: UploadResult = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (err) {
          resolve({
            success: false,
            error: 'Invalid response',
            message: 'Failed to parse server response',
            retryable: true
          });
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Network error',
          message: 'Failed to upload file due to network error',
          retryable: true
        });
      });

      xhr.addEventListener('timeout', () => {
        resolve({
          success: false,
          error: 'Upload timeout',
          message: 'Upload timed out. Please try again.',
          retryable: true
        });
      });

      xhr.addEventListener('abort', () => {
        resolve({
          success: false,
          error: 'Upload cancelled',
          message: 'Upload was cancelled',
          retryable: true
        });
      });

      // Start upload
      xhr.open('POST', `${config.apiUrl}/upload`);
      xhr.send(formData);
    });

  } catch (error) {
    return {
      success: false,
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      retryable: true
    };
  }
};

/**
 * Validate image file before upload
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { 
      isValid: false, 
      error: `File too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB.` 
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      isValid: false, 
      error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}` 
    };
  }

  return { isValid: true };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Generate a preview URL for uploaded image
 */
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to create preview'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};