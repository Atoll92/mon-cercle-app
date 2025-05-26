import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import { useNetwork } from '../context/networkContext';
import { supabase } from '../supabaseclient';
import { AnimatedCard, StaggeredListItem, PageTransition } from './AnimatedComponents';
import { NewsItemSkeleton } from './LoadingSkeleton';
import {
  Typography,
  Paper,
  Divider,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Fade,
  Zoom
} from '@mui/material';
import {
  Edit as EditIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Poll as PollIcon
} from '@mui/icons-material';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { createNewsPost, deleteNewsPost } from '../api/networks';
import { getActivePolls } from '../api/polls';
import PollCard from './PollCard';
import MediaUpload from './MediaUpload';
import MediaPlayer from './MediaPlayer';

// Enhanced News Tab component with image upload support and admin editing
const NewsTab = ({ darkMode }) => {
  const { user } = useAuth();
  const { network, news: networkNews, members: networkMembers, refreshNews, isAdmin } = useNetwork();
  
  // Debug: Log the news data to see what we're getting
  useEffect(() => {
    console.log('NetworkNews data:', networkNews);
    if (networkNews && networkNews.length > 0) {
      console.log('First news item:', networkNews[0]);
      console.log('Media fields:', {
        media_url: networkNews[0].media_url,
        media_type: networkNews[0].media_type,
        media_metadata: networkNews[0].media_metadata
      });
    }
  }, [networkNews]);
  
  // State for editing/creating news
  const [isCreating, setIsCreating] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [newsTitle, setNewsTitle] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageCaption, setImageCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaMetadata, setMediaMetadata] = useState({});
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  
  // State for polls
  const [activePolls, setActivePolls] = useState([]);
  const [loadingPolls, setLoadingPolls] = useState(true);
  const [message, setMessage] = useState('');

  // Fetch active polls
  useEffect(() => {
    if (network?.id) {
      fetchActivePolls();
    }
  }, [network?.id]);

  const fetchActivePolls = async () => {
    if (!network?.id) return;
    
    setLoadingPolls(true);
    const { data, error } = await getActivePolls(network.id);
    if (!error && data) {
      setActivePolls(data);
    }
    setLoadingPolls(false);
  };

  const handlePollVoteSubmit = (pollId) => {
    // Refresh polls after voting
    fetchActivePolls();
  };

  // TipTap editor instance
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start writing your news post...</p>',
  });

  // Reset all form fields
  const resetForm = () => {
    setNewsTitle('');
    setImageFile(null);
    setImageCaption('');
    setMediaUrl(null);
    setMediaType(null);
    setMediaMetadata({});
    editor?.commands.clearContent();
    editor?.commands.focus();
  };

  // Handle media upload
  const handleMediaUpload = (uploadResult) => {
    console.log("NewsTab media upload result:", uploadResult);
    setMediaUrl(uploadResult.url);
    setMediaType(uploadResult.type);
    // Include all metadata from the upload result, including thumbnail for audio
    setMediaMetadata(uploadResult.metadata || {
      fileName: uploadResult.fileName,
      fileSize: uploadResult.fileSize,
      mimeType: uploadResult.mimeType
    });
  };

  // Upload image to Supabase Storage
  const uploadNewsImage = async (networkId, file) => {
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

  // Handle news post submission
  const handleNewsSubmit = async () => {
    if (!newsTitle.trim() || !editor) {
      setError('Please fill in at least the title and content');
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
        imageUrl = await uploadNewsImage(network.id, imageFile);
      }
      
      // Create the news post with optional media
      const newsData = {
        title: newsTitle,
        content,
        network_id: network.id,
        created_by: user.id
      };
      
      // Add media fields if media was uploaded
      if (mediaUrl) {
        newsData.media_url = mediaUrl;
        newsData.media_type = mediaType;
        newsData.media_metadata = mediaMetadata;
        // For backward compatibility, also set image fields if it's an image
        if (mediaType === 'image') {
          newsData.image_url = mediaUrl;
          newsData.image_caption = imageCaption;
        }
      } else if (imageUrl) {
        // Legacy image upload support
        newsData.image_url = imageUrl;
        newsData.image_caption = imageCaption;
      }
      
      // Insert news post to database
      const { data, error } = await supabase
        .from('network_news')
        .insert([newsData])
        .select();
        
      if (error) throw error;
      
      // Update UI and clean up
      resetForm();
      setIsCreating(false);
      setMessage('News post published successfully!');
      
      // Refresh news from context
      refreshNews();
    } catch (error) {
      console.error('Error creating news post:', error);
      setError('Failed to publish news post: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };
  
  // Handle post deletion
  const handleDeleteNews = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    setError(null);
    setMessage('');
    
    try {
      const { error } = await supabase
        .from('network_news')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
      
      setMessage('News post deleted successfully!');
      
      // Refresh news from context
      refreshNews();
    } catch (error) {
      console.error('Error deleting news post:', error);
      setError('Failed to delete the post: ' + error.message);
    }
  };

  // Format a network member's name
  const formatMemberName = (memberId) => {
    const member = networkMembers.find(m => m.id === memberId);
    return member?.full_name || 'Admin';
  };

  // News post creation form
  const renderNewsForm = () => (
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
      />
      
      {/* Media upload section */}
      <Box sx={{ mb: 2, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          Featured Media (optional)
        </Typography>
        
        {mediaUrl && (
          <Box sx={{ position: 'relative', mb: 2 }}>
            {mediaType === 'IMAGE' ? (
              <img 
                src={mediaUrl} 
                alt="Preview" 
                style={{ maxWidth: '100%', maxHeight: '200px', display: 'block', margin: '0 auto' }} 
              />
            ) : (
              <MediaPlayer
                src={mediaUrl}
                type={mediaType === 'VIDEO' ? 'video' : 'audio'}
                title={newsTitle || 'Media preview'}
                thumbnail={mediaMetadata?.thumbnail}
                compact={false}
                darkMode={darkMode}
              />
            )}
            <IconButton 
              sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
              onClick={() => {
                setMediaUrl(null);
                setMediaType(null);
                setMediaMetadata({});
                setImageFile(null);
                setImageCaption('');
              }}
            >
              <CancelIcon />
            </IconButton>
          </Box>
        )}
        
        <MediaUpload
          onUpload={handleMediaUpload}
          allowedTypes={['IMAGE', 'VIDEO', 'AUDIO']}
          bucket="networks"
          path={`news/${network?.id}`}
          maxFiles={1}
          showPreview={false}
        />
        
        {/* Image caption field, shown only when media is an image */}
        {mediaType === 'image' && (
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
      
      {/* Rich text editor */}
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
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleNewsSubmit}
          startIcon={updating ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={updating}
        >
          Publish Post
        </Button>
        <Button
          variant="outlined"
          onClick={resetForm}
        >
          Clear
        </Button>
        <Button
          variant="text"
          onClick={() => setIsCreating(false)}
          startIcon={<CancelIcon />}
        >
          Cancel
        </Button>
      </Box>
    </Card>
  );

  // Main component render
  return (
    <PageTransition>
      <Paper sx={{ p: 3, bgcolor: darkMode ? 'background.paper' : undefined }} className="hover-lift">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            Network News
          </Typography>
        
        {isAdmin && !isCreating && (
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddPhotoIcon />}
            onClick={() => setIsCreating(true)}
          >
            Create News Post
          </Button>
        )}
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
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
      
      {isCreating && renderNewsForm()}
      
      {/* Active Polls Section */}
      {!loadingPolls && activePolls.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PollIcon color="primary" />
            Active Polls
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {activePolls.map(poll => (
            <PollCard 
              key={poll.id} 
              poll={poll} 
              onVoteSubmit={handlePollVoteSubmit}
            />
          ))}
        </Box>
      )}
      
      {/* News Posts Section */}
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        News & Updates
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {!network ? (
        <Box>
          {[1, 2, 3].map((_, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <NewsItemSkeleton />
            </Box>
          ))}
        </Box>
      ) : networkNews.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No news posts available
          </Typography>
          {isAdmin && !isCreating && (
            <Button 
              variant="outlined" 
              color="primary"
              startIcon={<AddPhotoIcon />}
              onClick={() => setIsCreating(true)}
              sx={{ mt: 2 }}
            >
              Create First News Post
            </Button>
          )}
        </Box>
      ) : (
        networkNews.map((post, index) => (
          <StaggeredListItem key={post.id} index={index}>
            <AnimatedCard sx={{ mb: 3, overflow: 'hidden' }}>
              {/* Display media content */}
              {post.media_url ? (
                <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                  {(() => {
                    // Determine media type from URL if media_type is missing
                    let mediaType = post.media_type;
                    if (!mediaType && post.media_url) {
                      const url = post.media_url.toLowerCase();
                      if (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('.mov')) {
                        mediaType = 'video';
                      } else if (url.includes('.mp3') || url.includes('.wav') || url.includes('.m4a') || url.includes('.aac')) {
                        mediaType = 'audio';
                      } else if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp')) {
                        mediaType = 'image';
                      }
                    }
                    
                    if (mediaType === 'image') {
                      return (
                        <CardMedia
                          component="img"
                          height="400"
                          image={post.media_url}
                          alt={post.title}
                          sx={{ objectFit: 'contain', bgcolor: 'black' }}
                        />
                      );
                    } else {
                      return (
                        <MediaPlayer
                          src={post.media_url}
                          type={mediaType === 'video' ? 'video' : 'audio'}
                          title={post.media_metadata?.fileName}
                          darkMode={darkMode}
                        />
                      );
                    }
                  })()}
                </Box>
              ) : post.image_url && (
                <CardMedia
                  component="img"
                  height="240"
                  image={post.image_url}
                  alt={post.title}
                  sx={{ objectFit: 'cover' }}
                />
              )}
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {post.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Posted by {formatMemberName(post.created_by)} • {new Date(post.created_at).toLocaleDateString()}
                </Typography>
              </Box>
              
              {/* Display caption for any media */}
              {((post.media_url && post.media_metadata?.fileName) || (post.image_url && post.image_caption)) && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mt: -2, mb: 2, fontStyle: 'italic' }}
                >
                  {post.image_caption || post.media_metadata?.fileName}
                </Typography>
              )}
              
              <Divider sx={{ my: 2 }} />
              <Box 
                className="tiptap-output"
                dangerouslySetInnerHTML={{ __html: post.content }}
                sx={{
                  '& ul': { listStyleType: 'disc', pl: 2 },
                  '& ol': { listStyleType: 'decimal', pl: 2 },
                  '& h1': { fontSize: '2em' },
                  '& h2': { fontSize: '1.5em' }
                }}
              />
            </CardContent>
            
            {isAdmin && (
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
            )}
            </AnimatedCard>
          </StaggeredListItem>
        ))
      )}
      </Paper>
    </PageTransition>
  );
};

export default NewsTab;