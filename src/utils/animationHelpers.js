// Utility to prevent janky animations during window resize
export const preventResizeAnimations = () => {
  let resizeTimer;
  
  const handleResize = () => {
    // Add class to stop animations
    document.body.classList.add('resize-animation-stopper');
    
    // Clear existing timer
    clearTimeout(resizeTimer);
    
    // Remove class after resize is done
    resizeTimer = setTimeout(() => {
      document.body.classList.remove('resize-animation-stopper');
    }, 400);
  };
  
  window.addEventListener('resize', handleResize);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
    clearTimeout(resizeTimer);
  };
};

// Utility to add smooth scroll to element
export const smoothScrollTo = (elementId, offset = 0) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
};

// Utility to check if element is in viewport
export const isInViewport = (element) => {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

// Utility to add entrance animation to elements when they come into view
export const observeEntranceAnimations = (selector = '[data-animate]', options = {}) => {
  const elements = document.querySelectorAll(selector);
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        // Optionally unobserve after animation
        if (options.once !== false) {
          observer.unobserve(entry.target);
        }
      }
    });
  }, {
    threshold: options.threshold || 0.1,
    rootMargin: options.rootMargin || '0px'
  });
  
  elements.forEach(el => observer.observe(el));
  
  // Return cleanup function
  return () => {
    elements.forEach(el => observer.unobserve(el));
  };
};