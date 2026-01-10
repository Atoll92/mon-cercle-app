import React, { useState, useEffect, useCallback } from 'react';
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
import { fetchBlogBySubdomain, fetchBlogPosts, incrementPostViews } from '../../api/blog';
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
            href={`/api/blog/${subdomain}/rss`}
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

        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Featured Post */}
          {featuredPost && (
            <Box sx={{ mb: 6 }}>
              <Typography
                variant="overline"
                sx={{
                  color: themeColor,
                  fontWeight: 600,
                  letterSpacing: 1
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
            <>
              <Typography
                variant="h5"
                sx={{ mb: 3, fontWeight: 600 }}
              >
                Latest Posts
              </Typography>

              <Grid container spacing={3}>
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
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Button
                    variant="outlined"
                    onClick={loadMorePosts}
                    disabled={loadingMore}
                    sx={{
                      borderColor: themeColor,
                      color: themeColor,
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
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No posts yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check back soon for new content!
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 6 }} />

          {/* About Section */}
          {blogSettings.about_page_content && (
            <BlogAboutSection
              blog={blog}
              themeColor={themeColor}
            />
          )}

          {/* Newsletter Signup */}
          {blogSettings.newsletter_enabled && (
            <NewsletterSignup
              networkId={blog.id}
              themeColor={themeColor}
            />
          )}

          {/* RSS Link */}
          {blogSettings.rss_enabled && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                component="a"
                href={`/api/blog/${subdomain}/rss`}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<RssIcon />}
                sx={{ color: 'text.secondary' }}
              >
                RSS Feed
              </Button>
            </Box>
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
    </>
  );
};

export default PublicBlogPage;
