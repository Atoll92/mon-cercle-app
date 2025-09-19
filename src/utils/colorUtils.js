// Color utility functions for theme generation
import Please from 'pleasejs';

// Convert hex to RGB
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Convert RGB to HSL
export const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  
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
  
  return { h: h * 360, s: s * 100, l: l * 100 };
};

// Convert HSL to RGB
export const hslToRgb = (h, s, l) => {
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};

// Convert RGB to hex
export const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Check if color is dark
export const isColorDark = (hexColor) => {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return false;
  
  // Calculate perceived brightness
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness < 128;
};

// Determine the best color scheme type based on primary color characteristics
const selectOptimalScheme = (primaryHex) => {
  const rgb = hexToRgb(primaryHex);
  if (!rgb) return 'complementary';
  
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // For grayscale colors, use split-complementary for more interest
  if (hsl.s < 15) {
    return 'split-complementary';
  }
  
  // For highly saturated colors, use complementary for balance
  if (hsl.s > 70) {
    return 'complementary';
  }
  
  // For muted colors, use split-complementary for visual interest
  if (hsl.s < 40) {
    return 'split-complementary';
  }
  
  // For medium saturation, choose based on lightness
  return hsl.l > 60 ? 'triadic' : 'complementary';
};

// Apply intensity adjustment to a color
const applyIntensityAdjustment = (color, intensity) => {
  if (!color || intensity === 1) return color;
  
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // Adjust saturation based on intensity
  let newS = hsl.s * intensity;
  
  // Adjust lightness slightly to maintain contrast
  let newL = hsl.l;
  if (intensity < 0.5) {
    // Lower intensity - move towards neutral
    newL = newL + (50 - newL) * (0.5 - intensity);
  }
  
  // Ensure values are within bounds
  newS = Math.max(0, Math.min(100, newS));
  newL = Math.max(0, Math.min(100, newL));
  
  const newRgb = hslToRgb(hsl.h, newS, newL);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
};

// Enhanced color harmony algorithms (improved version of the original)
const generateColorHarmony = (primaryHex, schemeType) => {
  const rgb = hexToRgb(primaryHex);
  if (!rgb) return primaryHex;
  
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  let newH, newS, newL;
  
  switch (schemeType) {
    case 'complementary':
      newH = (hsl.h + 180) % 360;
      newS = Math.max(30, Math.min(85, hsl.s));
      newL = hsl.l > 50 ? Math.max(20, hsl.l - 30) : Math.min(80, hsl.l + 30);
      break;
      
    case 'split-complementary':
      // Choose one of the split complements
      const splitOption = hsl.l > 50 ? 150 : 210;
      newH = (hsl.h + splitOption) % 360;
      newS = Math.max(40, Math.min(80, hsl.s + 10));
      newL = hsl.l > 50 ? Math.max(25, hsl.l - 25) : Math.min(75, hsl.l + 25);
      break;
      
    case 'triadic':
      newH = (hsl.h + 120) % 360;
      newS = Math.max(35, Math.min(85, hsl.s));
      newL = hsl.l > 60 ? Math.max(30, hsl.l - 30) : Math.min(70, hsl.l + 20);
      break;
      
    default:
      // Default to complementary
      newH = (hsl.h + 180) % 360;
      newS = hsl.s;
      newL = 100 - hsl.l;
  }
  
  const newRgb = hslToRgb(newH, newS, newL);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
};

// Generate a complementary color using enhanced color theory
export const generateComplementaryColor = (primaryHex, intensity = 0.7) => {
  // Input validation
  if (!primaryHex || typeof primaryHex !== 'string') {
    return '#9c27b0'; // fallback purple
  }
  
  // Ensure hex format
  const cleanHex = primaryHex.startsWith('#') ? primaryHex : `#${primaryHex}`;
  
  try {
    // First, try PleaseJS for random colors as a starting point
    const randomColors = [];
    for (let i = 0; i < 3; i++) {
      const randomColor = Please.make_color();
      if (randomColor && randomColor[0] && !randomColor[0].includes('aN')) {
        randomColors.push(randomColor[0]);
      }
    }
    
    // If PleaseJS random generation works, proceed with our enhanced algorithm
    // Determine optimal color scheme based on primary color
    const schemeType = selectOptimalScheme(cleanHex);
    
    // Generate secondary color using our enhanced algorithm
    const secondaryColor = generateColorHarmony(cleanHex, schemeType);
    
    // Apply intensity adjustment
    const finalColor = applyIntensityAdjustment(secondaryColor, intensity);
    
    return finalColor;
    
  } catch (error) {
    console.warn('Color generation failed, using simple fallback:', error);
    
    // Simple fallback
    const rgb = hexToRgb(cleanHex);
    if (!rgb) return '#9c27b0';
    
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    // Enhanced grayscale handling
    if (hsl.s < 15) {
      // For grayscale, use vibrant complementary colors
      if (hsl.l < 30) return '#FF6B35'; // Orange for dark grays
      if (hsl.l > 70) return '#4ECDC4'; // Teal for light grays  
      return '#9B59B6'; // Purple for medium grays
    }
    
    // Simple complementary with contrast adjustment
    const complementaryH = (hsl.h + 180) % 360;
    const complementaryS = Math.max(30, Math.min(85, hsl.s));
    const complementaryL = hsl.l > 50 ? Math.max(25, hsl.l - 30) : Math.min(75, hsl.l + 30);
    
    const complementaryRgb = hslToRgb(complementaryH, complementaryS, complementaryL);
    const result = rgbToHex(complementaryRgb.r, complementaryRgb.g, complementaryRgb.b);
    
    return applyIntensityAdjustment(result, intensity);
  }
};

// Generate an accent color (similar to primary but slightly different)
export const generateAccentColor = (primaryHex) => {
  const rgb = hexToRgb(primaryHex);
  if (!rgb) return primaryHex;
  
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // Shift hue slightly and adjust lightness
  const newH = (hsl.h + 15) % 360;
  const newS = Math.min(hsl.s + 10, 100);
  const newL = hsl.l > 50 ? Math.max(hsl.l - 15, 20) : Math.min(hsl.l + 15, 80);
  
  const newRgb = hslToRgb(newH, newS, newL);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
};