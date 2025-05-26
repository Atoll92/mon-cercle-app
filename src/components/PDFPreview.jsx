import { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { formatFileSize } from '../utils/mediaUpload';
// import PDFReader from './PDFReader'; // Disabled due to PDF.js worker issues

function PDFPreview({ 
  url, 
  fileName, 
  fileSize, 
  numPages, 
  title, 
  author, 
  thumbnail,
  compact = false,
  showActions = true 
}) {
  // const [readerOpen, setReaderOpen] = useState(false); // Not needed without PDFReader

  const handleView = () => {
    // Open PDF in new tab instead of using PDFReader
    window.open(url, '_blank');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'document.pdf';
    link.click();
  };

  return (
    <>
      <Card 
        sx={{ 
          position: 'relative', 
          width: compact ? 150 : 200,
          cursor: showActions ? 'pointer' : 'default'
        }}
        onClick={showActions ? handleView : undefined}
      >
        {thumbnail ? (
          <CardMedia
            component="img"
            height={compact ? 100 : 140}
            image={thumbnail}
            alt={title || fileName}
            sx={{ 
              objectFit: 'contain', 
              bgcolor: '#f5f5f5',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          />
        ) : (
          <Box
            sx={{
              height: compact ? 100 : 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'action.hover',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <PdfIcon sx={{ fontSize: compact ? 40 : 60, color: 'error.main' }} />
          </Box>
        )}

        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          <Typography 
            variant="caption" 
            noWrap 
            sx={{ 
              display: 'block',
              fontWeight: 500,
              mb: 0.5
            }}
          >
            {title || fileName}
          </Typography>
          
          {author && !compact && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              noWrap
              sx={{ display: 'block', mb: 0.5 }}
            >
              by {author}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip
              icon={<PdfIcon />}
              label="PDF"
              size="small"
              color="error"
              sx={{ fontSize: '0.7rem' }}
            />
            
            {fileSize && (
              <Chip
                label={formatFileSize(fileSize)}
                size="small"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            
            {numPages && (
              <Chip
                label={`${numPages} pages`}
                size="small"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>
        </CardContent>

        {showActions && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 0.5
            }}
          >
            <Tooltip title="View PDF">
              <IconButton
                size="small"
                sx={{
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.8)'
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleView();
                }}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Download PDF">
              <IconButton
                size="small"
                sx={{
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.8)'
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Card>

      {/* PDFReader disabled due to PDF.js worker issues - PDFs open in new tab instead */}
    </>
  );
}

export default PDFPreview;