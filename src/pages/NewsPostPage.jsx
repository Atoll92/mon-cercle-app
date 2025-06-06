import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';
import { format } from 'date-fns';
import MediaPlayer from '../components/MediaPlayer';
import { sanitizeRichText } from '../utils/sanitizeHtml';

function NewsPostPage() {
  const { networkId, newsId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [newsPost, setNewsPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchNewsPost();
    checkAdminStatus();
  }, [newsId, user]);

  const fetchNewsPost = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch news post
      const { data: post, error: postError } = await supabase
        .from('network_news')
        .select('*')
        .eq('id', newsId)
        .eq('network_id', networkId)
        .single();

      if (postError) throw postError;
      
      if (!post) {
        setError('News post not found');
        return;
      }

      setNewsPost(post);

      // Fetch author details
      const { data: authorData, error: authorError } = await supabase
        .from('profiles')
        .select('id, full_name, profile_picture_url')
        .eq('id', post.created_by)
        .single();

      if (!authorError && authorData) {
        setAuthor(authorData);
      }
    } catch (err) {
      console.error('Error fetching news post:', err);
      setError('Failed to load news post');
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, network_id')
        .eq('user_id', user.id)
        .eq('network_id', networkId)
        .single();

      setIsAdmin(profile?.role === 'admin');
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    // TODO: Navigate to edit page
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this news post?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('network_news')
        .delete()
        .eq('id', newsId);

      if (error) throw error;

      navigate(`/network/${networkId}`, { replace: true });
    } catch (err) {
      console.error('Error deleting news post:', err);
      alert('Failed to delete news post');
    }
    handleMenuClose();
  };

  const handleFlag = async () => {
    try {
      const { error } = await supabase
        .from('network_news')
        .update({ 
          is_flagged: true,
          flag_reason: 'Flagged by user'
        })
        .eq('id', newsId);

      if (error) throw error;
      
      alert('Post has been flagged for review');
      fetchNewsPost(); // Refresh the post
    } catch (err) {
      console.error('Error flagging post:', err);
      alert('Failed to flag post');
    }
    handleMenuClose();
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !newsPost) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'News post not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/network/${networkId}`)}
        >
          Back to Network
        </Button>
      </Container>
    );
  }

  const isAuthor = user?.id === newsPost.created_by;
  const canModerate = isAdmin || isAuthor;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/network/${networkId}`)}
        >
          Back to Network
        </Button>
        
        {canModerate && (
          <>
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              {isAuthor && (
                <MenuItem onClick={handleEdit}>
                  <EditIcon sx={{ mr: 1 }} fontSize="small" />
                  Edit
                </MenuItem>
              )}
              {canModerate && (
                <MenuItem onClick={handleDelete}>
                  <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
                  Delete
                </MenuItem>
              )}
              {!isAuthor && (
                <MenuItem onClick={handleFlag}>
                  <FlagIcon sx={{ mr: 1 }} fontSize="small" />
                  Flag
                </MenuItem>
              )}
            </Menu>
          </>
        )}
      </Box>

      {/* Main Content */}
      <Paper sx={{ p: 4 }}>
        {/* Title */}
        <Typography variant="h3" component="h1" gutterBottom>
          {newsPost.title}
        </Typography>

        {/* Meta Information */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          {author && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                src={author.profile_picture_url}
                alt={author.full_name}
                sx={{ width: 40, height: 40, mr: 1 }}
              >
                {author.full_name?.[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">
                  {author.full_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Author
                </Typography>
              </Box>
            </Box>
          )}
          
          <Chip
            icon={<CalendarIcon />}
            label={format(new Date(newsPost.created_at), 'MMMM d, yyyy')}
            size="small"
          />
          
          {newsPost.is_flagged && (
            <Chip
              icon={<FlagIcon />}
              label="Flagged"
              color="warning"
              size="small"
            />
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Featured Media */}
        {(() => {
          // Determine media type and URL
          let mediaUrl = newsPost.media_url || newsPost.image_url;
          let mediaType = newsPost.media_type;
          
          // Fallback detection for legacy posts or case mismatch
          if (!mediaType && mediaUrl) {
            const url = mediaUrl.toLowerCase();
            if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
              mediaType = 'video';
            } else if (url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg')) {
              mediaType = 'audio';
            } else {
              mediaType = 'image';
            }
          }
          
          // Handle case variations (normalize to lowercase)
          if (mediaType) {
            mediaType = mediaType.toLowerCase();
          }
          
          if (mediaUrl) {
            return (
              <Box sx={{ mb: 3 }}>
                {mediaType === 'image' ? (
                  <>
                    <img
                      src={mediaUrl}
                      alt={newsPost.title}
                      style={{
                        width: '100%',
                        maxHeight: '500px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                    {newsPost.image_caption && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {newsPost.image_caption}
                      </Typography>
                    )}
                  </>
                ) : (
                  <MediaPlayer
                    src={mediaUrl}
                    type={mediaType}
                    title={newsPost.media_metadata?.fileName || newsPost.title}
                    thumbnail={newsPost.media_metadata?.thumbnail}
                    compact={false}
                  />
                )}
              </Box>
            );
          }
          return null;
        })()}

        {/* Content */}
        <Box 
          sx={{ 
            '& p': { mb: 2 },
            '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 3, mb: 1 },
            '& ul, & ol': { mb: 2 },
            '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1 },
            '& blockquote': { 
              borderLeft: '3px solid', 
              borderColor: 'primary.main',
              pl: 2,
              ml: 0,
              my: 2
            }
          }}
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(newsPost.content) }}
        />

        {/* Footer */}
        <Divider sx={{ mt: 4, mb: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Published on {format(new Date(newsPost.created_at), 'MMMM d, yyyy at h:mm a')}
          </Typography>
          
          {newsPost.updated_at && newsPost.updated_at !== newsPost.created_at && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {format(new Date(newsPost.updated_at), 'MMMM d, yyyy')}
            </Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default NewsPostPage;