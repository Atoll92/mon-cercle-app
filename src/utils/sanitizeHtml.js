import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - The HTML content to sanitize
 * @param {Object} options - Optional DOMPurify configuration
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHtml = (html, options = {}) => {
  if (!html) return '';

  // Default configuration allows common HTML tags and attributes
  const defaultConfig = {
    ALLOWED_TAGS: [
      'p', 'br', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'b', 'strong', 'i', 'em',
      'u', 'code', 'pre', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'sub', 'sup', 'mark', 'del', 's', 'ins', 'small', 'kbd', 'var',
      'iframe', 'video', 'audio', 'source'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'width', 'height', 'target', 'rel',
      'class', 'id', 'style', 'data-*', 'frameborder', 'allowfullscreen',
      'controls', 'autoplay', 'loop', 'muted', 'poster', 'preload', 'type'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ['target', 'rel'], // Allow target and rel on links
    // Security settings
    FORBID_TAGS: ['script', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  };

  const config = { ...defaultConfig, ...options };

  // Additional processing for links
  if (config.ALLOWED_TAGS.includes('a')) {
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if ('target' in node && node.tagName === 'A') {
        node.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  const sanitized = DOMPurify.sanitize(html, config);

  // Remove the hook after use to avoid memory leaks
  DOMPurify.removeHooks('afterSanitizeAttributes');

  return sanitized;
};

/**
 * Sanitize HTML for rich text editor content
 * This is more permissive for user-generated content from editors
 */
export const sanitizeRichText = (html) => {
  return sanitizeHtml(html, {
    // Allow data URLs for images from rich text editors
    ADD_DATA_URI_TAGS: ['img'],
    // Allow style attribute for text formatting
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'width', 'height', 'target', 'rel',
      'class', 'id', 'style', 'data-*', 'align', 'color', 'face', 'size'
    ],
  });
};

