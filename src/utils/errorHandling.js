/**
 * Centralized error handling utilities
 */

/**
 * Standard error handler for API functions that return arrays
 * @param {Error} error - The error that occurred
 * @param {string} context - Context string for logging (e.g., 'fetching badges')
 * @param {Array} fallback - Fallback value to return (default: [])
 * @returns {Array} The fallback array
 */
export const handleArrayError = (error, context, fallback = []) => {
  console.error(`Error ${context}:`, error);
  
  // You could add additional error reporting here:
  // - Send to error tracking service
  // - Store in local error log
  // - Show user notification in some cases
  
  return fallback;
};

/**
 * Standard error handler for API functions that return objects
 * @param {Error} error - The error that occurred  
 * @param {string} context - Context string for logging
 * @param {object} fallback - Fallback object to return
 * @returns {object} Object with error information
 */
export const handleObjectError = (error, context, fallback = {}) => {
  console.error(`Error ${context}:`, error);
  
  return {
    data: fallback.data || null,
    error: error.message || error,
    success: false,
    ...fallback
  };
};

/**
 * Enhanced error logger with more context
 * @param {Error} error - The error that occurred
 * @param {string} operation - The operation being performed
 * @param {object} metadata - Additional metadata about the error
 */
export const logError = (error, operation, metadata = {}) => {
  const errorInfo = {
    message: error.message || error,
    operation,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    ...metadata
  };
  
  console.error('API Error:', errorInfo);
  
  // Future: Send to error tracking service
  // errorTrackingService.log(errorInfo);
  
  return errorInfo;
};

/**
 * Wrapper for successful array responses from Supabase
 * @param {Array} data - The successful data array
 * @returns {object} Standardized success response
 */
export const handleArraySuccess = (data) => {
  return {
    data: data || [],
    error: null
  };
};

/**
 * Wrapper for successful object responses from Supabase
 * @param {object} data - The successful data object
 * @returns {object} Standardized success response
 */
export const handleObjectSuccess = (data) => {
  return {
    data: data || null,
    error: null
  };
};