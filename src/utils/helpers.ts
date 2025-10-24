import { nanoid } from 'nanoid';

/**
 * Generate a unique message ID
 */
export const generateMessageId = (): string => {
  return nanoid();
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate image file
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF images only.',
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File too large. Maximum size is 10MB.',
    };
  }

  return { isValid: true };
};

/**
 * Convert file to base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix to get just the base64 data
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Sanitize text for display
 */
export const sanitizeText = (text: string): string => {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Generate a random color for avatars
 */
export const generateAvatarColor = (seed: string): string => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
  ];
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Check if running in browser
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Get user's preferred language
 */
export const getUserLanguage = (): 'en' | 'he' => {
  if (!isBrowser()) return 'en';
  
  const stored = localStorage.getItem('scam-hunter-language');
  if (stored === 'he' || stored === 'en') return stored;
  
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('he') ? 'he' : 'en';
};

/**
 * Set user's preferred language
 */
export const setUserLanguage = (lang: 'en' | 'he'): void => {
  if (!isBrowser()) return;
  localStorage.setItem('scam-hunter-language', lang);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!isBrowser()) return false;
  
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Generate a unique session ID
 */
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${nanoid(8)}`;
};

/**
 * Get or create anonymous user ID
 */
export const getAnonymousUserId = (): string => {
  if (!isBrowser()) return generateSessionId();
  
  let userId = localStorage.getItem('scam-hunter-user-id');
  if (!userId) {
    userId = `user_${Date.now()}_${nanoid(12)}`;
    localStorage.setItem('scam-hunter-user-id', userId);
  }
  
  return userId;
};

/**
 * Format analysis classification for display
 */
export const formatClassification = (classification: string, lang: 'en' | 'he' = 'en'): string => {
  const translations = {
    en: {
      SAFE: 'Safe',
      SUSPICIOUS: 'Suspicious', 
      HIGH_RISK: 'High Risk',
    },
    he: {
      SAFE: 'בטוח',
      SUSPICIOUS: 'חשוד',
      HIGH_RISK: 'סיכון גבוה',
    },
  };
  
  return translations[lang][classification as keyof typeof translations.en] || classification;
};

/**
 * Calculate time ago string
 */
export const timeAgo = (date: Date, lang: 'en' | 'he' = 'en'): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const intervals = {
    en: {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    },
    he: {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    },
  };
  
  const labels = {
    en: {
      year: ['year', 'years'],
      month: ['month', 'months'],
      week: ['week', 'weeks'],
      day: ['day', 'days'],
      hour: ['hour', 'hours'],
      minute: ['minute', 'minutes'],
      now: 'just now',
      ago: 'ago',
    },
    he: {
      year: ['שנה', 'שנים'],
      month: ['חודש', 'חודשים'],
      week: ['שבוע', 'שבועות'],
      day: ['יום', 'ימים'],
      hour: ['שעה', 'שעות'],
      minute: ['דקה', 'דקות'],
      now: 'עכשיו',
      ago: 'לפני',
    },
  };
  
  if (diffInSeconds < 60) {
    return labels[lang].now;
  }
  
  for (const [unit, seconds] of Object.entries(intervals[lang])) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      const unitLabels = labels[lang][unit as keyof typeof labels.en];
      const label = interval === 1 ? unitLabels[0] : unitLabels[1];
      
      if (lang === 'he') {
        return `${labels[lang].ago} ${interval} ${label}`;
      } else {
        return `${interval} ${label} ${labels[lang].ago}`;
      }
    }
  }
  
  return labels[lang].now;
};