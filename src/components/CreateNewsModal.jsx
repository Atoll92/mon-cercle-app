import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { createNewsPost } from '../api/networks';
import { fetchNetworkCategories } from '../api/categories';
import MediaUpload from './MediaUpload';
import MediaCarousel from './MediaCarousel';
import UserContent from './UserContent';
import { useProfile } from '../context/profileContext';
import { useTheme } from './ThemeProvider';

const CreateAnnouncementModal = ({ open, onClose, networkId, onNewsCreated }) => {
  const { activeProfile } = useProfile();
  const { darkMode } = useTheme();
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaMetadata, setMediaMetadata] = useState({});
  // New state for multiple media items
  const [mediaItems, setMediaItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start writing your announcement...</p>',
  });

  // Load categories when modal opens
  useEffect(() => {
    if (open && networkId) {
      const loadCategories = async () => {
        const { data, error } = await fetchNetworkCategories(networkId, true);
        if (data && !error) {
          setCategories(data);
        }
      };
      loadCategories();
    }
  }, [open, networkId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setAnnouncementTitle('');
      setImageCaption('');
      setImagePreview(null);
      setMediaUrl(null);
      setMediaType(null);
      setMediaMetadata({});
      setMediaItems([]);
      setSelectedCategory('');
      setError(null);
      if (editor) {
        editor.commands.clearContent();
      }
    }
  }, [open, editor]);

  const handleMediaUpload = (uploadResult) => {
    // Handle both single file and multiple files
    const uploadResults = Array.isArray(uploadResult) ? uploadResult : [uploadResult];
    
    const newMediaItems = uploadResults.map(result => ({
      url: result.url,
      type: result.type,
      metadata: result.metadata || {
        fileName: result.fileName,
        fileSize: result.fileSize,
        mimeType: result.mimeType
      }
    }));
    
    // Add all new items to media items array
    setMediaItems(prev => [...prev, ...newMediaItems]);
    
    // Keep single media state for backwards compatibility (use first item)
    const firstItem = newMediaItems[0];
    setMediaUrl(firstItem.url);
    setMediaType(firstItem.type);
    setMediaMetadata(firstItem.metadata);
    
    if (firstItem.type === 'image') {
      setImagePreview(firstItem.url);
    } else {
      setImagePreview(null);
    }
  };
  
  // Handle removal of specific media item
  const handleRemoveMediaItem = (index) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
    // If no media items left, clear single media state
    if (mediaItems.length === 1) {
      setMediaUrl(null);
      setMediaType(null);
      setMediaMetadata({});
      setImagePreview(null);
      setImageCaption('');
    }
  };

  const handleSubmit = async () => {
    if (!announcementTitle.trim() || !editor) {
      setError('Please fill in both title and content');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const content = editor.getHTML();
      const imageUrl = mediaType === 'image' ? mediaUrl : null;

      const result = await createNewsPost(
        networkId,
        activeProfile.id,
        announcementTitle,
        content,
        imageUrl,
        imageCaption,
        mediaUrl,
        mediaType,
        mediaMetadata,
        selectedCategory || null,
        mediaItems // Pass the media_items array
      );

      if (result.success) {
        onNewsCreated(result.post);
        onClose();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to publish announcement: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: darkMode ? 'grey.900' : 'background.paper',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Create Announcement</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Announcement Title"
          value={announcementTitle}
          onChange={(e) => setAnnouncementTitle(e.target.value)}
          sx={{ mb: 2 }}
          autoFocus
        />

        {categories.length > 0 && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Category"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
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

        <Box sx={{ mb: 2, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Featured Media (optional) - You can add multiple files
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
                  bucket="networks"
                  path={`announcements/${networkId}`}
                  maxFiles={10 - mediaItems.length} // Allow remaining slots up to 10
                  showPreview={false}
                  autoUpload={true}
                  customButton={
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      disabled={submitting || mediaItems.length >= 10}
                      size="small"
                    >
                      Add More Media ({mediaItems.length}/10)
                    </Button>
                  }
                />
              </Box>
            </Box>
          ) : (
            <MediaUpload
              onUpload={handleMediaUpload}
              allowedTypes={['IMAGE', 'VIDEO', 'AUDIO', 'PDF']}
              bucket="networks"
              path={`announcements/${networkId}`}
              maxFiles={10 - mediaItems.length} // Allow up to 10 total, minus current items
              showPreview={false}
              autoUpload={true}
            />
          )}

          {/* Caption for first image */}
          {(mediaItems.some(item => item.type === 'image') || mediaUrl) && (
            <TextField
              fullWidth
              label="Media Caption"
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              size="small"
              sx={{ mt: 2 }}
            />
          )}
        </Box>

        <Paper sx={{
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          minHeight: '300px',
          '& .tiptap': {
            minHeight: '250px',
            padding: '8px',
            '&:focus-visible': {
              outline: 'none'
            }
          }
        }}>
          <EditorContent editor={editor} />
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          startIcon={<SaveIcon />}
          disabled={submitting || !announcementTitle.trim()}
        >
          {submitting ? 'Publishing...' : 'Publish Announcement'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAnnouncementModal;