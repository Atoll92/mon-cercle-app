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
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import MediaUpload from './MediaUpload';
import { fetchNetworkCategories } from '../api/categories';
import { createPost, updatePost } from '../api/posts';

const CreatePostModal = ({ 
  open, 
  onClose, 
  onPostCreated, 
  darkMode = false,
  mode = 'create', // 'create' or 'edit'
  editPost = null // Post data for editing
}) => {
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
      if (!activeProfile.network_id) return;
      const { data, error } = await fetchNetworkCategories(activeProfile.network_id, true);
      if (data && !error) {
        setCategories(data);
      }
    };
    if (open) {
      loadCategories();
    }
  }, [activeProfile, open]);

  // Initialize form with edit data
  useEffect(() => {
    if (mode === 'edit' && editPost && open) {
      setTitle(editPost.title || '');
      setContent(editPost.description || '');
      setUrl(editPost.url || '');
      setSelectedCategory(editPost.category_id || '');
      
      // Set media fields
      if (editPost.media_url) {
        setMediaUrl(editPost.media_url);
        setMediaType(editPost.media_type);
        setMediaMetadata(editPost.media_metadata || {});
      } else if (editPost.image_url) {
        // Handle legacy image_url
        setMediaUrl(editPost.image_url);
        setMediaType('image');
        setMediaMetadata({});
      }
    }
  }, [mode, editPost, open]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      // Reset form after a short delay to avoid visual glitches
      setTimeout(() => {
        if (mode === 'create') {
          setTitle('');
          setContent('');
          setUrl('');
          setSelectedCategory('');
          setMediaUrl(null);
          setMediaType(null);
          setMediaMetadata({});
        }
        setError('');
        setSuccess(false);
      }, 200);
    }
  }, [open, mode]);

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

  // Handle form submission
  const handleSubmit = async () => {
    // Validate the form
    if (!title.trim()) {
      setError('Post title is required');
      return;
    }
    
    try {
      setCreating(true);
      
      const postData = {
        title: title,
        description: content,
        url: url,
        category_id: selectedCategory || null,
        mediaUrl: mediaUrl,
        mediaType: mediaType,
        mediaMetadata: mediaMetadata
      };
      
      let data;
      
      if (mode === 'edit') {
        console.log("Updating post:", editPost.id);
        console.log("Update data:", postData);
        data = await updatePost(editPost.id, postData);
      } else {
        console.log("Creating post:", title);
        console.log("Create data:", postData);
        data = await createPost({
          ...postData,
          profile_id: activeProfile.id
        });
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
      console.error('Error saving post:', err);
      setError(`Failed to ${mode === 'edit' ? 'update' : 'create'} post. Please try again.`);
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
            {mode === 'edit' ? 'Edit Post' : 'Create New Post'}
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
            Post {mode === 'edit' ? 'updated' : 'created'} successfully!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
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
          {creating ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Post' : 'Create Post')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePostModal;