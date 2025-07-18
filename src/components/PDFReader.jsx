import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Toolbar,
  Alert,
  Tooltip,
  TextField
} from '@mui/material';
import Spinner from './Spinner';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  FitScreen as FitScreenIcon
} from '@mui/icons-material';

function PDFReader({ url, fileName, open, onClose }) {
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rendering, setRendering] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize PDF.js when dialog opens
  useEffect(() => {
    if (!open || !url) return;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker path for Vite
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          // Use CDN with explicit https to avoid CORS issues
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        }
        
        const pdfDocument = await pdfjsLib.getDocument(url).promise;
        setPdf(pdfDocument);
        setNumPages(pdfDocument.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document');
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [open, url]);

  // Render current page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        setRendering(true);
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        setRendering(false);
      } catch (err) {
        console.error('Error rendering page:', err);
        setError('Failed to render page');
        setRendering(false);
      }
    };

    renderPage();
  }, [pdf, currentPage, scale]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(Math.min(scale * 1.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale / 1.2, 0.5));
  };

  const handleFitToWidth = () => {
    if (containerRef.current && canvasRef.current) {
      const containerWidth = containerRef.current.clientWidth - 32; // Account for padding
      const canvasWidth = canvasRef.current.width / scale;
      const newScale = containerWidth / canvasWidth;
      setScale(Math.min(newScale, 2.0));
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
  };

  const handlePageInput = (event) => {
    const page = parseInt(event.target.value);
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: '90vw',
          height: '90vh',
          maxWidth: 'none',
          maxHeight: 'none',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ p: 1 }}>
        <Toolbar sx={{ px: 0, minHeight: '48px !important' }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1rem' }}>
            {fileName}
          </Typography>
          
          {numPages > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
              <Tooltip title="Previous page">
                <IconButton size="small" onClick={handlePrevPage} disabled={currentPage <= 1}>
                  <PrevIcon />
                </IconButton>
              </Tooltip>
              
              <TextField
                size="small"
                type="number"
                value={currentPage}
                onChange={handlePageInput}
                inputProps={{
                  min: 1,
                  max: numPages,
                  style: { textAlign: 'center', width: '50px' }
                }}
                variant="outlined"
              />
              <Typography variant="body2">/ {numPages}</Typography>
              
              <Tooltip title="Next page">
                <IconButton size="small" onClick={handleNextPage} disabled={currentPage >= numPages}>
                  <NextIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Zoom out">
              <IconButton size="small" onClick={handleZoomOut}>
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            
            <Typography variant="body2" sx={{ alignSelf: 'center', minWidth: '50px', textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </Typography>
            
            <Tooltip title="Zoom in">
              <IconButton size="small" onClick={handleZoomIn}>
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Fit to width">
              <IconButton size="small" onClick={handleFitToWidth}>
                <FitScreenIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Fullscreen">
              <IconButton size="small" onClick={handleFullscreen}>
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Download">
              <IconButton size="small" onClick={handleDownload}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <IconButton onClick={onClose} size="small" sx={{ ml: 1 }}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </DialogTitle>

      <DialogContent 
        ref={containerRef}
        sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          overflow: 'auto',
          p: 2,
          bgcolor: '#f5f5f5'
        }}
      >
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Spinner />
            <Typography>Loading PDF...</Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ maxWidth: 400 }}>
            {error}
          </Alert>
        )}
        
        {!loading && !error && (
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                backgroundColor: 'white'
              }}
            />
            
            {rendering && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255,255,255,0.8)'
                }}
              >
                <Spinner size={48} />
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PDFReader;