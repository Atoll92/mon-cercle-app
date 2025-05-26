import { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';

function PDFFirstPageViewer({ url, height = 400 }) {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef(null);

  useEffect(() => {
    // Add event listener to detect when iframe loads
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        setIsLoading(false);
        // Try to zoom and position the iframe content
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          if (iframeDoc && iframeDoc.body) {
            // Apply styles to zoom and crop
            iframeDoc.body.style.margin = '0';
            iframeDoc.body.style.padding = '0';
            iframeDoc.body.style.overflow = 'hidden';
          }
        } catch (e) {
          // Cross-origin restrictions
        }
      };
      
      iframe.addEventListener('load', handleLoad);
      return () => iframe.removeEventListener('load', handleLoad);
    }
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        height,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#f5f5f5',
        // Hide PDF viewer controls with CSS
        '& iframe': {
          // Attempt to hide controls via CSS injection
          filter: 'contrast(1.1)', // Slight contrast boost
        }
      }}
    >
      {/* Container to clip the PDF viewer */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <Box
          ref={iframeRef}
          component="iframe"
          src={url}
          sx={{
            position: 'absolute',
            top: '-45px', // Hide top toolbar (usually ~40px)
            left: 0,
            width: '100%',
            height: 'calc(100% + 90px)', // Add extra height for top and bottom
            border: 'none',
            pointerEvents: 'none',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s'
          }}
          title="PDF Preview"
          loading="lazy"
        />
      </Box>
      
      {/* Invisible overlay to prevent any interaction */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          cursor: 'inherit' // Inherit cursor from parent
        }}
      />
      
      {/* Loading state */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'text.secondary',
            zIndex: 2
          }}
        >
          Loading PDF...
        </Box>
      )}
    </Box>
  );
}

export default PDFFirstPageViewer;