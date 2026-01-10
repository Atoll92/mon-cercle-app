import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import {
  Visibility as ViewsIcon,
  Article as PostsIcon,
  Comment as CommentsIcon,
  Email as SubscribersIcon,
  TrendingUp as TrendingIcon,
  Star as FeaturedIcon
} from '@mui/icons-material';
import { getBlogAnalytics } from '../../../api/blog';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        height: '100%'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(color, 0.1)
            }}
          >
            <Icon sx={{ color, fontSize: 24 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const BlogAnalyticsTab = ({ network, activeProfile }) => {
  const theme = useTheme();
  const themeColor = network?.theme_color || theme.palette.primary.main;

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBlogAnalytics(network.id);
        setAnalytics(data);
      } catch (err) {
        console.error('Error loading analytics:', err);
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    if (network?.id) {
      loadAnalytics();
    }
  }, [network?.id]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const stats = analytics || {
    totalViews: 0,
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalComments: 0,
    pendingComments: 0,
    totalSubscribers: 0,
    topPosts: []
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Blog Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Overview of your blog's performance
      </Typography>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Views"
            value={stats.totalViews?.toLocaleString() || '0'}
            icon={ViewsIcon}
            color={themeColor}
            subtitle="All-time page views"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Published Posts"
            value={stats.publishedPosts || '0'}
            icon={PostsIcon}
            color={theme.palette.success.main}
            subtitle={`${stats.draftPosts || 0} drafts`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Comments"
            value={stats.totalComments || '0'}
            icon={CommentsIcon}
            color={theme.palette.info.main}
            subtitle={stats.pendingComments > 0 ? `${stats.pendingComments} pending` : 'All approved'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Subscribers"
            value={stats.totalSubscribers || '0'}
            icon={SubscribersIcon}
            color={theme.palette.warning.main}
            subtitle="Newsletter signups"
          />
        </Grid>
      </Grid>

      {/* Top Posts */}
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
        <TrendingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Top Performing Posts
      </Typography>

      {stats.topPosts && stats.topPosts.length > 0 ? (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Post</TableCell>
                <TableCell align="center">Views</TableCell>
                <TableCell align="center">Comments</TableCell>
                <TableCell align="right">Published</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.topPosts.map((post, index) => (
                <TableRow key={post.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {post.is_featured && (
                        <FeaturedIcon sx={{ fontSize: 16, color: themeColor }} />
                      )}
                      <Typography variant="body2" fontWeight={500}>
                        {post.title || '(Untitled)'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight={600} sx={{ color: themeColor }}>
                      {post.view_count?.toLocaleString() || '0'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {post.comment_count || '0'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(post.published_at || post.created_at)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <PostsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            No posts yet. Create your first post to see analytics!
          </Typography>
        </Paper>
      )}

      {/* Quick Stats Summary */}
      <Box sx={{ mt: 4, p: 3, bgcolor: alpha(themeColor, 0.05), borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Quick Summary
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your blog has <strong>{stats.totalPosts || 0}</strong> posts with a total of{' '}
          <strong>{stats.totalViews?.toLocaleString() || 0}</strong> views.{' '}
          {stats.totalSubscribers > 0 && (
            <>
              You have <strong>{stats.totalSubscribers}</strong> newsletter subscribers.
            </>
          )}
          {stats.pendingComments > 0 && (
            <>
              {' '}There are <strong>{stats.pendingComments}</strong> comments awaiting moderation.
            </>
          )}
        </Typography>
      </Box>
    </Box>
  );
};

export default BlogAnalyticsTab;
