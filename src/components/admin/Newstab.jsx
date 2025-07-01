import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  alpha
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { createNewsPost, deleteNewsPost } from '../../api/networks';
import { fetchNetworkCategories } from '../../api/categories';
import MediaUpload from '../MediaUpload';

const NewsTab = ({ networkId, userId, newsPosts, setNewsPosts, members, darkMode = false }) => {
  const [newsTitle, setNewsTitle] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaMetadata, setMediaMetadata] = useState({});
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start writing your news post...</p>',
    onUpdate: ({ editor }) => {
      // You can access the content with editor.getHTML()
    },
  });

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await fetchNetworkCategories(networkId, true); // Only active categories
      if (data && !error) {
        setCategories(data);
      }
    };
    loadCategories();
  }, [networkId]);

  // Handle media upload
  const handleMediaUpload = (uploadResult) => {
    console.log("[Admin NewsTab] Media upload result:", uploadResult);
    setMediaUrl(uploadResult.url);
    setMediaType(uploadResult.type);
    // Include all metadata from the upload result, including thumbnail for audio
    setMediaMetadata(uploadResult.metadata || {
      fileName: uploadResult.fileName,
      fileSize: uploadResult.fileSize,
      mimeType: uploadResult.mimeType
    });
    
    // For backward compatibility with existing image preview
    if (uploadResult.type === 'image') {
      setImagePreview(uploadResult.url);
    } else {
      setImagePreview(null);
    }
    
    // Show success message
    setMessage(`${uploadResult.type.toUpperCase()} uploaded successfully: ${uploadResult.fileName}`);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleNewsSubmit = async () => {
    if (!newsTitle.trim() || !editor) {
      setError('Please fill in both title and content');
      return;
    }
  
    setUpdating(true);
    setError(null);
    setMessage('');
    
    try {
      const content = editor.getHTML();
      
      // Use mediaUrl as imageUrl if it's an image type
      const imageUrl = mediaType === 'image' ? mediaUrl : null;
      
      // Debug log the media parameters
      console.log('Creating news post with media:', {
        mediaUrl,
        mediaType,
        mediaMetadata,
        imageUrl,
        imageCaption
      });
      
      // Create news post with optional media
      const result = await createNewsPost(
        networkId, 
        userId, 
        newsTitle, 
        content, 
        imageUrl, 
        imageCaption,
        mediaUrl,
        mediaType,
        mediaMetadata,
        selectedCategory || null
      );
    
      if (result.success) {
        setNewsPosts([result.post, ...newsPosts]);
        setNewsTitle('');
        setImageCaption('');
        setImagePreview(null);
        setMediaUrl(null);
        setMediaType(null);
        setMediaMetadata({});
        setSelectedCategory('');
        editor.commands.clearContent();
        setMessage(result.message);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to publish news post: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };
  
  const handleDeleteNews = async (postId) => {
    setError(null);
    setMessage('');
    
    const result = await deleteNewsPost(postId);
  
    if (result.success) {
      setNewsPosts(newsPosts.filter(post => post.id !== postId));
      setMessage(result.message);
    } else {
      setError(result.message);
    }
  };

  return (
    <>
      {message && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Card sx={{ p: 3, mb: 3, bgcolor: darkMode ? 'background.paper' : undefined }}>
        <Typography variant="h5" gutterBottom>
          Create a news
        </Typography>
        <TextField
          fullWidth
          label="Post Title"
          value={newsTitle}
          onChange={(e) => setNewsTitle(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            sx: {
              color: darkMode ? 'text.primary' : undefined
            }
          }}
        />
        
        {/* Category selection */}
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
        
        {/* Image upload section */}
        <Box sx={{ mb: 2, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Featured Image (optional)
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
              path={`news/${networkId}`}
              maxFiles={1}
              showPreview={false}
              autoUpload={true}
            />
            
            {/* Media upload feedback */}
            {mediaUrl && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={`${mediaType?.toUpperCase()} uploaded: ${mediaMetadata?.fileName}`}
                  color="success"
                  size="small"
                  onDelete={() => {
                    setMediaUrl(null);
                    setMediaType(null);
                    setMediaMetadata({});
                  }}
                />
              </Box>
            )}
            
            {(imageCaption || mediaUrl) && (
              <TextField
                label="Image Caption"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                size="small"
                sx={{ flex: 1, minWidth: 200 }}
                InputProps={{
                  sx: {
                    color: darkMode ? 'text.primary' : undefined
                  }
                }}
              />
            )}
          </Box>
        </Box>
        <Paper sx={{ 
          p: 2, 
          border: '1px solid #ddd',
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
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleNewsSubmit}
            startIcon={<SaveIcon />}
            disabled={updating}
          >
            {updating ? <CircularProgress size={24} /> : 'Publish News'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => editor?.commands.clearContent()}
          >
            Clear
          </Button>
        </Box>
      </Card>

      <Typography variant="h5" gutterBottom>
        Previous Posts
      </Typography>
      {newsPosts.map(post => (
        <Card key={post.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h6">{post.title}</Typography>
              {post.category_id && categories.find(c => c.id === post.category_id) && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '16px',
                    bgcolor: alpha(categories.find(c => c.id === post.category_id).color, 0.12),
                    border: `1px solid ${alpha(categories.find(c => c.id === post.category_id).color, 0.3)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(categories.find(c => c.id === post.category_id).color, 0.18),
                      borderColor: alpha(categories.find(c => c.id === post.category_id).color, 0.4),
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: categories.find(c => c.id === post.category_id).color,
                      flexShrink: 0
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: categories.find(c => c.id === post.category_id).color,
                      letterSpacing: '0.02em'
                    }}
                  >
                    {categories.find(c => c.id === post.category_id).name}
                  </Typography>
                </Box>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Posted by {members.find(m => m.id === post.created_by)?.full_name || 'Admin'} • 
              {new Date(post.created_at).toLocaleDateString()}
            </Typography>
            
            {post.image_url && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <img 
                  src={post.image_url} 
                  alt={post.title}
                  style={{ maxWidth: '100%', maxHeight: '300px', display: 'block' }} 
                />
                {post.image_caption && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                    {post.image_caption}
                  </Typography>
                )}
              </Box>
            )}
            <Divider sx={{ my: 2 }} />
            <div 
              className="tiptap-output"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </CardContent>
          <CardActions>
            <Button 
              size="small" 
              color="error"
              onClick={() => handleDeleteNews(post.id)}
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          </CardActions>
        </Card>
      ))}
    </>
  );
};

export default NewsTab;