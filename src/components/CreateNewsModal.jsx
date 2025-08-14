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
  Cancel as CancelIcon
} from '@mui/icons-material';
import { createNewsPost } from '../api/networks';
import { fetchNetworkCategories } from '../api/categories';
import MediaUpload from './MediaUpload';
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
      setSelectedCategory('');
      setError(null);
      if (editor) {
        editor.commands.clearContent();
      }
    }
  }, [open, editor]);

  const handleMediaUpload = (uploadResult) => {
    setMediaUrl(uploadResult.url);
    setMediaType(uploadResult.type);
    setMediaMetadata(uploadResult.metadata || {
      fileName: uploadResult.fileName,
      fileSize: uploadResult.fileSize,
      mimeType: uploadResult.mimeType
    });
    
    if (uploadResult.type === 'image') {
      setImagePreview(uploadResult.url);
    } else {
      setImagePreview(null);
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
        selectedCategory || null
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
            Featured Media (optional)
          </Typography>

          {imagePreview && (
            <Box sx={{ position: 'relative', mb: 2 }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '200px', display: 'block', margin: '0 auto' }}
              />
              <IconButton
                sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                onClick={() => {
                  setImagePreview(null);
                  setImageCaption('');
                  setMediaUrl(null);
                  setMediaType(null);
                  setMediaMetadata({});
                }}
                size="small"
              >
                <CancelIcon />
              </IconButton>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <MediaUpload
              onUpload={handleMediaUpload}
              allowedTypes={['IMAGE', 'VIDEO', 'AUDIO', 'PDF']}
              bucket="networks"
              path={`announcements/${networkId}`}
              maxFiles={1}
              showPreview={false}
              autoUpload={true}
            />

            {mediaUrl && (
              <Chip
                label={`${mediaType?.toUpperCase()} uploaded: ${mediaMetadata?.fileName}`}
                color="success"
                size="small"
                onDelete={() => {
                  setMediaUrl(null);
                  setMediaType(null);
                  setMediaMetadata({});
                  setImagePreview(null);
                }}
              />
            )}
          </Box>

          {(imageCaption || mediaUrl) && (
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