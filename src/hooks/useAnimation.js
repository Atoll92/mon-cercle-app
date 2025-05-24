import { useEffect, useRef } from 'react';

// Animation timing constants
export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 400,
  verySlow: 600
};

// Easing functions
export const EASING = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
};

// Custom hook for fade-in animations
export const useFadeIn = (delay = 0, duration = ANIMATION_DURATION.normal) => {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Set initial state
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = `opacity ${duration}ms ${EASING.standard}, transform ${duration}ms ${EASING.standard}`;

    const timer = setTimeout(() => {
      if (element) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [delay, duration]);

  return elementRef;
};

// Custom hook for staggered list animations
export const useStaggeredAnimation = (itemCount, baseDelay = 0, staggerDelay = 50) => {
  const itemRefs = useRef([]);
  const timersRef = useRef([]);

  useEffect(() => {
    // Clear existing timers
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];

    itemRefs.current.forEach((item, index) => {
      if (!item) return;

      // Set initial state
      item.style.opacity = '0';
      item.style.transform = 'translateY(10px)';
      item.style.transition = `opacity ${ANIMATION_DURATION.normal}ms ${EASING.standard}, transform ${ANIMATION_DURATION.normal}ms ${EASING.standard}`;

      const timer = setTimeout(() => {
        if (item) {
          item.style.opacity = '1';
          item.style.transform = 'translateY(0)';
        }
      }, baseDelay + (index * staggerDelay));

      timersRef.current.push(timer);
    });

    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
    };
  }, [itemCount, baseDelay, staggerDelay]);

  return (index) => (el) => {
    if (itemRefs.current) {
      itemRefs.current[index] = el;
    }
  };
};

// Animation classes for CSS
export const animationClasses = {
  fadeIn: 'animate-fade-in',
  fadeInUp: 'animate-fade-in-up',
  fadeInDown: 'animate-fade-in-down',
  scaleIn: 'animate-scale-in',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',
  pulse: 'animate-pulse',
  shimmer: 'animate-shimmer'
};