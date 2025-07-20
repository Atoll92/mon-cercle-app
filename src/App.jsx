// src/App.jsx - Updated version with shared files routes
import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/authcontext';
import { Box } from '@mui/material';
import Spinner from './components/Spinner';
import NetworkHeader from './components/NetworkHeader';
import Footer from './components/Footer';
import { preventResizeAnimations } from './utils/animationHelpers';
import ThemeProvider from './components/ThemeProvider';
import ProtectedRoute from './components/ProtectedRoute';
import { DirectMessagesProvider } from './context/directMessagesContext';
import { AppProvider } from './context/appContext';
import ErrorBoundary from './components/ErrorBoundary';
import { Analytics } from '@vercel/analytics/react';
import { ProfileProvider, useProfile } from './context/profileContext';
import NetworkSelector from './components/NetworkSelector';
import ProfileAwareRoute from './components/ProfileAwareRoute';
import { LanguageProvider } from './hooks/useTranslation.jsx';

// Eagerly loaded pages (small, frequently accessed)
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SimpleLandingPage from './pages/SimpleLandingPage';
import NotFoundPage from './pages/NotFoundPage';
import EventPage from './pages/EventPage';

// Lazy loaded pages (larger, less frequently accessed)
const PasswordResetPage = lazy(() => import('./pages/PasswordResetPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const NetworkAdminPage = lazy(() => import('./pages/NetworkAdminPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const NewLandingPage = lazy(() => import('./pages/NewLandingPage'));
const NewLandingPage2 = lazy(() => import('./pages/NewLandingPage2'));
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
const PersonalMoodboardsPage = lazy(() => import('./pages/PersonalMoodboardPage'));
const PasswordUpdatePage = lazy(() => import('./pages/PasswordUpdatePage'));
const NetworkOnboardingPage = lazy(() => import('./pages/NetworkOnboardingPage'));
const MicroConclavPage = lazy(() => import('./pages/MicroConclavPage'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const LogoAnimation = lazy(() => import('./components/LogoAnimation'));
const NetworkLandingPageOverlap = lazy(() => import('./pages/NetworkLandingPageOverlap'));
const JoinNetworkPage = lazy(() => import('./pages/JoinNetworkPage'));
const NewsPostPage = lazy(() => import('./pages/NewsPostPage'));
const PostPage = lazy(() => import('./pages/PostPage'));
const MediaTest = lazy(() => import('./pages/MediaTest'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const DocumentationPage = lazy(() => import('./pages/DocumentationPage'));
const EnhancedLandingPage = lazy(() => import('./pages/EnhancedLandingPage'));
const AlternativeLandingPage = lazy(() => import('./pages/AlternativeLandingPage'));
const SimpleConclavLanding = lazy(() => import('./pages/SimpleConclavLanding'));

// Loading component for lazy loaded routes
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spinner size={120} />
  </Box>
);

// Component that provides network ID from active profile
const AppWithProfileContext = ({ children }) => {
  const { activeProfile, isLoadingProfiles } = useProfile();
  const [userNetworkId, setUserNetworkId] = useState(null);
  const [fetchingNetwork, setFetchingNetwork] = useState(false);

  // Update network ID when active profile changes
  useEffect(() => {
    if (isLoadingProfiles) {
      setFetchingNetwork(true);
      return;
    }

    setFetchingNetwork(false);
    
    if (activeProfile?.network_id) {
      setUserNetworkId(activeProfile.network_id);
    } else {
      setUserNetworkId(null);
    }
  }, [activeProfile, isLoadingProfiles]);

  return (
    <AppProvider userNetworkId={userNetworkId} fetchingNetwork={fetchingNetwork}>
      {children}
    </AppProvider>
  );
};

function App() {
  const { loading, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize resize animation prevention
  useEffect(() => {
    const cleanup = preventResizeAnimations();
    return cleanup;
  }, []);

  useEffect(() => {
    // Handle any redirects after login
    if (!loading && session) {
      // Get the current URL to check for parameters
      const searchParams = new URLSearchParams(location.search);
      const returnTo = searchParams.get('returnTo') || sessionStorage.getItem('returnTo');
      
      // If we have a returnTo, navigate there and remove it from session storage
      if (returnTo) {
        sessionStorage.removeItem('returnTo');
        navigate(returnTo, { replace: true });
        return;
      }
      
      // Let login and signup pages handle their own redirects based on profile count and invitation flows
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
        <Spinner size={120} />
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ProfileProvider>
          <ThemeProvider>
            <AppWithProfileContext>
              <DirectMessagesProvider>
                <Box className="App" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Pass the network name to the header */}
            {window.location.pathname !== "/" && 
             window.location.pathname !== "/pricing" && 
             window.location.pathname !== "/terms" && 
             window.location.pathname !== "/old" && 
             window.location.pathname !== "/profiles/select" && 
             window.location.pathname !== "/login" && 
             !window.location.pathname.startsWith("/micro-conclav/") &&
             window.location.pathname !== "/network" &&
             !window.location.pathname.match(/^\/network\/[^\/]+$/) && (
              <NetworkHeader/>
            )}
            <Box component="main" sx={{ 
              flex: 1, 
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
              pt: window.location.pathname !== "/" && 
                 window.location.pathname !== "/pricing" && 
                 window.location.pathname !== "/terms" && 
                 window.location.pathname !== "/old" && 
                 window.location.pathname !== "/profiles/select" && 
                 window.location.pathname !== "/login" && 
                 !window.location.pathname.startsWith("/micro-conclav/") &&
                 window.location.pathname !== "/network" &&
                 !window.location.pathname.match(/^\/network\/[^\/]+$/) ? '80px' : 0
            }}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
            {/* Public Routes */}
            <Route path="/" element={<SimpleConclavLanding/>}/>
            <Route path="/enhanced" element={<EnhancedLandingPage/>}/>
            <Route path="/simple" element={<SimpleLandingPage/>}/>
            <Route path="/simple-conclav" element={<SimpleConclavLanding/>}/>
            <Route path="/old" element={<LandingPage/>}/>
            <Route path="/alt" element={<AlternativeLandingPage/>}/>
            <Route path="/new" element={<NewLandingPage/>}/>
            <Route path="/new2" element={<NewLandingPage2/>}/>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/password-reset" element={<PasswordResetPage />} />
            <Route path="/update-password" element={<PasswordUpdatePage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            
            {/* Documentation Routes */}
            <Route path="/documentation" element={<DocumentationPage />} />
            <Route path="/docs" element={<DocumentationPage />} />
            <Route path="/help" element={<DocumentationPage />} />
            <Route path="/faq" element={<DocumentationPage />} />
            
            {/* Logo Animation Route */}
            <Route path="/logo-animation" element={<LogoAnimation />} />
            
            {/* Micro Conclav routes */}
            <Route path="/micro-conclav/:profileId" element={<MicroConclavPage />} />
            <Route path="/micro/:username" element={<MicroConclavPage />} />
            
            {/* Public Wiki routes */}
            <Route path="/network/:networkId/wiki" element={<WikiListPage />} />
            <Route path="/network/:networkId/wiki/category/:categorySlug" element={<WikiListPage />} />
            <Route path="/network/:networkId/wiki/:pageSlug" element={<WikiPage />} />
            
            {/* Protected Wiki routes - need to be inside ProtectedRoute */}
            <Route element={<ProtectedRoute />}>
              <Route path="/network/:networkId/wiki/new" element={<ProfileAwareRoute><WikiEditPage /></ProfileAwareRoute>} />
              <Route path="/network/:networkId/wiki/edit/:pageSlug" element={<ProfileAwareRoute><WikiEditPage /></ProfileAwareRoute>} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/moodboard/:moodboardId" element={<ProfileAwareRoute><MoodboardPage /></ProfileAwareRoute>} />
              <Route path="/dashboard/moodboards" element={<ProfileAwareRoute><PersonalMoodboardsPage /></ProfileAwareRoute>} />
              <Route path="/network/:networkId/moodboards/create" element={<ProfileAwareRoute><MoodboardPage /></ProfileAwareRoute>} />
            </Route>

            {/* Protected Shared Files Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/network/:networkId/files" element={<ProfileAwareRoute><SharedFilesPage /></ProfileAwareRoute>} />
            </Route>

            {/* Protected Direct Messages Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/messages" element={<ProfileAwareRoute><DirectMessagesPage /></ProfileAwareRoute>} />
              <Route path="/messages/:userId" element={<ProfileAwareRoute><DirectMessagesPage /></ProfileAwareRoute>} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/billing" element={<ProfileAwareRoute><BillingPage /></ProfileAwareRoute>} />
            </Route>
            
            {/* Profile Selection Route */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profiles/select" element={<NetworkSelector />} />
            </Route>
            
            
            {/* Other Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ProfileAwareRoute><DashboardPage /></ProfileAwareRoute>} />
              <Route path="/profile/:userId" element={<ProfileAwareRoute><ProfilePage /></ProfileAwareRoute>} />
              <Route path="/profile/edit" element={<ProfileAwareRoute><EditProfilePage /></ProfileAwareRoute>} />
              <Route path="/admin" element={<ProfileAwareRoute><NetworkAdminPage /></ProfileAwareRoute>} />
              <Route path="/super-admin" element={<ProfileAwareRoute><SuperAdminDashboard /></ProfileAwareRoute>} />
              <Route path="/create-network" element={<NetworkOnboardingPage />} />
              {/* Protected network route without ID for authenticated members */}
              <Route path="/network" element={<ProfileAwareRoute><NetworkLandingPage /></ProfileAwareRoute>} />
            </Route>
            
            {/* Public network routes with ID */}
            <Route path="/network/:networkId" element={<NetworkLandingPage />} />
            <Route path="/network/:networkId/news/:newsId" element={<NewsPostPage />} />
            <Route path="/network/:networkId/event/:eventId" element={<EventPage />} />
            
            {/* Individual post route */}
            <Route path="/post/:postId" element={<PostPage />} />
            
            {/* Test routes */}
            <Route path="/media-test" element={<MediaTest />} />
            <Route path="/network-overlap" element={<ProfileAwareRoute><NetworkLandingPageOverlap /></ProfileAwareRoute>} />
            <Route path="/network-overlap/:networkId" element={<NetworkLandingPageOverlap />} />
            
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
          </AppWithProfileContext>
        </ThemeProvider>
      </ProfileProvider>
    </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;