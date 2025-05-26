import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  ZoomIn as ZoomInIcon
} from '@mui/icons-material';
import PDFModal from './PDFModal';
import PDFFirstPageViewer from './PDFFirstPageViewer';

function PDFPreviewEnhanced({ 
  url, 
  fileName, 
  title,
  height = 300,
  showFileName = true,
  borderRadius = 1,
  thumbnail
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = () => {
    setModalOpen(true);
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          width: '100%',
          height,
          overflow: 'hidden',
          cursor: 'pointer',
          borderRadius,
          bgcolor: '#f5f5f5',
          '&:hover': {
            '& .pdf-overlay': {
              opacity: 1
            }
          }
        }}
        onClick={handleClick}
      >
        {/* PDF Preview using iframe */}
        <PDFFirstPageViewer url={url} height={height} />

        {/* Overlay with zoom icon */}
        <Box
          className="pdf-overlay"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.3s',
            pointerEvents: 'none'
          }}
        >
          <IconButton
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 1)'
              }
            }}
          >
            <ZoomInIcon sx={{ fontSize: 32 }} />
          </IconButton>
        </Box>

        {/* PDF indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            bgcolor: 'error.main',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          <PdfIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            PDF
          </Typography>
        </Box>

        {/* File name */}
        {showFileName && fileName && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              p: 1
            }}
          >
            <Typography variant="caption" noWrap>
              {fileName}
            </Typography>
          </Box>
        )}
      </Paper>

      <PDFModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        url={url}
        fileName={fileName || title || 'document.pdf'}
      />
    </>
  );
}

export default PDFPreviewEnhanced;