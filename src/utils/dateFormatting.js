// Utility functions for formatting dates and times

/**
 * Format a date string to show both date and time
 * @param {string} dateString - ISO date string
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateString, options = {}) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Default options
  const defaultOptions = {
    dateStyle: 'medium',
    timeStyle: 'short'
  };
  
  return date.toLocaleString(undefined, { ...defaultOptions, ...options });
};

/**
 * Format a date string to show only the date
 * @param {string} dateString - ISO date string
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  return date.toLocaleDateString(undefined, options);
};

/**
 * Format a date string to show only the time
 * @param {string} dateString - ISO date string
 * @param {Object} options - Formatting options
 * @returns {string} Formatted time string
 */
export const formatTime = (dateString, options = {}) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleTimeString(undefined, { ...defaultOptions, ...options });
};

/**
 * Check if a date has a time component (not midnight)
 * @param {string} dateString - ISO date string
 * @returns {boolean} True if the date has a time component
 */
export const hasTimeComponent = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  return date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;
};

/**
 * Format event date intelligently - show time if it's set
 * @param {string} dateString - ISO date string
 * @param {boolean} detailed - If true, show weekday and full month names
 * @returns {string} Formatted date/datetime string
 */
export const formatEventDate = (dateString, detailed = false) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // If the date has a time component, show both date and time
  if (hasTimeComponent(dateString)) {
    if (detailed) {
      // Detailed format: "Monday, January 15, 2025 at 2:30 PM"
      const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const timeOptions = { hour: 'numeric', minute: '2-digit' };
      const dateStr = date.toLocaleDateString(undefined, dateOptions);
      const timeStr = date.toLocaleTimeString(undefined, timeOptions);
      return `${dateStr} at ${timeStr}`;
    }
    return formatDateTime(dateString);
  }
  
  // Otherwise just show the date
  if (detailed) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }
  return formatDate(dateString);
};

/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
export const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return count === 1 
        ? `${count} ${interval.label} ago`
        : `${count} ${interval.label}s ago`;
    }
  }
  
  return 'just now';
};