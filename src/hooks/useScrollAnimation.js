import { useEffect, useRef, useState } from 'react';

/**
 * Hook for scroll-triggered animations using Intersection Observer
 * @param {Object} options - Intersection Observer options
 * @param {number} options.threshold - Visibility threshold (0-1)
 * @param {string} options.rootMargin - Margin around root
 * @param {boolean} options.triggerOnce - Only trigger animation once
 * @returns {Object} - { ref, isVisible }
 */
export const useScrollAnimation = ({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true
} = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        
        if (isIntersecting && !hasAnimated) {
          setIsVisible(true);
          if (triggerOnce) {
            setHasAnimated(true);
            observer.unobserve(element);
          }
        } else if (!triggerOnce && !isIntersecting) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasAnimated]);

  return { ref, isVisible };
};

/**
 * Hook for parallax scroll effect
 * @param {number} speed - Parallax speed factor
 * @returns {Object} - { ref, offset }
 */
export const useParallax = (speed = 0.5) => {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const element = ref.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const scrolled = window.pageYOffset;
      const rate = (rect.top + scrolled) * -speed;
      
      setOffset(rate);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed]);

  return { ref, offset };
};