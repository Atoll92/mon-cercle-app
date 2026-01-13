import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { supabase } from '../supabaseclient';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { alpha } from '@mui/material/styles';

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
    // Default to dark mode if no preference saved
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
  
  // Create MUI theme based on darkMode state
 // In your ThemeProvider.jsx
const theme = createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    background: {
      default: darkMode ? '#121212' : networkTheme.backgroundColor || '#ffffff',
      paper: darkMode ? '#1e1e1e' : '#ffffff',
    },
    // Custom colors
    custom: {
      lightText: darkMode ? '#ffffff' : '#000000',
      fadedText: darkMode ? alpha('#ffffff', 0.7) : alpha('#000000', 0.7),
      border: darkMode ? alpha('#ffffff', 0.1) : alpha('#000000', 0.1),
    }
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

  // Expose networkTheme, darkMode functionality, and refresh function
  const themeContextValue = {
    networkTheme,
    darkMode,
    toggleDarkMode,
    refreshNetworkTheme
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