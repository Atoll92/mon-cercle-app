import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  Box,
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Campaign as CampaignIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import MediaPlayer from '../MediaPlayer';
import MediaCarousel from '../MediaCarousel';
import LazyImage from '../LazyImage';
import UserContent from '../UserContent';
import CommentSection from '../CommentSection';
import ReactionBar from '../ReactionBar';
import Spinner from '../Spinner';
import { formatTimeAgo } from '../../utils/dateFormatting';

/**
 * NewsCard component - Memoized card for displaying news/announcement items
 */
const NewsCard = React.memo(({
  item,
  category,
  darkMode,
  isUserPost,
  deletingPostId,
  customLightText,
  customFadedText,
  customBorder,
  onMemberClick,
  onDeletePost,
  onImageClick,
  t,
}) => {
  const muiTheme = useTheme();
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRefs = React.useRef({});

  // Debug logging
  console.log('NewsCard rendering:', item?.id, item?.title?.substring(0, 30));

  // Handle audio playback
  const handleAudioPlay = (itemId, audioUrl) => {
    if (playingAudioId === itemId) {
      const audio = audioRefs.current[itemId];
      if (audio) {
        if (audio.paused) {
          audio.play();
        } else {
          audio.pause();
        }
      }
    } else {
      if (playingAudioId && audioRefs.current[playingAudioId]) {
        audioRefs.current[playingAudioId].pause();
      }

      if (!audioRefs.current[itemId]) {
        const audio = new Audio(audioUrl);
        audio.addEventListener('ended', () => {
          setPlayingAudioId(null);
        });
        audioRefs.current[itemId] = audio;
      }

      audioRefs.current[itemId].play();
      setPlayingAudioId(itemId);
    }
  };

  // Render media content
  const renderMedia = () => {
    // PDF Preview
    if (item.file_type === 'pdf' && item.file_url) {
      return (
        <Box sx={{
          bgcolor: darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}>
          <MediaPlayer
            src={item.file_url}
            type="pdf"
            title={item.title || "PDF Document"}
            fileName={item.title || "PDF Document"}
            darkMode={darkMode}
          />
        </Box>
      );
    }

    // Multiple media items
    let mediaItemsArray = null;
    if (item.media_items && Array.isArray(item.media_items) && item.media_items.length > 0) {
      mediaItemsArray = item.media_items;
    } else if (item.media_metadata?.media_items && Array.isArray(item.media_metadata.media_items) && item.media_metadata.media_items.length > 0) {
      mediaItemsArray = item.media_metadata.media_items;
    }

    if (mediaItemsArray) {
      if (mediaItemsArray.length === 1) {
        const mediaItem = mediaItemsArray[0];
        const mediaType = mediaItem.type?.toLowerCase();

        if (mediaType === 'image') {
          return (
            <Box
              sx={{
                bgcolor: darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.03)',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    '& img': {
                      filter: 'brightness(0.95)'
                    }
                  }
                }}
                onClick={() => onImageClick(mediaItem.url, mediaItem.metadata?.fileName || item.title)}
              >
                <img
                  src={mediaItem.url}
                  alt={mediaItem.metadata?.fileName || item.title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '600px',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'filter 0.3s ease'
                  }}
                />
              </Box>
            </Box>
          );
        }

        return (
          <Box sx={{
            bgcolor: darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}>
            <MediaPlayer
              src={mediaItem.url}
              type={mediaType}
              title={mediaItem.metadata?.fileName}
              thumbnail={mediaItem.metadata?.thumbnail}
              darkMode={darkMode}
              autoplay={mediaType === 'video'}
              muted={true}
              hideControlsUntilInteraction={true}
            />
          </Box>
        );
      }

      return (
        <Box sx={{
          bgcolor: darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}>
          <MediaCarousel
            media={mediaItemsArray.map(mediaItem => ({
              url: mediaItem.url,
              type: mediaItem.type,
              metadata: mediaItem.metadata || {}
            }))}
            darkMode={darkMode}
            height={500}
            autoplay={false}
            showThumbnails={true}
            compact={false}
          />
        </Box>
      );
    }

    // Single media URL
    if (item.media_url) {
      let mediaType = item.media_type;
      if (!mediaType && item.media_url) {
        const url = item.media_url.toLowerCase();
        if (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('.mov')) {
          mediaType = 'video';
        } else if (url.includes('.mp3') || url.includes('.wav') || url.includes('.m4a') || url.includes('.aac')) {
          mediaType = 'audio';
        } else if (url.includes('.pdf')) {
          mediaType = 'pdf';
        } else if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp')) {
          mediaType = 'image';
        }
      }

      if (mediaType === 'image') {
        return (
          <Box
            sx={{
              bgcolor: darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.03)',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                  '& img': {
                    filter: 'brightness(0.95)'
                  }
                }
              }}
              onClick={() => onImageClick(item.media_url, item.title)}
            >
              <LazyImage
                src={item.media_url}
                alt={item.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  maxHeight: '600px',
                  objectFit: 'cover',
                  transition: 'filter 0.3s ease'
                }}
              />
            </Box>
          </Box>
        );
      } else if (mediaType === 'audio' || mediaType === 'video' || mediaType === 'pdf') {
        return (
          <Box sx={{
            bgcolor: darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}>
            <MediaPlayer
              src={item.media_url}
              type={mediaType}
              title={item.media_metadata?.fileName || item.title}
              thumbnail={item.media_metadata?.thumbnail || item.image_url}
              darkMode={darkMode}
              autoplay={mediaType === 'video'}
              muted={true}
              hideControlsUntilInteraction={true}
            />
          </Box>
        );
      }
    }

    // Legacy image_url fallback
    if (item.image_url) {
      return (
        <Box
          sx={{
            bgcolor: darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.02)',
                '& img': {
                  filter: 'brightness(0.95)'
                }
              }
            }}
            onClick={() => onImageClick(item.image_url, item.title)}
          >
            <LazyImage
              src={item.image_url}
              alt={item.title}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                maxHeight: '600px',
                objectFit: 'cover',
                transition: 'filter 0.3s ease'
              }}
            />
          </Box>
        </Box>
      );
    }

    return null;
  };

  return (
    <Card
      data-newscard-id={item?.id}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        minHeight: '200px',
        visibility: 'visible !important',
        display: 'block !important',
        transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px) !important',
          boxShadow: darkMode ? '0 6px 20px rgba(0,0,0,0.25)' : '0 6px 20px rgba(0,0,0,0.08)'
        },
        bgcolor: darkMode ? alpha('#1e1e1e', 0.5) : 'background.paper',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${customBorder}`
      }}
    >
      <Box sx={{ p: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Avatar */}
          <Avatar
            src={item.memberAvatar}
            onClick={(e) => onMemberClick(item.memberId || item.created_by, e)}
            sx={{
              width: 40,
              height: 40,
              border: `2px solid ${customBorder}`,
              bgcolor: muiTheme.palette.primary.main,
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }
            }}
          >
            {item.memberName ? item.memberName.charAt(0).toUpperCase() : 'U'}
          </Avatar>

          {/* Name and Date */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              onClick={(e) => onMemberClick(item.memberId || item.created_by, e)}
              sx={{
                fontWeight: 600,
                color: customLightText,
                cursor: 'pointer',
                '&:hover': {
                  color: muiTheme.palette.primary.main,
                  textDecoration: 'underline'
                },
                transition: 'color 0.2s ease',
                lineHeight: 1.4,
                mb: 0.5
              }}
            >
              {item.memberName}
            </Typography>
            <Typography
              variant="caption"
              color={customFadedText}
              sx={{
                whiteSpace: 'nowrap',
                fontSize: '0.75rem',
                fontWeight: 500,
                lineHeight: 1,
                display: 'block'
              }}
            >
              {formatTimeAgo(item.createdAt)}
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isUserPost && (
                <IconButton
                  size="small"
                  onClick={(e) => onDeletePost(item, e)}
                  disabled={deletingPostId === item.id}
                  sx={{
                    color: 'error.main',
                    width: 28,
                    height: 28,
                    '&:hover': {
                      bgcolor: alpha(muiTheme.palette.error.main, 0.08)
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  {deletingPostId === item.id ? (
                    <Spinner size={16} />
                  ) : (
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  )}
                </IconButton>
              )}

              {item.itemType === 'news' && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: alpha(muiTheme.palette.primary.main, 0.12),
                    border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.3)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(muiTheme.palette.primary.main, 0.18),
                      borderColor: alpha(muiTheme.palette.primary.main, 0.4),
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <CampaignIcon
                    sx={{
                      fontSize: 14,
                      color: muiTheme.palette.primary.main
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Category */}
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

      {/* Media */}
      {renderMedia()}

      {/* Content */}
      <CardContent sx={{ pt: 1, pb: 2 }}>
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: customLightText,
            mb: 1
          }}
        >
          {item.title}
        </Typography>

        <Box
          sx={{
            transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
            overflow: 'hidden',
            maxHeight: '4.5em',
            position: 'relative',
            mb: 2
          }}
        >
          <UserContent
            content={item.content}
            html={true}
            noShowMore={true}
            maxLines={3}
            sx={{
              color: customFadedText,
              fontSize: '0.875rem'
            }}
          />
        </Box>

        {/* Reactions */}
        <Box sx={{ mb: 2, pt: 1, borderTop: `1px solid ${alpha(muiTheme.palette.divider, 0.1)}` }}>
          <ReactionBar
            contentType="news"
            contentId={item.id}
            initialCount={item.reaction_count || 0}
            size="medium"
          />
        </Box>

        {/* Comments */}
        <CommentSection
          itemType={item.itemType}
          itemId={item.id}
          onMemberClick={onMemberClick}
          TopRightElement={
            <Button
              component={Link}
              to={`/network/${item.network_id}/news/${item.id}`}
              size="small"
              endIcon={<ArrowForwardIcon />}
              sx={{ alignSelf: 'flex-start' }}
            >
              {t('socialWall.readFullPost')}
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
});

NewsCard.displayName = 'NewsCard';

export default NewsCard;
