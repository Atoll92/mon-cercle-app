// src/components/LinkPreview.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Skeleton,
  Link as MuiLink
} from '@mui/material';
import {
  Link as LinkIcon,
  Language as LanguageIcon,
  BrokenImage as BrokenImageIcon
} from '@mui/icons-material';
import { getOpenGraphData } from '../services/opengraphService';

const LinkPreview = ({ url, compact = false, onDataLoaded = null, height = 'auto', isEditable = true }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ogData, setOgData] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Fetch OpenGraph data when URL changes
  useEffect(() => {
    const fetchData = async () => {
      if (!url) return;
      
      try {
        setLoading(true);
        setError(null);
        setImageLoaded(false);
        setImageError(false);
        
        const data = await getOpenGraphData(url);
        setOgData(data);
        
        // Notify parent component if data was loaded
        if (onDataLoaded) onDataLoaded(data);
      } catch (err) {
        console.error('Error loading link preview:', err);
        setError('Failed to load preview');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [url, onDataLoaded]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Extract hostname from URL
  const getHostname = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch (e) {
      return url;
    }
  };

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
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => isEditable && e.stopPropagation()}
          sx={{
            textDecoration: 'none',
            color: 'primary.main',
            textAlign: 'center',
            fontWeight: 'medium',
            pointerEvents: isEditable ? 'auto' : 'none'
          }}
        >
          {url}
        </MuiLink>
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
        <LinkIcon color="primary" sx={{ fontSize: 20, mr: 1, flexShrink: 0 }} />
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography
            variant="subtitle2"
            noWrap
            sx={{
              fontWeight: 'medium',
              color: 'text.primary'
            }}
          >
            {ogData.title || url}
          </Typography>
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: 'text.secondary',
              display: 'block'
            }}
          >
            {getHostname(url)}
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Full preview
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
          boxShadow: 3
        }
      }}
    >
      <MuiLink
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        underline="none"
        sx={{
          display: 'contents',
          pointerEvents: isEditable ? 'auto' : 'none'
        }}
        onClick={(e) => isEditable && e.stopPropagation()}
      >
        {/* Image section */}
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
          </Box>
        ) : (
          <Box
            sx={{
              width: '100%',
              height: 100,
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {imageError ? (
              <BrokenImageIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            ) : (
              <LanguageIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
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
            {ogData.title || url}
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
              alignItems: 'center'
            }}
          >
            <LinkIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {getHostname(url)}
            </Typography>
          </Box>
        </Box>
      </MuiLink>
    </Paper>
  );
};

export default LinkPreview;