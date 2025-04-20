import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';

// Create a context for theme data
const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const { session, user } = useAuth();
  const [theme, setTheme] = useState({
    backgroundColor: '#ffffff', // Default white background
    logoUrl: null,
    loaded: false
  });

  useEffect(() => {
    const loadNetworkTheme = async () => {
      // Only attempt to load theme if user is logged in
      if (!user) {
        setTheme(prev => ({ ...prev, loaded: true }));
        return;
      }

      try {
        // Get user's profile to find their network
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('network_id')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // If user has no network, use default theme
        if (!profile.network_id) {
          setTheme(prev => ({ ...prev, loaded: true }));
          return;
        }

        // Load network theme settings
        const { data: network, error: networkError } = await supabase
          .from('networks')
          .select('theme_bg_color, logo_url')
          .eq('id', profile.network_id)
          .single();

        if (networkError) throw networkError;

        // Apply theme if available
        setTheme({
          backgroundColor: network.theme_bg_color || '#ffffff',
          logoUrl: network.logo_url || null,
          loaded: true
        });
      } catch (error) {
        console.error('Error loading theme:', error);
        setTheme(prev => ({ ...prev, loaded: true }));
      }
    };

    loadNetworkTheme();
  }, [user]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div style={{ 
        backgroundColor: theme.backgroundColor,
        minHeight: '100vh',
        transition: 'background-color 0.3s ease'
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;