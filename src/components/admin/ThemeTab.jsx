import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation.jsx';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  TextField,
  Grid,
  IconButton,
  Alert,
  LinearProgress,
  Modal,
  Backdrop,
  Fade
} from '@mui/material';
import {
  Save as SaveIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Palette as PaletteIcon,
  RestartAlt as RestartAltIcon
} from '@mui/icons-material';
import CustomColorPicker from '../CustomColorPicker';
import { updateNetworkDetails, uploadNetworkImage, removeNetworkImage } from '../../api/networks';
import { useTheme } from '../ThemeProvider';
import { generateComplementaryColor } from '../../utils/colorUtils';

const ThemeTab = ({ network, onNetworkUpdate, darkMode = false }) => {
  const { refreshNetworkTheme } = useTheme();
  const [themeSettings, setThemeSettings] = useState({
    backgroundColor: network.theme_bg_color || '#ffffff'
  });
  const [backgroundImageFile, setBackgroundImageFile] = useState(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState(
    network.background_image_url || null
  );
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(
    network.logo_url || null
  );
  const [updating, setUpdating] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  // Color presets for theme selection
  const colorPresets = [
    { name: 'Light', value: '#ffffff' },
    { name: 'Ash', value: '#6b7280' },
    { name: 'Dark', value: '#374151' },
    { name: 'Onyx', value: '#000000' }
  ];

  // Helper function to determine if a color is dark
  const isColorDark = (hexColor) => {
    if (!hexColor || typeof hexColor !== 'string') return false;
    // Remove the # if it exists
    hexColor = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate brightness (standard formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return true if dark
    return brightness < 128;
  };

  const handleSaveTheme = async () => {
    setUpdating(true);
    setError(null);
    setMessage('');

    const result = await updateNetworkDetails(network.id, { 
      theme_bg_color: themeSettings.backgroundColor 
    });

    if (result.success) {
      onNetworkUpdate({
        ...network,
        theme_bg_color: themeSettings.backgroundColor
      });
      // Refresh the global theme to apply changes instantly
      await refreshNetworkTheme();
      setMessage('Theme settings updated successfully!');
    } else {
      setError(result.message || 'Failed to update theme settings');
    }

    setUpdating(false);
  };

  const handleBackgroundImageChange = (event) => {
    if (!event.target.files || event.target.files.length === 0) {
      setBackgroundImageFile(null);
      return;
    }
    
    const file = event.target.files[0];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, GIF).');
      return;
    }
    
    // Check file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      setError('Background image file must be less than 20MB.');
      return;
    }
    
    setBackgroundImageFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setBackgroundImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBackgroundImage = async () => {
    if (!backgroundImageFile) {
      setError('Please select a background image first.');
      return;
    }
    
    setUploadingBackground(true);
    setError(null);
    setMessage('');
    
    const result = await uploadNetworkImage(
      network.id, 
      backgroundImageFile, 
      'background'
    );
    
    if (result.success) {
      onNetworkUpdate({
        ...network,
        background_image_url: result.publicUrl
      });
      setMessage('Network background image updated successfully!');
      setBackgroundImageFile(null);
    } else {
      setError(result.message);
    }
    
    setUploadingBackground(false);
  };

  const handleRemoveBackgroundImage = async () => {
    if (!network.background_image_url) return;
    
    setUploadingBackground(true);
    setError(null);
    setMessage('');
    
    const result = await removeNetworkImage(network.id, 'background');
    
    if (result.success) {
      onNetworkUpdate({
        ...network,
        background_image_url: null
      });
      setBackgroundImagePreview(null);
      setMessage('Network background image removed successfully!');
    } else {
      setError(result.message);
    }
    
    setUploadingBackground(false);
  };

  const handleLogoChange = (event) => {
    if (!event.target.files || event.target.files.length === 0) {
      setLogoFile(null);
      return;
    }
    
    const file = event.target.files[0];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, GIF).');
      return;
    }
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo file must be less than 5MB.');
      return;
    }
    
    setLogoFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = async () => {
    if (!logoFile) {
      setError('Please select a logo image first.');
      return;
    }
    
    setUploadingLogo(true);
    setError(null);
    setMessage('');
    
    const result = await uploadNetworkImage(network.id, logoFile, 'logo');
    
    if (result.success) {
      onNetworkUpdate({
        ...network,
        logo_url: result.publicUrl
      });
      // Refresh the global theme to apply logo changes instantly
      await refreshNetworkTheme();
      setMessage('Network logo updated successfully!');
      setLogoFile(null);
    } else {
      setError(result.message);
    }
    
    setUploadingLogo(false);
  };

  const handleRemoveLogo = async () => {
    if (!network.logo_url) return;
    
    setUploadingLogo(true);
    setError(null);
    setMessage('');
    
    const result = await removeNetworkImage(network.id, 'logo');
    
    if (result.success) {
      onNetworkUpdate({
        ...network,
        logo_url: null
      });
      // Refresh the global theme to apply logo removal instantly
      await refreshNetworkTheme();
      setLogoPreview(null);
      setMessage('Network logo removed successfully!');
    } else {
      setError(result.message);
    }
    
    setUploadingLogo(false);
  };

  const handleResetToDefaults = () => {
    // Reset to white background (default before secondary colors implementation)
    setThemeSettings({
      backgroundColor: '#ffffff'
    });
    setMessage('Theme reset to default settings');
  };

  return (
    <>
      {message && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <PaletteIcon sx={{ color: '#1976d2', fontSize: 28 }} />
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                  Background Color
                </Typography>
              </Box>
              
              {/* Appearance Preview */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                  Appearance
                </Typography>
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: 120, 
                    backgroundColor: themeSettings.backgroundColor,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}
                >
                  {/* Sample content overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      right: 16,
                      color: isColorDark(themeSettings.backgroundColor) ? '#ffffff' : '#000000',
                      opacity: 0.8
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      Preview of your network theme
                    </Typography>
                  </Box>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: isColorDark(themeSettings.backgroundColor) ? '#ffffff' : '#000000',
                      fontWeight: 600,
                      textAlign: 'center'
                    }}
                  >
                    {themeSettings.backgroundColor.toUpperCase()}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: isColorDark(themeSettings.backgroundColor) ? '#ffffff' : '#000000',
                      opacity: 0.7,
                      mt: 0.5
                    }}
                  >
                    Your network background
                  </Typography>
                </Box>
              </Box>

              {/* Generated Secondary Color */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                  Generated Secondary Color
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      backgroundColor: (themeSettings.backgroundColor === '#ffffff') 
                        ? '#9c27b0' // Original purple secondary
                        : generateComplementaryColor(themeSettings.backgroundColor),
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}
                  />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {(themeSettings.backgroundColor === '#ffffff' 
                        ? '#9c27b0' 
                        : generateComplementaryColor(themeSettings.backgroundColor)).toUpperCase()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {themeSettings.backgroundColor === '#ffffff' 
                        ? 'Original default purple color'
                        : 'Automatically generated from your background color'}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                  This color will be used for secondary UI elements throughout your network.
                </Typography>
                
                {/* Color Harmony Preview */}
                <Box sx={{ mt: 3, p: 2, backgroundColor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontWeight: 600 }}>
                    Preview of color combination:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button size="small" variant="contained" sx={{ backgroundColor: themeSettings.backgroundColor, '&:hover': { backgroundColor: themeSettings.backgroundColor, opacity: 0.9 } }}>
                      Primary
                    </Button>
                    <Button size="small" variant="contained" color="secondary" sx={{ backgroundColor: (themeSettings.backgroundColor === '#ffffff' ? '#9c27b0' : generateComplementaryColor(themeSettings.backgroundColor)), '&:hover': { backgroundColor: (themeSettings.backgroundColor === '#ffffff' ? '#9c27b0' : generateComplementaryColor(themeSettings.backgroundColor)), opacity: 0.9 } }}>
                      Secondary
                    </Button>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                      How your buttons will look
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Default Theme Colors */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                  Default Theme Colors
                </Typography>
                <Grid container spacing={2}>
                  {colorPresets.map((color) => (
                    <Grid item xs={6} sm={3} key={color.value}>
                      <Box
                        onClick={() => setThemeSettings({...themeSettings, backgroundColor: color.value})}
                        sx={{
                          aspectRatio: '1',
                          backgroundColor: color.value,
                          borderRadius: 2,
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          position: 'relative',
                          transition: 'all 0.2s ease-in-out',
                          border: themeSettings.backgroundColor === color.value 
                            ? '3px solid #1976d2' 
                            : '2px solid transparent',
                          boxShadow: themeSettings.backgroundColor === color.value 
                            ? '0 0 0 4px rgba(25, 118, 210, 0.2)' 
                            : '0 2px 8px rgba(0,0,0,0.1)',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                          }
                        }}
                      >
                        {themeSettings.backgroundColor === color.value && (
                          <CheckIcon sx={{ 
                            color: isColorDark(color.value) ? '#ffffff' : '#000000',
                            fontSize: 20,
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                          }} />
                        )}
                      </Box>
                      <Typography 
                        variant="caption" 
                        align="center" 
                        display="block" 
                        sx={{ 
                          mt: 1,
                          fontSize: '0.7rem',
                          fontWeight: themeSettings.backgroundColor === color.value ? 600 : 400,
                          color: themeSettings.backgroundColor === color.value ? '#1976d2' : 'text.secondary'
                        }}
                      >
                        {color.name}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Custom Colors */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                  Custom Colors
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Hex Color Code"
                    placeholder="#RRGGBB"
                    value={themeSettings.backgroundColor}
                    onChange={(e) => setThemeSettings({...themeSettings, backgroundColor: e.target.value})}
                    slotProps={{
                      input: {
                        pattern: "#[0-9A-Fa-f]{6}",
                        maxLength: 7,
                        startAdornment: (
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              backgroundColor: themeSettings.backgroundColor,
                              borderRadius: 1,
                              mr: 1,
                              border: '1px solid rgba(0,0,0,0.1)'
                            }}
                          />
                        )
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<PaletteIcon />}
                    onClick={() => setColorPickerOpen(true)}
                    sx={{ 
                      minWidth: 160,
                      whiteSpace: 'nowrap',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    Color Picker
                  </Button>
                </Box>
              </Box>

              {/* Reset to Defaults Button */}
              <Box sx={{ mb: 4 }}>
                <Divider sx={{ mb: 3 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Reset Theme
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Restore default theme without secondary colors
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<RestartAltIcon />}
                    onClick={handleResetToDefaults}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    Reset to Defaults
                  </Button>
                </Box>
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveTheme}
                disabled={updating}
                fullWidth
                sx={{ 
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                  }
                }}
              >
                {updating ? 'Saving...' : 'Save Background Color'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Network Logo
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Current Logo
                </Typography>
                
                {logoPreview ? (
                  <Box 
                    sx={{ 
                      width: '100%',
                      height: 200,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: '1px solid #ddd',
                      borderRadius: 1,
                      padding: 2,
                      mb: 2
                    }}
                  >
                    <img 
                      src={logoPreview} 
                      alt="Network Logo" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%', 
                        objectFit: 'contain' 
                      }} 
                    />
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      width: '100%',
                      height: 200,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: '1px dashed #aaa',
                      borderRadius: 1,
                      backgroundColor: 'main.light',
                      mb: 2
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No logo uploaded
                    </Typography>
                  </Box>
                )}
                
                <input
                  accept="image/*"
                  id="logo-upload"
                  type="file"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                />
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <label htmlFor="logo-upload">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<AddIcon />}
                    >
                      Select New Logo
                    </Button>
                  </label>
                  
                  {logoPreview && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleRemoveLogo}
                      disabled={uploadingLogo}
                    >
                      Remove Logo
                    </Button>
                  )}
                </Box>
              </Box>
              
              {logoFile && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected file: {logoFile.name}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveLogo}
                    disabled={uploadingLogo}
                    sx={{ mt: 1 }}
                  >
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                </Box>
              )}
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Recommended logo size: 250x250 pixels. Max file size: 5MB.
                Supported formats: PNG, JPG, GIF.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Landing Page Background Image
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Current Background Image
                </Typography>
                
                {backgroundImagePreview ? (
                  <Box 
                    sx={{ 
                      width: '100%',
                      height: 300,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: '1px solid #ddd',
                      borderRadius: 1,
                      mb: 2,
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <img 
                      src={backgroundImagePreview} 
                      alt="Network Background" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover'
                      }} 
                    />
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        fontSize: '0.8rem'
                      }}
                    >
                      This is how the background will appear on your network landing page
                    </Box>
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      width: '100%',
                      height: 300,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: '1px dashed #aaa',
                      borderRadius: 1,
                      backgroundColor: 'main.light',
                      mb: 2,
                      flexDirection: 'column'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No custom background image set
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      A default gradient will be used
                    </Typography>
                  </Box>
                )}
                
                <input
                  accept="image/*"
                  id="background-image-upload"
                  type="file"
                  onChange={handleBackgroundImageChange}
                  style={{ display: 'none' }}
                />
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <label htmlFor="background-image-upload">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<AddIcon />}
                    >
                      Select New Background
                    </Button>
                  </label>
                  
                  {backgroundImagePreview && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleRemoveBackgroundImage}
                      disabled={uploadingBackground}
                    >
                      Remove Background Image
                    </Button>
                  )}
                </Box>
              </Box>
              
              {backgroundImageFile && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected file: {backgroundImageFile.name}
                  </Typography>

                  {uploadingBackground && (
                    <Box sx={{ width: '100%', mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Uploading...
                      </Typography>
                      <LinearProgress />
                    </Box>
                  )}

                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveBackgroundImage}
                    disabled={uploadingBackground}
                    sx={{ mt: 1 }}
                  >
                    {uploadingBackground ? 'Uploading...' : 'Upload Background Image'}
                  </Button>
                </Box>
              )}
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Recommended image size: 1920x1080 pixels (16:9 ratio). Max file size: 10MB.
                Supported formats: PNG, JPG, GIF. For best results, use an image with good contrast for text visibility.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Custom Color Picker Modal */}
      <Modal
        open={colorPickerOpen}
        onClose={() => setColorPickerOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={colorPickerOpen}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              outline: 'none'
            }}
          >
            <CustomColorPicker
              value={themeSettings.backgroundColor}
              onChange={(color) => setThemeSettings({...themeSettings, backgroundColor: color})}
              onClose={() => setColorPickerOpen(false)}
              onSave={(colorData) => {
                // Handle both old format (string) and new format (object)
                const color = typeof colorData === 'string' ? colorData : colorData.primary;
                setThemeSettings({...themeSettings, backgroundColor: color});
                setColorPickerOpen(false);
              }}
            />
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

export default ThemeTab;