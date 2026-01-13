import { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Container,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import { RssFeed as RssIcon } from '@mui/icons-material';
import { fetchBlogBySubdomain, fetchBlogPosts } from '../../api/blog';
import BlogHeader from '../../components/blog/BlogHeader';
import BlogPostCard from '../../components/blog/BlogPostCard';
import NewsletterSignup from '../../components/blog/NewsletterSignup';
import BlogAboutSection from '../../components/blog/BlogAboutSection';

const PublicBlogPage = () => {
  const { subdomain } = useParams();
  const theme = useTheme();

  const [blog, setBlog] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const POSTS_PER_PAGE = 12;

  // Fetch blog details
  useEffect(() => {
    const loadBlog = async () => {
      try {
        setLoading(true);
        setError(null);

        const blogData = await fetchBlogBySubdomain(subdomain);

        if (!blogData) {
          setError('Blog not found');
          return;
        }

        setBlog(blogData);
      } catch (err) {
        console.error('Error loading blog:', err);
        setError('Failed to load blog');
      } finally {
        setLoading(false);
      }
    };

    if (subdomain) {
      loadBlog();
    }
  }, [subdomain]);

  // Fetch posts when blog is loaded
  useEffect(() => {
    const loadPosts = async () => {
      if (!blog?.id) return;

      try {
        const postsData = await fetchBlogPosts(blog.id, {
          limit: POSTS_PER_PAGE,
          offset: 0
        });

        setPosts(postsData);
        setHasMore(postsData.length === POSTS_PER_PAGE);
        setOffset(postsData.length);
      } catch (err) {
        console.error('Error loading posts:', err);
      }
    };

    loadPosts();
  }, [blog?.id]);

  // Load more posts
  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore || !blog?.id) return;

    try {
      setLoadingMore(true);

      const morePosts = await fetchBlogPosts(blog.id, {
        limit: POSTS_PER_PAGE,
        offset
      });

      setPosts(prev => [...prev, ...morePosts]);
      setHasMore(morePosts.length === POSTS_PER_PAGE);
      setOffset(prev => prev + morePosts.length);
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [blog?.id, offset, hasMore, loadingMore]);

  // Get featured post
  const featuredPost = posts.find(p => p.is_featured);
  const regularPosts = posts.filter(p => !p.is_featured);

  // SEO meta tags
  const seoTitle = blog?.seo_settings?.meta_title || blog?.name || 'Blog';
  const seoDescription = blog?.seo_settings?.meta_description || blog?.description || '';
  const ogImage = blog?.seo_settings?.og_image_url || blog?.logo_url || '';

  if (loading) {
    return (
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
    );
  }

  if (error || !blog) {
    return (
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
            {error || 'Blog not found'}
          </Alert>
          <Button component={RouterLink} to="/" variant="contained">
            Go to Homepage
          </Button>
        </Container>
      </Box>
    );
  }

  const blogSettings = blog.blog_settings || {};
  const themeColor = blog.theme_color || theme.palette.primary.main;

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        {blogSettings.rss_enabled && (
          <link
            rel="alternate"
            type="application/rss+xml"
            title={`${blog.name} RSS Feed`}
            href={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-rss/${subdomain}`}
          />
        )}
      </Helmet>

      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        {/* Blog Header */}
        <BlogHeader
          blog={blog}
          themeColor={themeColor}
        />

        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
          {/* Featured Post */}
          {featuredPost && (
            <Box
              sx={{
                mb: { xs: 4, md: 6 },
                maxWidth: 1000,
                mx: 'auto'
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: themeColor,
                  fontWeight: 600,
                  letterSpacing: 1.5,
                  fontSize: '0.75rem'
                }}
              >
                Featured
              </Typography>
              <BlogPostCard
                post={featuredPost}
                blog={blog}
                featured
                themeColor={themeColor}
              />
            </Box>
          )}

          {/* Posts Grid */}
          {regularPosts.length > 0 ? (
            <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
              <Typography
                variant="h5"
                sx={{
                  mb: { xs: 2, md: 3 },
                  fontWeight: 600,
                  fontSize: { xs: '1.25rem', md: '1.5rem' }
                }}
              >
                Latest Posts
              </Typography>

              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {regularPosts.map((post) => (
                  <Grid item xs={12} sm={6} md={4} key={post.id}>
                    <BlogPostCard
                      post={post}
                      blog={blog}
                      themeColor={themeColor}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Load More */}
              {hasMore && (
                <Box sx={{ textAlign: 'center', mt: { xs: 3, md: 5 } }}>
                  <Button
                    variant="outlined"
                    onClick={loadMorePosts}
                    disabled={loadingMore}
                    size="large"
                    sx={{
                      borderColor: themeColor,
                      color: themeColor,
                      borderRadius: 2,
                      px: 4,
                      '&:hover': {
                        borderColor: themeColor,
                        bgcolor: alpha(themeColor, 0.05)
                      }
                    }}
                  >
                    {loadingMore ? <CircularProgress size={20} /> : 'Load More'}
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: { xs: 6, md: 10 } }}>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                No posts yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check back soon for new content!
              </Typography>
            </Box>
          )}

          {/* Divider only if there's content below */}
          {(blogSettings.about_page_content || blogSettings.newsletter_enabled || blogSettings.rss_enabled) && (
            <Divider sx={{ my: { xs: 4, md: 6 } }} />
          )}

          {/* About & Newsletter Section */}
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            {/* About Section */}
            {blogSettings.about_page_content && (
              <BlogAboutSection
                blog={blog}
                themeColor={themeColor}
              />
            )}

            {/* Newsletter Signup */}
            {blogSettings.newsletter_enabled && (
              <Box sx={{ mt: blogSettings.about_page_content ? 4 : 0 }}>
                <NewsletterSignup
                  networkId={blog.id}
                  themeColor={themeColor}
                />
              </Box>
            )}

            {/* RSS Link */}
            {blogSettings.rss_enabled && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button
                  component="a"
                  href={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-rss/${subdomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<RssIcon />}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      bgcolor: alpha(themeColor, 0.05)
                    }
                  }}
                >
                  RSS Feed
                </Button>
              </Box>
            )}
          </Box>
        </Container>

        {/* Footer */}
        <Box
          sx={{
            py: { xs: 3, md: 4 },
            mt: { xs: 4, md: 6 },
            borderTop: '1px solid',
            borderColor: 'divider',
            textAlign: 'center'
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: '0.8125rem' }}
          >
            Powered by{' '}
            <Box
              component="a"
              href="https://conclav.club"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: themeColor,
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Conclav
            </Box>
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default PublicBlogPage;
