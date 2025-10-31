import React, { useState } from 'react';
import { Grid } from '@giphy/react-components';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Box, TextField, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from '../hooks/useTranslation';

// Initialize GiphyFetch with API key from environment variable
// Get your API key at https://developers.giphy.com/
const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY || 'your_giphy_api_key_here');

const GifPicker = ({ onGifSelect, onClose, darkMode = true }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch function for trending or search results
  const fetchGifs = (offset) => {
    if (searchTerm) {
      return gf.search(searchTerm, { offset, limit: 10 });
    }
    return gf.trending({ offset, limit: 10 });
  };

  // Handle GIF selection
  const handleGifClick = (gif, e) => {
    e.preventDefault();
    // Return the GIF URL and metadata
    onGifSelect({
      url: gif.images.original.url,
      width: gif.images.original.width,
      height: gif.images.original.height,
      title: gif.title,
      id: gif.id
    });
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: darkMode ? 'rgba(30, 30, 40, 0.98)' : 'white',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid',
          borderBottomColor: darkMode ? 'rgba(255,255,255,0.1)' : 'divider'
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {t('chat.selectGif', 'Select a GIF')}
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: darkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary',
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
            }
          }}
        >
          <CloseIcon sx={{ fontSize: '1.2rem' }} />
        </IconButton>
      </Box>

      {/* Search Bar */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('chat.searchGifs', 'Search GIFs...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              color: darkMode ? 'white' : 'text.primary',
              '& fieldset': {
                borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
              },
              '&:hover fieldset': {
                borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main'
              }
            },
            '& .MuiInputBase-input::placeholder': {
              color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
              opacity: 1
            }
          }}
        />
      </Box>

      {/* GIF Grid */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          pb: 2,
          '&::-webkit-scrollbar': {
            width: '8px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
            '&:hover': {
              background: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
            }
          }
        }}
      >
        <Grid
          key={searchTerm} // Force re-render when search changes
          width={300}
          columns={2}
          gutter={6}
          fetchGifs={fetchGifs}
          onGifClick={handleGifClick}
          noLink={true}
          hideAttribution={false}
        />
      </Box>

      {/* Powered by Giphy */}
      <Box
        sx={{
          p: 1,
          textAlign: 'center',
          borderTop: '1px solid',
          borderTopColor: darkMode ? 'rgba(255,255,255,0.1)' : 'divider'
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: darkMode ? 'rgba(255,255,255,0.5)' : 'text.secondary',
            fontSize: '0.7rem'
          }}
        >
          Powered by GIPHY
        </Typography>
      </Box>
    </Box>
  );
};

export default GifPicker;
