import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { useNetwork } from '../context/networkContext';
import { supabase } from '../supabaseclient';
import MembersDetailModal from './MembersDetailModal';
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
  IconButton,
  Chip,
  Fade,
  Zoom,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha
} from '@mui/material';
import Spinner from './Spinner';
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
import { fetchNetworkCategories } from '../api/categories';
import PollCard from './PollCard';
import MediaUpload from './MediaUpload';
import MediaPlayer from './MediaPlayer';
import ImageViewerModal from './ImageViewerModal';

// Enhanced News Tab component with image upload support and admin editing
const NewsTab = ({ darkMode }) => {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
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
  
  // State for categories
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState([]);
  
  // State for polls
  const [activePolls, setActivePolls] = useState([]);
  const [loadingPolls, setLoadingPolls] = useState(true);
  const [message, setMessage] = useState('');
  
  // State for image viewer modal
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '' });
  
  // Member detail modal state
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);

  // Fetch active polls and categories
  useEffect(() => {
    if (network?.id) {
      fetchActivePolls();
      loadCategories();
    }
  }, [network?.id]);

  const loadCategories = async () => {
    const { data, error } = await fetchNetworkCategories(network.id, true); // Only active categories
    if (data && !error) {
      setCategories(data);
    }
  };

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
  
  // Handle image click
  const handleImageClick = (imageUrl, title = '') => {
    setSelectedImage({ url: imageUrl, title });
    setImageViewerOpen(true);
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
    setSelectedCategory('');
    editor?.commands.clearContent();
    editor?.commands.focus();
  };

  // Handle media upload
  const handleMediaUpload = (uploadResult) => {
    console.log("[Regular NewsTab] Media upload result:", uploadResult);
    console.log("[Regular NewsTab] Setting mediaType to:", uploadResult.type);
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
      
      // Create news post using API function (includes notification queueing)
      const result = await createNewsPost(
        network.id,
        activeProfile?.id || user.id,
        newsTitle,
        content,
        imageUrl,
        imageCaption,
        mediaUrl,
        mediaType,
        mediaMetadata,
        selectedCategory
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create news post');
      }
      
      console.log('📰 News post created successfully:', result);
      
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

  // Handle member click
  const handleMemberClick = async (memberId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Find member in networkMembers first
      let member = networkMembers.find(m => m.id === memberId);
      
      if (!member) {
        // If not found in networkMembers, fetch from profiles table
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', memberId)
          .single();
          
        if (error) throw error;
        member = profileData;
      }
      
      if (member) {
        setSelectedMember(member);
        setMemberModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching member details:', err);
      // If modal fails, just log the error and don't fallback to navigation
    }
  };

  // News post creation form
  const renderNewsForm = () => (
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
                  margin: '0 auto',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onClick={() => handleImageClick(mediaUrl, newsTitle || 'Preview')}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              />
            ) : (
              <MediaPlayer
                src={mediaUrl}
                type={mediaType === 'video' ? 'video' : mediaType === 'pdf' ? 'pdf' : 'audio'}
                title={newsTitle || 'Media preview'}
                thumbnail={mediaMetadata?.thumbnail}
                fileName={mediaMetadata?.fileName}
                fileSize={mediaMetadata?.fileSize}
                numPages={mediaMetadata?.numPages}
                author={mediaMetadata?.author}
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
          allowedTypes={['IMAGE', 'VIDEO', 'AUDIO', 'PDF']}
          bucket="networks"
          path={`news/${network?.id}`}
          maxFiles={1}
          showPreview={false}
          autoUpload={true}
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
          startIcon={updating ? <Spinner size={20} /> : <SaveIcon />}
          disabled={updating}
        >
          Publish News
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
            Create a news
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5">
          News & Updates
        </Typography>
        
        {/* Category Filter */}
        {categories.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel shrink>Filter by Category</InputLabel>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              label="Filter by Category"
              displayEmpty
            >
              <MenuItem value="">
                <em>All Categories</em>
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
      </Box>
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
        networkNews
          .filter(post => !filterCategory || post.category_id === filterCategory)
          .map((post, index) => (
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
                          sx={{ 
                            objectFit: 'contain', 
                            bgcolor: 'black',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                            '&:hover': {
                              opacity: 0.9
                            }
                          }}
                          onClick={() => handleImageClick(post.media_url, post.title)}
                        />
                      );
                    } else {
                      return (
                        <MediaPlayer
                          src={post.media_url}
                          type={mediaType === 'video' ? 'video' : mediaType === 'pdf' ? 'pdf' : 'audio'}
                          title={post.media_metadata?.fileName}
                          fileName={post.media_metadata?.fileName}
                          fileSize={post.media_metadata?.fileSize}
                          numPages={post.media_metadata?.numPages}
                          author={post.media_metadata?.author}
                          thumbnail={post.media_metadata?.thumbnail}
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
                  sx={{ 
                    objectFit: 'cover',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                    '&:hover': {
                      opacity: 0.9
                    }
                  }}
                  onClick={() => handleImageClick(post.image_url, post.title)}
                />
              )}
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h6">
                  {post.title}
                </Typography>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Posted by{' '}
                  <Box 
                    component="span" 
                    onClick={(e) => handleMemberClick(post.created_by, e)}
                    sx={{ 
                      cursor: 'pointer', 
                      color: 'primary.main', 
                      '&:hover': { 
                        textDecoration: 'underline' 
                      },
                      transition: 'color 0.2s ease'
                    }}
                  >
                    {formatMemberName(post.created_by)}
                  </Box>
                  {' • '}{new Date(post.created_at).toLocaleDateString()}
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
      
      {/* Image Viewer Modal */}
      <ImageViewerModal
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage.url}
        title={selectedImage.title}
      />
      
      {/* Member Detail Modal */}
      <MembersDetailModal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        member={selectedMember}
        darkMode={darkMode}
      />
    </PageTransition>
  );
};

export default NewsTab;