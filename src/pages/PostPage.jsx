import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import Spinner from '../components/Spinner';
import {
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Link as LinkIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';
import { formatDate } from '../utils/dateFormatting';
import MediaPlayer from '../components/MediaPlayer';
import LinkPreview from '../components/LinkPreview';
import LazyImage from '../components/LazyImage';
import ImageViewerModal from '../components/ImageViewerModal';
import CommentSection from '../components/CommentSection';
import LinkifiedText from '../components/LinkifiedText';
import UserContent from '../components/UserContent';
import CreatePostModal from '../components/CreatePostModal';

function PostPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { activeProfile } = useProfile();
  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '' });
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch portfolio post
      const { data: postData, error: postError } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('id', postId)
        .single();

      if (postError) throw postError;
      
      if (!postData) {
        setError('Post not found');
        return;
      }

      setPost(postData);

      // Fetch author details
      const { data: authorData, error: authorError } = await supabase
        .from('profiles')
        .select('id, full_name, profile_picture_url, user_id')
        .eq('id', postData.profile_id)
        .single();

      if (!authorError && authorData) {
        setAuthor(authorData);
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    setEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', postId)
        .eq('profile_id', activeProfile?.id); // Ensure user can only delete their own posts

      if (error) throw error;

      navigate(`/profile/${author.id}`, { replace: true });
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post');
    }
    handleMenuClose();
  };

  const handleImageClick = (url, title) => {
    setSelectedImage({ url, title });
    setImageViewerOpen(true);
  };

  const handlePostUpdated = () => {
    setEditModalOpen(false);
    fetchPost(); // Refresh the post data
  };

  const getContentTypeIcon = () => {
    // Check for PDF
    if (post.file_type === 'pdf') {
      return { icon: <PdfIcon fontSize="small" />, label: 'PDF', color: 'error' };
    }
    
    // Check for media
    if (post.media_url && post.media_type) {
      switch (post.media_type) {
        case 'image':
          return { icon: <ImageIcon fontSize="small" />, label: 'Image', color: 'success' };
        case 'video':
          return { icon: <VideoIcon fontSize="small" />, label: 'Video', color: 'info' };
        case 'audio':
          return { icon: <AudioIcon fontSize="small" />, label: 'Audio', color: 'warning' };
      }
    }
    
    // Check for legacy image
    if (post.image_url) {
      return { icon: <ImageIcon fontSize="small" />, label: 'Image', color: 'success' };
    }
    
    // Check for external link
    if (post.url) {
      return { icon: <LinkIcon fontSize="small" />, label: 'Link', color: 'primary' };
    }
    
    return null;
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Spinner size={120} />
      </Container>
    );
  }

  if (error || !post) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Post not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  const isAuthor = author && (author.id === activeProfile?.id);
  const contentType = getContentTypeIcon();

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
        
        {isAuthor && (
          <>
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleEdit}>
                <EditIcon sx={{ mr: 1 }} fontSize="small" />
                Edit Post
              </MenuItem>
              <MenuItem onClick={handleDelete}>
                <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
                Delete Post
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>

      {/* Main Content */}
      <Paper sx={{ p: 4 }}>
        {/* Author Info */}
        {author && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar
                src={author.profile_picture_url}
                alt={author.full_name}
                sx={{ width: 60, height: 60, mr: 2 }}
                onClick={() => navigate(`/profile/${author.id}`)}
                style={{ cursor: 'pointer' }}
              >
                {author.full_name?.[0]}
              </Avatar>
              <Typography
                variant="h5"
                component={Link}
                to={`/profile/${author.id}`}
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                {author.full_name}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ ml: '76px' }}>
              Posted on {formatDate(post.created_at, { year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* Title and Tags */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <UserContent 
              content={post.title}
              html={false}
              component="h1"
              sx={{ 
                fontSize: '2.125rem',
                fontWeight: 400,
                lineHeight: 1.235,
                letterSpacing: '0.00735em'
              }}
            />
            {contentType && (
              <Chip
                size="small"
                icon={contentType.icon}
                label={contentType.label}
                color={contentType.color}
                variant="outlined"
              />
            )}
          </Box>
          {post.tags && post.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              {post.tags.map((tag, index) => (
                <Chip key={index} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          )}
        </Box>

        {/* Media Display */}
        {post.file_type === 'pdf' && post.file_url ? (
          <Box sx={{ mb: 3 }}>
            <MediaPlayer
              src={post.file_url}
              type="pdf"
              title={post.title || "PDF Document"}
              fileName={post.title || "PDF Document"}
            />
          </Box>
        ) : post.media_url ? (
          <Box sx={{ mb: 3 }}>
            {(() => {
              // Determine media type from URL if media_type is missing
              let mediaType = post.media_type;
              if (!mediaType && post.media_url) {
                const url = post.media_url.toLowerCase();
                if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
                  mediaType = 'video';
                } else if (url.includes('.mp3') || url.includes('.wav') || url.includes('.m4a')) {
                  mediaType = 'audio';
                } else if (url.includes('.pdf')) {
                  mediaType = 'pdf';
                } else {
                  mediaType = 'image';
                }
              }
              
              if (mediaType === 'image') {
                return (
                  <Box 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.9 }
                    }}
                    onClick={() => handleImageClick(post.media_url, post.title)}
                  >
                    <LazyImage
                      src={post.media_url}
                      alt={post.title}
                      style={{
                        width: '100%',
                        maxHeight: '600px',
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                    />
                  </Box>
                );
              } else if (mediaType === 'audio') {
                const audioThumbnail = post.media_metadata?.thumbnail || post.image_url;
                
                return (
                  <MediaPlayer
                    src={post.media_url}
                    type="audio"
                    title={post.media_metadata?.title || post.title}
                    thumbnail={audioThumbnail}
                    metadata={post.media_metadata}
                  />
                );
              } else {
                // Video or PDF
                return (
                  <MediaPlayer
                    src={post.media_url}
                    type={mediaType}
                    title={post.media_metadata?.fileName || post.title}
                    thumbnail={post.media_metadata?.thumbnail || post.image_url}
                    metadata={post.media_metadata}
                  />
                );
              }
            })()}
          </Box>
        ) : post.image_url && (
          <Box 
            sx={{ 
              mb: 3,
              cursor: 'pointer',
              '&:hover': { opacity: 0.9 }
            }}
            onClick={() => handleImageClick(post.image_url, post.title)}
          >
            <LazyImage
              src={post.image_url}
              alt={post.title}
              style={{
                width: '100%',
                maxHeight: '600px',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          </Box>
        )}

        {/* Description */}
        {post.description && (
          <Box sx={{ mb: 3 }}>
            <UserContent
              content={post.description}
              html={false}
              sx={{ 
                fontSize: '1rem',
                color: 'text.primary'
              }}
            />
          </Box>
        )}

        {/* External Link */}
        {post.url && (
          <Box sx={{ mb: 3 }}>
            <LinkPreview 
              url={post.url} 
              compact={false}
            />
          </Box>
        )}

        {/* View PDF Button */}
        {post.file_type === 'pdf' && post.file_url && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<PdfIcon />}
              href={post.file_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open PDF in New Tab
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Comments Section */}
        <CommentSection
          itemType="post"
          itemId={post.id}
          defaultExpanded={true}
        />
      </Paper>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage.url}
        title={selectedImage.title}
      />

      {/* Edit Post Modal */}
      <CreatePostModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onPostCreated={handlePostUpdated}
        mode="edit"
        editPost={post}
      />
    </Container>
  );
}

export default PostPage;