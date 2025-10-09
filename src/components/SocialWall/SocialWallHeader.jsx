import React from 'react';
import {
  Box,
  Card,
  Avatar,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  useTheme,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
} from '@mui/icons-material';

/**
 * SocialWallHeader - Header with post creation trigger and filters
 */
const SocialWallHeader = React.memo(({
  darkMode,
  activeProfile,
  user,
  categories,
  selectedCategory,
  showScrollTop,
  onCreatePostClick,
  onCategoryChange,
  onScrollTop,
  t,
}) => {
  const muiTheme = useTheme();

  return (
    <>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
        width: '100%',
        mb: 3
      }}>
        {/* Post Creation Trigger */}
        <Card
          onClick={onCreatePostClick}
          sx={{
            width: '100%',
            p: 2,
            cursor: 'pointer',
            bgcolor: darkMode ? alpha('#ffffff', 0.03) : alpha('#000000', 0.02),
            border: `1px solid ${darkMode ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08)}`,
            borderRadius: 2,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: darkMode ? alpha('#ffffff', 0.05) : alpha('#000000', 0.04),
              borderColor: muiTheme.palette.primary.main,
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={activeProfile?.profile_picture_url || user?.profile_picture_url}
              sx={{
                width: 40,
                height: 40,
                bgcolor: muiTheme.palette.primary.main
              }}
            >
              {(activeProfile?.full_name || user?.full_name || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <TextField
              fullWidth
              placeholder={t('socialWall.whatsOnYourMind')}
              variant="outlined"
              disabled
              sx={{
                pointerEvents: 'none',
                '& .MuiOutlinedInput-root': {
                  bgcolor: darkMode ? alpha('#ffffff', 0.05) : 'background.paper',
                  '& fieldset': {
                    borderColor: 'transparent'
                  }
                }
              }}
            />
            <IconButton
              sx={{
                bgcolor: muiTheme.palette.primary.main,
                color: 'white',
                '&:hover': {
                  bgcolor: muiTheme.palette.primary.dark,
                },
                width: 40,
                height: 40,
                pointerEvents: 'none'
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Card>

        {/* Category Filter */}
        {categories.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel shrink>{t('socialWall.filterByCategory')}</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              label={t('socialWall.filterByCategory')}
              displayEmpty
            >
              <MenuItem value="">
                <em>{t('socialWall.allCategories')}</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: 0.5,
                        bgcolor: category.color,
                        flexShrink: 0
                      }}
                    />
                    {category.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Fade in={showScrollTop}>
          <IconButton
            onClick={onScrollTop}
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 100,
              bgcolor: muiTheme.palette.primary.main,
              color: '#ffffff',
              '&:hover': {
                bgcolor: muiTheme.palette.primary.dark,
              },
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <ArrowUpwardIcon />
          </IconButton>
        </Fade>
      )}
    </>
  );
});

SocialWallHeader.displayName = 'SocialWallHeader';

export default SocialWallHeader;
