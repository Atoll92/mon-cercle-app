/**
 * Media type detection and validation utilities
 */

export const MEDIA_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  PDF: 'pdf',
  UNKNOWN: 'unknown'
};

/**
 * Detect media type from URL or MIME type
 * @param {string} url - Media URL
 * @param {string} mimeType - Optional MIME type
 * @returns {string} Detected media type
 */
export const detectMediaType = (url, mimeType = null) => {
  if (!url) return MEDIA_TYPES.UNKNOWN;
  
  // Check MIME type first if provided
  if (mimeType) {
    if (mimeType.startsWith('image/')) return MEDIA_TYPES.IMAGE;
    if (mimeType.startsWith('video/')) return MEDIA_TYPES.VIDEO;
    if (mimeType.startsWith('audio/')) return MEDIA_TYPES.AUDIO;
    if (mimeType === 'application/pdf') return MEDIA_TYPES.PDF;
  }
  
  // Fallback to URL extension detection
  const lowerUrl = url.toLowerCase();
  
  // Video extensions
  if (/\.(mp4|webm|mov|avi|mkv|m4v)(\?|$)/.test(lowerUrl)) {
    return MEDIA_TYPES.VIDEO;
  }
  
  // Audio extensions
  if (/\.(mp3|wav|ogg|m4a|flac|aac)(\?|$)/.test(lowerUrl)) {
    return MEDIA_TYPES.AUDIO;
  }
  
  // PDF
  if (/\.pdf(\?|$)/.test(lowerUrl)) {
    return MEDIA_TYPES.PDF;
  }
  
  // Image extensions (default for most cases)
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/.test(lowerUrl)) {
    return MEDIA_TYPES.IMAGE;
  }
  
  // Default to image if no match
  return MEDIA_TYPES.IMAGE;
};

/**
 * Get media configuration based on type
 * @param {string} mediaType - Media type
 * @returns {object} Media configuration
 */
export const getMediaConfig = (mediaType) => {
  const configs = {
    [MEDIA_TYPES.VIDEO]: {
      aspectRatio: '16/9',
      minHeight: 120,
      maxHeight: 400,
      defaultHeight: 200
    },
    [MEDIA_TYPES.AUDIO]: {
      aspectRatio: 'auto',
      minHeight: 60,
      maxHeight: 120,
      defaultHeight: 80
    },
    [MEDIA_TYPES.PDF]: {
      aspectRatio: '3/4',
      minHeight: 250,
      maxHeight: 400,
      defaultHeight: 300
    },
    [MEDIA_TYPES.IMAGE]: {
      aspectRatio: 'auto',
      minHeight: 100,
      maxHeight: 400,
      defaultHeight: 200
    }
  };
  
  return configs[mediaType] || configs[MEDIA_TYPES.IMAGE];
};

/**
 * Check if media type is playable (video/audio)
 * @param {string} mediaType - Media type
 * @returns {boolean}
 */
export const isPlayableMedia = (mediaType) => {
  return [MEDIA_TYPES.VIDEO, MEDIA_TYPES.AUDIO].includes(mediaType);
};

/**
 * Check if media type is viewable (image/pdf)
 * @param {string} mediaType - Media type
 * @returns {boolean}
 */
export const isViewableMedia = (mediaType) => {
  return [MEDIA_TYPES.IMAGE, MEDIA_TYPES.PDF].includes(mediaType);
};