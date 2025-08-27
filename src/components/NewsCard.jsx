import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MediaPlayer from './MediaPlayer';
import ImageViewerModal from './ImageViewerModal';
import { formatTimeAgo } from '../utils/dateFormatting';
import { truncateContent, stripHtml } from '../utils/textFormatting';
import { detectMediaType, MEDIA_TYPES, getMediaConfig } from '../utils/mediaDetection';
import { getCommentCount } from '../api/comments';
import { useTranslation } from '../hooks/useTranslation';
import {
  Card,
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

const AnnouncementCard = ({ news, networkId, onMemberClick }) => {
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
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
          {/* Author info */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar
              src={news.profiles?.profile_picture_url}
              sx={{ width: 24, height: 24, mr: 1 }}
            >
              {news.profiles?.full_name ? 
                news.profiles.full_name.charAt(0).toUpperCase() : 
                <PersonIcon sx={{ fontSize: 16 }} />
              }
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="caption" 
                fontWeight={500} 
                noWrap 
                onClick={onMemberClick ? (e) => onMemberClick(news.profiles?.id, e) : undefined}
                sx={{ 
                  lineHeight: 1.2,
                  cursor: onMemberClick ? 'pointer' : 'default',
                  '&:hover': onMemberClick ? {
                    color: 'primary.main',
                    textDecoration: 'underline'
                  } : {},
                  transition: 'color 0.2s ease'
                }}
              >
                {news.profiles?.full_name || 'Unknown Author'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <ScheduleIcon sx={{ fontSize: 10, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1, fontSize: '0.7rem' }}>
                  {formatTimeAgo(news.created_at)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: 1 }} />

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
                mb: 1,
                fontSize: '1rem'
              }}
            >
              {news.title}
            </Typography>

            {(() => {
              // Determine media type and URL
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

            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: (news.image_url || news.media_url) ? 2 : 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.5,
                fontSize: '0.875rem'
              }}
            >
              {truncateContent(stripHtml(news.content), 150)}
            </Typography>
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