import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardMedia,
  alpha,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Language as LanguageIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import MediaUpload from './MediaUpload';
import { fetchNetworkCategories } from '../api/categories';
import { queuePortfolioNotifications } from '../services/emailNotificationService';

const CreatePostModal = ({ open, onClose, onPostCreated, darkMode = false, networkId }) => {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  
  // Media state
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaMetadata, setMediaMetadata] = useState({});
  
  // UI state
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      if (!networkId) return;
      const { data, error } = await fetchNetworkCategories(networkId, true);
      if (data && !error) {
        setCategories(data);
      }
    };
    if (open) {
      loadCategories();
    }
  }, [networkId, open]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      // Reset form after a short delay to avoid visual glitches
      setTimeout(() => {
        setTitle('');
        setContent('');
        setUrl('');
        setSelectedCategory('');
        setMediaUrl(null);
        setMediaType(null);
        setMediaMetadata({});
        setError('');
        setSuccess(false);
      }, 200);
    }
  }, [open]);

  // Handle media upload - exact same as DashboardPage
  const handleMediaUpload = (uploadResult) => {
    console.log("=== handleMediaUpload called ===");
    console.log("Upload result received:", uploadResult);
    console.log("Upload result URL:", uploadResult.url);
    console.log("Upload result type:", uploadResult.type);
    console.log("Upload result metadata:", uploadResult.metadata);
    
    setMediaUrl(uploadResult.url);
    setMediaType(uploadResult.type);
    setMediaMetadata({
      fileName: uploadResult.metadata?.fileName || uploadResult.fileName,
      fileSize: uploadResult.metadata?.fileSize || uploadResult.fileSize,
      mimeType: uploadResult.metadata?.mimeType || uploadResult.mimeType,
      duration: uploadResult.metadata?.duration,
      thumbnail: uploadResult.metadata?.thumbnail,
      title: uploadResult.metadata?.title,
      artist: uploadResult.metadata?.artist,
      album: uploadResult.metadata?.album,
      albumArt: uploadResult.metadata?.albumArt
    });
    
    console.log("State after setting - mediaUrl:", uploadResult.url);
    console.log("State after setting - mediaType:", uploadResult.type);
    
    setError('');
  };

  // Handle media deletion
  const handleDeleteMedia = () => {
    setMediaUrl(null);
    setMediaType(null);
    setMediaMetadata({});
  };

  // Get media icon
  const getMediaIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'image': return <ImageIcon fontSize="small" />;
      case 'video': return <VideoIcon fontSize="small" />;
      case 'audio': return <AudioIcon fontSize="small" />;
      case 'pdf': return <PdfIcon fontSize="small" />;
      default: return <AddIcon fontSize="small" />;
    }
  };

  // Handle form submission - exact same logic as DashboardPage
  const handleSubmit = async () => {
    // Validate the form
    if (!title.trim()) {
      setError('Post title is required');
      return;
    }
    
    try {
      setCreating(true);
      console.log("Publishing post:", title);
      console.log("Current media state:", { mediaUrl, mediaType, mediaMetadata });
      
      // Save post directly to the database
      const newPost = {
        profile_id: activeProfile?.id || user.id, // Backward compatible with both schemas
        title: title,
        description: content,
        url: url,
        category_id: selectedCategory || null
      };

      // Add media fields if media was uploaded via MediaUpload component
      if (mediaUrl) {
        newPost.media_url = mediaUrl;
        newPost.media_type = mediaType;
        newPost.media_metadata = mediaMetadata;
        
        // For backward compatibility, also set image_url if it's an image
        if (mediaType === 'image') {
          newPost.image_url = mediaUrl;
        }
      } else {
        console.log("No media URL found - mediaUrl is:", mediaUrl);
      }
      
      console.log('Saving post to portfolio_items table:', newPost);
      
      const { error, data } = await supabase
        .from('portfolio_items')
        .insert(newPost)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      console.log('Post saved successfully:', data);
      console.log('Saved post media fields:', {
        media_url: data.media_url,
        media_type: data.media_type,
        media_metadata: data.media_metadata
      });
      
      // Queue email notifications for network members
      if (networkId) {
        try {
        
        const notificationResult = await queuePortfolioNotifications(
          networkId,
          data.id,
          activeProfile?.id || user.id,
          title,
          content,
          data.media_url || data.image_url,
          data.media_type || (data.image_url ? 'image' : null)
        );
        
        if (!notificationResult.success) {
          console.error('Failed to queue email notifications:', notificationResult.error);
          // Don't fail the post creation if notification queueing fails
        }
      } catch (notificationError) {
        console.error('Error queueing email notifications:', notificationError);
        // Don't fail the post creation if notification queueing fails
      }
    }
      
      setSuccess(true);
      
      // Call callback if provided
      if (onPostCreated) {
        onPostCreated(data);
      }

      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error('Error publishing post:', err);
      setError('Failed to publish post. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!creating) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: darkMode ? alpha('#121212', 0.95) : 'background.paper',
          backdropFilter: 'blur(10px)',
          border: darkMode ? '1px solid rgba(255,255,255,0.1)' : 'none'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1,
        borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Create New Post
          </Typography>
        </Box>
        <IconButton 
          onClick={handleClose} 
          disabled={creating}
          sx={{ 
            color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            '&:hover': {
              bgcolor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Post created successfully!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Title Field */}
          <TextField
            label="Post Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            disabled={creating}
            variant="outlined"
            placeholder="Give your post a catchy title..."
          />

          {/* Content Field */}
          <TextField
            label="Post Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            required
            multiline
            rows={3}
            disabled={creating}
            variant="outlined"
            placeholder="Share your thoughts, experience, or story..."
          />

          {/* URL Field */}
          <TextField
            label="Link (Optional)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
            disabled={creating}
            variant="outlined"
            placeholder="Add a relevant link..."
            InputProps={{
              startAdornment: <LanguageIcon sx={{ color: 'text.secondary', mr: 1 }} />
            }}
          />

          {/* Category Selection */}
          {categories.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>Category (Optional)</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category (Optional)"
                disabled={creating}
              >
                <MenuItem value="">
                  <em>No Category</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: 0.5,
                          bgcolor: category.color,
                          flexShrink: 0
                        }}
                      />
                      {category.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Media Upload */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Add Media (Optional)
            </Typography>
            
            {mediaUrl ? (
              <Card sx={{ position: 'relative', mb: 2 }}>
                {mediaType === 'image' ? (
                  <CardMedia
                    component="img"
                    image={mediaUrl}
                    alt="Preview"
                    sx={{ 
                      maxHeight: 200, 
                      objectFit: 'contain',
                      bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                    }}
                  />
                ) : (
                  <Box 
                    sx={{ 
                      p: 3, 
                      textAlign: 'center',
                      bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                    }}
                  >
                    {getMediaIcon(mediaType)}
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {mediaMetadata?.fileName || 'Media file uploaded'}
                    </Typography>
                    <Chip 
                      label={mediaType?.toUpperCase() || 'FILE'} 
                      size="small" 
                      sx={{ mt: 1 }} 
                    />
                  </Box>
                )}
                <IconButton
                  onClick={handleDeleteMedia}
                  disabled={creating}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.8)'
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Card>
            ) : (
              <MediaUpload
                onUpload={handleMediaUpload}
                allowedTypes={['IMAGE', 'VIDEO', 'AUDIO', 'PDF']}
                bucket="profiles"
                path={`portfolios/${user?.id}`}
                maxFiles={1}
                autoUpload={true}
                showPreview={false}
                compact={true}
                disabled={creating}
              />
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        pt: 2,
        borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
      }}>
        <Button 
          onClick={handleClose} 
          disabled={creating}
          sx={{ 
            color: darkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary' 
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={creating || !title.trim() || !content.trim()}
          sx={{ 
            borderRadius: 2,
            px: 3,
            fontWeight: 600
          }}
        >
          {creating ? 'Creating...' : 'Create Post'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePostModal;