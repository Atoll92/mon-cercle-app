import { useState } from 'react';
import { Link } from 'react-router-dom';
import MediaPlayer from './MediaPlayer';
import ImageViewerModal from './ImageViewerModal';
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
  CardMedia,
  Typography,
  Box,
  Avatar,
  Button,
  Divider
} from '@mui/material';
import {
  Article as NewsIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';

const LatestNewsWidget = ({ networkId }) => {
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '' });

  const { data: latestNews, loading, error } = useSupabaseQuery(
    () => supabase
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
      .single(),
    [networkId],
    { enabled: !!networkId }
  );

  const handleImageClick = (imageUrl, title) => {
    setSelectedImage({ url: imageUrl, title });
    setImageViewerOpen(true);
  };


  if (loading) {
    return <WidgetSkeleton showHeader={true} contentLines={3} showImage={true} />;
  }

  if (error) {
    return (
      <WidgetErrorState 
        icon={<NewsIcon color="primary" />}
        title="Latest News"
        error={error}
      />
    );
  }

  if (!latestNews) {
    return (
      <WidgetEmptyState
        icon={<NewsIcon color="primary" />}
        title="Latest News"
        emptyIcon={<NewsIcon />}
        emptyMessage="No news posts yet"
        emptySubMessage="Be the first to share something with your network!"
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
        icon={<NewsIcon color="primary" />}
        title="Latest News"
        viewAllLink={`/network/${networkId}?tab=news`}
      />
      
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
            const mediaUrl = latestNews.media_url || latestNews.image_url;
            const mediaType = detectMediaType(mediaUrl, latestNews.media_type);
            const mediaConfig = getMediaConfig(mediaType);
            
            if (mediaUrl) {
              if (mediaType !== MEDIA_TYPES.IMAGE && mediaType !== MEDIA_TYPES.UNKNOWN) {
                return (
                  <Box sx={{ 
                    mb: 1.5, 
                    aspectRatio: mediaConfig.aspectRatio,
                    minHeight: mediaConfig.minHeight,
                    maxHeight: Math.min(mediaConfig.maxHeight, 160),
                    width: '100%',
                    overflow: 'hidden'
                  }}>
                    <MediaPlayer
                      src={mediaUrl}
                      type={mediaType}
                      title={latestNews.title}
                      fileName={latestNews.media_metadata?.fileName}
                      fileSize={latestNews.media_metadata?.fileSize}
                      numPages={latestNews.media_metadata?.numPages}
                      author={latestNews.media_metadata?.author}
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
                    onClick={() => handleImageClick(mediaUrl, latestNews.title)}
                    sx={{ 
                      borderRadius: 1, 
                      mb: 2,
                      objectFit: 'cover',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s ease',
                      '&:hover': {
                        opacity: 0.9
                      }
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

      <ImageViewerModal
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage.url}
        title={selectedImage.title}
      />
    </Card>
  );
};

export default LatestNewsWidget;