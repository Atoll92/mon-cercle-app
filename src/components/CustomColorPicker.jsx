import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Slider,
  Typography,
  Paper,
  IconButton,
  TextField,
  Stack,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Casino as SurpriseIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useTheme } from './ThemeProvider';
import { generateComplementaryColor } from '../utils/colorUtils';

const CustomColorPicker = ({ 
  value = '#5865F2', 
  onChange, 
  onClose,
  onSave
}) => {
  const { darkMode } = useTheme();
  const [currentColor, setCurrentColor] = useState(value);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [colorIntensity, setColorIntensity] = useState(74);
  const [customColors, setCustomColors] = useState([]);
  const canvasRef = useRef(null);

  // Helper function to determine if a color is dark
  const isColorDark = (hexColor) => {
    if (!hexColor || typeof hexColor !== 'string') return false;
    hexColor = hexColor.replace('#', '');
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  // Convert hex to HSL
  const hexToHsl = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  };

  // Convert HSL to hex
  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Initialize from current color
  useEffect(() => {
    if (value) {
      const [h, s, l] = hexToHsl(value);
      setHue(h);
      setSaturation(s);
      setLightness(l);
      setCurrentColor(value);
    }
  }, [value]);

  // Update color when HSL changes
  useEffect(() => {
    const newColor = hslToHex(hue, saturation, lightness);
    setCurrentColor(newColor);
  }, [hue, saturation, lightness]);

  // Calculate secondary color with current intensity
  const secondaryColor = generateComplementaryColor(currentColor, colorIntensity / 100) || '#9c27b0';

  // Draw color gradient canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Create main gradient (saturation vs lightness)
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const s = (x / width) * 100;
        const l = ((height - y) / height) * 100;
        const color = hslToHex(hue, s, l);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [hue]);

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newSaturation = (x / canvas.width) * 100;
    const newLightness = ((canvas.height - y) / canvas.height) * 100;
    
    setSaturation(newSaturation);
    setLightness(newLightness);
  };

  const handleColorChange = (newColor) => {
    setCurrentColor(newColor);
    onChange?.(newColor);
  };

  const handleAddColor = () => {
    if (!customColors.includes(currentColor)) {
      setCustomColors([...customColors, currentColor]);
    }
  };

  const handleSurpriseMe = () => {
    const newHue = Math.floor(Math.random() * 360);
    const newSaturation = Math.floor(Math.random() * 50) + 50; // 50-100%
    const newLightness = Math.floor(Math.random() * 40) + 30; // 30-70%
    
    setHue(newHue);
    setSaturation(newSaturation);
    setLightness(newLightness);
  };

  const handleSave = () => {
    const colorData = {
      primary: currentColor,
      secondary: secondaryColor,
      intensity: colorIntensity / 100
    };
    onSave?.(colorData);
  };

  const handleHexChange = (event) => {
    const hex = event.target.value;
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      const [h, s, l] = hexToHsl(hex);
      setHue(h);
      setSaturation(s);
      setLightness(l);
    }
  };

  return (
    <Paper
      sx={{
        p: 3,
        minWidth: 400,
        maxWidth: 500,
        bgcolor: darkMode ? '#2c2c2c' : '#ffffff',
        color: darkMode ? '#ffffff' : '#000000',
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              width: 12, 
              height: 12, 
              borderRadius: 1, 
              bgcolor: '#9c27b0'
            }} 
          />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Custom Themes
          </Typography>
          <Chip label="BETA" size="small" color="secondary" />
        </Box>
        <IconButton onClick={onClose} size="small">
          ×
        </IconButton>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Match your mood with endless color combinations. Try it now!
      </Typography>

      {/* Colors Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Colors
        </Typography>
        
        {/* Main Color Canvas */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 200,
            borderRadius: 2,
            overflow: 'hidden',
            mb: 2,
            cursor: 'crosshair',
            border: '1px solid',
            borderColor: darkMode ? '#555' : '#e0e0e0'
          }}
          onClick={handleCanvasClick}
        >
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            style={{
              width: '100%',
              height: '100%',
              display: 'block'
            }}
          />
          {/* Color picker indicator */}
          <Box
            sx={{
              position: 'absolute',
              left: `${(saturation / 100) * 100}%`,
              top: `${100 - (lightness / 100) * 100}%`,
              width: 12,
              height: 12,
              border: '2px solid white',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
              pointerEvents: 'none'
            }}
          />
        </Box>

        {/* Hue Slider */}
        <Box sx={{ mb: 2 }}>
          <Slider
            value={hue}
            onChange={(_, value) => setHue(value)}
            min={0}
            max={360}
            sx={{
              height: 8,
              '& .MuiSlider-rail': {
                background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                opacity: 1
              },
              '& .MuiSlider-track': {
                background: 'transparent',
                border: 'none'
              },
              '& .MuiSlider-thumb': {
                width: 20,
                height: 20,
                backgroundColor: currentColor,
                border: '2px solid white',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0 0 0 8px rgba(0,0,0,0.1)'
                }
              }
            }}
          />
        </Box>

        {/* Color Preview - Primary and Secondary */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            Color Preview
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {/* Primary Color */}
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  width: '100%',
                  height: 48,
                  bgcolor: currentColor,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: darkMode ? '#555' : '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: isColorDark(currentColor) ? '#ffffff' : '#000000',
                    fontWeight: 600
                  }}
                >
                  Primary
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {currentColor.toUpperCase()}
              </Typography>
            </Box>
            
            {/* Secondary Color */}
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  width: '100%',
                  height: 48,
                  bgcolor: secondaryColor,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: darkMode ? '#555' : '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: isColorDark(secondaryColor) ? '#ffffff' : '#000000',
                    fontWeight: 600
                  }}
                >
                  Secondary
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {secondaryColor.toUpperCase()}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Hex Input */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TextField
            label="Hex Color"
            value={currentColor.toUpperCase()}
            onChange={handleHexChange}
            size="small"
            sx={{ 
              flex: 1,
              '& .MuiOutlinedInput-root': {
                bgcolor: darkMode ? '#404040' : '#f5f5f5'
              }
            }}
          />
          <IconButton 
            onClick={handleAddColor}
            sx={{ 
              bgcolor: darkMode ? '#404040' : '#f5f5f5',
              '&:hover': {
                bgcolor: darkMode ? '#555555' : '#e0e0e0'
              }
            }}
          >
            <EditIcon />
          </IconButton>
        </Box>

        {/* Add Color Button */}
        <Button
          startIcon={<AddIcon />}
          variant="text"
          fullWidth
          onClick={handleAddColor}
          sx={{ 
            mb: 2,
            color: darkMode ? '#ffffff' : '#000000',
            '&:hover': {
              bgcolor: darkMode ? '#404040' : '#f5f5f5'
            }
          }}
        >
          Add Color
        </Button>

        {/* Custom Colors */}
        {customColors.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Your Colors
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {customColors.map((color, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: color,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: darkMode ? '#555' : '#e0e0e0',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'scale(1.1)'
                    }
                  }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      {/* Controls */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Controls
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box>
              <Typography variant="body2">Color Intensity</Typography>
              <Typography variant="caption" color="text.secondary">
                Affects secondary color vibrancy
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {Math.round(colorIntensity)}%
            </Typography>
          </Box>
          <Slider
            value={colorIntensity}
            onChange={(_, value) => setColorIntensity(value)}
            min={0}
            max={100}
            sx={{
              color: currentColor,
              '& .MuiSlider-thumb': {
                width: 20,
                height: 20,
                backgroundColor: 'white',
                border: `2px solid ${currentColor}`,
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: `0 0 0 8px ${currentColor}20`
                }
              }
            }}
          />
        </Box>
      </Box>

      {/* Action Buttons */}
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          startIcon={<SurpriseIcon />}
          onClick={handleSurpriseMe}
          sx={{ 
            flex: 1,
            borderColor: darkMode ? '#555' : '#e0e0e0',
            color: darkMode ? '#ffffff' : '#000000',
            '&:hover': {
              borderColor: currentColor,
              bgcolor: `${currentColor}10`
            }
          }}
        >
          Surprise Me!
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<SaveIcon />}
          sx={{ 
            backgroundColor: currentColor,
            color: isColorDark(currentColor) ? '#ffffff' : '#000000',
            '&:hover': {
              backgroundColor: currentColor,
              opacity: 0.9
            },
            minWidth: 'auto',
            px: 2
          }}
        >
          Save
        </Button>
      </Stack>
    </Paper>
  );
};

export default CustomColorPicker;