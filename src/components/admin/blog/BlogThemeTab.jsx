import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Palette as PaletteIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabaseclient';
import MediaUpload from '../../MediaUpload';
import LazyImage from '../../LazyImage';
import { useTranslation } from '../../../hooks/useTranslation';

// Predefined color palette
const colorPalette = [
  '#1976d2', // Blue
  '#388e3c', // Green
  '#f57c00', // Orange
  '#d32f2f', // Red
  '#7b1fa2', // Purple
  '#0097a7', // Cyan
  '#5d4037', // Brown
  '#455a64', // Blue Grey
  '#e91e63', // Pink
  '#00bcd4', // Light Cyan
  '#ff5722', // Deep Orange
  '#673ab7', // Deep Purple
];

const BlogThemeTab = ({ network, onNetworkUpdate }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const themeColor = network?.theme_color || theme.palette.primary.main;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    theme_color: network?.theme_color || '#1976d2',
    logo_url: network?.logo_url || '',
    background_image_url: network?.background_image_url || ''
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const { error: updateError } = await supabase
        .from('networks')
        .update({
          theme_color: formData.theme_color,
          logo_url: formData.logo_url,
          background_image_url: formData.background_image_url
        })
        .eq('id', network.id);

      if (updateError) throw updateError;

      setSuccess(true);
      if (onNetworkUpdate) {
        onNetworkUpdate();
      }
    } catch (err) {
      console.error('Error saving theme:', err);
      setError('Failed to save theme settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (uploadedItems) => {
    if (uploadedItems.length > 0) {
      setFormData(prev => ({ ...prev, logo_url: uploadedItems[0].url }));
    }
  };

  const handleBackgroundUpload = (uploadedItems) => {
    if (uploadedItems.length > 0) {
      setFormData(prev => ({ ...prev, background_image_url: uploadedItems[0].url }));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          {t('admin.blog.theme.title', 'Theme Settings')}
        </Typography>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{
            bgcolor: themeColor,
            '&:hover': { bgcolor: alpha(themeColor, 0.9) }
          }}
        >
          {t('admin.blog.theme.save', 'Save Changes')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(false)}>
          {t('admin.blog.theme.saved', 'Theme settings saved successfully')}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Theme Color */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PaletteIcon color="primary" />
                <Typography variant="h6">
                  {t('admin.blog.theme.color', 'Brand Color')}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('admin.blog.theme.colorDescription', 'Choose a primary color for your blog. This will be used for buttons, links, and accents.')}
              </Typography>

              {/* Color Palette */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {colorPalette.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setFormData(prev => ({ ...prev, theme_color: color }))}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      bgcolor: color,
                      cursor: 'pointer',
                      border: formData.theme_color === color ? '3px solid' : '1px solid',
                      borderColor: formData.theme_color === color ? 'text.primary' : 'divider',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.1)' }
                    }}
                  />
                ))}
              </Box>

              {/* Custom Color Input */}
              <TextField
                label={t('admin.blog.theme.customColor', 'Custom Color')}
                value={formData.theme_color}
                onChange={(e) => setFormData(prev => ({ ...prev, theme_color: e.target.value }))}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 0.5,
                        bgcolor: formData.theme_color,
                        mr: 1
                      }}
                    />
                  )
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Logo */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ImageIcon color="primary" />
                <Typography variant="h6">
                  {t('admin.blog.theme.logo', 'Blog Logo')}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('admin.blog.theme.logoDescription', 'Upload a logo for your blog. Recommended size: 200x200px.')}
              </Typography>

              {/* Current Logo Preview */}
              {formData.logo_url && (
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <LazyImage
                      src={formData.logo_url}
                      alt="Logo"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                </Box>
              )}

              <MediaUpload
                onUpload={handleLogoUpload}
                maxFiles={1}
                accept="image/*"
                networkId={network.id}
              />

              {formData.logo_url && (
                <Button
                  size="small"
                  color="error"
                  onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                  sx={{ mt: 1 }}
                >
                  {t('admin.blog.theme.removeLogo', 'Remove Logo')}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Background Image */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ImageIcon color="primary" />
                <Typography variant="h6">
                  {t('admin.blog.theme.background', 'Header Background')}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('admin.blog.theme.backgroundDescription', 'Upload a background image for your blog header. Recommended size: 1920x400px.')}
              </Typography>

              {/* Current Background Preview */}
              {formData.background_image_url && (
                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: '100%',
                      height: 150,
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <LazyImage
                      src={formData.background_image_url}
                      alt="Background"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                </Box>
              )}

              <MediaUpload
                onUpload={handleBackgroundUpload}
                maxFiles={1}
                accept="image/*"
                networkId={network.id}
              />

              {formData.background_image_url && (
                <Button
                  size="small"
                  color="error"
                  onClick={() => setFormData(prev => ({ ...prev, background_image_url: '' }))}
                  sx={{ mt: 1 }}
                >
                  {t('admin.blog.theme.removeBackground', 'Remove Background')}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BlogThemeTab;
