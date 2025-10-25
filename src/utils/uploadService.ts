export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, or WebP images only.',
    };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB

  if (file.size > maxSize) {
    return { isValid: false, error: 'File too large. Maximum size is 10MB.' };
  }

  return { isValid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Deprecated: Base64 conversion no longer needed with Vercel Blob
// Images are now uploaded to Vercel Blob storage via /api/upload
// export function createImagePreview(file: File): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => resolve(reader.result as string);
//     reader.onerror = reject;
//     reader.readAsDataURL(file);
//   });
// }
