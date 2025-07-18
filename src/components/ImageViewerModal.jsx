import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  IconButton,
  Typography,
  Fade,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import Spinner from './Spinner';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  RotateRight as RotateRightIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

const ImageViewerModal = ({ open, onClose, imageUrl, title = 'Image Viewer' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setLoading(true);
    }
  }, [open]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleFullscreen = () => {
    const elem = document.documentElement;
    if (!isFullscreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = title || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            outline: 'none',
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h6" sx={{ color: 'white' }}>
              {title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={handleDownload}
                sx={{ color: 'white' }}
                title="Download"
              >
                <DownloadIcon />
              </IconButton>
              <IconButton
                onClick={handleRotate}
                sx={{ color: 'white' }}
                title="Rotate"
              >
                <RotateRightIcon />
              </IconButton>
              <IconButton
                onClick={handleZoomOut}
                sx={{ color: 'white' }}
                disabled={scale <= 0.5}
                title="Zoom Out"
              >
                <ZoomOutIcon />
              </IconButton>
              <Typography
                sx={{
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  minWidth: '60px',
                  textAlign: 'center',
                }}
              >
                {Math.round(scale * 100)}%
              </Typography>
              <IconButton
                onClick={handleZoomIn}
                sx={{ color: 'white' }}
                disabled={scale >= 3}
                title="Zoom In"
              >
                <ZoomInIcon />
              </IconButton>
              {!isMobile && (
                <IconButton
                  onClick={handleFullscreen}
                  sx={{ color: 'white' }}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              )}
              <IconButton
                onClick={onClose}
                sx={{ color: 'white' }}
                title="Close"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Image Container */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            }}
            onWheel={handleWheel}
          >
            {loading && (
              <Spinner
                sx={{
                  position: 'absolute',
                  color: 'white',
                }}
              />
            )}
            <img
              src={imageUrl}
              alt={title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease',
                userSelect: 'none',
                display: loading ? 'none' : 'block',
              }}
              onLoad={() => setLoading(false)}
              onMouseDown={handleMouseDown}
              draggable={false}
            />
          </Box>

          {/* Instructions */}
          {!isMobile && scale === 1 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                px: 2,
                py: 1,
                borderRadius: 1,
                fontSize: '0.875rem',
              }}
            >
              Use mouse wheel to zoom • Click and drag to pan when zoomed
            </Box>
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

export default ImageViewerModal;