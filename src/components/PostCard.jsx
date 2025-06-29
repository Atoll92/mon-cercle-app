import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  Box,
  Chip,
  Button,
  Menu,
  MenuItem,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowForward as ArrowForwardIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  Article as ArticleIcon,
  ChatBubbleOutline as CommentIcon
} from '@mui/icons-material';
import MediaPlayer from './MediaPlayer';
import LazyImage from './LazyImage';
import LinkPreview from './LinkPreview';
import ImageViewerModal from './ImageViewerModal';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { getCommentCount } from '../api/comments';

/**
 * PostCard component for displaying portfolio posts
 * Based on SocialWallTab implementation with added edit/delete functionality
 */
const PostCard = ({
  post,
  author,
  category,
  darkMode = false,
  isOwner = false,
  onEdit,
  onDelete,
  onAuthorClick,
  sx = {}
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '' });

  // Fetch comment count on mount
  useEffect(() => {
    const fetchCommentCount = async () => {
      if (post?.id) {
        const { count } = await getCommentCount('post', post.id);
        setCommentCount(count || 0);
      }
    };
    
    fetchCommentCount();
  }, [post?.id]);

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
  const timeAgo = post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : '';

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
    if (onEdit) onEdit(post);
  };

  const handleDelete = async () => {
    handleMenuClose();
    if (onDelete) {
      setIsDeleting(true);
      try {
        await onDelete(post);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Content type icon for media type - matches SocialWallTab implementation
  const getContentTypeIcon = () => {
    // Check for PDF
    if (post.file_type === 'pdf' || (post.file_url && !post.media_url && !post.image_url)) {
      return { icon: <PdfIcon fontSize="small" />, label: 'PDF', color: 'error' };
    }
    
    // Check for media
    if (mediaUrl && mediaType) {
      switch (mediaType) {
        case 'image':
          return { icon: <ImageIcon fontSize="small" />, label: 'Image', color: 'success' };
        case 'video':
          return { icon: <VideoIcon fontSize="small" />, label: 'Video', color: 'info' };
        case 'audio':
          return { icon: <AudioIcon fontSize="small" />, label: 'Audio', color: 'warning' };
        case 'pdf':
          return { icon: <PdfIcon fontSize="small" />, label: 'PDF', color: 'error' };
      }
    }
    
    // Check for legacy image
    if (post.image_url) {
      return { icon: <ImageIcon fontSize="small" />, label: 'Image', color: 'success' };
    }
    
    // Default to article/text
    return { icon: <ArticleIcon fontSize="small" />, label: 'Text', color: 'default' };
  };

  // Render media content
  const renderMedia = () => {
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
              pt: '56.25%', // 16:9 aspect ratio
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
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
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

  const contentTypeIcon = getContentTypeIcon();

  return (
    <Card sx={{
      borderRadius: 2,
      boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
      bgcolor: darkMode ? 'grey.900' : 'background.paper',
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: darkMode ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
        transform: 'translateY(-2px)'
      },
      ...sx
    }}>
      {/* Header with author info and actions */}
      <CardHeader
        avatar={
          <Avatar 
            src={author?.profile_picture_url}
            onClick={onAuthorClick ? () => onAuthorClick(author) : undefined}
            sx={{ 
              cursor: onAuthorClick ? 'pointer' : 'default',
              transition: 'all 0.3s ease',
              '&:hover': onAuthorClick ? {
                transform: 'scale(1.1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              } : {}
            }}
          >
            {author?.full_name?.[0]?.toUpperCase() || 'U'}
          </Avatar>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, mr: 1 }}>
            {/* Edit/Delete menu for owner */}
            {isOwner && (onEdit || onDelete) && (
              <>
                <IconButton
                  size="small"
                  onClick={handleMenuClick}
                  disabled={isDeleting}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08)
                    }
                  }}
                >
                  {isDeleting ? (
                    <CircularProgress size={16} />
                  ) : (
                    <MoreVertIcon fontSize="small" />
                  )}
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  {onEdit && (
                    <MenuItem onClick={handleEdit}>
                      <EditIcon sx={{ mr: 1 }} fontSize="small" />
                      Edit
                    </MenuItem>
                  )}
                  {onDelete && (
                    <MenuItem onClick={handleDelete}>
                      <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
                      Delete
                    </MenuItem>
                  )}
                </Menu>
              </>
            )}
            
            {/* Media type indicator */}
            <Chip
              size="small"
              icon={contentTypeIcon.icon}
              label={contentTypeIcon.label}
              color={contentTypeIcon.color}
              variant="outlined"
              sx={{ 
                height: 24,
                fontWeight: 500,
                '& .MuiChip-icon': {
                  fontSize: 16
                }
              }}
            />
            
            {/* Post type indicator - matches SocialWallTab */}
            <Chip 
              size="small" 
              label="Post" 
              color="secondary"
              sx={{ 
                height: 24,
                fontWeight: 500
              }}
            />
          </Box>
        }
        title={
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600,
              cursor: onAuthorClick ? 'pointer' : 'default',
              color: darkMode ? 'grey.100' : 'text.primary'
            }}
            onClick={onAuthorClick ? () => onAuthorClick(author) : undefined}
          >
            {author?.full_name || 'Unknown User'}
          </Typography>
        }
        subheader={
          <Typography variant="caption" color="text.secondary">
            {timeAgo}
          </Typography>
        }
        sx={{ pb: 1 }}
      />

      {/* Media content */}
      {renderMedia()}

      {/* Post content */}
      <CardContent>
        {/* Title and category */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, gap: 2 }}>
          <Typography 
            variant="h6" 
            color="text.primary" 
            sx={{ 
              fontWeight: 600, 
              lineHeight: 1.3,
              flex: 1
            }}
          >
            {post.title}
          </Typography>
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
                '&:hover': {
                  bgcolor: alpha(category.color, 0.18),
                  borderColor: alpha(category.color, 0.4),
                },
                flexShrink: 0
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: category.color,
                  flexShrink: 0
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: category.color,
                  letterSpacing: '0.02em'
                }}
              >
                {category.name}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Description */}
        {post.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2, 
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {post.description}
          </Typography>
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

        {/* Comment count and actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
          <Button
            component={Link}
            to={`/post/${post.id}`}
            startIcon={<CommentIcon sx={{ fontSize: 18 }} />}
            sx={{
              textTransform: 'none',
              color: theme.palette.text.secondary,
              fontSize: '0.875rem',
              py: 0.5,
              px: 1,
              minHeight: 'auto',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main
              }
            }}
          >
            {commentCount > 0 ? `${commentCount} comment${commentCount !== 1 ? 's' : ''}` : 'Comment'}
          </Button>
          
          <Button
            component={Link}
            to={`/post/${post.id}`}
            size="small"
            endIcon={<ArrowForwardIcon />}
            sx={{ alignSelf: 'flex-start' }}
          >
            View Post
          </Button>
        </Box>
      </CardContent>
      
      {/* Image Viewer Modal */}
      <ImageViewerModal
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage.url}
        title={selectedImage.title}
      />
    </Card>
  );
};

export default PostCard;