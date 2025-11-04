import React from 'react';
import { Box, alpha } from '@mui/material';
import MoodboardItemSimple from './MoodboardItemSimple';

/**
 * InfiniteMoodboardCarousel - Reusable infinite sliding carousel for moodboard items
 *
 * @param {Array} items - Array of moodboard items to display
 * @param {string} backgroundColor - Background color for the carousel (supports alpha)
 * @param {boolean} darkMode - Whether dark mode is enabled
 */
const InfiniteMoodboardCarousel = ({ items, backgroundColor, darkMode = false }) => {
  if (!items || items.length === 0) {
    return null;
  }

  const defaultBgColor = darkMode ? alpha('#333333', 0.5) : alpha('#f5f5f5', 0.8);
  const bgColor = backgroundColor || defaultBgColor;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        bgcolor: bgColor,
        '@keyframes infiniteSlide': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      }}
    >
      {/* Infinite sliding container */}
      <Box
        sx={{
          display: 'flex',
          width: 'max-content',
          height: '100%',
          animation: `infiniteSlide ${items.length * 8}s linear infinite`,
          '&:hover': {
            animationPlayState: 'paused'
          }
        }}
      >
        {/* First set of items */}
        {items.map((item) => (
          <Box
            key={`first-${item.id}`}
            sx={{
              height: '100%',
              flexShrink: 0,
              display: 'flex'
            }}
          >
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'stretch',
                '& .MuiPaper-root': {
                  borderRadius: '0 !important',
                  boxShadow: 'none !important',
                  margin: '0 !important',
                  height: '100% !important',
                  display: 'flex !important',
                  alignItems: 'stretch !important',
                  '&:hover': {
                    transform: 'none !important',
                    boxShadow: 'none !important'
                  }
                },
                '& img, & video': {
                  height: '100% !important',
                  width: 'auto !important',
                  objectFit: 'contain !important',
                  maxWidth: 'none !important'
                }
              }}
            >
              <MoodboardItemSimple
                item={item}
                mediaOnly={true}
                style={{
                  height: '100%',
                  borderRadius: 0,
                  boxShadow: 'none',
                  border: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'stretch',
                  '&:hover': {
                    transform: 'none',
                    boxShadow: 'none'
                  }
                }}
              />
            </Box>
          </Box>
        ))}
        {/* Identical duplicate set for seamless infinite loop */}
        {items.map((item) => (
          <Box
            key={`second-${item.id}`}
            sx={{
              height: '100%',
              flexShrink: 0,
              display: 'flex'
            }}
          >
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'stretch',
                '& .MuiPaper-root': {
                  borderRadius: '0 !important',
                  boxShadow: 'none !important',
                  margin: '0 !important',
                  height: '100% !important',
                  display: 'flex !important',
                  alignItems: 'stretch !important',
                  '&:hover': {
                    transform: 'none !important',
                    boxShadow: 'none !important'
                  }
                },
                '& img, & video': {
                  height: '100% !important',
                  width: 'auto !important',
                  objectFit: 'contain !important',
                  maxWidth: 'none !important'
                }
              }}
            >
              <MoodboardItemSimple
                item={item}
                mediaOnly={true}
                style={{
                  height: '100%',
                  borderRadius: 0,
                  boxShadow: 'none',
                  border: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'stretch',
                  '&:hover': {
                    transform: 'none',
                    boxShadow: 'none'
                  }
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default InfiniteMoodboardCarousel;
