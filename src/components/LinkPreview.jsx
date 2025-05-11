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
  PlayCircleOutline as PlayCircleOutlineIcon
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
        setOgData(data);
        
        // Handle special case for YouTube videos - try to create media info from ogData if not already set
        if (hasYouTubeData(data) && !mediaInfo) {
          setMediaInfo({
            service: 'youtube',
            embedUrl: `https://www.youtube.com/embed/${data.videoId}`,
            height: 315
          });
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

  // Function to handle link clicks
  const handleLinkClick = (e) => {
    // If in edit mode, prevent the default action and stop propagation
    if (!isEditable) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Function to toggle media player
  const toggleMediaPlayer = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  // Determine if we should auto-embed media (Spotify is auto-embedded, YouTube requires a click)
  const shouldAutoEmbed = mediaInfo && (mediaInfo.service === 'spotify' || isPlaying);

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
            height={120}
            animation="wave"
          />
        )}
        <Box sx={{ p: compact ? 1 : 2, width: '100%' }}>
          <Skeleton animation="wave" height={24} width="80%" sx={{ mb: 1 }} />
          {!compact && <Skeleton animation="wave" height={18} width="90%" />}
          <Skeleton animation="wave" height={18} width="40%" />
        </Box>
      </Paper>
    );
  }

  // Error state
  if (error || !ogData) {
    return (
      <Paper
        elevation={compact ? 0 : 1}
        sx={{
          height: height,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 1
        }}
      >
        <LinkIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
        <MuiLink
          href={isEditable ? formattedUrl : "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleLinkClick}
          sx={{
            textDecoration: 'none',
            color: 'primary.main',
            textAlign: 'center',
            fontWeight: 'medium',
            pointerEvents: isEditable ? 'auto' : 'none',
            cursor: isEditable ? 'pointer' : 'default'
          }}
        >
          {formattedUrl}
        </MuiLink>
      </Paper>
    );
  }

  // Compact preview for media links with play option
  if (compact && mediaInfo) {
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
        {mediaInfo.service === 'spotify' ? (
          <MusicNoteIcon color="success" sx={{ fontSize: 20, mr: 1, flexShrink: 0 }} />
        ) : (
          <PlayCircleOutlineIcon color="error" sx={{ fontSize: 20, mr: 1, flexShrink: 0 }} />
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
            {ogData.title || formattedUrl}
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
          onClick={toggleMediaPlayer}
          sx={{ ml: 1 }}
        >
          {isPlaying ? <OpenInNewIcon /> : <PlayCircleOutlineIcon />}
        </IconButton>
      </Paper>
    );
  }

  // Compact preview
  if (compact) {
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
              flexShrink: 0,
              display: faviconLoaded ? 'block' : 'none'
            }}
          />
        ) : (
          <LinkIcon color="primary" sx={{ fontSize: 20, mr: 1, flexShrink: 0 }} />
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
            {ogData.title || formattedUrl}
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
            frameBorder="0"
            allowFullScreen
            allow="encrypted-media; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
        // This helps with showing it's not interactive in edit mode
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

  // Helper function to render the content
  function renderContent() {
    return (
      <>
        {/* Image section or Media Preview Thumbnail */}
        {ogData.image && !imageError ? (
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 160,
              bgcolor: 'action.hover'
            }}
          >
            {!imageLoaded && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CircularProgress size={24} />
              </Box>
            )}
            <Box
              component="img"
              src={ogData.image}
              alt={ogData.title || "Link preview"}
              onLoad={handleImageLoad}
              onError={handleImageError}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: imageLoaded ? 'block' : 'none'
              }}
            />
            
            {/* Play button overlay for media links */}
            {mediaInfo && imageLoaded && (
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
              height: 100,
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            {imageError ? (
              <BrokenImageIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            ) : (
              <LanguageIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            )}
            
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
            {ogData.title || formattedUrl}
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
              {ogData.favicon && !faviconError ? (
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
                    display: faviconLoaded ? 'block' : 'none'
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