import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Avatar,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { fetchBlogPost, incrementPostViews } from '../../api/blog';
import BlogHeader from '../../components/blog/BlogHeader';
import BlogCommentSection from '../../components/blog/BlogCommentSection';
import MediaCarousel from '../../components/MediaCarousel';
import MediaPlayer from '../../components/MediaPlayer';
import LazyImage from '../../components/LazyImage';
import UserContent from '../../components/UserContent';

// Create a local dark theme for the blog post page
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

const BlogPostPage = () => {
  const { subdomain, postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch post
  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        setError(null);

        const postData = await fetchBlogPost(postId);

        if (!postData) {
          setError('Post not found');
          return;
        }

        // Verify this post belongs to the correct blog
        if (postData.network?.subdomain !== subdomain) {
          setError('Post not found');
          return;
        }

        setPost(postData);

        // Increment view count
        await incrementPostViews(postId);
      } catch (err) {
        console.error('Error loading post:', err);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      loadPost();
    }
  }, [postId, subdomain]);

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default'
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  if (error || !post) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default'
          }}
        >
          <Container maxWidth="sm">
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || 'Post not found'}
            </Alert>
            <Button component={RouterLink} to={`/blog/${subdomain}`} variant="contained">
              Back to Blog
            </Button>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  const blog = post.network;
  const author = post.created_by_profile;
  const blogSettings = blog?.blog_settings || {};
  const themeColor = blog?.theme_color || '#1976d2'; // Default MUI primary color

  // Get media items
  const mediaItems = post.media_metadata?.media_items || [];
  const hasMultipleMedia = mediaItems.length > 1;
  const hasSingleMedia = post.media_url && !hasMultipleMedia;

  // SEO
  const seoTitle = post.title ? `${post.title} | ${blog?.name}` : blog?.name || 'Blog Post';
  const seoDescription = post.content?.substring(0, 160) || blog?.description || '';
  const ogImage = post.media_url || blog?.logo_url || '';

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
      </Helmet>

      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Blog Header */}
        <BlogHeader
          blog={blog}
          themeColor={themeColor}
          compact
        />

        <Container maxWidth="md" sx={{ py: 4 }}>
          {/* Back Button */}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/blog/${subdomain}`)}
            sx={{ mb: 3, color: 'text.secondary' }}
          >
            Back to Blog
          </Button>

          {/* Post Content */}
          <Box component="article">
            {/* Title */}
            {post.title && (
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  lineHeight: 1.2
                }}
              >
                {post.title}
              </Typography>
            )}

            {/* Meta info */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                mb: 4,
                flexWrap: 'wrap'
              }}
            >
              {/* Author */}
              {author && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={author.profile_picture_url}
                    alt={author.full_name}
                    sx={{ width: 40, height: 40 }}
                  >
                    {author.full_name?.[0]}
                  </Avatar>
                  <Typography variant="body1" fontWeight={500}>
                    {author.full_name}
                  </Typography>
                </Box>
              )}

              {/* Date */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <CalendarIcon fontSize="small" />
                <Typography variant="body2">
                  {formatDate(post.published_at || post.created_at)}
                </Typography>
              </Box>

            </Box>

            {/* Media */}
            {hasMultipleMedia && (
              <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
                <MediaCarousel
                  items={mediaItems}
                  maxHeight={500}
                />
              </Box>
            )}

            {hasSingleMedia && (
              <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
                {post.media_type === 'image' ? (
                  <LazyImage
                    src={post.media_url}
                    alt={post.title || 'Post image'}
                    sx={{
                      width: '100%',
                      maxHeight: 500,
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <MediaPlayer
                    url={post.media_url}
                    type={post.media_type}
                    metadata={post.media_metadata}
                  />
                )}
              </Box>
            )}

            {/* Content */}
            {post.content && (
              <Box
                sx={{
                  '& p': { mb: 2, lineHeight: 1.8 },
                  '& a': { color: themeColor },
                  fontSize: '1.1rem'
                }}
              >
                <UserContent
                  content={post.content}
                  html={false}
                />
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 6 }} />

          {/* Comments Section */}
          {blogSettings.comments_enabled && (
            <BlogCommentSection
              postId={post.id}
              blogSettings={blogSettings}
              themeColor={themeColor}
            />
          )}
        </Container>

        {/* Footer */}
        <Box
          sx={{
            py: 4,
            mt: 6,
            borderTop: '1px solid',
            borderColor: 'divider',
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Powered by{' '}
            <Box
              component="a"
              href="https://conclav.club"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: themeColor,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Conclav
            </Box>
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default BlogPostPage;
