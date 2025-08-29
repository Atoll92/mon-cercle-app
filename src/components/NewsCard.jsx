import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MediaPlayer from './MediaPlayer';
import MediaCarousel from './MediaCarousel';
import LinkifiedText from './LinkifiedText';
import ImageViewerModal from './ImageViewerModal';
import { formatTimeAgo } from '../utils/dateFormatting';
import { truncateContent, stripHtml } from '../utils/textFormatting';
import { detectMediaType, MEDIA_TYPES, getMediaConfig } from '../utils/mediaDetection';
import { getCommentCount } from '../api/comments';
import { useTranslation } from '../hooks/useTranslation';
import {
  Card,
  CardHeader,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Avatar,
  Button,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  ChatBubbleOutline as CommentIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

const AnnouncementCard = ({ news, networkId, onMemberClick, category }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '' });
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    const fetchCommentCount = async () => {
      const { count } = await getCommentCount('news', news.id);
      setCommentCount(count || 0);
    };
    fetchCommentCount();
  }, [news.id]);

  const handleImageClick = (imageUrl, title) => {
    setSelectedImage({ url: imageUrl, title });
    setImageViewerOpen(true);
  };

  return (
    <>
      <Card sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        },
        transition: 'all 0.3s ease'
      }}>
        <CardHeader
          avatar={
            <Avatar
              src={news.profiles?.profile_picture_url}
              onClick={onMemberClick ? (e) => onMemberClick(news.profiles?.id, e) : undefined}
              sx={{ 
                width: 36, 
                height: 36,
                cursor: onMemberClick ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                '&:hover': onMemberClick ? {
                  transform: 'scale(1.05)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                } : {}
              }}
            >
              {news.profiles?.full_name ? 
                news.profiles.full_name.charAt(0).toUpperCase() : 
                <PersonIcon />
              }
            </Avatar>
          }
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Category indicator */}
              {category && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '16px',
                    bgcolor: alpha(category.color, 0.12),
                    border: `1px solid ${alpha(category.color, 0.3)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(category.color, 0.18),
                      borderColor: alpha(category.color, 0.4),
                    }
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: category.color,
                      letterSpacing: '0.02em'
                    }}
                  >
                    #{category.name}
                  </Typography>
                </Box>
              )}
            </Box>
          }
          title={
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 600,
                cursor: onMemberClick ? 'pointer' : 'default',
                '&:hover': onMemberClick ? {
                  color: 'primary.main'
                } : {}
              }}
              onClick={onMemberClick ? (e) => onMemberClick(news.profiles?.id, e) : undefined}
            >
              {news.profiles?.full_name || 'Unknown Author'}
            </Typography>
          }
          subheader={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <ScheduleIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {formatTimeAgo(news.created_at)}
              </Typography>
            </Box>
          }
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', pt: 0 }}>

          {/* News content */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography 
              variant="subtitle1" 
              fontWeight={600} 
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.3,
                fontSize: '1rem',
                mb: 1
              }}
            >
              {news.title}
            </Typography>

            {(() => {
              // Check for multiple media items - first check direct field, then check media_metadata
              let mediaItemsArray = null;
              
              if (news.media_items && Array.isArray(news.media_items) && news.media_items.length > 0) {
                mediaItemsArray = news.media_items;
              } else if (news.media_metadata?.media_items && Array.isArray(news.media_metadata.media_items) && news.media_metadata.media_items.length > 0) {
                mediaItemsArray = news.media_metadata.media_items;
              }
              
              if (mediaItemsArray) {
                return (
                  <Box sx={{ mb: 1 }}>
                    <MediaCarousel
                      media={mediaItemsArray.map(item => ({
                        url: item.url,
                        type: item.type,
                        metadata: item.metadata || {}
                      }))}
                      darkMode={false}
                      height={200}
                      autoplay={false}
                      showThumbnails={false}
                      compact={true}
                    />
                  </Box>
                );
              }
              
              // Single media item fallback
              const mediaUrl = news.media_url || news.image_url;
              const mediaType = detectMediaType(mediaUrl, news.media_type);
              const mediaConfig = getMediaConfig(mediaType);
              
              if (mediaUrl) {
                if (mediaType !== MEDIA_TYPES.IMAGE && mediaType !== MEDIA_TYPES.UNKNOWN) {
                  return (
                    <Box sx={{ 
                      mb: 1, 
                      aspectRatio: mediaConfig.aspectRatio,
                      minHeight: 80,
                      maxHeight: 120,
                      width: '100%',
                      overflow: 'hidden'
                    }}>
                      <MediaPlayer
                        src={mediaUrl}
                        type={mediaType}
                        title={news.title}
                        fileName={news.media_metadata?.fileName}
                        fileSize={news.media_metadata?.fileSize}
                        numPages={news.media_metadata?.numPages}
                        author={news.media_metadata?.author}
                        thumbnail={news.media_metadata?.thumbnail || news.media_metadata?.albumArt || news.image_url}
                        darkMode={true}
                        compact={true}
                        sx={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 0.5,
                          '& video': {
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: 0.5
                          },
                          '& audio': {
                            width: '100%',
                            height: '100%',
                            borderRadius: 0.5
                          }
                        }}
                      />
                    </Box>
                  );
                } else {
                  // Default to image display
                  return (
                    <Box sx={{ mb: 1 }}>
                      <img
                        src={mediaUrl}
                        alt={news.image_caption || news.title}
                        onClick={() => handleImageClick(mediaUrl, news.title)}
                        style={{
                          width: '100%',
                          height: 'auto',
                          maxHeight: '300px',
                          objectFit: 'contain',
                          borderRadius: 4,
                          cursor: 'pointer',
                          transition: 'opacity 0.2s ease',
                        }}
                        onMouseOver={(e) => e.target.style.opacity = 0.9}
                        onMouseOut={(e) => e.target.style.opacity = 1}
                      />
                    </Box>
                  );
                }
              }
              return null;
            })()}

            <LinkifiedText 
              text={truncateContent(stripHtml(news.content), 150)}
              component="div"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: (news.image_url || news.media_url) ? 2 : 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.5,
                fontSize: '0.875rem',
                color: 'text.secondary'
              }}
            />
          </Box>

          {/* Comment count and actions - matching PostCard */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
            <Button
              component={Link}
              to={`/network/${networkId}/news/${news.id}`}
              startIcon={<CommentIcon sx={{ fontSize: 18 }} />}
              sx={{
                textTransform: 'none',
                color: theme.palette.text.secondary,
                fontSize: '0.875rem',
                py: 0.5,
                px: 1,
                minHeight: 'auto',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main
                }
              }}
            >
              {commentCount > 0 ? `${commentCount} comment${commentCount !== 1 ? 's' : ''}` : t('dashboard.comment')}
            </Button>
            
            <Button
              component={Link}
              to={`/network/${networkId}/news/${news.id}`}
              size="small"
              endIcon={<ArrowForwardIcon />}
              sx={{ alignSelf: 'flex-start' }}
            >
              {t('dashboard.viewPost')}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <ImageViewerModal
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage.url}
        title={selectedImage.title}
      />
    </>
  );
};

export default AnnouncementCard;