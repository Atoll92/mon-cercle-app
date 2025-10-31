import React, { useState, useEffect, useCallback } from 'react';
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
  Chip,
  CircularProgress
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
import MediaCarousel from './MediaCarousel';
import UserContent from './UserContent';
import { fetchNetworkCategories } from '../api/categories';
import { createPost, updatePost } from '../api/posts';
import { useTranslation } from '../hooks/useTranslation';
import { fetchUrlMetadata, isValidUrl } from '../utils/urlMetadata';

const CreatePostModal = ({ 
  open, 
  onClose, 
  onPostCreated, 
  darkMode = false,
  mode = 'create', // 'create' or 'edit'
  editPost = null // Post data for editing
}) => {
  const { t } = useTranslation();
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
  // New state for multiple media items
  const [mediaItems, setMediaItems] = useState([]);
  
  // UI state
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [metadataFetched, setMetadataFetched] = useState(false);

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

  // Handle URL change and fetch metadata
  const handleUrlChange = useCallback(async (newUrl) => {
    setUrl(newUrl);
    setMetadataFetched(false);

    // If URL is valid and title is empty, fetch metadata
    if (isValidUrl(newUrl) && !title.trim() && mode === 'create') {
      setFetchingMetadata(true);
      setError('');

      try {
        const metadata = await fetchUrlMetadata(newUrl);

        if (metadata.success && metadata.title) {
          // Auto-fill title if it's empty
          if (!title.trim()) {
            setTitle(metadata.title);
            setMetadataFetched(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch URL metadata:', err);
        // Don't show error to user - it's a nice-to-have feature
      } finally {
        setFetchingMetadata(false);
      }
    }
  }, [title, mode]);

  // Initialize form with edit data
  useEffect(() => {
    if (mode === 'edit' && editPost && open) {
      setTitle(editPost.title || '');
      setContent(editPost.description || '');
      setUrl(editPost.url || '');
      setSelectedCategory(editPost.category_id || '');
      
      // Set media fields - check both direct and nested media_items
      if (editPost.media_items && Array.isArray(editPost.media_items) && editPost.media_items.length > 0) {
        // Handle multiple media items (direct field)
        setMediaItems(editPost.media_items);
        // Set first item as single media for backwards compatibility
        if (editPost.media_items.length > 0) {
          const firstItem = editPost.media_items[0];
          setMediaUrl(firstItem.url);
          setMediaType(firstItem.type);
          setMediaMetadata(firstItem.metadata || {});
        }
      } else if (editPost.media_metadata?.media_items && Array.isArray(editPost.media_metadata.media_items) && editPost.media_metadata.media_items.length > 0) {
        // Handle multiple media items (nested in media_metadata)
        setMediaItems(editPost.media_metadata.media_items);
        // Set first item as single media for backwards compatibility
        if (editPost.media_metadata.media_items.length > 0) {
          const firstItem = editPost.media_metadata.media_items[0];
          setMediaUrl(firstItem.url);
          setMediaType(firstItem.type);
          setMediaMetadata(firstItem.metadata || {});
        }
      } else if (editPost.media_url) {
        // Handle single media
        setMediaUrl(editPost.media_url);
        setMediaType(editPost.media_type);
        setMediaMetadata(editPost.media_metadata || {});
        // Also add to media items array
        setMediaItems([{
          url: editPost.media_url,
          type: editPost.media_type,
          metadata: editPost.media_metadata || {}
        }]);
      } else if (editPost.image_url) {
        // Handle legacy image_url
        setMediaUrl(editPost.image_url);
        setMediaType('image');
        setMediaMetadata({});
        setMediaItems([{
          url: editPost.image_url,
          type: 'image',
          metadata: {}
        }]);
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
          setMediaItems([]);
        }
        setError('');
        setSuccess(false);
      }, 200);
    }
  }, [open, mode]);

  // Handle media upload - supports multiple media
  const handleMediaUpload = (uploadResult) => {
    console.log("=== handleMediaUpload called ===");
    console.log("Upload result received:", uploadResult);
    
    // Handle both single file and multiple files
    const uploadResults = Array.isArray(uploadResult) ? uploadResult : [uploadResult];
    
    const newMediaItems = uploadResults.map(result => ({
      url: result.url,
      type: result.type,
      metadata: {
        fileName: result.metadata?.fileName || result.fileName,
        fileSize: result.metadata?.fileSize || result.fileSize,
        mimeType: result.metadata?.mimeType || result.mimeType,
        duration: result.metadata?.duration,
        thumbnail: result.metadata?.thumbnail,
        title: result.metadata?.title,
        artist: result.metadata?.artist,
        album: result.metadata?.album,
        albumArt: result.metadata?.albumArt
      }
    }));
    
    // Add all new items to media items array
    setMediaItems(prev => [...prev, ...newMediaItems]);
    
    // Keep single media state for backwards compatibility (use first item)
    const firstItem = newMediaItems[0];
    setMediaUrl(firstItem.url);
    setMediaType(firstItem.type);
    setMediaMetadata(firstItem.metadata);
    
    setError('');
  };

  // Handle removal of specific media item
  const handleRemoveMediaItem = (index) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
    // If no media items left, clear single media state
    if (mediaItems.length === 1) {
      setMediaUrl(null);
      setMediaType(null);
      setMediaMetadata({});
    }
  };

  // Handle media deletion (clear all) - currently unused but keeping for potential future use
  // const handleDeleteMedia = () => {
  //   setMediaUrl(null);
  //   setMediaType(null);
  //   setMediaMetadata({});
  //   setMediaItems([]);
  // };

  // Get media icon - currently unused but keeping for potential future use
  // const getMediaIcon = (type) => {
  //   switch (type?.toLowerCase()) {
  //     case 'image': return <ImageIcon fontSize="small" />;
  //     case 'video': return <VideoIcon fontSize="small" />;
  //     case 'audio': return <AudioIcon fontSize="small" />;
  //     case 'pdf': return <PdfIcon fontSize="small" />;
  //     default: return <AddIcon fontSize="small" />;
  //   }
  // };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate the form
    if (!title.trim()) {
      setError(t('createPost.errors.titleRequired'));
      return;
    }
    
    try {
      setCreating(true);
      
      const postData = {
        title: title,
        description: content,
        url: url,
        category_id: selectedCategory || null,
        // Include single media for backwards compatibility
        mediaUrl: mediaUrl,
        mediaType: mediaType,
        mediaMetadata: mediaMetadata,
        // Include multiple media items if available
        media_items: mediaItems.length > 0 ? mediaItems : undefined
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
      setError(t('createPost.errors.saveFailed'));
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
            {mode === 'edit' ? t('createPost.editPost') : t('createPost.createNewPost')}
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
            {t('createPost.success', { action: mode === 'edit' ? t('createPost.updated') : t('createPost.created') })}
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
            label={t('createPost.postTitle')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            disabled={creating}
            variant="outlined"
            placeholder={t('createPost.postTitlePlaceholder')}
          />

          {/* Content Field */}
          <TextField
            label={t('createPost.postContent')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            multiline
            rows={3}
            disabled={creating}
            variant="outlined"
            placeholder={t('createPost.postContentPlaceholder')}
            helperText={t('createPost.optionalField')}
          />

          {/* URL Field */}
          <TextField
            label={t('createPost.linkOptional')}
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            fullWidth
            disabled={creating}
            variant="outlined"
            placeholder={t('createPost.linkPlaceholder')}
            slotProps={{
              input: {
                startAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                    <LanguageIcon sx={{ color: 'text.secondary' }} />
                    {fetchingMetadata && (
                      <CircularProgress size={16} sx={{ ml: 1 }} />
                    )}
                  </Box>
                )
              }
            }}
            helperText={metadataFetched ? t('createPost.titleAutoFilled') : ''}
          />

          {/* Category Selection */}
          {categories.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>{t('createPost.categoryOptional')}</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label={t('createPost.categoryOptional')}
                disabled={creating}
              >
                <MenuItem value="">
                  <em>{t('createPost.noCategory')}</em>
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
              {t('createPost.addMediaMultiple')}
            </Typography>
            
            {mediaItems.length > 0 ? (
              <Box sx={{ mb: 2 }}>
                <MediaCarousel
                  media={mediaItems}
                  onRemove={handleRemoveMediaItem}
                  isEditMode={true}
                  darkMode={darkMode}
                  height={300}
                  autoplay={false}
                  showThumbnails={true}
                  compact={false}
                />
                
                {/* Add more media button */}
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <MediaUpload
                    onUpload={handleMediaUpload}
                    allowedTypes={['IMAGE', 'VIDEO', 'AUDIO', 'PDF']}
                    bucket="profiles"
                    path={`portfolios/${user?.id}`}
                    maxFiles={10 - mediaItems.length} // Allow remaining slots up to 10
                    autoUpload={true}
                    showPreview={false}
                    compact={true}
                    disabled={creating || mediaItems.length >= 10}
                    customButton={
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        disabled={creating || mediaItems.length >= 10}
                        size="small"
                      >
                        {t('createPost.addMoreMedia', { count: mediaItems.length })}
                      </Button>
                    }
                  />
                </Box>
              </Box>
            ) : (
              <MediaUpload
                onUpload={handleMediaUpload}
                allowedTypes={['IMAGE', 'VIDEO', 'AUDIO', 'PDF']}
                bucket="profiles"
                path={`portfolios/${user?.id}`}
                maxFiles={10 - mediaItems.length} // Allow up to 10 total, minus current items
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
          {t('createPost.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={creating || !title.trim()}
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 600
          }}
        >
          {creating ? (mode === 'edit' ? t('createPost.updating') : t('createPost.creating')) : (mode === 'edit' ? t('createPost.updatePost') : t('createPost.createPostButton'))}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePostModal;