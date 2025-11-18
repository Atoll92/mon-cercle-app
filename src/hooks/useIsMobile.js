// src/hooks/useIsMobile.js
import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if viewport is mobile-sized
 * Uses Material-UI's 'sm' breakpoint (600px) as threshold
 * Memoizes the result to avoid repeated window.innerWidth checks
 *
 * @param {number} breakpoint - Width threshold in pixels (default: 600)
 * @returns {boolean} true if viewport width is below breakpoint
 */
export const useIsMobile = (breakpoint = 600) => {
  const [isMobile, setIsMobile] = useState(() => {
    // Initialize with current window width (SSR-safe)
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  useEffect(() => {
    // Handler to update state on window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler immediately to set initial state
    handleResize();

    // Cleanup on unmount
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};
