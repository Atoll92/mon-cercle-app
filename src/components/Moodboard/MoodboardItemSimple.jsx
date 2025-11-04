import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';
import Spinner from '../Spinner';
import {
  Link as LinkIcon,
  Image as ImageIcon,
  TextFields as TextFieldsIcon,
  PictureAsPdf as PdfIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
} from '@mui/icons-material';
import LinkPreview from '../LinkPreview';
import PDFPreviewEnhanced from '../PDFPreviewEnhanced';
import UserContent from '../UserContent';

/**
 * Simple display component for moodboard items without editing capabilities
 * Used for grid and read-only views
 */
const MoodboardItemSimple = ({ item, style = {}, mediaOnly = false }) => {
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
              <Spinner size={48} sx={{ position: 'absolute' }} />
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
              maxWidth: '300px', // Prevent overly wide text boxes
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
            <UserContent
              content={item.content || ''}
              html={false}
              component="div"
              sx={{ 
                width: '100%',
                color: item.textColor || '#000000',
                fontFamily: item.font_family || 'inherit',
                fontSize: item.font_size || 'inherit',
                fontWeight: item.font_weight || 'normal',
                lineHeight: item.line_height || 'normal',
                textAlign: item.text_align || 'left',
                pointerEvents: 'none',
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            />
          </Box>
        );

      case 'link':
        return (
          <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <LinkPreview
              url={item.content}
              compact={!mediaOnly}
              customTitle={item.title}
              mediaOnly={mediaOnly}
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
              playsInline
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
              overflow: 'hidden',
            }}
          >
            <PDFPreviewEnhanced
              url={item.content}
              fileName={item.title || 'PDF Document'}
              title={item.title || 'PDF Document'}
              height="100%"
              showFileName={false}
              borderRadius={0}
            />
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