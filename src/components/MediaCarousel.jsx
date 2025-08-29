import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Chip,
  useTheme,
  useMediaQuery,
  alpha,
  Fade,
  Paper
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Close as CloseIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  PictureAsPdf as PdfIcon,
  PlayCircleFilled as PlayIcon,
  Pause as PauseIcon,
  FullscreenOutlined as FullscreenIcon
} from '@mui/icons-material';
import LazyImage from './LazyImage';
import MediaPlayer from './MediaPlayer';
import ImageViewerModal from './ImageViewerModal';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Keyboard, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const MediaCarousel = ({
  media = [], // Array of { url, type, metadata }
  onRemove = null, // Function to remove media item (only for edit mode)
  isEditMode = false,
  darkMode = false,
  height = 400,
  autoplay = false,
  showThumbnails = true,
  compact = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '' });
  const [playingVideoIndex, setPlayingVideoIndex] = useState(null);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const swiperRef = useRef(null);
  const videoRefs = useRef({});

  // Clean up video refs on unmount
  useEffect(() => {
    return () => {
      Object.values(videoRefs.current).forEach(video => {
        if (video) {
          video.pause();
          video.src = '';
        }
      });
    };
  }, []);

  // Handle media removal
  const handleRemoveMedia = (index, e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(index);
    }
  };

  // Handle image click for fullscreen
  const handleImageClick = (mediaItem) => {
    if (mediaItem.type === 'image') {
      setSelectedImage({ 
        url: mediaItem.url, 
        title: mediaItem.metadata?.fileName || 'Image' 
      });
      setImageViewerOpen(true);
    }
  };

  // Get media icon
  const getMediaIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'image': return <ImageIcon />;
      case 'video': return <VideoIcon />;
      case 'audio': return <AudioIcon />;
      case 'pdf': return <PdfIcon />;
      default: return <ImageIcon />;
    }
  };

  // Render single media item
  const renderMediaItem = (mediaItem, index) => {
    const { url, type, metadata } = mediaItem;

    switch (type?.toLowerCase()) {
      case 'image':
        return (
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: compact ? 200 : height,
              cursor: 'pointer',
              overflow: 'hidden',
              bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
              '&:hover .media-overlay': {
                opacity: 1
              }
            }}
            onClick={() => handleImageClick(mediaItem)}
          >
            <LazyImage
              src={url}
              alt={metadata?.fileName || 'Image'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
            {/* Hover overlay with fullscreen icon */}
            <Box
              className="media-overlay"
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 60,
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                pb: 1,
                opacity: 0,
                transition: 'opacity 0.2s ease'
              }}
            >
              <IconButton
                size="small"
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
              >
                <FullscreenIcon />
              </IconButton>
            </Box>
          </Box>
        );

      case 'video':
        return (
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: compact ? 200 : height,
              bgcolor: 'black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MediaPlayer
              src={url}
              type="video"
              title={metadata?.fileName}
              thumbnail={metadata?.thumbnail}
              darkMode={darkMode}
              autoplay={true}
              muted={true}
              hideControlsUntilInteraction={true}
              onRef={(ref) => { videoRefs.current[index] = ref; }}
            />
          </Box>
        );

      case 'audio':
        const audioThumbnail = metadata?.thumbnail || metadata?.albumArt;
        return (
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: compact ? 200 : height,
              bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {audioThumbnail ? (
              <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                <LazyImage
                  src={audioThumbnail}
                  alt={metadata?.title || metadata?.fileName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'brightness(0.7)'
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 3,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)'
                  }}
                >
                  <MediaPlayer
                    src={url}
                    type="audio"
                    title={metadata?.title || metadata?.fileName}
                    artist={metadata?.artist}
                    album={metadata?.album}
                    darkMode={darkMode}
                    compact={true}
                    showVisualizer={false}
                  />
                </Box>
              </Box>
            ) : (
              <MediaPlayer
                src={url}
                type="audio"
                title={metadata?.title || metadata?.fileName}
                artist={metadata?.artist}
                album={metadata?.album}
                darkMode={darkMode}
                compact={false}
              />
            )}
          </Box>
        );

      case 'pdf':
        return (
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: compact ? 200 : height,
              bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
              p: 2
            }}
          >
            <MediaPlayer
              src={url}
              type="pdf"
              title={metadata?.fileName}
              fileName={metadata?.fileName}
              fileSize={metadata?.fileSize}
              numPages={metadata?.numPages}
              author={metadata?.author}
              thumbnail={metadata?.thumbnail}
              darkMode={darkMode}
            />
          </Box>
        );

      default:
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: compact ? 200 : height,
              bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }}
          >
            <Typography color="text.secondary">
              Unsupported media type
            </Typography>
          </Box>
        );
    }
  };

  // Render thumbnail
  const renderThumbnail = (mediaItem, index) => {
    const { url, type, metadata } = mediaItem;
    const isActive = index === activeIndex;

    return (
      <Box
        onClick={() => {
          if (swiperInstance) {
            swiperInstance.slideToLoop(index);
          }
        }}
        sx={{
          position: 'relative',
          width: 60,
          height: 60,
          cursor: 'pointer',
          overflow: 'hidden',
          borderRadius: 1,
          border: `2px solid ${isActive ? theme.palette.primary.main : 'transparent'}`,
          opacity: isActive ? 1 : 0.6,
          transition: 'all 0.2s ease',
          '&:hover': {
            opacity: 1,
            transform: 'scale(1.05)'
          }
        }}
      >
        {type === 'image' ? (
          <LazyImage
            src={url}
            alt={`Thumbnail ${index + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : type === 'video' && metadata?.thumbnail ? (
          <LazyImage
            src={metadata.thumbnail}
            alt={`Video thumbnail ${index + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
            }}
          >
            {getMediaIcon(type)}
          </Box>
        )}
        
        {/* Media type indicator */}
        <Chip
          icon={getMediaIcon(type)}
          size="small"
          sx={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            height: 20,
            fontSize: '0.65rem',
            bgcolor: 'rgba(0,0,0,0.7)',
            color: 'white',
            '& .MuiChip-icon': {
              fontSize: '0.9rem',
              color: 'white'
            }
          }}
        />
      </Box>
    );
  };

  if (!media || media.length === 0) {
    return null;
  }

  // Single media item - no carousel needed
  if (media.length === 1) {
    return (
      <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
        {renderMediaItem(media[0], 0)}
        {isEditMode && onRemove && (
          <IconButton
            onClick={(e) => handleRemoveMedia(0, e)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.9)'
              }
            }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>
    );
  }

  // Multiple media items - show carousel
  return (
    <Box sx={{ position: 'relative' }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)'
        }}
      >
        <Swiper
          ref={swiperRef}
          modules={[Pagination, Keyboard, A11y]}
          spaceBetween={0}
          slidesPerView={1}
          loop={true}
          pagination={{
            clickable: true,
            dynamicBullets: true
          }}
          keyboard={{
            enabled: true
          }}
          onSwiper={setSwiperInstance}
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          style={{ borderRadius: '8px' }}
        >
          {media.map((mediaItem, index) => (
            <SwiperSlide key={index}>
              <Box sx={{ position: 'relative' }}>
                {renderMediaItem(mediaItem, index)}
                {isEditMode && onRemove && (
                  <IconButton
                    onClick={(e) => handleRemoveMedia(index, e)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      zIndex: 10,
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.9)'
                      }
                    }}
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                )}
              </Box>
            </SwiperSlide>
          ))}
          
          {/* Custom navigation buttons */}
          <IconButton
            onClick={() => swiperInstance?.slidePrev()}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: 'rgba(0,0,0,0.6)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.8)'
              }
            }}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            onClick={() => swiperInstance?.slideNext()}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: 'rgba(0,0,0,0.6)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.8)'
              }
            }}
          >
            <ChevronRight />
          </IconButton>
        </Swiper>
        
        {/* Media count indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            bgcolor: 'rgba(0,0,0,0.7)',
            color: 'white',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.875rem',
            fontWeight: 500,
            zIndex: 10
          }}
        >
          {activeIndex + 1} / {media.length}
        </Box>
      </Paper>
      
      
      {/* Image viewer modal */}
      <ImageViewerModal
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage.url}
        title={selectedImage.title}
      />
      
      {/* Custom styles for swiper pagination */}
      <style jsx global>{`
        .swiper-pagination {
          bottom: 12px !important;
        }
        .swiper-pagination-bullet {
          background: white;
          opacity: 0.6;
        }
        .swiper-pagination-bullet-active {
          opacity: 1;
        }
      `}</style>
    </Box>
  );
};

export default MediaCarousel;