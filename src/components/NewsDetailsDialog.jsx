import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import MediaPlayer from './MediaPlayer';
import ImageViewerModal from './ImageViewerModal';
import UserContent from './UserContent';
import { formatDate } from '../utils/dateFormatting';
import { linkifyHtml } from '../utils/textFormatting';

const NewsDetailsDialog = ({ 
  open, 
  onClose, 
  news, 
  author,
  darkMode = false 
}) => {
  const [imageViewerOpen, setImageViewerOpen] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState({ url: '', title: '' });
  
  if (!news) return null;

  const handleImageClick = (imageUrl, title = '') => {
    setSelectedImage({ url: imageUrl, title });
    setImageViewerOpen(true);
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: darkMode ? 'background.paper' : undefined
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, pr: 2 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                {news.title}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {author || 'Unknown Author'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(news.created_at)}
                  </Typography>
                </Box>
                {news.category && (
                  <Chip
                    icon={<CategoryIcon />}
                    label={news.category.name}
                    size="small"
                    sx={{
                      bgcolor: alpha(news.category.color || '#666', 0.12),
                      color: news.category.color || '#666',
                      border: `1px solid ${alpha(news.category.color || '#666', 0.3)}`,
                      '& .MuiChip-icon': {
                        color: news.category.color || '#666'
                      }
                    }}
                  />
                )}
              </Box>
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {/* Display media content */}
          {news.media_url && (
            <Box sx={{ mb: 3 }}>
              {(() => {
                // Determine media type
                let mediaType = news.media_type;
                if (!mediaType && news.media_url) {
                  const url = news.media_url.toLowerCase();
                  if (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('.mov')) {
                    mediaType = 'video';
                  } else if (url.includes('.mp3') || url.includes('.wav') || url.includes('.m4a') || url.includes('.aac')) {
                    mediaType = 'audio';
                  } else if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp')) {
                    mediaType = 'image';
                  } else if (url.includes('.pdf')) {
                    mediaType = 'pdf';
                  }
                }
                
                if (mediaType === 'image') {
                  return (
                    <Box>
                      <img
                        src={news.media_url}
                        alt={news.title}
                        style={{
                          width: '100%',
                          height: 'auto',
                          maxHeight: '400px',
                          objectFit: 'contain',
                          cursor: 'pointer',
                          borderRadius: '8px'
                        }}
                        onClick={() => handleImageClick(news.media_url, news.title)}
                      />
                      {news.image_caption && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}
                        >
                          {news.image_caption}
                        </Typography>
                      )}
                    </Box>
                  );
                } else if (mediaType) {
                  return (
                    <MediaPlayer
                      src={news.media_url}
                      type={mediaType === 'video' ? 'video' : mediaType === 'pdf' ? 'pdf' : 'audio'}
                      title={news.media_metadata?.fileName || news.title}
                      fileName={news.media_metadata?.fileName}
                      fileSize={news.media_metadata?.fileSize}
                      numPages={news.media_metadata?.numPages}
                      author={news.media_metadata?.author}
                      thumbnail={news.media_metadata?.thumbnail}
                      darkMode={darkMode}
                    />
                  );
                }
                return null;
              })()}
            </Box>
          )}
          
          {/* Legacy image support */}
          {!news.media_url && news.image_url && (
            <Box sx={{ mb: 3 }}>
              <img
                src={news.image_url}
                alt={news.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '400px',
                  objectFit: 'contain',
                  cursor: 'pointer',
                  borderRadius: '8px'
                }}
                onClick={() => handleImageClick(news.image_url, news.title)}
              />
              {news.image_caption && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}
                >
                  {news.image_caption}
                </Typography>
              )}
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          {/* News content */}
          <UserContent 
            content={news.content}
            html={true}
          />
          
          {/* Additional metadata */}
          {news.updated_at && news.updated_at !== news.created_at && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                Last updated: {formatDate(news.updated_at)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Image Viewer Modal */}
      <ImageViewerModal
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage.url}
        title={selectedImage.title}
      />
    </>
  );
};

export default NewsDetailsDialog;