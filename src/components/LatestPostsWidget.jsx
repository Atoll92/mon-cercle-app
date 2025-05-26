import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import MediaPlayer from './MediaPlayer';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  CardActionArea,
  Avatar,
  Button,
  Divider
} from '@mui/material';
import {
  Work as WorkIcon,
  OpenInNew as OpenInNewIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

const LatestPostsWidget = ({ networkId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestPosts = async () => {
      if (!networkId) return;
      
      try {
        setLoading(true);
        
        // First get members of the network
        const { data: members, error: membersError } = await supabase
          .from('profiles')
          .select('id')
          .eq('network_id', networkId);
          
        if (membersError) throw membersError;
        
        if (!members || members.length === 0) {
          setPosts([]);
          return;
        }
        
        const memberIds = members.map(m => m.id);
        
        // Then get latest post with media (image, video, or audio) from these members
        const { data, error } = await supabase
          .from('portfolio_items')
          .select(`
            *,
            profiles:profile_id (
              full_name,
              profile_picture_url
            )
          `)
          .in('profile_id', memberIds)
          .or('media_url.not.is.null,image_url.not.is.null')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (error) throw error;
        
        setPosts(data || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLatestPosts();
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

  if (loading) {
    return (
      <Card sx={{ 
        height: '100%', 
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <CircularProgress size={30} />
      </Card>
    );
  }

  return (
    <Card sx={{ 
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      overflow: 'hidden',
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
        {posts.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            p: 3,
            textAlign: 'center'
          }}>
            <WorkIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              No portfolio posts yet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Be the first to share your work!
            </Typography>
          </Box>
        ) : posts[0] && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Author info */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Avatar
                src={posts[0].profiles?.profile_picture_url}
                sx={{ width: 28, height: 28, mr: 1 }}
              >
                {posts[0].profiles?.full_name ? 
                  posts[0].profiles.full_name.charAt(0).toUpperCase() : 
                  <PersonIcon fontSize="small" />
                }
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={500} noWrap sx={{ lineHeight: 1.2 }}>
                  {posts[0].profiles?.full_name || 'Unknown Author'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                  <ScheduleIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                    {formatTimeAgo(posts[0].created_at)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mb: 1.5 }} />

            {/* Post content */}
            <CardActionArea
              component={posts[0].url ? 'a' : 'div'}
              href={posts[0].url || undefined}
              target={posts[0].url ? "_blank" : undefined}
              rel={posts[0].url ? "noopener noreferrer" : undefined}
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 1,
                overflow: 'hidden',
                '&:hover .portfolio-image': {
                  transform: 'scale(1.05)'
                }
              }}
            >
              {/* Post Title */}
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
                {posts[0].title}
              </Typography>

              {/* Media content */}
              {(() => {
                // Determine media type and URL
                let mediaUrl = posts[0].media_url || posts[0].image_url;
                let mediaType = posts[0].media_type;
                
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
                        mb: 2, 
                        aspectRatio: mediaType === 'video' ? '16/9' : 'auto',
                        minHeight: mediaType === 'audio' ? 60 : 120,
                        maxHeight: 200,
                        width: '100%',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}>
                        <MediaPlayer
                          src={mediaUrl}
                          type={mediaType}
                          title={posts[0].title}
                          thumbnail={posts[0].media_metadata?.thumbnail || posts[0].media_metadata?.albumArt || posts[0].image_url}
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
                          borderRadius: 1
                        }}
                      >
                        <img 
                          src={mediaUrl} 
                          alt={posts[0].title}
                          className="portfolio-image"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease'
                          }}
                        />
                      </Box>
                    );
                  }
                }
                return null;
              })()}
              
              {/* Description */}
              {posts[0].description && (
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: (posts[0].media_url || posts[0].image_url) ? 3 : 5,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.6
                  }}
                >
                  {posts[0].description}
                </Typography>
              )}
              
              {posts[0].url && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <OpenInNewIcon sx={{ fontSize: 14, color: 'text.secondary', mr: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    External link
                  </Typography>
                </Box>
              )}
            </CardActionArea>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default LatestPostsWidget;