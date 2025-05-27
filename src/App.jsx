// src/App.jsx - Updated version with shared files routes
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/authcontext';
import { CircularProgress, Box } from '@mui/material';
import NetworkHeader from './components/NetworkHeader';
import Footer from './components/Footer';
import { supabase } from './supabaseclient';
import { preventResizeAnimations } from './utils/animationHelpers';
import ThemeProvider from './components/ThemeProvider';
import ProtectedRoute from './components/ProtectedRoute';
import { DirectMessagesProvider } from './context/directMessagesContext';
import ErrorBoundary from './components/ErrorBoundary';
import { Analytics } from '@vercel/analytics/react';

// Eagerly loaded pages (small, frequently accessed)
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SimpleLandingPage from './pages/SimpleLandingPage';
import NotFoundPage from './pages/NotFoundPage';

// Lazy loaded pages (larger, less frequently accessed)
const PasswordResetPage = lazy(() => import('./pages/PasswordResetPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const NetworkAdminPage = lazy(() => import('./pages/NetworkAdminPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const WikiListPage = lazy(() => import('./pages/WikiListPage'));
const WikiPage = lazy(() => import('./pages/WikiPage'));
const WikiEditPage = lazy(() => import('./pages/WikiEditPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const SharedFilesPage = lazy(() => import('./pages/SharedFilesPage'));
const MoodboardPage = lazy(() => import('./pages/MoodboardPage'));
const NetworkLandingPage = lazy(() => import('./pages/NetworkLandingPage'));
const DemoPage = lazy(() => import('./pages/DemoPage'));
const DirectMessagesPage = lazy(() => import('./pages/DirectMessagesPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const ShimmeringTextPage = lazy(() => import('./pages/ShimmeringTextPage'));
const PersonalMoodboardsPage = lazy(() => import('./pages/PersonalMoodboardPage'));
const PasswordUpdatePage = lazy(() => import('./pages/PasswordUpdatePage'));
const NetworkOnboardingPage = lazy(() => import('./pages/NetworkOnboardingPage'));
const MicroConclavPage = lazy(() => import('./pages/MicroConclavPage'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const JoinNetworkPage = lazy(() => import('./pages/JoinNetworkPage'));
const NewsPostPage = lazy(() => import('./pages/NewsPostPage'));
const EventPage = lazy(() => import('./pages/EventPage'));
const MediaTest = lazy(() => import('./pages/MediaTest'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const DocumentationPage = lazy(() => import('./pages/DocumentationPage'));
const EnhancedLandingPage = lazy(() => import('./pages/EnhancedLandingPage'));

// Loading component for lazy loaded routes
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

function App() {
  const { loading, session, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [networkName, setNetworkName] = useState('');
  const [fetchingNetwork, setFetchingNetwork] = useState(false);

  // Initialize resize animation prevention
  useEffect(() => {
    const cleanup = preventResizeAnimations();
    return cleanup;
  }, []);

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
    <ErrorBoundary>
      <ThemeProvider>
        <DirectMessagesProvider>
          <Box className="App" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Pass the network name to the header */}
            {window.location.pathname !== "/" && window.location.pathname !== "/pricing" && window.location.pathname !== "/terms" && window.location.pathname !== "/old" && !window.location.pathname.startsWith("/micro-conclav/") && (
              <NetworkHeader/>
            )}
            <Box component="main" sx={{ 
              flex: 1, 
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto'
            }}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
            {/* Public Routes */}
            <Route path="/" element={<EnhancedLandingPage/>}/>
            <Route path="/simple" element={<SimpleLandingPage/>}/>
            <Route path="/old" element={<LandingPage/>}/>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/password-reset" element={<PasswordResetPage />} />
            <Route path="/update-password" element={<PasswordUpdatePage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/shimmer" element={<ShimmeringTextPage />} />
            <Route path="/terms" element={<TermsPage />} />
            
            {/* Documentation Routes */}
            <Route path="/documentation" element={<DocumentationPage />} />
            <Route path="/docs" element={<DocumentationPage />} />
            <Route path="/help" element={<DocumentationPage />} />
            <Route path="/faq" element={<DocumentationPage />} />
            
            {/* Micro Conclav routes */}
            <Route path="/micro-conclav/:userId" element={<MicroConclavPage />} />
            
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
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/create-network" element={<NetworkOnboardingPage />} />
            </Route>
            
            {/* Networks routes */}
            <Route path="/network/:networkId" element={<NetworkLandingPage />} />
            <Route path="/network/:networkId/news/:newsId" element={<NewsPostPage />} />
            <Route path="/network/:networkId/event/:eventId" element={<EventPage />} />
            
            {/* Test route */}
            <Route path="/media-test" element={<MediaTest />} />
            
            {/* Join network via invitation link */}
            <Route path="/join/:code" element={<JoinNetworkPage />} />
            
            {/* Catch-all Route for 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
            </Box>
            <Footer />
            <Analytics />
          </Box>
        </DirectMessagesProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;