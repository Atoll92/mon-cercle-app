import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MediaPlayer from './MediaPlayer';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Avatar,
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
            media_url,
            media_type,
            media_metadata,
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
        <Box 
          sx={{ 
            p: 1.5, 
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(25, 118, 210, 0.05)'
          }}
        >
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 1.5 }} />
          <Box>
            <Skeleton width={120} height={24} />
            <Skeleton width={80} height={16} />
          </Box>
        </Box>
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
        <Box 
          sx={{ 
            p: 1.5, 
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(25, 118, 210, 0.05)'
          }}
        >
          <NewsIcon color="primary" sx={{ mr: 1.5 }} />
          <Typography variant="subtitle1">
            Latest News
          </Typography>
        </Box>
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
        <Box 
          sx={{ 
            p: 1.5, 
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(25, 118, 210, 0.05)'
          }}
        >
          <NewsIcon color="primary" sx={{ mr: 1.5 }} />
          <Typography variant="subtitle1">
            Latest News
          </Typography>
        </Box>
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
      <Box 
        sx={{ 
          p: 1.5, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(25, 118, 210, 0.05)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <NewsIcon color="primary" sx={{ mr: 1.5 }} />
          <Typography variant="subtitle1">
            Latest News
          </Typography>
        </Box>
        
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
      </Box>
      
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
        {/* Author info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Avatar
            src={latestNews.profiles?.profile_picture_url}
            sx={{ width: 28, height: 28, mr: 1 }}
          >
            {latestNews.profiles?.full_name ? 
              latestNews.profiles.full_name.charAt(0).toUpperCase() : 
              <PersonIcon fontSize="small" />
            }
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={500} noWrap sx={{ lineHeight: 1.2 }}>
              {latestNews.profiles?.full_name || 'Unknown Author'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <ScheduleIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                {formatTimeAgo(latestNews.created_at)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* News content */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography 
            variant="h6" 
            fontWeight={600} 
            gutterBottom
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4,
              mb: 2,
              fontSize: '1.25rem'
            }}
          >
            {latestNews.title}
          </Typography>

          {(() => {
            // Determine media type and URL
            let mediaUrl = latestNews.media_url || latestNews.image_url;
            let mediaType = latestNews.media_type;
            
            // Fallback detection for legacy posts
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
            
            if (mediaUrl) {
              if (mediaType && ['video', 'audio'].includes(mediaType)) {
                return (
                  <Box sx={{ 
                    mb: 1.5, 
                    aspectRatio: mediaType === 'video' ? '16/9' : 'auto',
                    minHeight: mediaType === 'audio' ? 60 : 120,
                    maxHeight: 160,
                    width: '100%'
                  }}>
                    <MediaPlayer
                      src={mediaUrl}
                      type={mediaType}
                      title={latestNews.title}
                      thumbnail={latestNews.media_metadata?.thumbnail || latestNews.media_metadata?.albumArt || latestNews.image_url}
                      darkMode={true}
                      compact={false}
                      sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 1,
                        '& video': {
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 1
                        },
                        '& audio': {
                          width: '100%',
                          height: '100%',
                          borderRadius: 1
                        }
                      }}
                    />
                  </Box>
                );
              } else {
                // Default to image display
                return (
                  <CardMedia
                    component="img"
                    height="200"
                    image={mediaUrl}
                    alt={latestNews.image_caption || latestNews.title}
                    sx={{ 
                      borderRadius: 1, 
                      mb: 2,
                      objectFit: 'cover'
                    }}
                  />
                );
              }
            }
            return null;
          })()}

          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: (latestNews.image_url || latestNews.media_url) ? 3 : 5,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.6
            }}
          >
            {truncateContent(latestNews.content, 200)}
          </Typography>
        </Box>

        {/* Read more */}
        <Box sx={{ pt: 2, mt: 'auto' }}>
          <Button
            component={Link}
            to={`/network/${networkId}/news/${latestNews.id}`}
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