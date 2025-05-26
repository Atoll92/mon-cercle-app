import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MediaPlayer from './MediaPlayer';
import ImageViewerModal from './ImageViewerModal';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Skeleton,
  Alert,
  Button,
  Divider
} from '@mui/material';
import {
  Work as WorkIcon,
  ArrowForward as ArrowForwardIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';

const LatestPostsWidget = ({ networkId }) => {
  const [latestPost, setLatestPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '' });

  useEffect(() => {
    const fetchLatestPost = async () => {
      if (!networkId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First get members of the network
        const { data: members, error: membersError } = await supabase
          .from('profiles')
          .select('id')
          .eq('network_id', networkId);
          
        if (membersError) throw membersError;
        
        if (!members || members.length === 0) {
          setLatestPost(null);
          setLoading(false);
          return;
        }
        
        const memberIds = members.map(m => m.id);
        
        // Then get latest post from these members
        const { data, error } = await supabase
          .from('portfolio_items')
          .select(`
            *,
            profiles:profile_id (
              id,
              full_name,
              profile_picture_url
            )
          `)
          .in('profile_id', memberIds)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw error;
        }

        setLatestPost(data);
      } catch (err) {
        console.error('Error fetching latest post:', err);
        setError('Failed to load latest post');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPost();
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
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...'
      : content;
  };

  const handleImageClick = (imageUrl, imageTitle) => {
    setSelectedImage({ url: imageUrl, title: imageTitle });
    setImageViewerOpen(true);
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
          <WorkIcon color="primary" sx={{ mr: 1.5 }} />
          <Typography variant="subtitle1">
            Latest Post
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

  if (!latestPost) {
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
          <WorkIcon color="primary" sx={{ mr: 1.5 }} />
          <Typography variant="subtitle1">
            Latest Post
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
          <WorkIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body2" color="text.secondary" gutterBottom>
            No portfolio posts yet
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Be the first to share your work!
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
          <WorkIcon color="primary" sx={{ mr: 1.5 }} />
          <Typography variant="subtitle1">
            Latest Post
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
            src={latestPost.profiles?.profile_picture_url}
            sx={{ width: 28, height: 28, mr: 1 }}
          >
            {latestPost.profiles?.full_name ? 
              latestPost.profiles.full_name.charAt(0).toUpperCase() : 
              <PersonIcon fontSize="small" />
            }
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={500} noWrap sx={{ lineHeight: 1.2 }}>
              {latestPost.profiles?.full_name || 'Unknown Author'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <ScheduleIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                {formatTimeAgo(latestPost.created_at)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* Post content */}
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
            {latestPost.title}
          </Typography>

          {(() => {
            // Determine media type and URL
            let mediaUrl = latestPost.media_url || latestPost.image_url;
            let mediaType = latestPost.media_type;
            
            // Fallback detection for legacy posts
            if (!mediaType && mediaUrl) {
              const url = mediaUrl.toLowerCase();
              if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
                mediaType = 'video';
              } else if (url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg')) {
                mediaType = 'audio';
              } else if (url.includes('.pdf')) {
                mediaType = 'pdf';
              } else {
                mediaType = 'image';
              }
            }
            
            if (mediaUrl) {
              if (mediaType && ['video', 'audio', 'pdf'].includes(mediaType)) {
                return (
                  <Box sx={{ 
                    mb: 2, 
                    aspectRatio: mediaType === 'video' ? '16/9' : mediaType === 'pdf' ? '3/4' : 'auto',
                    minHeight: mediaType === 'audio' ? 60 : mediaType === 'pdf' ? 250 : 120,
                    maxHeight: mediaType === 'pdf' ? 250 : 200,
                    width: '100%',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}>
                    <MediaPlayer
                      src={mediaUrl}
                      type={mediaType}
                      title={latestPost.title}
                      fileName={latestPost.media_metadata?.fileName}
                      fileSize={latestPost.media_metadata?.fileSize}
                      numPages={latestPost.media_metadata?.numPages}
                      author={latestPost.media_metadata?.author}
                      thumbnail={latestPost.media_metadata?.thumbnail || latestPost.media_metadata?.albumArt || latestPost.image_url}
                      darkMode={true}
                      compact={false}
                      autoplay={false}
                      sx={{
                        width: '100%',
                        height: '100%',
                        '& video': {
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }
                      }}
                    />
                  </Box>
                );
              } else {
                // Default to image display
                return (
                  <Box
                    sx={{
                      width: '100%',
                      height: 200,
                      overflow: 'hidden',
                      bgcolor: 'grey.100',
                      mb: 2,
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover img': {
                        opacity: 0.9,
                        transform: 'scale(1.05)'
                      }
                    }}
                    onClick={() => handleImageClick(mediaUrl, latestPost.title)}
                  >
                    <img 
                      src={mediaUrl} 
                      alt={latestPost.title}
                      className="portfolio-image"
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease, opacity 0.3s ease'
                      }} 
                    />
                  </Box>
                );
              }
            }
            return null;
          })()}

          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.6
            }}
          >
            {truncateContent(latestPost.description)}
          </Typography>

          {latestPost.url && (
            <Button
              component="a"
              href={latestPost.url}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{ mt: 2 }}
            >
              View Project
            </Button>
          )}
        </Box>
      </CardContent>
      
      <ImageViewerModal
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage.url}
        title={selectedImage.title}
      />
    </Card>
  );
};

export default LatestPostsWidget;