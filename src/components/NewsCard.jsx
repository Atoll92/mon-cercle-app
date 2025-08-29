import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MediaPlayer from './MediaPlayer';
import MediaCarousel from './MediaCarousel';
import LinkifiedText from './LinkifiedText';
import ImageViewerModal from './ImageViewerModal';
import UserContent from './UserContent';
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
        {/* Custom header layout */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* Left column: Avatar */}
            <Avatar
              src={news.profiles?.profile_picture_url}
              onClick={onMemberClick ? (e) => onMemberClick(news.profiles?.id, e) : undefined}
              sx={{ 
                width: 40, 
                height: 40,
                cursor: onMemberClick ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                '&:hover': onMemberClick ? {
                  transform: 'scale(1.1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                } : {}
              }}
            >
              {news.profiles?.full_name ? 
                news.profiles.full_name.charAt(0).toUpperCase() : 
                <PersonIcon />
              }
            </Avatar>
            
            {/* Middle: Name and Date */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600,
                  cursor: onMemberClick ? 'pointer' : 'default',
                  '&:hover': onMemberClick ? {
                    color: 'primary.main',
                    textDecoration: 'underline'
                  } : {},
                  transition: 'color 0.2s ease',
                  lineHeight: 1.4,
                  mb: 0.5
                }}
                onClick={onMemberClick ? (e) => onMemberClick(news.profiles?.id, e) : undefined}
              >
                {news.profiles?.full_name || 'Unknown Author'}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  whiteSpace: 'nowrap',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  lineHeight: 1,
                  display: 'block'
                }}
              >
                {formatTimeAgo(news.created_at)}
              </Typography>
            </Box>
            
            {/* Right: Actions */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
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
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      bgcolor: alpha(category.color, 0.18),
                      borderColor: alpha(category.color, 0.4),
                    }
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: category.color,
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    #{category.name}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
        {/* Media content - moved outside CardContent to match PostCard layout */}
        {(() => {
              // Check for multiple media items - first check direct field, then check media_metadata
              let mediaItemsArray = null;
              
              if (news.media_items && Array.isArray(news.media_items) && news.media_items.length > 0) {
                mediaItemsArray = news.media_items;
              } else if (news.media_metadata?.media_items && Array.isArray(news.media_metadata.media_items) && news.media_metadata.media_items.length > 0) {
                mediaItemsArray = news.media_metadata.media_items;
              }
              
              if (mediaItemsArray) {
                // For single media items, use appropriate component based on type
                if (mediaItemsArray.length === 1) {
                  const mediaItem = mediaItemsArray[0];
                  const mediaType = mediaItem.type?.toLowerCase();
                  
                  // For images, use img element directly since MediaPlayer doesn't handle images
                  if (mediaType === 'image') {
                    return (
                      <Box sx={{ bgcolor: 'rgba(0,0,0,0.05)', p: 2 }}>
                        <img
                          src={mediaItem.url}
                          alt={mediaItem.metadata?.fileName || news.title}
                          onClick={() => handleImageClick(mediaItem.url, news.title)}
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '400px',
                            objectFit: 'contain',
                            borderRadius: 8,
                            cursor: 'pointer',
                            transition: 'opacity 0.2s ease',
                          }}
                          onMouseOver={(e) => e.target.style.opacity = 0.9}
                          onMouseOut={(e) => e.target.style.opacity = 1}
                        />
                      </Box>
                    );
                  }
                  
                  // For video, audio, pdf use MediaPlayer
                  return (
                    <Box sx={{ bgcolor: 'rgba(0,0,0,0.05)', p: 2 }}>
                      <MediaPlayer
                        src={mediaItem.url}
                        type={mediaType}
                        title={mediaItem.metadata?.fileName || news.title}
                        thumbnail={mediaItem.metadata?.thumbnail}
                        darkMode={false}
                        compact={false}
                        autoplay={false}
                      />
                    </Box>
                  );
                }
                
                // For multiple media items, use MediaCarousel
                return (
                  <Box sx={{ bgcolor: 'rgba(0,0,0,0.05)', p: 2 }}>
                    <MediaCarousel
                      media={mediaItemsArray.map(item => ({
                        url: item.url,
                        type: item.type,
                        metadata: item.metadata || {}
                      }))}
                      darkMode={false}
                      height={400}
                      autoplay={false}
                      showThumbnails={true}
                      compact={false}
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
                    <Box sx={{ bgcolor: 'rgba(0,0,0,0.05)', p: 2 }}>
                      <MediaPlayer
                        src={mediaUrl}
                        type={mediaType}
                        title={news.title}
                        fileName={news.media_metadata?.fileName}
                        fileSize={news.media_metadata?.fileSize}
                        numPages={news.media_metadata?.numPages}
                        author={news.media_metadata?.author}
                        thumbnail={news.media_metadata?.thumbnail || news.media_metadata?.albumArt || news.image_url}
                        darkMode={false}
                        compact={false}
                      />
                    </Box>
                  );
                } else {
                  // Default to image display
                  return (
                    <Box sx={{ bgcolor: 'rgba(0,0,0,0.05)', p: 2 }}>
                      <img
                        src={mediaUrl}
                        alt={news.image_caption || news.title}
                        onClick={() => handleImageClick(mediaUrl, news.title)}
                        style={{
                          width: '100%',
                          height: 'auto',
                          maxHeight: '400px',
                          objectFit: 'contain',
                          borderRadius: 8,
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
        
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', pt: 2 }}>
          {/* News content - title now comes after media like in PostCard */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <UserContent 
              content={news.title}
              html={false}
              maxLines={2}
              sx={{
                fontWeight: 600,
                fontSize: '1rem',
                mb: 2
              }}
            />

            <UserContent 
              content={news.content}
              html={true}
              maxLines={(news.image_url || news.media_url) ? 2 : 3}
              sx={{
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