import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to apply scroll-based animations to cards using Intersection Observer
 * This is more performant than requestAnimationFrame
 * @param {Object} options - Animation options
 * @param {boolean} options.enabled - Whether animations are enabled
 * @returns {Function} - Ref callback to attach to animated elements
 */
export const useCardAnimations = ({ enabled = true } = {}) => {
  const observerRef = useRef(null);
  const elementsRef = useRef(new Map());

  // Apply animation styles to an element based on intersection
  const applyAnimationStyles = useCallback((element, isIntersecting, intersectionRatio) => {
    if (!element) return;

    if (isIntersecting) {
      // Element is visible - scale up and fade in
      const scale = 0.98 + (intersectionRatio * 0.02);
      const opacity = 1;

      element.style.transform = `scale(${scale})`;
      element.style.opacity = opacity;
      element.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    } else {
      // Element is not visible - slightly reduce scale but keep fully visible
      element.style.transform = 'scale(0.98)';
      element.style.opacity = '1';
    }
  }, []);

  // Initialize Intersection Observer
  useEffect(() => {
    if (!enabled) {
      // Cleanup if disabled
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      // Reset all element styles
      elementsRef.current.forEach((element) => {
        if (element) {
          element.style.transform = '';
          element.style.opacity = '';
          element.style.transition = '';
        }
      });
      return;
    }

    // Create Intersection Observer with multiple thresholds for smooth animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          applyAnimationStyles(
            entry.target,
            entry.isIntersecting,
            entry.intersectionRatio
          );
        });
      },
      {
        root: null, // viewport
        rootMargin: '0px',
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      }
    );

    // Observe all existing elements
    elementsRef.current.forEach((element) => {
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    // Cleanup on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [enabled, applyAnimationStyles]);

  // Ref callback to attach to elements
  const setRef = useCallback((key) => (element) => {
    // Remove old element from observer
    const oldElement = elementsRef.current.get(key);
    if (oldElement && observerRef.current) {
      observerRef.current.unobserve(oldElement);
    }

    if (element) {
      // Store new element
      elementsRef.current.set(key, element);

      // Observe new element
      if (observerRef.current && enabled) {
        observerRef.current.observe(element);
      }
    } else {
      // Remove from map if element is null
      elementsRef.current.delete(key);
    }
  }, [enabled]);

  return setRef;
};
