import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Visibility as ViewIcon,
  Star as FeaturedIcon
} from '@mui/icons-material';
import LazyImage from '../LazyImage';

const BlogPostCard = ({ post, blog, featured = false, themeColor, showViews = false }) => {
  const theme = useTheme();

  // Get first media item for preview
  const mediaItems = post.media_metadata?.media_items || [];
  const previewImage = mediaItems[0]?.url || post.media_url;
  const hasImage = previewImage && (post.media_type === 'image' || mediaItems[0]?.type === 'image');

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Truncate content for preview
  const getExcerpt = (content, maxLength = 150) => {
    if (!content) return '';
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength).trim() + '...';
  };

  const postUrl = `/blog/${blog?.subdomain}/post/${post.id}`;

  if (featured) {
    // Featured post - larger card
    return (
      <Card
        elevation={0}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: `0 8px 24px ${alpha(themeColor, 0.15)}`,
            transform: 'translateY(-2px)'
          }
        }}
      >
        {hasImage && (
          <Box
            sx={{
              width: { xs: '100%', md: '50%' },
              minHeight: { xs: 200, md: 280 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
              p: 2
            }}
          >
            <LazyImage
              src={previewImage}
              alt={post.title || 'Post image'}
              sx={{
                maxWidth: '100%',
                maxHeight: { xs: 280, md: 400 },
                width: 'auto',
                height: 'auto',
                objectFit: 'contain'
              }}
            />
          </Box>
        )}

        <CardActionArea
          component={RouterLink}
          to={postUrl}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center'
          }}
        >
          <CardContent sx={{ p: 4, width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Chip
                icon={<FeaturedIcon sx={{ fontSize: 16 }} />}
                label="Featured"
                size="small"
                sx={{
                  bgcolor: alpha(themeColor, 0.1),
                  color: themeColor,
                  fontWeight: 600
                }}
              />
            </Box>

            {post.title && (
              <Typography
                variant="h4"
                component="h2"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  lineHeight: 1.3
                }}
              >
                {post.title}
              </Typography>
            )}

            {post.content && (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, lineHeight: 1.7 }}
              >
                {getExcerpt(post.content, 250)}
              </Typography>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, color: 'text.secondary' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarIcon fontSize="small" />
                <Typography variant="body2">
                  {formatDate(post.published_at || post.created_at)}
                </Typography>
              </Box>
              {showViews && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ViewIcon fontSize="small" />
                  <Typography variant="body2">
                    {post.view_count || 0} views
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  }

  // Regular post card
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: `0 4px 16px ${alpha(themeColor, 0.12)}`,
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardActionArea
        component={RouterLink}
        to={postUrl}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch'
        }}
      >
        {hasImage && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
              minHeight: 140,
              p: 1.5
            }}
          >
            <LazyImage
              src={previewImage}
              alt={post.title || 'Post image'}
              sx={{
                maxWidth: '100%',
                maxHeight: { xs: 220, md: 240 },
                width: 'auto',
                height: 'auto',
                objectFit: 'contain'
              }}
            />
          </Box>
        )}

        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {post.title && (
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 600,
                mb: 1,
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {post.title}
            </Typography>
          )}

          {post.content && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                flex: 1,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {getExcerpt(post.content, 120)}
            </Typography>
          )}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mt: 'auto',
              pt: 1,
              borderTop: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {formatDate(post.published_at || post.created_at)}
            </Typography>
            {showViews && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <ViewIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption">
                  {post.view_count || 0}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default BlogPostCard;
