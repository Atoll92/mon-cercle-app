// src/App.jsx - Updated version with shared files routes
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/authcontext';
import { CircularProgress, Box } from '@mui/material';
import NetworkHeader from './components/NetworkHeader';
import { supabase } from './supabaseclient';
import WikiListPage from './pages/WikiListPage';
import WikiPage from './pages/WikiPage';
import WikiEditPage from './pages/WikiEditPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import BillingPage from './pages/BillingPage';
import SharedFilesPage from './pages/SharedFilesPage'; // Import the SharedFilesPage
import MoodboardPage from './pages/MoodboardPage';

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
import DirectMessagesPage from './pages/DirectMessagesPage';
import { DirectMessagesProvider } from './context/directMessagesContext';
import PricingPage from './pages/PricingPage';
import ShimmeringTextPage from './pages/ShimmeringTextPage';
import PersonalMoodboardsPage from './pages/PersonalMoodboardPage';

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
    // Handle any redirects after login
    if (!loading && session) {
      // Get the current URL to check for parameters
      const searchParams = new URLSearchParams(location.search);
      const hasInvite = searchParams.get('invite');
      const returnTo = searchParams.get('returnTo') || sessionStorage.getItem('returnTo');
      
      // If we have a returnTo, navigate there and remove it from session storage
      if (returnTo) {
        sessionStorage.removeItem('returnTo');
        navigate(returnTo, { replace: true });
        return;
      }
      
      // Otherwise handle standard auth page redirects
      if (['/login', '/password-reset'].includes(location.pathname) ||
         (location.pathname === '/signup' && !hasInvite)) {
        console.log('User authenticated, redirecting from auth page to /dashboard');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [loading, session, location.pathname, location.search, navigate]);

  // Save returnTo to session storage when redirecting to login
  useEffect(() => {
    if (!loading && !session) {
      // Check if we're on a protected page
      if (location.pathname.includes('/wiki/edit/') || 
          location.pathname.includes('/wiki/new') || 
          location.pathname.includes('/files')) { // Add files to protected routes
        sessionStorage.setItem('returnTo', location.pathname);
      }
    }
  }, [location.pathname, session, loading]);

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
    <DirectMessagesProvider>
      <div className="App">
        {/* Pass the network name to the header */}
        {window.location.pathname !== "/" && window.location.pathname !== "/pricing" && (
          <NetworkHeader/>
        )}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage/>}/>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/password-reset" element={<PasswordResetPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/shimmer" element={<ShimmeringTextPage />} />
          
          {/* Public Wiki routes */}
          <Route path="/network/:networkId/wiki" element={<WikiListPage />} />
          <Route path="/network/:networkId/wiki/category/:categorySlug" element={<WikiListPage />} />
          <Route path="/network/:networkId/wiki/:pageSlug" element={<WikiPage />} />
          
          {/* Protected Wiki routes - need to be inside ProtectedRoute */}
          <Route element={<ProtectedRoute />}>
            <Route path="/network/:networkId/wiki/new" element={<WikiEditPage />} />
            <Route path="/network/:networkId/wiki/edit/:pageSlug" element={<WikiEditPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/moodboard/:moodboardId" element={<MoodboardPage />} />
            <Route path="/dashboard/moodboards" element={<PersonalMoodboardsPage />} />
            <Route path="/network/:networkId/moodboards/create" element={<MoodboardPage />} />
          </Route>

          {/* Protected Shared Files Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/network/:networkId/files" element={<SharedFilesPage />} />
          </Route>

          {/* Protected Direct Messages Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/messages" element={<DirectMessagesPage />} />
            <Route path="/messages/:userId" element={<DirectMessagesPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/billing" element={<BillingPage />} />
          </Route>
          
          
          {/* Other Protected Routes */}
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
      </DirectMessagesProvider>
    </ThemeProvider>
  );
}

export default App;