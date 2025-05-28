/**
 * API helper utilities for consistent error handling and response processing
 */

/**
 * Standard API error class
 */
export class ApiError extends Error {
  constructor(message, code = null, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Wrap an async API function with error handling
 * @param {function} fn - Async function to wrap
 * @param {string} errorMessage - Custom error message
 * @returns {function} Wrapped function
 */
export const withErrorHandling = (fn, errorMessage = 'Operation failed') => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      
      // Preserve specific error codes
      if (error.code === 'PGRST116') {
        // No rows returned - not necessarily an error
        return { data: null, error: null };
      }
      
      throw new ApiError(
        error.message || errorMessage,
        error.code,
        error.details
      );
    }
  };
};

/**
 * Handle Supabase query response
 * @param {object} response - Supabase query response
 * @param {string} errorMessage - Custom error message
 * @returns {any} Data from response
 */
export const handleSupabaseResponse = (response, errorMessage = 'Query failed') => {
  const { data, error } = response;
  
  if (error) {
    // Special handling for common errors
    if (error.code === 'PGRST116') {
      return null; // No rows returned
    }
    
    throw new ApiError(
      error.message || errorMessage,
      error.code,
      error.details
    );
  }
  
  return data;
};

/**
 * Batch multiple Supabase queries
 * @param {array} queries - Array of query functions
 * @returns {Promise<array>} Array of results
 */
export const batchQueries = async (queries) => {
  try {
    const results = await Promise.all(
      queries.map(queryFn => queryFn())
    );
    
    return results.map((result, index) => {
      try {
        return handleSupabaseResponse(result);
      } catch (error) {
        console.error(`Query ${index} failed:`, error);
        return null;
      }
    });
  } catch (error) {
    console.error('Batch query failed:', error);
    throw new ApiError('Failed to execute batch queries', null, error);
  }
};

/**
 * Retry a function with exponential backoff
 * @param {function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in ms
 * @returns {Promise} Result of function
 */
export const retryWithBackoff = async (
  fn,
  maxRetries = 3,
  initialDelay = 1000
) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Create a standardized API response
 * @param {any} data - Response data
 * @param {Error} error - Error if any
 * @returns {object} Standardized response
 */
export const createApiResponse = (data = null, error = null) => {
  return {
    data,
    error: error ? {
      message: error.message,
      code: error.code,
      details: error.details
    } : null,
    success: !error
  };
};