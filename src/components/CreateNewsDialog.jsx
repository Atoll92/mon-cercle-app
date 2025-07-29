import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Box,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  Chip,
  alpha
} from '@mui/material';
import {
  Save as SaveIcon,
  Close as CloseIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import MediaUpload from './MediaUpload';
import MediaPlayer from './MediaPlayer';
import { createNewsPost, updateNewsPost } from '../api/networks';
import { fetchNetworkCategories } from '../api/categories';
import { supabase } from '../supabaseclient';
import Spinner from './Spinner';

const CreateNewsDialog = ({ 
  open, 
  onClose, 
  networkId, 
  profileId, 
  onNewsCreated, 
  editingNews = null, 
  onNewsUpdated,
  darkMode = false 
}) => {
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    image_url: '',
    image_caption: '',
    media_url: null,
    media_type: null,
    media_metadata: {},
    category_id: ''
  });
  
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaMetadata, setMediaMetadata] = useState({});
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  // TipTap editor instance
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start writing your news post...</p>',
  });

  // Load categories on mount
  useEffect(() => {
    if (networkId) {
      const loadCategories = async () => {
        const { data, error } = await fetchNetworkCategories(networkId, true);
        if (data && !error) {
          setCategories(data);
        }
      };
      loadCategories();
    }
  }, [networkId]);

  // Reset form when dialog opens/closes or populate with editing data
  useEffect(() => {
    if (!open) {
      // Reset form
      setNewsForm({
        title: '',
        content: '',
        image_url: '',
        image_caption: '',
        media_url: null,
        media_type: null,
        media_metadata: {},
        category_id: ''
      });
      setMediaUrl(null);
      setMediaType(null);
      setMediaMetadata({});
      setError(null);
      editor?.commands.clearContent();
    } else if (editingNews && editor) {
      // Populate form with news data for editing
      setNewsForm({
        title: editingNews.title || '',
        content: editingNews.content || '',
        image_url: editingNews.image_url || '',
        image_caption: editingNews.image_caption || '',
        media_url: editingNews.media_url || null,
        media_type: editingNews.media_type || null,
        media_metadata: editingNews.media_metadata || {},
        category_id: editingNews.category_id || ''
      });
      
      // Set editor content
      editor.commands.setContent(editingNews.content || '<p>Start writing your news post...</p>');
      
      // Set media preview if exists
      if (editingNews.media_url) {
        setMediaUrl(editingNews.media_url);
        setMediaType(editingNews.media_type);
        setMediaMetadata(editingNews.media_metadata || {});
      }
    }
  }, [open, editingNews, editor]);

  // Handle media upload
  const handleMediaUpload = (uploadResult) => {
    setMediaUrl(uploadResult.url);
    setMediaType(uploadResult.type);
    setMediaMetadata(uploadResult.metadata || {
      fileName: uploadResult.fileName,
      fileSize: uploadResult.fileSize,
      mimeType: uploadResult.mimeType
    });
    
    // Update form with media info
    setNewsForm(prev => ({
      ...prev,
      media_url: uploadResult.url,
      media_type: uploadResult.type,
      media_metadata: uploadResult.metadata || {},
      // For backward compatibility
      image_url: uploadResult.type === 'image' ? uploadResult.url : prev.image_url
    }));
  };

  const handleSubmit = async () => {
    if (!newsForm.title.trim() || !editor) {
      setError('Please fill in at least the title and content');
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const content = editor.getHTML();
      
      if (editingNews) {
        // Update existing news
        const { error: updateError } = await supabase
          .from('network_news')
          .update({
            title: newsForm.title,
            content: content,
            image_url: newsForm.image_url,
            image_caption: newsForm.image_caption,
            media_url: mediaUrl,
            media_type: mediaType,
            media_metadata: mediaMetadata,
            category_id: newsForm.category_id || null
          })
          .eq('id', editingNews.id);

        if (updateError) throw updateError;

        // Fetch updated news
        const { data: updatedNews, error: fetchError } = await supabase
          .from('network_news')
          .select(`
            *,
            category:network_categories(
              id,
              name,
              color
            )
          `)
          .eq('id', editingNews.id)
          .single();

        if (fetchError) throw fetchError;

        onNewsUpdated(updatedNews);
      } else {
        // Create new news
        const result = await createNewsPost(
          networkId,
          profileId,
          newsForm.title,
          content,
          newsForm.image_url,
          newsForm.image_caption,
          mediaUrl,
          mediaType,
          mediaMetadata,
          newsForm.category_id || null
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to create news post');
        }

        // Fetch the complete news with category info
        const { data: newNews, error: fetchError } = await supabase
          .from('network_news')
          .select(`
            *,
            category:network_categories(
              id,
              name,
              color
            )
          `)
          .eq('id', result.post.id)
          .single();

        if (fetchError) throw fetchError;

        onNewsCreated(newNews);
      }

      onClose();
    } catch (error) {
      console.error('Error saving news:', error);
      setError(error.message || 'Failed to save news post');
    } finally {
      setUpdating(false);
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
          bgcolor: darkMode ? 'background.paper' : undefined
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {editingNews ? 'Edit News' : 'Create News'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <TextField
          fullWidth
          label="News Title"
          value={newsForm.title}
          onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
          sx={{ mb: 2 }}
          required
        />
        
        {/* Category selection */}
        {categories.length > 0 && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={newsForm.category_id}
              onChange={(e) => setNewsForm({ ...newsForm, category_id: e.target.value })}
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
        
        {/* Media upload section */}
        <Box sx={{ mb: 2, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Featured Media (optional)
          </Typography>
          
          {mediaUrl && (
            <Box sx={{ position: 'relative', mb: 2 }}>
              {mediaType === 'image' ? (
                <img 
                  src={mediaUrl} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px', 
                    display: 'block', 
                    margin: '0 auto' 
                  }} 
                />
              ) : (
                <MediaPlayer
                  src={mediaUrl}
                  type={mediaType === 'video' ? 'video' : mediaType === 'pdf' ? 'pdf' : 'audio'}
                  title={newsForm.title || 'Media preview'}
                  thumbnail={mediaMetadata?.thumbnail}
                  fileName={mediaMetadata?.fileName}
                  fileSize={mediaMetadata?.fileSize}
                  numPages={mediaMetadata?.numPages}
                  author={mediaMetadata?.author}
                  compact={true}
                  darkMode={darkMode}
                />
              )}
              <IconButton 
                sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                onClick={() => {
                  setMediaUrl(null);
                  setMediaType(null);
                  setMediaMetadata({});
                  setNewsForm(prev => ({
                    ...prev,
                    media_url: null,
                    media_type: null,
                    media_metadata: {},
                    image_url: ''
                  }));
                }}
              >
                <CancelIcon />
              </IconButton>
            </Box>
          )}
          
          <MediaUpload
            onUpload={handleMediaUpload}
            allowedTypes={['IMAGE', 'VIDEO', 'AUDIO', 'PDF']}
            bucket="networks"
            path={`news/${networkId}`}
            maxFiles={1}
            showPreview={false}
            autoUpload={true}
          />
          
          {/* Image caption field, shown only when media is an image */}
          {mediaType === 'image' && (
            <TextField
              fullWidth
              label="Image Caption (optional)"
              value={newsForm.image_caption}
              onChange={(e) => setNewsForm({ ...newsForm, image_caption: e.target.value })}
              margin="normal"
              size="small"
            />
          )}
        </Box>
        
        {/* Rich text editor */}
        <Typography variant="subtitle1" gutterBottom>
          Content
        </Typography>
        <Paper sx={{ 
          p: 2, 
          border: '1px solid #ddd',
          minHeight: '300px',
          mb: 2,
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
      
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          startIcon={updating ? <Spinner size={20} /> : <SaveIcon />}
          disabled={updating}
        >
          {editingNews ? 'Update' : 'Publish'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateNewsDialog;