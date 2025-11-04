import React from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Paper,
  Chip,
  Avatar,
  IconButton,
  Skeleton,
  alpha,
  useTheme
} from '@mui/material';
import UserContent from './UserContent';
import {
  Favorite as FavoriteIcon,
  Comment as CommentIcon,
  Visibility as VisibilityIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  Link as LinkIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LazyImage from './LazyImage';
import PDFPreviewEnhanced from './PDFPreviewEnhanced';
import LinkPreview from './LinkPreview';

const PostsGrid = ({ posts, author, isOwnProfile, loading = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const getMediaIcon = (post) => {
    if (post.file_type === 'pdf' || post.media_type === 'pdf') {
      return <PdfIcon />;
    }
    if (post.media_type === 'video') {
      return <VideoIcon />;
    }
    if (post.media_type === 'audio') {
      return <AudioIcon />;
    }
    if (post.url) {
      return <LinkIcon />;
    }
    return <ImageIcon />;
  };

  const renderMediaPreview = (post) => {
    // PDF files (legacy file_url field)
    if (post.file_type === 'pdf' && post.file_url) {
      return (
        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
          <PDFPreviewEnhanced
            url={post.file_url}
            fileName={post.title || 'PDF Document'}
            title={post.title || 'PDF Document'}
            height="100%"
            showFileName={false}
            borderRadius={0}
          />
        </Box>
      );
    }

    // PDF files (new media_url field)
    if (post.media_type === 'pdf' && post.media_url) {
      return (
        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
          <PDFPreviewEnhanced
            url={post.media_url}
            fileName={post.title || 'PDF Document'}
            title={post.title || 'PDF Document'}
            height="100%"
            showFileName={false}
            borderRadius={0}
          />
        </Box>
      );
    }

    // Media files
    if (post.media_url) {
      if (post.media_type === 'image' || !post.media_type) {
        return (
          <Box sx={{
            width: '100%',
            height: '100%',
            bgcolor: theme.palette.grey[100],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <LazyImage
              src={post.media_url}
              alt={post.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </Box>
        );
      }
      if (post.media_type === 'video') {
        return (
          <Box sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            bgcolor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <video
              src={post.media_url}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
              muted
              playsInline
            />
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'rgba(0,0,0,0.7)',
              borderRadius: '50%',
              p: 1,
              display: 'flex'
            }}>
              <VideoIcon sx={{ color: 'white', fontSize: 32 }} />
            </Box>
          </Box>
        );
      }
    }

    // Legacy image_url
    if (post.image_url) {
      return (
        <Box sx={{
          width: '100%',
          height: '100%',
          bgcolor: theme.palette.grey[100],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <LazyImage
            src={post.image_url}
            alt={post.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </Box>
      );
    }

    // URL-based posts (links, embedded media)
    if (post.url) {
      return (
        <Box sx={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: theme.palette.grey[100]
        }}>
          <LinkPreview
            url={post.url}
            compact={false}
            mediaOnly={false}
            hideInfo={true}
            height="100%"
          />
        </Box>
      );
    }

    // Placeholder for posts without media
    return (
      <Box sx={{
        width: '100%',
        height: '100%',
        bgcolor: theme.palette.grey[200],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 1
      }}>
        {getMediaIcon(post)}
        <Typography variant="caption" color="text.secondary">
          {post.media_type || 'No preview'}
        </Typography>
      </Box>
    );
  };

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item}>
            <Skeleton 
              variant="rectangular" 
              height={300} 
              sx={{ borderRadius: 2 }} 
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        py: 8,
        px: 2
      }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No posts yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isOwnProfile ? 'Share your first post to get started!' : 'This user hasn\'t shared any posts yet.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {posts.map((post) => (
        <Grid item xs={12} sm={6} md={4} key={post.id}>
          <Paper
            elevation={0}
            sx={{
              height: 380,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
                borderColor: 'primary.main',
                '& .media-overlay': {
                  opacity: 1
                }
              },
            }}
            onClick={() => handlePostClick(post.id)}
          >
            {/* Media Preview Section */}
            <Box sx={{ 
              height: 200, 
              position: 'relative',
              overflow: 'hidden',
              bgcolor: theme.palette.grey[100]
            }}>
              {renderMediaPreview(post)}
              
              {/* Hover Overlay */}
              <Box 
                className="media-overlay"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                }}
              >
                <VisibilityIcon sx={{ color: 'white', fontSize: 40 }} />
              </Box>

              {/* Media Type Badge */}
              <Box sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}>
                {getMediaIcon(post)}
              </Box>
            </Box>

            {/* Content Section */}
            <Box sx={{ 
              p: 2, 
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 1,
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {post.title}
              </Typography>

              <UserContent
                content={post.description || 'No description'}
                html={false}
                maxLines={2}
                sx={{
                  mb: 2,
                  flexGrow: 1,
                  color: 'text.secondary',
                  fontSize: '0.875rem'
                }}
              />

              {/* Footer with stats */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                mt: 'auto'
              }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FavoriteIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {post.likes_count || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CommentIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {post.comments_count || 0}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="caption" color="text.secondary">
                  {new Date(post.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default PostsGrid;