// src/components/LinkPreview.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Skeleton,
  Link as MuiLink,
  IconButton
} from '@mui/material';
import {
  Link as LinkIcon,
  Language as LanguageIcon,
  BrokenImage as BrokenImageIcon,
  OpenInNew as OpenInNewIcon,
  MusicNote as MusicNoteIcon,
  PlayCircleOutline as PlayCircleOutlineIcon,
  Event as EventIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { getOpenGraphData } from '../services/opengraphService';

// Media URL patterns for embedding
const MEDIA_PATTERNS = {
  spotify: {
    pattern: /^(https?:\/\/)?(open\.spotify\.com\/track\/[a-zA-Z0-9]+)(\?.*)?$/,
    getEmbedUrl: (url) => {
      const trackId = url.match(/track\/([a-zA-Z0-9]+)/)[1];
      return `https://open.spotify.com/embed/track/${trackId}`;
    },
    height: 80
  },
  youtube: {
    pattern: /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)(\&.*)?$/,
    getEmbedUrl: (url) => {
      let videoId;
      if (url.includes('youtube.com/watch?v=')) {
        // Extract videoId from URL
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        videoId = urlObj.searchParams.get('v');
      } else {
        videoId = url.split('/').pop().split('?')[0];
      }
      return `https://www.youtube.com/embed/${videoId}`;
    },
    height: 315
  },
  soundcloud: {
    pattern: /^(https?:\/\/)?(www\.)?(soundcloud\.com\/.+)$/,
    getEmbedUrl: (url) => {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
    },
    height: 166
  },
  vimeo: {
    pattern: /^(https?:\/\/)?(www\.)?(vimeo\.com\/)([0-9]+)$/,
    getEmbedUrl: (url) => {
      const videoId = url.split('/').pop().split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    },
    height: 315
  }
};

// Helper function to detect if a URL is from a supported media service
const detectMediaService = (url) => {
  if (!url) return null;
  
  // Ensure URL has protocol
  const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
  
  for (const [service, config] of Object.entries(MEDIA_PATTERNS)) {
    if (config.pattern.test(formattedUrl)) {
      return {
        service,
        embedUrl: config.getEmbedUrl(formattedUrl),
        height: config.height
      };
    }
  }
  
  return null;
};

// Check if URL is from Facebook
const isFacebookUrl = (url) => {
  if (!url) return false;
  return url.includes('facebook.com') || 
         url.includes('fb.com') || 
         url.includes('fb.me');
};

// Check if URL is a Facebook event
const isFacebookEventUrl = (url) => {
  if (!url) return false;
  return (url.includes('facebook.com/events/') || 
         url.includes('fb.me/e/'));
};

// Special case for YouTube video metadata from ogData
const hasYouTubeData = (ogData) => {
  return ogData && ogData.videoId && ogData.siteName === 'YouTube';
};

const LinkPreview = ({ url, compact = false, onDataLoaded = null, height = 'auto', isEditable = true }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ogData, setOgData] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [faviconLoaded, setFaviconLoaded] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const [mediaInfo, setMediaInfo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Ensure URL has http/https prefix
  const formattedUrl = url && !url.startsWith('http') ? `https://${url}` : url;

  // Detect if URL is from a supported media service
  useEffect(() => {
    if (formattedUrl) {
      const mediaService = detectMediaService(formattedUrl);
      setMediaInfo(mediaService);
    }
  }, [formattedUrl]);

  // Fetch OpenGraph data when URL changes
  useEffect(() => {
    const fetchData = async () => {
      if (!formattedUrl) return;
      
      try {
        console.log('LinkPreview: Fetching data for URL:', formattedUrl);
        setLoading(true);
        setError(null);
        setImageLoaded(false);
        setImageError(false);
        setFaviconLoaded(false);
        setFaviconError(false);
        
        const data = await getOpenGraphData(formattedUrl);
        console.log('LinkPreview: Received data:', data);
        console.log('LinkPreview: Title:', data?.title);
        console.log('LinkPreview: Description:', data?.description);
        console.log('LinkPreview: Image URL:', data?.image);
        console.log('LinkPreview: Thumbnail URL:', data?.thumbnail);
        console.log('LinkPreview: Favicon:', data?.favicon);
        setOgData(data);
        
        // Handle special case for YouTube videos
        if (hasYouTubeData(data) && !mediaInfo) {
          setMediaInfo({
            service: 'youtube',
            embedUrl: `https://www.youtube.com/embed/${data.videoId}`,
            height: 315
          });
        }
        
        // For Facebook data with embedded SVG images or any already loaded images, mark them as already loaded
        if (data.image) {
          // For data URIs or cached images, mark as already loaded
          if (data.image.startsWith('data:') || data.image.startsWith('blob:') || 
              data.image.includes('ggpht.com') || data.image.includes('ytimg.com')) {
            console.log('Image preloaded:', data.image);
            setImageLoaded(true);
          }
        }
        
        if (data.favicon) {
          // For data URIs or cached favicons, mark as already loaded
          if (data.favicon.startsWith('data:') || data.favicon.startsWith('blob:')) {
            console.log('Favicon preloaded:', data.favicon);
            setFaviconLoaded(true);
          }
        }
        
        // Notify parent component if data was loaded
        if (onDataLoaded) onDataLoaded(data);
      } catch (err) {
        console.error('LinkPreview: Error loading link preview:', err);
        setError('Failed to load preview');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [formattedUrl, onDataLoaded]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.log('LinkPreview: Image failed to load:', ogData?.image);
    setImageError(true);
  };

  const handleFaviconLoad = () => {
    setFaviconLoaded(true);
  };

  const handleFaviconError = () => {
    setFaviconError(true);
  };

  // Extract hostname from URL
  const getHostname = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch (e) {
      return url;
    }
  };


  // Function to toggle media player
  const toggleMediaPlayer = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  // Auto-play media in chat when the component mounts
  useEffect(() => {
    // If this is not in a compact view and it's a media URL, auto-play it
    if (!compact && mediaInfo) {
      setIsPlaying(true);
    }
  }, [compact, mediaInfo]);

  // Determine if we should auto-embed media (Spotify is auto-embedded, YouTube requires a click)
  const shouldAutoEmbed = mediaInfo && (mediaInfo.service === 'spotify' || isPlaying);

  // Check if this is a Facebook event
  const isFacebookEvent = ogData?.isFacebookEvent || (isFacebookEventUrl(formattedUrl));
  
  // Check if this is a Facebook link
  const isFacebook = ogData?.isFacebook || (isFacebookUrl(formattedUrl));

  // Loading state
  if (loading) {
    return (
      <Paper
        elevation={compact ? 0 : 1}
        sx={{
          height: height,
          width: '100%',
          display: 'flex',
          flexDirection: compact ? 'row' : 'column',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          borderRadius: 1
        }}
      >
        {!compact && (
          <Skeleton
            variant="rectangular"
            width="100%"
            height={200}
            animation="wave"
          />
        )}
        <Box sx={{ p: compact ? 1 : 2, width: '100%' }}>
          <Skeleton animation="wave" height={24} width="80%" sx={{ mb: 1 }} />
          {!compact && <Skeleton animation="wave" height={18} width="90%" sx={{ mb: 1 }} />}
          <Skeleton animation="wave" height={18} width="40%" />
        </Box>
      </Paper>
    );
  }

  // Error state or no data - still show a nice preview
  if (error || !ogData) {
    const fallbackData = {
      title: getHostname(formattedUrl),
      description: `Visit ${getHostname(formattedUrl)}`,
      image: null,
      favicon: `https://www.google.com/s2/favicons?domain=${getHostname(formattedUrl)}&sz=64`
    };
    
    return (
      <Paper
        elevation={compact ? 0 : 1}
        component="a"
        href={formattedUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          height: height,
          width: '100%',
          display: 'flex',
          flexDirection: compact ? 'row' : 'column',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          borderRadius: 1,
          textDecoration: 'none',
          color: 'inherit',
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
      >
        {compact ? (
          <>
            <Box
              sx={{
                width: 48,
                height: 48,
                m: 1,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.100',
                borderRadius: 1
              }}
            >
              <LinkIcon color="primary" sx={{ fontSize: 24 }} />
            </Box>
            <Box sx={{ minWidth: 0, flexGrow: 1, py: 1 }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  fontWeight: 'medium',
                  color: 'text.primary'
                }}
              >
                {fallbackData.title}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  color: 'text.secondary',
                  display: 'block'
                }}
              >
                {fallbackData.description}
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <Box
              sx={{
                width: '100%',
                height: 120,
                bgcolor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LanguageIcon sx={{ fontSize: 50, color: 'text.disabled' }} />
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{
                  fontWeight: 'medium',
                  color: 'text.primary'
                }}
              >
                {fallbackData.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {fallbackData.description}
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    );
  }

  // Compact preview for Facebook events with special styling
  if (compact && isFacebookEvent) {
    return (
      <Paper
        elevation={0}
        sx={{
          height: height,
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderRadius: 1,
          p: 1
        }}
      >
        <EventIcon color="primary" sx={{ fontSize: 20, mr: 1, flexShrink: 0 }} />
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography
            variant="subtitle2"
            noWrap
            sx={{
              fontWeight: 'medium',
              color: 'text.primary'
            }}
          >
            {ogData.title || "Facebook Event"}
          </Typography>
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: 'text.secondary',
              display: 'block'
            }}
          >
            {getHostname(formattedUrl)}
          </Typography>
        </Box>
        <IconButton 
          size="small" 
          color="primary" 
          component="a"
          href={formattedUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ ml: 1 }}
        >
          <OpenInNewIcon />
        </IconButton>
      </Paper>
    );
  }

  // Compact preview for media links with play option
  if (compact && mediaInfo && !isPlaying) {
    // If we have ogData with image, show thumbnail preview
    const thumbnailUrl = ogData?.thumbnail || ogData?.image;
    
    return (
      <Paper
        elevation={0}
        sx={{
          height: height,
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderRadius: 1,
          p: 1,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
      >
        {/* Thumbnail or icon */}
        {thumbnailUrl && !imageError ? (
          <Box 
            sx={{ 
              width: 48, 
              height: 48, 
              mr: 1, 
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 1,
              bgcolor: 'grey.200'
            }}
          >
            <Box
              component="img"
              src={thumbnailUrl}
              alt={ogData.title || "Thumbnail"}
              onLoad={handleImageLoad}
              onError={handleImageError}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            {/* Play icon overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.3)',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.5)'
                }
              }}
            >
              <PlayCircleOutlineIcon 
                sx={{ 
                  fontSize: 24, 
                  color: 'white',
                  filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.5))'
                }} 
              />
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              width: 48,
              height: 48,
              mr: 1,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: mediaInfo.service === 'spotify' ? 'success.light' : 'error.light',
              borderRadius: 1
            }}
          >
            {mediaInfo.service === 'spotify' ? (
              <MusicNoteIcon color="success" sx={{ fontSize: 24 }} />
            ) : (
              <PlayCircleOutlineIcon color="error" sx={{ fontSize: 24 }} />
            )}
          </Box>
        )}
        
        <Box 
          sx={{ minWidth: 0, flexGrow: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            toggleMediaPlayer(e);
          }}
        >
          <Typography
            variant="subtitle2"
            noWrap
            sx={{
              fontWeight: 'medium',
              color: 'text.primary'
            }}
          >
            {ogData?.title || formattedUrl}
          </Typography>
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: 'text.secondary',
              display: 'block'
            }}
          >
            {getHostname(formattedUrl)}
          </Typography>
        </Box>
        
        <IconButton 
          size="small" 
          color="primary" 
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleMediaPlayer(e);
          }}
          sx={{ ml: 1 }}
        >
          <PlayCircleOutlineIcon />
        </IconButton>
      </Paper>
    );
  }
  
  // Show embedded player in compact mode when playing
  if (compact && mediaInfo && isPlaying) {
    return (
      <Box sx={{ width: '100%' }}>
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            borderRadius: 1
          }}
        >
          {/* Header with close button */}
          <Box
            sx={{
              p: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'medium' }}>
              {ogData?.title || getHostname(formattedUrl)}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(false);
              }}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Box>
          
          {/* Embedded Media Player */}
          <Box
            sx={{
              width: '100%',
              height: mediaInfo.height,
              bgcolor: '#000'
            }}
          >
            <Box
              component="iframe"
              src={mediaInfo.embedUrl}
              title={ogData?.title || "Media content"}
              style={{ border: 'none' }}
              allowFullScreen
              allow="autoplay; encrypted-media; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              sx={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
            />
          </Box>
        </Paper>
      </Box>
    );
  }

  // Compact preview
  if (compact) {
    // Use thumbnail or image from ogData
    const thumbnailUrl = ogData?.thumbnail || ogData?.image;
    const hasImage = thumbnailUrl && !imageError;
    
    return (
      <Paper
        elevation={0}
        component="a"
        href={formattedUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          height: height,
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderRadius: 1,
          p: 1,
          overflow: 'hidden',
          textDecoration: 'none',
          color: 'inherit',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
            textDecoration: 'none'
          }
        }}
      >
        {/* Thumbnail, favicon, or icon */}
        {hasImage ? (
          <Box 
            sx={{ 
              width: 48, 
              height: 48, 
              mr: 1, 
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 1,
              bgcolor: 'grey.200'
            }}
          >
            {(!imageLoaded && !thumbnailUrl.startsWith('data:')) && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100'
                }}
              >
                <ImageIcon sx={{ color: 'grey.400' }} />
              </Box>
            )}
            <Box
              component="img"
              src={thumbnailUrl}
              alt={ogData?.title || "Thumbnail"}
              onLoad={handleImageLoad}
              onError={handleImageError}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              width: 48,
              height: 48,
              mr: 1,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100',
              borderRadius: 1
            }}
          >
            {isFacebookEvent ? (
              <EventIcon color="primary" sx={{ fontSize: 24 }} />
            ) : isFacebook ? (
              <Box
                component="img"
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjMTg3N0YyIiBkPSJNNTA0IDI1NkM1MDQgMTE5IDM5MyA4IDI1NiA4UzggMTE5IDggMjU2YzAgMTIzLjc4IDkwLjY5IDIyNi4zOCAyMDkuMjUgMjQ1VjMyNy42OWgtNjMuVjI1Nmg2My4wOVYyMDhjMC02Mi4xNSAzNy05Ni40OCA5My42Ny05Ni40OCAyNy4xNCAwIDU1LjUyIDQuODQgNTUuNTIgNC44NHY2MS4wNWgtMzEuMjhjLTMwLjggMC00MC40MSAxOS4xMi00MC40MSAzOC43M1YyNTZoNjguNzhsLTExIDcxLjY5aC01Ny43OFY1MDFDNDEzLjMxIDQ4Mi4zOCA1MDQgMzc5Ljc4IDUwNCAyNTZ6Ii8+PC9zdmc+"
                alt="Facebook"
                sx={{ width: 24, height: 24 }}
              />
            ) : ogData?.favicon && !faviconError ? (
              <Box
                component="img"
                src={ogData.favicon}
                alt="Site favicon"
                onLoad={handleFaviconLoad}
                onError={handleFaviconError}
                sx={{
                  width: 24,
                  height: 24,
                  display: faviconLoaded || ogData.favicon.startsWith('data:') ? 'block' : 'none'
                }}
              />
            ) : (
              <LinkIcon color="primary" sx={{ fontSize: 24 }} />
            )}
          </Box>
        )}
        
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography
            variant="subtitle2"
            noWrap
            sx={{
              fontWeight: 'medium',
              color: 'text.primary'
            }}
          >
            {ogData?.title || formattedUrl}
          </Typography>
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: 'text.secondary',
              display: 'block'
            }}
          >
            {getHostname(formattedUrl)}
          </Typography>
        </Box>
        
        <IconButton 
          size="small" 
          color="primary"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          sx={{ ml: 1 }}
        >
          <OpenInNewIcon fontSize="small" />
        </IconButton>
      </Paper>
    );
  }

  // Media content full preview with embedded player
  if (shouldAutoEmbed) {
    return (
      <Paper
        elevation={1}
        sx={{
          height: 'auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          borderRadius: 1,
          transition: 'box-shadow 0.2s',
          '&:hover': {
            boxShadow: 3
          }
        }}
      >
        {/* Media Header */}
        <Box
          sx={{
            p: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0,0,0,0.1)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {ogData.favicon && !faviconError ? (
              <Box
                component="img"
                src={ogData.favicon}
                alt="Site favicon"
                onLoad={handleFaviconLoad}
                onError={handleFaviconError}
                sx={{
                  width: 20,
                  height: 20,
                  mr: 1,
                  display: faviconLoaded ? 'block' : 'none'
                }}
              />
            ) : (
              mediaInfo.service === 'spotify' ? (
                <MusicNoteIcon color="success" sx={{ fontSize: 20, mr: 1 }} />
              ) : (
                <PlayCircleOutlineIcon color="error" sx={{ fontSize: 20, mr: 1 }} />
              )
            )}
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 'medium',
                color: 'text.primary'
              }}
            >
              {ogData.title || getHostname(formattedUrl)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {mediaInfo.service !== 'spotify' && (
              <IconButton size="small" onClick={toggleMediaPlayer}>
                {isPlaying ? <OpenInNewIcon fontSize="small" /> : <PlayCircleOutlineIcon fontSize="small" />}
              </IconButton>
            )}
            
            <MuiLink
              href={formattedUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <IconButton size="small">
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </MuiLink>
          </Box>
        </Box>
        
        {/* Embedded Media Player */}
        <Box
          sx={{
            width: '100%',
            height: mediaInfo.height,
            bgcolor: '#000',
            overflow: 'hidden'
          }}
        >
          <Box
            component="iframe"
            src={mediaInfo.embedUrl}
            title={ogData.title || "Media content"}
            style={{ border: 'none' }}
            allowFullScreen
            allow="autoplay; encrypted-media; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            sx={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
          />
        </Box>
      </Paper>
    );
  }

  // Full preview for Facebook event
  if (isFacebookEvent) {
    return (
      <Paper
        elevation={1}
        sx={{
          height: height,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          borderRadius: 1,
          transition: 'box-shadow 0.2s',
          '&:hover': {
            boxShadow: isEditable ? 3 : 0
          },
          cursor: isEditable ? 'pointer' : 'default'
        }}
      >
        {isEditable ? (
          <MuiLink
            href={formattedUrl}
            target="_blank"
            rel="noopener noreferrer"
            underline="none"
            sx={{ display: 'contents' }}
            onClick={(e) => e.stopPropagation()}
          >
            {renderFacebookEventContent()}
          </MuiLink>
        ) : (
          <Box sx={{ display: 'contents' }}>
            {renderFacebookEventContent()}
          </Box>
        )}
      </Paper>
    );
  }

  // Full preview for normal links or media links that aren't playing
  return (
    <Paper
      elevation={1}
      sx={{
        height: height,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        borderRadius: 1,
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: isEditable ? 3 : 0
        },
        cursor: isEditable ? 'pointer' : 'default'
      }}
    >
      {/* Wrap content in either a link or a div depending on editability */}
      {isEditable && !mediaInfo ? (
        <MuiLink
          href={formattedUrl}
          target="_blank"
          rel="noopener noreferrer"
          underline="none"
          sx={{ display: 'contents' }}
          onClick={(e) => e.stopPropagation()}
        >
          {renderContent()}
        </MuiLink>
      ) : (
        <Box sx={{ display: 'contents' }} onClick={mediaInfo ? toggleMediaPlayer : undefined}>
          {renderContent()}
        </Box>
      )}
    </Paper>
  );

  // Helper function to render Facebook event content
  function renderFacebookEventContent() {
    return (
      <>
        {/* Facebook event image */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 160,
            bgcolor: '#1877F2', // Facebook blue
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {ogData.image ? (
            <Box
              component="img"
              src={ogData.image}
              alt={ogData.title || "Facebook Event"}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <EventIcon sx={{ fontSize: 80, color: 'white' }} />
          )}
          
          {/* Facebook event indicator */}
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              bgcolor: 'rgba(255,255,255,0.9)',
              color: '#1877F2', // Facebook blue
              borderRadius: '4px',
              px: 1,
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
            }}
          >
            <EventIcon fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
              Facebook Event
            </Typography>
          </Box>
        </Box>

        {/* Content section */}
        <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant="subtitle1"
            component="h3"
            gutterBottom
            sx={{
              fontWeight: 'medium',
              lineHeight: 1.2,
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {ogData.title || "Facebook Event"}
          </Typography>

          {ogData.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {ogData.description}
            </Typography>
          )}

          <Box
            sx={{
              mt: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Box
                component="img" 
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjMTg3N0YyIiBkPSJNNTA0IDI1NkM1MDQgMTE5IDM5MyA4IDI1NiA4UzggMTE5IDggMjU2YzAgMTIzLjc4IDkwLjY5IDIyNi4zOCAyMDkuMjUgMjQ1VjMyNy42OWgtNjMuVjI1Nmg2My4wOVYyMDhjMC02Mi4xNSAzNy05Ni40OCA5My42Ny05Ni40OCAyNy4xNCAwIDU1LjUyIDQuODQgNTUuNTIgNC44NHY2MS4wNWgtMzEuMjhjLTMwLjggMC00MC40MSAxOS4xMi00MC40MSAzOC43M1YyNTZoNjguNzhsLTExIDcxLjY5aC01Ny43OFY1MDFDNDEzLjMxIDQ4Mi4zOCA1MDQgMzc5Ljc4IDUwNCAyNTZ6Ii8+PC9zdmc+"
                alt="Facebook"
                sx={{ width: 16, height: 16, mr: 0.5 }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                Facebook Event
              </Typography>
            </Box>
            
            {isEditable && (
              <IconButton 
                size="small" 
                color="primary" 
                component="a"
                href={formattedUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <OpenInNewIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </>
    );
  }

  // Helper function to render normal content
  function renderContent() {
    // Handle image URL - use appropriate fallbacks for different types of links
    let imageUrl = ogData.image || ogData.thumbnail;
    
    // Ensure absolute URL for images
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
      try {
        imageUrl = new URL(imageUrl, formattedUrl).href;
      } catch (e) {
        console.error('Failed to create absolute URL for image:', e);
        imageUrl = null;
      }
    }
    
    return (
      <>
        {/* Image section or Media Preview Thumbnail */}
        {imageUrl ? (
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 200,
              bgcolor: 'grey.100',
              overflow: 'hidden'
            }}
          >
            {!imageError && (
              <>
                {!imageLoaded && !imageUrl.startsWith('data:') && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.100'
                    }}
                  >
                    <CircularProgress size={30} />
                  </Box>
                )}
                <Box
                  component="img"
                  src={imageUrl}
                  alt={ogData.title || "Link preview"}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: (imageLoaded || imageUrl.startsWith('data:')) ? 'block' : 'none'
                  }}
                />
              </>
            )}
            {imageError && (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100'
                }}
              >
                <BrokenImageIcon sx={{ fontSize: 40, color: 'grey.400' }} />
              </Box>
            )}
            
            {/* Play button overlay for media links */}
            {mediaInfo && (imageLoaded || imageUrl.startsWith('data:')) && (
              <Box
                onClick={toggleMediaPlayer}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0,0,0,0.3)',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.5)',
                    cursor: 'pointer'
                  }
                }}
              >
                <PlayCircleOutlineIcon 
                  sx={{ 
                    fontSize: 60, 
                    color: 'white',
                    filter: 'drop-shadow(0px 0px 3px rgba(0,0,0,0.5))'
                  }} 
                />
              </Box>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              width: '100%',
              height: 120,
              bgcolor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <LanguageIcon sx={{ fontSize: 50, color: 'grey.400' }} />
            
            {/* Play button for media links even without image */}
            {mediaInfo && (
              <Box
                onClick={toggleMediaPlayer}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0,0,0,0.1)',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.2)',
                    cursor: 'pointer'
                  }
                }}
              >
                <PlayCircleOutlineIcon 
                  sx={{ 
                    fontSize: 50, 
                    color: mediaInfo.service === 'spotify' ? '#1DB954' : '#FF0000',
                    filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.3))'
                  }} 
                />
              </Box>
            )}
          </Box>
        )}

        {/* Content section */}
        <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant="subtitle1"
            component="h3"
            gutterBottom
            sx={{
              fontWeight: 600,
              lineHeight: 1.3,
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              color: 'text.primary'
            }}
          >
            {ogData.title || getHostname(formattedUrl)}
          </Typography>

          {(ogData.description || !ogData.title) && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.5
              }}
            >
              {ogData.description || `Visit ${getHostname(formattedUrl)} for more information`}
            </Typography>
          )}

          <Box
            sx={{
              mt: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              {isFacebook ? (
                <Box
                  component="img" 
                  src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjMTg3N0YyIiBkPSJNNTA0IDI1NkM1MDQgMTE5IDM5MyA4IDI1NiA4UzggMTE5IDggMjU2YzAgMTIzLjc4IDkwLjY5IDIyNi4zOCAyMDkuMjUgMjQ1VjMyNy42OWgtNjMuVjI1Nmg2My4wOVYyMDhjMC02Mi4xNSAzNy05Ni40OCA5My42Ny05Ni40OCAyNy4xNCAwIDU1LjUyIDQuODQgNTUuNTIgNC44NHY2MS4wNWgtMzEuMjhjLTMwLjggMC00MC40MSAxOS4xMi00MC40MSAzOC43M1YyNTZoNjguNzhsLTExIDcxLjY5aC01Ny43OFY1MDFDNDEzLjMxIDQ4Mi4zOCA1MDQgMzc5Ljc4IDUwNCAyNTZ6Ii8+PC9zdmc+"
                  alt="Facebook"
                  sx={{ width: 16, height: 16, mr: 0.5 }}
                />
              ) : ogData.favicon && !faviconError ? (
                <Box
                  component="img"
                  src={ogData.favicon}
                  alt="Site favicon"
                  onLoad={handleFaviconLoad}
                  onError={handleFaviconError}
                  sx={{
                    width: 16,
                    height: 16,
                    mr: 0.5,
                    display: faviconLoaded || ogData.favicon.startsWith('data:') ? 'block' : 'none'
                  }}
                />
              ) : (
                <LinkIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
              )}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {getHostname(formattedUrl)}
              </Typography>
            </Box>
            
            {/* Play button for media links */}
            {mediaInfo && (
              <IconButton 
                size="small" 
                color={mediaInfo.service === 'spotify' ? 'success' : 'error'} 
                onClick={toggleMediaPlayer}
              >
                <PlayCircleOutlineIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </>
    );
  }
};

export default LinkPreview;