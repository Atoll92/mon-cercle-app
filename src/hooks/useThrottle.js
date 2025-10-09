import { useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook to throttle a function call
 * @param {Function} callback - The function to throttle
 * @param {number} delay - The throttle delay in milliseconds
 * @returns {Function} - The throttled function
 */
export const useThrottle = (callback, delay = 100) => {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        callback(...args);
        lastRun.current = now;
      } else {
        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Schedule the callback to run after the remaining delay
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  );
};
