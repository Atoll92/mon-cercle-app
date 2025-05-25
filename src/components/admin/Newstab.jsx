import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { supabase } from '../../supabaseclient';
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
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { createNewsPost, deleteNewsPost } from '../../api/networks';
import MediaUpload from '../MediaUpload';

const NewsTab = ({ networkId, userId, newsPosts, setNewsPosts, members, darkMode = false }) => {
  const [newsTitle, setNewsTitle] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageCaption, setImageCaption] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaMetadata, setMediaMetadata] = useState({});
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start writing your news post...</p>',
    onUpdate: ({ editor }) => {
      // You can access the content with editor.getHTML()
    },
  });

  // Handle media upload
  const handleMediaUpload = (uploadResult) => {
    console.log("Media upload result:", uploadResult);
    setMediaUrl(uploadResult.url);
    setMediaType(uploadResult.type);
    setMediaMetadata({
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

  // Handle image file selection (legacy)
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Upload image to Supabase Storage
  const uploadNewsImage = async (file) => {
    try {
      if (!file) return null;
      
      // Sanitize filename
      const filename = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-zA-Z0-9.-]/g, "_"); // Replace special chars
      
      // Create a unique path for the image
      const filePath = `news/${networkId}/${Date.now()}_${filename}`;
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('networks')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('networks')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading news image:', error);
      throw error;
    }
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
      let imageUrl = null;
      
      // Upload image if one is selected
      if (imageFile) {
        imageUrl = await uploadNewsImage(imageFile);
      }
      
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
        mediaMetadata
      );
    
      if (result.success) {
        setNewsPosts([result.post, ...newsPosts]);
        setNewsTitle('');
        setImageFile(null);
        setImageCaption('');
        setImagePreview(null);
        setMediaUrl(null);
        setMediaType(null);
        setMediaMetadata({});
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
          Create News Post
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
                  setImageFile(null);
                  setImagePreview(null);
                  setImageCaption('');
                }}
              >
                <CancelIcon />
              </IconButton>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <MediaUpload
              onUpload={handleMediaUpload}
              allowedTypes={['IMAGE', 'VIDEO', 'AUDIO']}
              bucket="networks"
              path={`news/${networkId}`}
              maxFiles={1}
              showPreview={false}
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
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<AddPhotoIcon />}
              size="small"
            >
              {imageFile ? 'Change' : 'Add'} Image (Legacy)
              <input 
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageChange}
              />
            </Button>
            
            {imageFile && (
              <Typography variant="body2" color="text.secondary">
                {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
              </Typography>
            )}
          </Box>
          
          {/* Image caption field, shown only when image is selected */}
          {imageFile && (
            <TextField
              fullWidth
              label="Image Caption (optional)"
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              margin="normal"
              size="small"
            />
          )}
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
            {updating ? <CircularProgress size={24} /> : 'Publish Post'}
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
            <Typography variant="h6">{post.title}</Typography>
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