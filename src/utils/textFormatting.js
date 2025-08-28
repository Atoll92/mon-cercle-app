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

/**
 * Convert URLs in text to clickable links
 * Returns React elements with links wrapped in anchor tags
 * @param {string} text - Text content that may contain URLs
 * @returns {Array} Array of React elements (strings and anchor elements)
 */
export const linkifyText = (text) => {
  if (!text) return '';
  
  // Comprehensive URL regex that matches various URL formats
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+|www\.[^\s<>"{}|\\^`[\]]+\.[^\s<>"{}|\\^`[\]]+)/gi;
  
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    let url = match[0];
    let displayUrl = url;
    
    // Add https:// to www. URLs
    if (url.startsWith('www.')) {
      url = 'https://' + url;
    }
    
    // Truncate display URL if too long
    if (displayUrl.length > 50) {
      displayUrl = displayUrl.substring(0, 47) + '...';
    }
    
    // Create link element
    parts.push({
      type: 'link',
      url: url,
      text: displayUrl,
      key: `link-${match.index}`
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after last URL
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
};

/**
 * Convert URLs in HTML content to clickable links
 * Preserves existing HTML structure and only linkifies URLs in text nodes
 * @param {string} html - HTML content that may contain URLs
 * @returns {string} HTML with URLs converted to anchor tags
 */
export const linkifyHtml = (html) => {
  if (!html) return '';
  
  // Create a temporary container
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Function to process text nodes
  const processTextNode = (node) => {
    const text = node.textContent;
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+|www\.[^\s<>"{}|\\^`[\]]+\.[^\s<>"{}|\\^`[\]]+)/gi;
    
    let matches = [];
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        url: match[0]
      });
    }
    
    if (matches.length === 0) return;
    
    // Process matches in reverse order to maintain indices
    matches.reverse().forEach(({ start, end, url }) => {
      let href = url;
      if (url.startsWith('www.')) {
        href = 'https://' + url;
      }
      
      const before = text.substring(0, start);
      const after = text.substring(end);
      
      // Create a link element
      const link = document.createElement('a');
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = url;
      link.style.textDecoration = 'underline';
      
      // Replace the text node with the new nodes
      const parent = node.parentNode;
      const beforeNode = document.createTextNode(before);
      const afterNode = document.createTextNode(after);
      
      parent.replaceChild(afterNode, node);
      parent.insertBefore(link, afterNode);
      parent.insertBefore(beforeNode, link);
    });
  };
  
  // Walk through all text nodes
  const walker = document.createTreeWalker(
    tempDiv,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip nodes that are already inside anchor tags
        if (node.parentElement && node.parentElement.tagName === 'A') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }
  
  // Process all text nodes
  textNodes.forEach(processTextNode);
  
  return tempDiv.innerHTML;
};