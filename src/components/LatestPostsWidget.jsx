import { useState } from 'react';
import { Link } from 'react-router-dom';
import MediaPlayer from './MediaPlayer';
import ImageViewerModal from './ImageViewerModal';
import LinkPreview from './LinkPreview';
import WidgetHeader from './shared/WidgetHeader';
import WidgetSkeleton from './shared/WidgetSkeleton';
import WidgetEmptyState from './shared/WidgetEmptyState';
import WidgetErrorState from './shared/WidgetErrorState';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { formatTimeAgo } from '../utils/dateFormatting';
import { truncateContent } from '../utils/textFormatting';
import { detectMediaType, MEDIA_TYPES, getMediaConfig } from '../utils/mediaDetection';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Divider
} from '@mui/material';
import {
  Work as WorkIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';

const LatestPostsWidget = ({ networkId }) => {
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '' });

  // First fetch network members
  const { data: members } = useSupabaseQuery(
    () => supabase
      .from('profiles')
      .select('id')
      .eq('network_id', networkId),
    [networkId],
    { enabled: !!networkId }
  );

  const memberIds = members?.map(m => m.id) || [];
  const memberIdsString = memberIds.length > 0 ? memberIds.sort().join(',') : '';

  // Then fetch latest post from members
  const { data: latestPost, loading, error } = useSupabaseQuery(
    () => memberIds.length > 0 ? supabase
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
      .single() : Promise.resolve({ data: null, error: null }),
    [memberIdsString],
    { enabled: memberIds.length > 0 }
  );


  const handleImageClick = (imageUrl, imageTitle) => {
    setSelectedImage({ url: imageUrl, title: imageTitle });
    setImageViewerOpen(true);
  };

  if (loading || !networkId) {
    return <WidgetSkeleton showHeader={true} contentLines={3} showImage={true} />;
  }

  if (error) {
    return (
      <WidgetErrorState
        icon={<WorkIcon color="primary" />}
        title="Latest Post"
        error={error}
      />
    );
  }

  if (!latestPost || memberIds.length === 0) {
    return (
      <WidgetEmptyState
        icon={<WorkIcon color="primary" />}
        title="Latest Post"
        emptyIcon={<WorkIcon />}
        emptyMessage="No portfolio posts yet"
        emptySubMessage="Be the first to share your work!"
      />
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
      <WidgetHeader
        icon={<WorkIcon color="primary" />}
        title="Latest Post"
        viewAllLink={`/network/${networkId}/`}
      />
      
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
            const mediaUrl = latestPost.media_url || latestPost.image_url;
            const mediaType = detectMediaType(mediaUrl, latestPost.media_type);
            const mediaConfig = getMediaConfig(mediaType);
            
            if (mediaUrl) {
              if (mediaType !== MEDIA_TYPES.IMAGE && mediaType !== MEDIA_TYPES.UNKNOWN) {
                return (
                  <Box sx={{ 
                    mb: 2, 
                    aspectRatio: mediaConfig.aspectRatio,
                    minHeight: mediaConfig.minHeight,
                    maxHeight: Math.min(mediaConfig.maxHeight, 200),
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
            <Box sx={{ 
              mt: 2,
              bgcolor: 'rgba(0,0,0,0.02)', 
              borderRadius: 1, 
              overflow: 'hidden'
            }}>
              <LinkPreview 
                url={latestPost.url} 
                compact={true}
              />
            </Box>
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