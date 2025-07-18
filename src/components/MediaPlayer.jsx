import React, { useState, useRef, useEffect } from 'react';
import Spinner from './Spinner';
import {
  Box,
  IconButton,
  Typography,
  Slider,
  Paper,
  alpha
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  AudioFile as AudioIcon
} from '@mui/icons-material';
import { formatDuration } from '../utils/mediaUpload';
import PDFPreviewEnhanced from './PDFPreviewEnhanced';

function MediaPlayer({ 
  src, 
  type = 'audio', // 'audio', 'video', or 'pdf'
  title,
  thumbnail,
  autoplay = false,
  muted = false,
  hideControlsUntilInteraction = false,
  compact = false,
  darkMode = false,
  // PDF specific props
  fileName,
  fileSize,
  numPages,
  author
}) {
  const mediaRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(!hideControlsUntilInteraction);
  const [hasInteracted, setHasInteracted] = useState(false);


  useEffect(() => {
    // Skip media setup for PDFs
    if (type === 'pdf') return;
    
    const media = mediaRef.current;
    if (!media) return;

    // Set muted state if specified
    if (muted) {
      media.muted = true;
      setIsMuted(true);
    }

    const handleLoadedMetadata = () => {
      setDuration(media.duration);
      setIsLoading(false);
      if (autoplay) {
        media.play().catch(() => {
          // Autoplay prevented by browser
        });
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleError = () => {
      setError('Failed to load media');
      setIsLoading(false);
    };

    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('play', handlePlay);
    media.addEventListener('pause', handlePause);
    media.addEventListener('ended', handleEnded);
    media.addEventListener('error', handleError);

    return () => {
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('pause', handlePause);
      media.removeEventListener('ended', handleEnded);
      media.removeEventListener('error', handleError);
    };
  }, [autoplay, muted]);

  const togglePlayPause = () => {
    const media = mediaRef.current;
    if (!hasInteracted && hideControlsUntilInteraction) {
      setHasInteracted(true);
      setShowControls(true);
    }
    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
  };

  const handleVideoClick = () => {
    if (!hasInteracted && hideControlsUntilInteraction) {
      setHasInteracted(true);
      setShowControls(true);
    }
  };

  const handleSeek = (_, newValue) => {
    const media = mediaRef.current;
    media.currentTime = newValue;
    setCurrentTime(newValue);
  };

  const handleVolumeChange = (_, newValue) => {
    const media = mediaRef.current;
    media.volume = newValue;
    setVolume(newValue);
    if (newValue > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (isMuted) {
      media.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      media.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // PDF handling
  if (type === 'pdf') {
    return (
      <PDFPreviewEnhanced
        url={src}
        fileName={fileName || title}
        title={title}
        height={compact ? 200 : 400}
        showFileName={!compact}
        thumbnail={thumbnail}
      />
    );
  }

  // Compact audio player (for chat messages)
  if (type === 'audio' && compact) {
    return (
      <Paper
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1,
          bgcolor: darkMode ? alpha('#fff', 0.05) : alpha('#000', 0.03),
          maxWidth: 300,
          borderRadius: 2
        }}
      >
        <IconButton size="small" onClick={togglePlayPause} disabled={isLoading}>
          {isLoading ? (
            <Spinner size={40} />
          ) : isPlaying ? (
            <PauseIcon />
          ) : (
            <PlayIcon />
          )}
        </IconButton>

        <Box sx={{ flex: 1, mx: 1 }}>
          <Slider
            size="small"
            value={currentTime}
            max={duration}
            onChange={handleSeek}
            sx={{ 
              py: 0.5,
              '& .MuiSlider-thumb': { width: 12, height: 12 }
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              {formatDuration(currentTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDuration(duration)}
            </Typography>
          </Box>
        </Box>

        <audio ref={mediaRef} src={src} preload="metadata" />
      </Paper>
    );
  }

  // Full audio player
  if (type === 'audio') {
    return (
      <Paper
        sx={{
          p: 2,
          bgcolor: darkMode ? alpha('#fff', 0.05) : alpha('#000', 0.03),
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {thumbnail ? (
            <Box
              sx={{
                width: 80,
                height: 80,
                mr: 2,
                borderRadius: 1,
                overflow: 'hidden',
                flexShrink: 0,
                bgcolor: darkMode ? 'grey.800' : 'grey.200'
              }}
            >
              <img
                src={thumbnail}
                alt={title || 'Audio artwork'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                width: 80,
                height: 80,
                mr: 2,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: darkMode ? 'grey.800' : 'grey.200',
                flexShrink: 0
              }}
            >
              <AudioIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            </Box>
          )}
          <Box sx={{ flex: 1 }}>
            {title && (
              <Typography variant="subtitle1" gutterBottom>
                {title}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={togglePlayPause} disabled={isLoading}>
                {isLoading ? (
                  <Spinner size={48} />
                ) : isPlaying ? (
                  <PauseIcon />
                ) : (
                  <PlayIcon />
                )}
              </IconButton>
              <Typography variant="body2" sx={{ mx: 2 }}>
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Slider
          value={currentTime}
          max={duration}
          onChange={handleSeek}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={toggleMute}>
            {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </IconButton>
          <Slider
            size="small"
            value={isMuted ? 0 : volume}
            max={1}
            step={0.1}
            onChange={handleVolumeChange}
            sx={{ width: 100 }}
          />
        </Box>

        <audio ref={mediaRef} src={src} preload="metadata" />
      </Paper>
    );
  }

  // Video player
  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        bgcolor: '#000',
        borderRadius: 2,
        overflow: 'hidden',
        width: '100%',
        maxWidth: compact ? 400 : '100%'
      }}
    >
      <video
        ref={mediaRef}
        src={src}
        style={{
          width: '100%',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'block',
          cursor: hideControlsUntilInteraction && !hasInteracted ? 'pointer' : 'default'
        }}
        poster={thumbnail}
        preload="metadata"
        muted={muted}
        onClick={handleVideoClick}
      />

      {/* Video controls overlay */}
      {showControls && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
            p: 2,
            color: 'white'
          }}
        >
        <Slider
          value={currentTime}
          max={duration}
          onChange={handleSeek}
          sx={{
            color: 'primary.main',
            mb: 1,
            '& .MuiSlider-thumb': {
              transition: 'opacity 0.2s',
              opacity: 0,
              '&:hover, &.Mui-focusVisible, &.Mui-active': {
                opacity: 1
              }
            },
            '&:hover .MuiSlider-thumb': {
              opacity: 1
            }
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              onClick={togglePlayPause} 
              disabled={isLoading}
              sx={{ color: 'white' }}
            >
              {isLoading ? (
                <Spinner size={48} color="inherit" />
              ) : isPlaying ? (
                <PauseIcon />
              ) : (
                <PlayIcon />
              )}
            </IconButton>

            <Typography variant="body2">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </Typography>

            <IconButton 
              size="small" 
              onClick={toggleMute}
              sx={{ color: 'white' }}
            >
              {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>

            <Slider
              size="small"
              value={isMuted ? 0 : volume}
              max={1}
              step={0.1}
              onChange={handleVolumeChange}
              sx={{ 
                width: 80,
                color: 'white',
                '& .MuiSlider-thumb': { width: 12, height: 12 }
              }}
            />
          </Box>

          <IconButton 
            onClick={toggleFullscreen}
            sx={{ color: 'white' }}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Box>
      </Box>
      )}

      {/* Center play button overlay when paused - only show after interaction */}
      {!isPlaying && !isLoading && hasInteracted && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            cursor: 'pointer'
          }}
          onClick={togglePlayPause}
        >
          <IconButton
            sx={{
              bgcolor: 'rgba(0,0,0,0.6)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.8)'
              }
            }}
          >
            <PlayIcon sx={{ fontSize: 48 }} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

export default MediaPlayer;