import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  Skeleton,
  Alert,
  Button,
  Divider
} from '@mui/material';
import {
  Article as NewsIcon,
  ArrowForward as ArrowForwardIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';

const LatestNewsWidget = ({ networkId }) => {
  const [latestNews, setLatestNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestNews = async () => {
      if (!networkId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch the latest news post with author information
        const { data, error } = await supabase
          .from('network_news')
          .select(`
            id,
            title,
            content,
            image_url,
            image_caption,
            created_at,
            profiles!network_news_created_by_fkey (
              id,
              full_name,
              profile_picture_url
            )
          `)
          .eq('network_id', networkId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw error;
        }

        setLatestNews(data);
      } catch (err) {
        console.error('Error fetching latest news:', err);
        setError('Failed to load latest news');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestNews();
  }, [networkId]);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - postDate) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    }
  };

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    const strippedContent = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return strippedContent.length > maxLength 
      ? strippedContent.substring(0, maxLength) + '...'
      : strippedContent;
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <CardHeader
          avatar={<Skeleton variant="circular" width={40} height={40} />}
          title={<Skeleton width="60%" />}
          subheader={<Skeleton width="40%" />}
          sx={{ 
            bgcolor: 'rgba(25, 118, 210, 0.05)',
            py: 1
          }}
        />
        <CardContent sx={{ flex: 1 }}>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
          <Skeleton width="80%" />
          <Skeleton width="60%" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <CardHeader
          avatar={<NewsIcon color="primary" />}
          title="Latest News"
          titleTypographyProps={{ variant: 'subtitle1' }}
          sx={{ 
            bgcolor: 'rgba(25, 118, 210, 0.05)',
            py: 1
          }}
        />
        <CardContent sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!latestNews) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <CardHeader
          avatar={<NewsIcon color="primary" />}
          title="Latest News"
          titleTypographyProps={{ variant: 'subtitle1' }}
          sx={{ 
            bgcolor: 'rgba(25, 118, 210, 0.05)',
            py: 1
          }}
        />
        <CardContent sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <NewsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body2" color="text.secondary" gutterBottom>
            No news posts yet
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Be the first to share something with your network!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      '&:hover': {
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        '& .view-all-button': {
          transform: 'translateX(4px)'
        }
      },
      transition: 'all 0.3s ease'
    }}>
      <CardHeader
        avatar={<NewsIcon color="primary" />}
        title="Latest News"
        titleTypographyProps={{ variant: 'subtitle1' }}
        action={
          <Button
            component={Link}
            to="/dashboard"
            size="small"
            endIcon={<ArrowForwardIcon />}
            className="view-all-button"
            sx={{ 
              transition: 'transform 0.2s ease',
              textTransform: 'none'
            }}
          >
            View All
          </Button>
        }
        sx={{ 
          bgcolor: 'rgba(25, 118, 210, 0.05)',
          py: 1
        }}
      />
      
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', pt: 0 }}>
        {/* Author info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={latestNews.profiles?.profile_picture_url}
            sx={{ width: 32, height: 32, mr: 1.5 }}
          >
            {latestNews.profiles?.full_name ? 
              latestNews.profiles.full_name.charAt(0).toUpperCase() : 
              <PersonIcon fontSize="small" />
            }
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={500} noWrap>
              {latestNews.profiles?.full_name || 'Unknown Author'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {formatTimeAgo(latestNews.created_at)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* News content */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography 
            variant="subtitle1" 
            fontWeight={600} 
            gutterBottom
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.3,
              mb: 1
            }}
          >
            {latestNews.title}
          </Typography>

          {latestNews.image_url && (
            <CardMedia
              component="img"
              height="80"
              image={latestNews.image_url}
              alt={latestNews.image_caption || latestNews.title}
              sx={{ 
                borderRadius: 1, 
                mb: 1.5,
                objectFit: 'cover'
              }}
            />
          )}

          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: latestNews.image_url ? 2 : 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4
            }}
          >
            {truncateContent(latestNews.content)}
          </Typography>
        </Box>

        {/* Read more */}
        <Box sx={{ pt: 2, mt: 'auto' }}>
          <Button
            component={Link}
            to="/dashboard"
            variant="text"
            size="small"
            fullWidth
            sx={{ 
              justifyContent: 'flex-start',
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Read full post →
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LatestNewsWidget;