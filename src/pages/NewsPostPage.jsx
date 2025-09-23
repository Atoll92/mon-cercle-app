import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
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
  MenuItem,
  alpha
} from '@mui/material';
import Spinner from '../components/Spinner';
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
import { formatDate } from '../utils/dateFormatting';
import MediaPlayer from '../components/MediaPlayer';
import UserContent from '../components/UserContent';
import { fetchNetworkCategories } from '../api/categories';
import CommentSection from '../components/CommentSection';

function AnnouncementPostPage() {
  const { networkId, newsId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [announcementPost, setAnnouncementPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [categories, setCategories] = useState([]);
  const [announcementCategory, setAnnouncementCategory] = useState(null);

  useEffect(() => {
    fetchAnnouncementPost();
    checkAdminStatus();
    loadCategories();
  }, [newsId, user, networkId]);
  
  // Update category when categories or announcementPost changes
  useEffect(() => {
    if (announcementPost?.category_id && categories.length > 0) {
      const category = categories.find(c => c.id === announcementPost.category_id);
      setAnnouncementCategory(category);
    }
  }, [announcementPost?.category_id, categories]);

  const fetchAnnouncementPost = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch announcement
      const { data: post, error: postError } = await supabase
        .from('network_news')
        .select('*')
        .eq('id', newsId)
        .eq('network_id', networkId)
        .single();

      if (postError) throw postError;
      
      if (!post) {
        setError('Announcement not found');
        return;
      }

      setAnnouncementPost(post);

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
      console.error('Error fetching announcement:', err);
      setError('Failed to load announcement');
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

  const loadCategories = async () => {
    if (!networkId) return;
    
    const { data, error } = await fetchNetworkCategories(networkId, true);
    if (data && !error) {
      setCategories(data);
      
      // If we already have an announcement, find its category
      if (announcementPost?.category_id) {
        const category = data.find(c => c.id === announcementPost.category_id);
        setAnnouncementCategory(category);
      }
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
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
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
      alert('Failed to delete announcement');
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
      fetchAnnouncementPost(); // Refresh the post
    } catch (err) {
      console.error('Error flagging post:', err);
      alert('Failed to flag post');
    }
    handleMenuClose();
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Spinner size={120} />
      </Container>
    );
  }

  if (error || !announcementPost) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Announcement not found'}
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

  const isAuthor = user?.id === announcementPost.created_by;
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
        {/* Title and Category */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {announcementPost.title}
          </Typography>
          {announcementCategory && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.5,
                py: 0.5,
                borderRadius: '16px',
                bgcolor: alpha(announcementCategory.color, 0.12),
                border: `1px solid ${alpha(announcementCategory.color, 0.3)}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(announcementCategory.color, 0.18),
                  borderColor: alpha(announcementCategory.color, 0.4),
                }
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: announcementCategory.color,
                  flexShrink: 0
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: announcementCategory.color,
                  letterSpacing: '0.02em'
                }}
              >
                {announcementCategory.name}
              </Typography>
            </Box>
          )}
        </Box>

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
            label={formatDate(announcementPost.created_at, { month: 'long', day: 'numeric', year: 'numeric' })}
            size="small"
          />
          
          {announcementPost.is_flagged && (
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
          let mediaUrl = announcementPost.media_url || announcementPost.image_url;
          let mediaType = announcementPost.media_type;
          
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
                      alt={announcementPost.title}
                      style={{
                        width: '100%',
                        maxHeight: '500px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                    {announcementPost.image_caption && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {announcementPost.image_caption}
                      </Typography>
                    )}
                  </>
                ) : (
                  <MediaPlayer
                    src={mediaUrl}
                    type={mediaType}
                    title={announcementPost.media_metadata?.fileName || announcementPost.title}
                    thumbnail={announcementPost.media_metadata?.thumbnail}
                    compact={false}
                  />
                )}
              </Box>
            );
          }
          return null;
        })()}

        {/* Content */}
        <UserContent 
          content={announcementPost.content}
          html={true}
          sx={{ mt: 2, mb: 3 }}
        />

        {/* Footer */}
        <Divider sx={{ mt: 4, mb: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Published on {formatDate(announcementPost.created_at, { month: 'long', day: 'numeric', year: 'numeric' })}
          </Typography>
          
          {announcementPost.updated_at && announcementPost.updated_at !== announcementPost.created_at && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {formatDate(announcementPost.updated_at, { month: 'long', day: 'numeric', year: 'numeric' })}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Comments Section */}
        <CommentSection
          itemType="news"
          itemId={announcementPost.id}
          defaultExpanded={true}
        />
      </Paper>
    </Container>
  );
}

export default AnnouncementPostPage;