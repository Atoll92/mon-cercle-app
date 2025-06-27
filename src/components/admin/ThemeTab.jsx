import React, { useState } from 'react';
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
  LinearProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { updateNetworkDetails, uploadNetworkImage, removeNetworkImage } from '../../api/networks';
import { useTheme } from '../ThemeProvider';

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

  // Color presets for theme selection
  const colorPresets = [
    { name: 'White', value: '#ffffff' },
    { name: 'Light Blue', value: '#f0f8ff' },
    { name: 'Light Green', value: '#f0fff0' },
    { name: 'Light Pink', value: '#fff0f5' },
    { name: 'Light Yellow', value: '#fffacd' },
    { name: 'Light Gray', value: '#f5f5f5' }
  ];

  // Helper function to determine if a color is dark
  const isColorDark = (hexColor) => {
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
    
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Background image file must be less than 10MB.');
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
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Background Color
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Current Background Color
                </Typography>
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: 100, 
                    backgroundColor: themeSettings.backgroundColor,
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: isColorDark(themeSettings.backgroundColor) ? '#ffffff' : '#000000'
                  }}
                >
                  <Typography variant="body1">
                    {themeSettings.backgroundColor}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Select a Preset Color
                </Typography>
                <Grid container spacing={2}>
                  {colorPresets.map((color) => (
                    <Grid item key={color.value}>
                      <Box
                        onClick={() => setThemeSettings({...themeSettings, backgroundColor: color.value})}
                        sx={{
                          width: 60,
                          height: 60,
                          backgroundColor: color.value,
                          border: themeSettings.backgroundColor === color.value 
                            ? '3px solid #1976d2' 
                            : '1px solid #ddd',
                          borderRadius: 1,
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        {themeSettings.backgroundColor === color.value && (
                          <CheckIcon sx={{ color: isColorDark(color.value) ? '#ffffff' : '#000000' }} />
                        )}
                      </Box>
                      <Typography variant="caption" align="center" display="block" sx={{ mt: 1 }}>
                        {color.name}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Custom Color
                </Typography>
                <TextField
                  fullWidth
                  label="Hex Color Code"
                  placeholder="#RRGGBB"
                  value={themeSettings.backgroundColor}
                  onChange={(e) => setThemeSettings({...themeSettings, backgroundColor: e.target.value})}
                  sx={{ mb: 2 }}
                  slotProps={{
                    input: {
                      pattern: "#[0-9A-Fa-f]{6}",
                      maxLength: 7
                    }
                  }}
                />
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveTheme}
                disabled={updating}
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
    </>
  );
};

export default ThemeTab;