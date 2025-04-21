// src/App.jsx - Updated version with network name fetching
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/authcontext';
import { CircularProgress, Box } from '@mui/material';
import NetworkLogoHeader from './components/NetworkLogoHeader';
import { supabase } from './supabaseclient';

// Import Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PasswordResetPage from './pages/PasswordResetPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import NetworkAdminPage from './pages/NetworkAdminPage';
import NotFoundPage from './pages/NotFoundPage';
import LandingPage from './pages/LandingPage';
//import components/context
import ThemeProvider from './components/ThemeProvider';
// Import Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';
import NetworkLandingPage from './pages/NetworkLandingPage';
import DemoPage from './pages/DemoPage';

function App() {
  const { loading, session, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [networkName, setNetworkName] = useState('');
  const [fetchingNetwork, setFetchingNetwork] = useState(false);

  // Fetch user's network info when user changes
  useEffect(() => {
    const fetchUserNetwork = async () => {
      if (!user) {
        setNetworkName('');
        return;
      }

      try {
        setFetchingNetwork(true);
        
        // First get the user's profile to find their network_id
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('network_id')
          .eq('id', user.id)
          .single();
          
        if (profileError || !profileData.network_id) {
          console.log('No network found or user not in a network');
          setNetworkName('');
          return;
        }
        
        // Then fetch the network details to get the name
        const { data: networkData, error: networkError } = await supabase
          .from('networks')
          .select('name')
          .eq('id', profileData.network_id)
          .single();
          
        if (networkError) {
          console.error('Error fetching network:', networkError);
          setNetworkName('');
          return;
        }
        
        setNetworkName(networkData.name);
      } catch (error) {
        console.error('Error in network fetch:', error);
        setNetworkName('');
      } finally {
        setFetchingNetwork(false);
      }
    };
    
    fetchUserNetwork();
  }, [user]);

  useEffect(() => {
    if (!loading) {
      if (session) {
        // Get the current URL to check for invitation parameters
        const searchParams = new URLSearchParams(location.search);
        const hasInvite = searchParams.get('invite');
        // Redirect logged-in users from auth pages to /dashboard, but make exception for signup with invite
        if (['/login', '/password-reset'].includes(location.pathname) ||
         (location.pathname === '/signup' && !hasInvite)) {
        console.log('User authenticated, redirecting from auth page to /dashboard');
        navigate('/dashboard', { replace: true });
         }
       }
     }
  }, [loading, session, location.pathname, location.search, navigate]);

  if (loading) {
    // Show loading indicator during initial auth check
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider>
      <div className="App">
        {/* Pass the network name to the header */}
        {window.location.pathname !== "/" && (
          <NetworkLogoHeader networkName={networkName} />
        )}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage/>}/>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/password-reset" element={<PasswordResetPage />} />
          <Route path="/demo" element={<DemoPage />} />
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<EditProfilePage />} />
            <Route path="/admin" element={<NetworkAdminPage />} />
          </Route>
          {/* Networks routes */}
          <Route path="/network/:networkId" element={<NetworkLandingPage />} />
          {/* Catch-all Route for 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;