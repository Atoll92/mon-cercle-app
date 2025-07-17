import React, { useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Link as LinkIcon,
  Image as ImageIcon,
  TextFields as TextFieldsIcon,
  PictureAsPdf as PdfIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
} from '@mui/icons-material';
import LinkPreview from '../LinkPreview';
import SimplePDFViewer from '../SimplePDFViewer';

/**
 * Simple display component for moodboard items without editing capabilities
 * Used for grid and read-only views
 */
const MoodboardItemSimple = ({ item, style = {} }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  const renderContent = () => {
    switch (item.type) {
      case 'image':
        return (
          <Box 
            sx={{ 
              width: '100%', 
              height: '100%', 
              position: 'relative',
              bgcolor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {!imageLoaded && !mediaError && (
              <CircularProgress size={24} sx={{ position: 'absolute' }} />
            )}
            {mediaError ? (
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <ImageIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Failed to load image
                </Typography>
              </Box>
            ) : (
              <img
                src={item.content}
                alt={item.title || 'Moodboard image'}
                onLoad={() => setImageLoaded(true)}
                onError={() => setMediaError(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: imageLoaded ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }}
              />
            )}
          </Box>
        );

      case 'text':
        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              p: 2,
              overflow: 'hidden',
              bgcolor: item.backgroundColor || 'transparent',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {item.title && (
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 'bold',
                  mb: 1,
                  color: item.textColor || 'text.primary',
                }}
                noWrap
              >
                {item.title}
              </Typography>
            )}
            <Typography
              variant="body2"
              sx={{
                color: item.textColor || 'text.primary',
                fontFamily: item.font_family || 'inherit',
                fontSize: item.font_size || '0.875rem',
                fontWeight: item.font_weight || 'normal',
                lineHeight: item.line_height || 1.5,
                textAlign: item.text_align || 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 6,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {item.content}
            </Typography>
          </Box>
        );

      case 'link':
        return (
          <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <LinkPreview 
              url={item.content} 
              compact={true}
              customTitle={item.title}
            />
          </Box>
        );

      case 'video':
        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#000',
              position: 'relative',
            }}
          >
            <video
              src={item.content}
              controls
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
              onError={() => setMediaError(true)}
            />
            {mediaError && (
              <Box sx={{ 
                position: 'absolute', 
                textAlign: 'center',
                color: 'white'
              }}>
                <VideoIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="caption">
                  Failed to load video
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 'audio':
        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              p: 2,
            }}
          >
            <AudioIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            {item.title && (
              <Typography variant="subtitle2" gutterBottom noWrap sx={{ width: '100%' }}>
                {item.title}
              </Typography>
            )}
            <audio
              src={item.content}
              controls
              style={{ width: '100%', maxWidth: '250px' }}
              onError={() => setMediaError(true)}
            />
          </Box>
        );

      case 'pdf':
        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              bgcolor: 'background.paper',
              position: 'relative',
            }}
          >
            <SimplePDFViewer
              url={item.content}
              width="100%"
              height="100%"
              showControls={false}
              backgroundColor="white"
            />
            {item.title && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  p: 1,
                }}
              >
                <Typography variant="caption" noWrap>
                  {item.title}
                </Typography>
              </Box>
            )}
          </Box>
        );

      default:
        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.default',
              p: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {item.type} item
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
        ...style,
      }}
    >
      {renderContent()}
    </Paper>
  );
};

export default MoodboardItemSimple;