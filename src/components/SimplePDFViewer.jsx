import { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { PictureAsPdf as PdfIcon } from '@mui/icons-material';

function SimplePDFViewer({ 
  url, 
  pageNumber = 1, 
  width = '100%', 
  height = '100%', 
  showControls = true,
  backgroundColor = '#f8f9fa' 
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    const renderPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker path for Vite - use the bundled worker
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          // Import the worker as a URL
          const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.min.js?url');
          pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;
        }
        
        const pdfDocument = await pdfjsLib.getDocument(url).promise;
        const page = await pdfDocument.getPage(pageNumber);
        
        const canvas = canvasRef.current;
        const container = containerRef.current;
        
        if (!canvas || !container) return;
        
        // Calculate scale to fit the container
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const viewport = page.getViewport({ scale: 1.0 });
        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        const scale = Math.min(scaleX, scaleY) * 0.95; // 95% to add some padding
        
        const scaledViewport = page.getViewport({ scale });
        
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        
        const context = canvas.getContext('2d');
        
        await page.render({
          canvasContext: context,
          viewport: scaledViewport
        }).promise;
        
        setLoading(false);
      } catch (err) {
        console.error('Error rendering PDF:', err);
        setError('Failed to load PDF');
        setLoading(false);
      }
    };

    renderPDF();
  }, [url, pageNumber]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!loading && !error && url) {
        const renderPDF = async () => {
          try {
            const pdfjsLib = await import('pdfjs-dist');
            
            // Set worker path for Vite - use the bundled worker
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
              // Import the worker as a URL
              const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.min.js?url');
              pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;
            }
            
            const pdfDocument = await pdfjsLib.getDocument(url).promise;
            const page = await pdfDocument.getPage(pageNumber);
            
            const canvas = canvasRef.current;
            const container = containerRef.current;
            
            if (!canvas || !container) return;
            
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            const viewport = page.getViewport({ scale: 1.0 });
            const scaleX = containerWidth / viewport.width;
            const scaleY = containerHeight / viewport.height;
            const scale = Math.min(scaleX, scaleY) * 0.95;
            
            const scaledViewport = page.getViewport({ scale });
            
            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;
            
            const context = canvas.getContext('2d');
            
            await page.render({
              canvasContext: context,
              viewport: scaledViewport
            }).promise;
          } catch (err) {
            console.error('Error re-rendering PDF:', err);
          }
        };
        
        renderPDF();
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [url, pageNumber, loading, error]);

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
          <CircularProgress size={24} />
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
      
      {!loading && !error && (
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
      )}
    </Box>
  );
}

export default SimplePDFViewer;