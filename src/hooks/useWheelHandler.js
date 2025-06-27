import { useEffect } from 'react';

/**
 * Custom hook for setting up wheel event handlers on canvas elements
 * Handles the complex timing and cleanup logic needed for wheel events
 */
const useWheelHandler = (canvasRef, wheelHandler, dependencies = []) => {
  useEffect(() => {
    if (!wheelHandler) return;
    
    // Use a timeout to ensure DOM is ready
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      
      if (!canvas) {
        return;
      }

      const wrappedWheelHandler = (e) => {
        // Always prevent default to stop page scroll
        e.preventDefault();
        e.stopPropagation();
        
        // Call the provided wheel handler
        wheelHandler(e);
      };

      // Add wheel event listener with passive: false to allow preventDefault
      canvas.addEventListener('wheel', wrappedWheelHandler, { passive: false });

      // Store cleanup function
      return () => {
        canvas.removeEventListener('wheel', wrappedWheelHandler);
      };
    }, 200); // Delay to ensure DOM is ready

    return () => {
      clearTimeout(timer);
    };
  }, [canvasRef, wheelHandler, ...dependencies]);
};

export default useWheelHandler;