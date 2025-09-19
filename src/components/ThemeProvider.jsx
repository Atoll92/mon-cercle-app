import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { supabase } from '../supabaseclient';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { alpha } from '@mui/material/styles';
import { generateComplementaryColor, generateAccentColor, isColorDark } from '../utils/colorUtils';
import * as designSystem from '../utils/designSystem';

// Create a context for theme data
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

const ThemeProvider = ({ children }) => {
  const { session, user } = useAuth();
  const { activeProfile } = useProfile();
  const [networkTheme, setNetworkTheme] = useState({
    backgroundColor: '#ffffff', // Default white background
    logoUrl: null,
    loaded: false
  });
  
  // Add darkMode state
  const [darkMode, setDarkMode] = useState(() => {
    // If user is not logged in, default to light mode
    if (!session) {
      return false;
    }
    // Check localStorage for user preference only if logged in
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === null ? true : savedMode === 'true';
  });
  
  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    // Only save to localStorage if user is logged in
    if (session) {
      localStorage.setItem('darkMode', newMode.toString());
    }
  };
  
  // Create MUI theme based on darkMode state and design system
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#90caf9' : '#1976d2', // Default MUI blue
      },
      secondary: {
        // Use original purple color when background is white (default)
        main: (networkTheme.backgroundColor === '#ffffff' || !networkTheme.backgroundColor) 
          ? (darkMode ? '#ce93d8' : '#9c27b0') // Light purple for dark mode, original purple for light mode
          : generateComplementaryColor(networkTheme.backgroundColor),
      },
      background: {
        default: darkMode ? '#121212' : networkTheme.backgroundColor || '#ffffff',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
      // Custom colors
      custom: {
        lightText: darkMode ? '#ffffff' : '#000000',
        fadedText: darkMode ? alpha('#ffffff', 0.7) : alpha('#000000', 0.7),
        border: darkMode ? alpha('#ffffff', 0.1) : alpha('#000000', 0.1),
        accent: generateAccentColor(networkTheme.backgroundColor || '#ffffff'),
      }
    },
    typography: {
      fontFamily: designSystem.typography.fontFamily.primary,
      h1: {
        fontSize: designSystem.typography.fontSize['5xl'],
        fontWeight: designSystem.typography.fontWeight.bold,
        lineHeight: designSystem.typography.lineHeight.tight,
      },
      h2: {
        fontSize: designSystem.typography.fontSize['4xl'],
        fontWeight: designSystem.typography.fontWeight.semibold,
        lineHeight: designSystem.typography.lineHeight.tight,
      },
      h3: {
        fontSize: designSystem.typography.fontSize['3xl'],
        fontWeight: designSystem.typography.fontWeight.semibold,
        lineHeight: designSystem.typography.lineHeight.normal,
      },
      h4: {
        fontSize: designSystem.typography.fontSize['2xl'],
        fontWeight: designSystem.typography.fontWeight.semibold,
        lineHeight: designSystem.typography.lineHeight.normal,
      },
      h5: {
        fontSize: designSystem.typography.fontSize.xl,
        fontWeight: designSystem.typography.fontWeight.medium,
        lineHeight: designSystem.typography.lineHeight.normal,
      },
      h6: {
        fontSize: designSystem.typography.fontSize.lg,
        fontWeight: designSystem.typography.fontWeight.medium,
        lineHeight: designSystem.typography.lineHeight.normal,
      },
      body1: {
        fontSize: designSystem.typography.fontSize.base,
        lineHeight: designSystem.typography.lineHeight.relaxed,
      },
      body2: {
        fontSize: designSystem.typography.fontSize.sm,
        lineHeight: designSystem.typography.lineHeight.relaxed,
      },
      caption: {
        fontSize: designSystem.typography.fontSize.xs,
        lineHeight: designSystem.typography.lineHeight.normal,
      },
    },
    spacing: designSystem.spacing.sm, // 8px base
    shape: {
      borderRadius: designSystem.borderRadius.base,
    },
    shadows: [
      'none',
      designSystem.shadows.xs,
      designSystem.shadows.sm,
      designSystem.shadows.base,
      designSystem.shadows.md,
      designSystem.shadows.md,
      designSystem.shadows.md,
      designSystem.shadows.md,
      designSystem.shadows.lg,
      designSystem.shadows.lg,
      designSystem.shadows.lg,
      designSystem.shadows.lg,
      designSystem.shadows.xl,
      designSystem.shadows.xl,
      designSystem.shadows.xl,
      designSystem.shadows.xl,
      designSystem.shadows.xl,
      designSystem.shadows.xl,
      designSystem.shadows.xl,
      designSystem.shadows.xl,
      designSystem.shadows.xl,
      designSystem.shadows.xl,
      designSystem.shadows.xl,
      designSystem.shadows.xl,
      designSystem.shadows.xl,
    ],
    transitions: {
      duration: {
        shortest: designSystem.transitions.duration.fast,
        shorter: designSystem.transitions.duration.fast,
        short: designSystem.transitions.duration.base,
        standard: designSystem.transitions.duration.base,
        complex: designSystem.transitions.duration.slow,
        enteringScreen: designSystem.transitions.duration.slow,
        leavingScreen: designSystem.transitions.duration.base,
      },
      easing: {
        easeInOut: designSystem.transitions.easing.easeInOut,
        easeOut: designSystem.transitions.easing.easeOut,
        easeIn: designSystem.transitions.easing.easeIn,
        sharp: designSystem.transitions.easing.easeInOut,
      },
    },
    components: {
      // Button component overrides
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: designSystem.borderRadius.sm,
            textTransform: 'none',
            fontWeight: designSystem.typography.fontWeight.medium,
            transition: `all ${designSystem.transitions.duration.base}ms ${designSystem.transitions.easing.easeInOut}`,
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: designSystem.shadows.md,
            },
          },
          sizeMedium: {
            height: designSystem.components.button.height.md,
            padding: designSystem.components.button.padding.md,
            fontSize: designSystem.components.button.fontSize.md,
          },
          sizeSmall: {
            height: designSystem.components.button.height.sm,
            padding: designSystem.components.button.padding.sm,
            fontSize: designSystem.components.button.fontSize.sm,
          },
          sizeLarge: {
            height: designSystem.components.button.height.lg,
            padding: designSystem.components.button.padding.lg,
            fontSize: designSystem.components.button.fontSize.lg,
          },
        },
      },
      // Card component overrides
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: designSystem.borderRadius.md,
            boxShadow: designSystem.shadows.base,
            transition: `all ${designSystem.transitions.duration.base}ms ${designSystem.transitions.easing.easeInOut}`,
            '&:hover': {
              boxShadow: designSystem.shadows.md,
            },
          },
        },
      },
      // TextField component overrides
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: designSystem.borderRadius.sm,
            },
          },
        },
      },
      // Paper component overrides
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          rounded: {
            borderRadius: designSystem.borderRadius.md,
          },
        },
      },
      // Chip component overrides
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: designSystem.borderRadius.pill,
          },
          sizeMedium: {
            height: designSystem.components.chip.height.md,
            padding: designSystem.components.chip.padding.md,
          },
          sizeSmall: {
            height: designSystem.components.chip.height.sm,
            padding: designSystem.components.chip.padding.sm,
          },
        },
      },
      // Avatar component overrides
      MuiAvatar: {
        styleOverrides: {
          root: {
            fontWeight: designSystem.typography.fontWeight.medium,
          },
        },
      },
      // Alert component overrides
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: designSystem.borderRadius.sm,
          },
        },
      },
      // Dialog component overrides
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: designSystem.borderRadius.lg,
            padding: designSystem.spacing.md,
          },
        },
      },
    },
  });
  // Effect to reset theme when session changes
  useEffect(() => {
    if (!session && darkMode) {
      // Reset to light mode when user logs out
      setDarkMode(false);
    }
  }, [session, darkMode]);

  useEffect(() => {
    const loadNetworkTheme = async () => {
      // Only attempt to load theme if user is logged in
      if (!user) {
        setNetworkTheme(prev => ({ ...prev, loaded: true }));
        return;
      }
      
      try {
        // Get network ID from active profile
        const networkId = activeProfile?.network_id;
        
        // If user has no network, use default theme
        if (!networkId) {
          setNetworkTheme(prev => ({ ...prev, loaded: true }));
          return;
        }
        
        // Load network theme settings
        const { data: network, error: networkError } = await supabase
          .from('networks')
          .select('theme_bg_color, logo_url')
          .eq('id', networkId)
          .single();
          
        if (networkError) throw networkError;
        
        // Apply theme if available
        setNetworkTheme({
          backgroundColor: network.theme_bg_color || '#ffffff',
          logoUrl: network.logo_url || null,
          loaded: true
        });
      } catch (error) {
        console.error('Error loading theme:', error);
        setNetworkTheme(prev => ({ ...prev, loaded: true }));
      }
    };
    
    loadNetworkTheme();
  }, [user, activeProfile]);

  // Function to refresh network theme
  const refreshNetworkTheme = async () => {
    // Only attempt to load theme if user is logged in
    if (!user) {
      setNetworkTheme(prev => ({ ...prev, loaded: true }));
      return;
    }
    
    try {
      // Get network ID from active profile
      const networkId = activeProfile?.network_id;
      
      // If user has no network, use default theme
      if (!networkId) {
        setNetworkTheme(prev => ({ ...prev, loaded: true }));
        return;
      }
      
      // Load network theme settings
      const { data: network, error: networkError } = await supabase
        .from('networks')
        .select('theme_bg_color, logo_url')
        .eq('id', networkId)
        .single();
        
      if (networkError) throw networkError;
      
      // Apply theme if available
      setNetworkTheme({
        backgroundColor: network.theme_bg_color || '#ffffff',
        logoUrl: network.logo_url || null,
        loaded: true
      });
    } catch (error) {
      console.error('Error refreshing theme:', error);
    }
  };

  // Expose networkTheme, darkMode functionality, refresh function, and design system
  const themeContextValue = {
    networkTheme,
    darkMode,
    toggleDarkMode,
    refreshNetworkTheme,
    designSystem, // Export design system for consistent use across components
    isBackgroundDark: isColorDark(networkTheme.backgroundColor || '#ffffff'),
  };

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline /> {/* This applies the base styles and resets */}
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;