import { useState, useEffect, useRef } from 'react';
import { Box, Skeleton } from '@mui/material';

const LazyImage = ({ 
  src, 
  alt, 
  width, 
  height,
  objectFit = 'cover',
  placeholder = null,
  onLoad = null,
  onError = null,
  style = {},
  className = '',
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        // Start loading when image is 50px away from viewport
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    setIsLoaded(true);
    if (onError) onError(e);
  };

  return (
    <Box
      ref={imgRef}
      sx={{
        position: 'relative',
        width: width || '100%',
        height: height || 'auto',
        overflow: 'hidden',
        ...style
      }}
      className={className}
    >
      {/* Show skeleton/placeholder while loading */}
      {!isLoaded && !hasError && (
        placeholder || (
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation="wave"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        )
      )}

      {/* Render image only when in view */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'grey.200',
            color: 'text.secondary',
          }}
        >
          <span>Failed to load image</span>
        </Box>
      )}
    </Box>
  );
};

export default LazyImage;