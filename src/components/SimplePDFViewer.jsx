import { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import Spinner from './Spinner';
import { PictureAsPdf as PdfIcon } from '@mui/icons-material';

function SimplePDFViewer({ 
  url, 
  width = '100%', 
  height = '100%', 
  showControls = true,
  backgroundColor = '#f8f9fa' 
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!url) {
      setError('No PDF URL provided');
      setLoading(false);
      return;
    }

    // Reset states when URL changes
    setLoading(true);
    setError(null);
  }, [url]);

  useEffect(() => {
    // Add event listener to detect when iframe loads
    const iframe = iframeRef.current;
    if (!iframe || !url) return;

    const handleLoad = () => {
      console.log('PDF iframe loaded:', url);
      setLoading(false);
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
        console.log('Cross-origin restriction when styling PDF iframe');
      }
    };
    
    const handleError = () => {
      console.error('PDF iframe error:', url);
      setError('Failed to load PDF');
      setLoading(false);
    };
    
    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);
    
    // Set a timeout to handle cases where load event doesn't fire
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('PDF loading timeout:', url);
        setLoading(false);
      }
    }, 10000); // 10 second timeout
    
    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
      clearTimeout(timeout);
    };
  }, [url, loading]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Spinner size={24} />
          <Typography variant="caption" color="text.secondary">
            Loading PDF...
          </Typography>
        </Box>
      )}
      
      {error && (
        <Box sx={{ textAlign: 'center', p: 2 }}>
          <PdfIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {error}
          </Typography>
        </Box>
      )}
      
      {/* Container to clip the PDF viewer */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: loading || error ? 'none' : 'block'
        }}
      >
        <Box
          ref={iframeRef}
          component="iframe"
          src={url}
          sx={{
            position: 'absolute',
            top: showControls ? 0 : '-45px', // Hide top toolbar if controls are disabled
            left: 0,
            width: '100%',
            height: showControls ? '100%' : 'calc(100% + 90px)', // Add extra height if hiding controls
            border: 'none',
            pointerEvents: showControls ? 'auto' : 'none',
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.3s'
          }}
          title="PDF Viewer"
          loading="lazy"
        />
      </Box>
      
      {/* Invisible overlay to prevent interaction when controls are hidden */}
      {!showControls && !loading && !error && (
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
      )}
    </Box>
  );
}

export default SimplePDFViewer;