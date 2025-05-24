import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  CardActionArea,
  Avatar
} from '@mui/material';
import {
  Work as WorkIcon,
  OpenInNew as OpenInNewIcon,
  Person as PersonIcon
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
        
        // Then get latest post with image from these members
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
          .not('image_url', 'is', null)
          .neq('image_url', '')
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
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 1.5, 
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'rgba(25, 118, 210, 0.05)'
      }}>
        <WorkIcon color="primary" sx={{ mr: 1.5 }} />
        <Typography variant="subtitle1">
          Latest Post
        </Typography>
      </Box>
      
      {/* Content */}
      <CardContent sx={{ 
        p: 2, 
        flexGrow: 1, 
        display: 'flex',
        flexDirection: 'column',
        '&:last-child': { pb: 2 }
      }}>
        {posts.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            p: 3
          }}>
            <WorkIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" align="center">
              No posts with images yet
            </Typography>
          </Box>
        ) : posts[0] && (
          <CardActionArea
            component={posts[0].url ? 'a' : 'div'}
            href={posts[0].url}
            target="_blank"
            rel="noopener noreferrer"
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
            {/* Thumbnail */}
            <Box
              sx={{
                width: '100%',
                height: 180,
                overflow: 'hidden',
                bgcolor: 'grey.100',
                mb: 2
              }}
            >
              <img 
                src={posts[0].image_url} 
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
            
            {/* Content */}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
                {posts[0].title}
              </Typography>
              
              {posts[0].description && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    mb: 2
                  }}
                >
                  {posts[0].description}
                </Typography>
              )}
              
              {/* Author info */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mt: 'auto'
              }}>
                <Avatar
                  src={posts[0].profiles?.profile_picture_url}
                  sx={{ width: 24, height: 24 }}
                >
                  <PersonIcon sx={{ fontSize: 16 }} />
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  {posts[0].profiles?.full_name || 'Unknown'}
                </Typography>
                {posts[0].url && (
                  <OpenInNewIcon sx={{ fontSize: 16, color: 'text.secondary', ml: 'auto' }} />
                )}
              </Box>
            </Box>
          </CardActionArea>
        )}
      </CardContent>
    </Card>
  );
};

export default LatestPostsWidget;