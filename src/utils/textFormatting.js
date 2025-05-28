/**
 * Truncate text content to a specified length
 * @param {string} content - Text content to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated content with ellipsis if needed
 */
export const truncateContent = (content, maxLength = 150) => {
  if (!content) return '';
  
  // Strip HTML tags if present
  const strippedContent = content.replace(/<[^>]*>/g, '');
  
  if (strippedContent.length <= maxLength) {
    return strippedContent;
  }
  
  // Find the last space before maxLength to avoid cutting words
  const lastSpaceIndex = strippedContent.lastIndexOf(' ', maxLength);
  const truncateIndex = lastSpaceIndex > -1 ? lastSpaceIndex : maxLength;
  
  return strippedContent.substring(0, truncateIndex) + '...';
};

/**
 * Strip HTML tags from content
 * @param {string} html - HTML content
 * @returns {string} Plain text content
 */
export const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

/**
 * Get excerpt from HTML content
 * @param {string} html - HTML content
 * @param {number} maxLength - Maximum length
 * @returns {string} Plain text excerpt
 */
export const getExcerpt = (html, maxLength = 150) => {
  const plainText = stripHtml(html);
  return truncateContent(plainText, maxLength);
};