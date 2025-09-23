import { useState, useEffect, useMemo } from 'react';
import Spinner from './Spinner';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  Box,
  Button,
  Menu,
  MenuItem,
  alpha,
  useTheme,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import MediaPlayer from './MediaPlayer';
import MediaCarousel from './MediaCarousel';
import LazyImage from './LazyImage';
import LinkPreview from './LinkPreview';
import UserContent from './UserContent';
import ImageViewerModal from './ImageViewerModal';
import CreatePostModal from './CreatePostModal';
import MembersDetailModal from './MembersDetailModal';
import { formatTimeAgo } from '../utils/dateFormatting';
import { Link, useNavigate } from 'react-router-dom';
import { deletePost } from '../api/posts';
import { useProfile } from '../context/profileContext';
import { useNetwork } from '../context/networkContext';
import { useAuth } from '../context/authcontext';
import { useTranslation } from '../hooks/useTranslation';
import CommentSection from './CommentSection';

/**
 * PostCard component for displaying portfolio posts
 * Based on SocialWallTab implementation with added edit/delete functionality
 * Returns null if not within a NetworkProvider context
 */
const PostCard = ({
  post,
  author,
  category,
  darkMode = false,
  isOwner = false,
  onAuthorClick,
  onPostUpdated,
  onPostDeleted,
  sx = {}
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { activeProfile } = useProfile();
  
  // Get network context - component requires NetworkProvider
  let networkContext = null;
  try {
    networkContext = useNetwork();
  } catch (error) {
    // Not within NetworkProvider - disable edit functionality
    console.warn('PostCard: useNetwork hook failed, component should be within NetworkProvider for edit functionality');
  }
  
  // Get networkId from context - make it reactive
  const { hasNetworkContext } = useMemo(() => {
    const contextNetworkId = networkContext?.network?.id;
    return {
      // currentNetworkId: contextNetworkId, // Keep for future use
      hasNetworkContext: Boolean(contextNetworkId)
    };
  }, [networkContext?.network?.id]);
  
  // Determine if current user owns this post
  // Only allow editing if we have networkId (for the edit modal)
  // Use useMemo to recalculate when activeProfile changes
  const isPostOwner = useMemo(() => {
    return hasNetworkContext && (isOwner || (activeProfile && post.profile_id === activeProfile.id));
  }, [hasNetworkContext, isOwner, activeProfile, post.profile_id]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '' });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);

  // Handle image click internally
  const handleImageClick = (url, title) => {
    setSelectedImage({ url, title });
    setImageViewerOpen(true);
  };

  // Determine media type from URL and stored type
  const getMediaType = (mediaUrl, storedType) => {
    if (storedType) return storedType;
    if (!mediaUrl) return null;
    
    const url = mediaUrl.toLowerCase();
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('.mov')) {
      return 'video';
    } else if (url.includes('.mp3') || url.includes('.wav') || url.includes('.m4a') || url.includes('.aac')) {
      return 'audio';
    } else if (url.includes('.pdf')) {
      return 'pdf';
    } else if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp')) {
      return 'image';
    }
    return null;
  };

  // Get the media URL (prioritize new media_url over legacy fields)
  const mediaUrl = post.media_url || post.image_url || post.file_url;
  const mediaType = getMediaType(mediaUrl, post.media_type);

  // Format post creation time
  const timeAgo = post.created_at ? formatTimeAgo(post.created_at) : '';

  // Handle menu actions
  const handleMenuClick = (event) => {
    event.stopPropagation();
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
    handleMenuClose();
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await deletePost(post.id);
        if (onPostDeleted) {
          onPostDeleted(post.id);
        }
      } catch (error) {
        console.error('Failed to delete post:', error);
        alert('Failed to delete post. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handlePostUpdated = (updatedPost) => {
    setEditModalOpen(false);

    // Notify parent of the update
    if (onPostUpdated) {
      onPostUpdated(updatedPost);
    }
  };

  // Handle author click - check if we're inside MembersDetailModal, then decide behavior
  const handleAuthorClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Simple check: if we're inside any modal dialog, assume it's MembersDetailModal
    const isInsideModal = e?.target?.closest('[role="dialog"]') !== null;
    
    if (isInsideModal) {
      // Inside a modal - navigate to profile page to avoid modal-in-modal
      if (author?.id) {
        navigate(`/profile/${author.id}`);
      }
    } else if (onAuthorClick) {
      // Not inside modal but callback provided - use the callback
      if (onAuthorClick.length >= 2) {
        onAuthorClick(author?.id, e);
      } else {
        onAuthorClick(author);
      }
    } else {
      // Default behavior - open MembersDetailModal
      setMemberModalOpen(true);
    }
  };

  // Render media content
  const renderMedia = () => {
    // Check for multiple media items - first check direct field, then check media_metadata
    let mediaItemsArray = null;
    
    if (post.media_items && Array.isArray(post.media_items) && post.media_items.length > 0) {
      mediaItemsArray = post.media_items;
    } else if (post.media_metadata?.media_items && Array.isArray(post.media_metadata.media_items) && post.media_metadata.media_items.length > 0) {
      mediaItemsArray = post.media_metadata.media_items;
    }
    
    if (mediaItemsArray) {
      // For single media items, use appropriate component based on type
      if (mediaItemsArray.length === 1) {
        const mediaItem = mediaItemsArray[0];
        const mediaType = mediaItem.type?.toLowerCase();
        
        // For images, use img element directly since MediaPlayer doesn't handle images
        if (mediaType === 'image') {
          return (
            <Box sx={{ bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', p: 2 }}>
              <Box 
                sx={{ 
                  position: 'relative', 
                  width: '100%',
                  cursor: 'pointer',
                  borderRadius: 1,
                  overflow: 'hidden',
                  '&:hover': { opacity: 0.9 }
                }}
                onClick={() => handleImageClick(mediaItem.url, mediaItem.metadata?.fileName || post.title)}
              >
                <LazyImage
                  src={mediaItem.url}
                  alt={mediaItem.metadata?.fileName || post.title}
                  style={{ 
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    maxHeight: '400px',
                    objectFit: 'contain'
                  }}
                />
              </Box>
            </Box>
          );
        }
        
        // For video, audio, pdf use MediaPlayer
        return (
          <Box sx={{ bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', p: 2 }}>
            <MediaPlayer
              src={mediaItem.url}
              type={mediaItem.type}
              title={mediaItem.metadata?.fileName || post.title}
              thumbnail={mediaItem.metadata?.thumbnail}
              darkMode={darkMode}
              autoplay={true}
              muted={true}
              hideControlsUntilInteraction={true}
            />
          </Box>
        );
      }
      
      // For multiple media items, use MediaCarousel
      return (
        <Box sx={{ bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', p: 2 }}>
          <MediaCarousel
            media={mediaItemsArray.map(item => ({
              url: item.url,
              type: item.type,
              metadata: item.metadata || {}
            }))}
            darkMode={darkMode}
            height={400}
            autoplay={false}
            showThumbnails={true}
            compact={false}
          />
        </Box>
      );
    }
    
    // Single media item fallback
    if (!mediaUrl) return null;

    // Handle legacy file_url for PDFs
    if (post.file_url && !post.media_url && !post.image_url) {
      return (
        <Box sx={{ bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', p: 2 }}>
          <MediaPlayer
            src={post.file_url}
            type="pdf"
            title={post.title || "PDF Document"}
            fileName={post.title || "PDF Document"}
            darkMode={darkMode}
          />
        </Box>
      );
    }

    if (mediaType === 'image') {
      return (
        <Box sx={{ bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', p: 2 }}>
          <Box 
            sx={{ 
              position: 'relative', 
              width: '100%',
              cursor: 'pointer',
              borderRadius: 1,
              overflow: 'hidden',
              '&:hover': { opacity: 0.9 }
            }}
            onClick={() => handleImageClick(mediaUrl, post.title)}
          >
            <LazyImage
              src={mediaUrl}
              alt={post.title}
              style={{ 
                width: '100%',
                height: 'auto',
                display: 'block',
                maxHeight: '600px',
                objectFit: 'contain'
              }}
            />
          </Box>
        </Box>
      );
    }

    // For video, audio, PDF - use MediaPlayer
    if (mediaType && mediaType !== 'image') {
      return (
        <Box sx={{ bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', p: 2 }}>
          <MediaPlayer
            src={mediaUrl}
            type={mediaType}
            title={post.title}
            fileName={post.title}
            darkMode={darkMode}
          />
        </Box>
      );
    }

    return null;
  };

  // const contentTypeIcon = getContentTypeIcon(); // Keep for future use

  return (
    <Card sx={{
      borderRadius: 2,
      boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
      bgcolor: darkMode ? 'grey.900' : 'background.paper',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: darkMode ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
        transform: 'translateY(-2px)'
      },
      ...sx
    }}>
      {/* Custom header layout */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Left column: Avatar */}
          <Avatar 
            src={author?.profile_picture_url}
            onClick={handleAuthorClick}
            sx={{ 
              width: 40,
              height: 40,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }
            }}
          >
            {author?.full_name?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          
          {/* Middle: Name and Date */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 600,
                cursor: 'pointer',
                color: darkMode ? 'grey.100' : 'text.primary',
                '&:hover': {
                  color: theme.palette.primary.main,
                  textDecoration: 'underline'
                },
                transition: 'color 0.2s ease',
                lineHeight: 1.4,
                mb: 0.5
              }}
              onClick={handleAuthorClick}
            >
              {author?.full_name || 'Unknown User'}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                whiteSpace: 'nowrap',
                fontSize: '0.75rem',
                fontWeight: 500,
                lineHeight: 1,
                display: 'block'
              }}
            >
              {timeAgo}
            </Typography>
          </Box>
          
          {/* Right: Actions */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            {/* Top row: Action buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Edit/Delete menu for owner */}
              {isPostOwner && (
                <>
                  <IconButton
                    size="small"
                    onClick={handleMenuClick}
                    disabled={isDeleting}
                    sx={{
                      color: 'text.secondary',
                      width: 28,
                      height: 28,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08)
                      }
                    }}
                  >
                    {isDeleting ? (
                      <Spinner size={16} />
                    ) : (
                      <MoreVertIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    <MenuItem onClick={handleEdit}>
                      <EditIcon sx={{ mr: 1 }} fontSize="small" />
                      Edit
                    </MenuItem>
                    <MenuItem onClick={handleDelete}>
                      <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
                      Delete
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
            
            {/* Category indicator */}
            {category && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '16px',
                  bgcolor: alpha(category.color, 0.12),
                  border: `1px solid ${alpha(category.color, 0.3)}`,
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    bgcolor: alpha(category.color, 0.18),
                    borderColor: alpha(category.color, 0.4),
                  }
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: category.color,
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap'
                  }}
                >
                  #{category.name}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Media content */}
      {renderMedia()}

      {/* Post content */}
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Title */}
        <UserContent 
          content={post.title}
          html={false}
          component="h6"
          sx={{ 
            fontSize: '1.25rem',
            fontWeight: 600, 
            lineHeight: 1.3,
            mb: 2,
            color: 'text.primary'
          }}
        />

        {/* Description */}
        {post.description && (
          <UserContent 
            content={post.description}
            html={false}
            noShowMore={true} // Disable "Show more" for description because we already have a button to view full post below
            maxLines={3}
            sx={{ 
              mb: 2, 
              color: 'text.secondary',
              fontSize: '0.875rem'
            }}
          />
        )}

        {/* Link Preview - matches SocialWallTab */}
        {post.url && (
          <Box sx={{ 
            mb: 2, 
            bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', 
            borderRadius: 1, 
            overflow: 'hidden'
          }}>
            <LinkPreview 
              url={post.url} 
              compact={true}
              darkMode={darkMode}
            />
          </Box>
        )}
        
        {/* Comments Section and view post button */}
        <CommentSection
          itemType={'post'}
          itemId={post.id}
          onMemberClick={(onAuthorClick ? onAuthorClick : handleAuthorClick)}
          TopRightElement={
            <Button
              component={Link}
              to={`/post/${post.id}`}
              size="small"
              endIcon={<ArrowForwardIcon />}
              sx={{ alignSelf: 'flex-start' }}
            >
              {t('postcard.readFullPost')}
            </Button>
          }
        />
      </CardContent>
      
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
        darkMode={darkMode}
        mode="edit"
        editPost={post}
      />

      {/* Member Detail Modal */}
      <MembersDetailModal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        member={author}
        posts={[]} // Don't show posts in the modal to avoid infinite nesting
        isCurrentUser={author?.id === activeProfile?.id}
        darkMode={darkMode}
      />
    </Card>
  );
};

export default PostCard;