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
import { AppProvider, useApp } from './context/appContext';
import ErrorBoundary from './components/ErrorBoundary';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { ProfileProvider, useProfile } from './context/profileContext';
import NetworkSelector from './components/NetworkSelector';
import ProfileAwareRoute from './components/ProfileAwareRoute';
import { LanguageProvider } from './hooks/useTranslation.jsx';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { HelmetProvider } from 'react-helmet-async';
import DynamicMetaTags from './components/DynamicMetaTags';

// Eagerly loaded pages (small, frequently accessed)
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import RezoProSpecSignupPage from './pages/RezoProSpecSignupPage';
import NotFoundPage from './pages/NotFoundPage';
import EventPage from './pages/EventPage';
import { NetworkProvider } from './context/networkContext.jsx';

// Lazy loaded pages (larger, less frequently accessed)
const PasswordResetPage = lazyWithRetry(() => import('./pages/PasswordResetPage'));
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'));
const ProfilePage = lazyWithRetry(() => import('./pages/ProfilePage'));
const EditProfilePage = lazyWithRetry(() => import('./pages/EditProfilePage'));
const NetworkAdminPage = lazyWithRetry(() => import('./pages/NetworkAdminPage'));
const WikiListPage = lazyWithRetry(() => import('./pages/WikiListPage'));
const WikiPage = lazyWithRetry(() => import('./pages/WikiPage'));
const WikiEditPage = lazyWithRetry(() => import('./pages/WikiEditPage'));
const PaymentSuccessPage = lazyWithRetry(() => import('./pages/PaymentSuccessPage'));
const BillingPage = lazyWithRetry(() => import('./pages/BillingPage'));
const SharedFilesPage = lazyWithRetry(() => import('./pages/SharedFilesPage'));
const MoodboardPage = lazyWithRetry(() => import('./pages/MoodboardPage'));
const NetworkLandingPage = lazyWithRetry(() => import('./pages/NetworkLandingPage'));
const DirectMessagesPage = lazyWithRetry(() => import('./pages/DirectMessagesPage'));
const PricingPage = lazyWithRetry(() => import('./pages/PricingPage'));
const PersonalMoodboardsPage = lazyWithRetry(() => import('./pages/PersonalMoodboardPage'));
const PasswordUpdatePage = lazyWithRetry(() => import('./pages/PasswordUpdatePage'));
const NetworkOnboardingPage = lazyWithRetry(() => import('./pages/NetworkOnboardingPage'));
const MicroConclavPage = lazyWithRetry(() => import('./pages/MicroConclavPage'));
const SuperAdminDashboard = lazyWithRetry(() => import('./pages/SuperAdminDashboard'));
const LogoAnimation = lazyWithRetry(() => import('./components/LogoAnimation'));
const JoinNetworkPage = lazyWithRetry(() => import('./pages/JoinNetworkPage'));
const NewsPostPage = lazyWithRetry(() => import('./pages/NewsPostPage'));
const PostPage = lazyWithRetry(() => import('./pages/PostPage'));
const TermsPage = lazyWithRetry(() => import('./pages/TermsPage'));
const PrivacyPage = lazyWithRetry(() => import('./pages/PrivacyPage'));
const DocumentationPage = lazyWithRetry(() => import('./pages/DocumentationPage'));
const SimpleConclavLanding = lazyWithRetry(() => import('./pages/SimpleConclavLanding'));
const CoursesPage = lazyWithRetry(() => import('./components/courses/CoursesPage'));
const CourseDetailPage = lazyWithRetry(() => import('./components/courses/CourseDetailPage'));
const EngagementDemoPage = lazyWithRetry(() => import('./pages/EngagementDemoPage'));

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
    <AppProvider userNetworkId={userNetworkId} fetchingNetwork={fetchingNetwork} activeProfile={activeProfile}>
      {children}
    </AppProvider>
  );
};

// Component that wraps NetworkHeader with NetworkProvider using the correct network ID
const NetworkHeaderWithProvider = () => {
  const { userNetworkId } = useApp();

  return (
    <NetworkProvider networkId={userNetworkId}>
      <NetworkHeader/>
    </NetworkProvider>
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
      <HelmetProvider>
        <LanguageProvider>
          <DynamicMetaTags />
          <ProfileProvider>
            <ThemeProvider>
              <AppWithProfileContext>
                <DirectMessagesProvider>
                  <Box className="App" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Pass the network name to the header */}
            {(window.location.pathname !== "/" || !session) &&
             window.location.pathname !== "/pricing" &&
             window.location.pathname !== "/terms" &&
             window.location.pathname !== "/profiles/select" &&
             window.location.pathname !== "/login" &&
             !window.location.pathname.startsWith("/micro-conclav/") &&
             !window.location.pathname.startsWith("/join/") &&
             window.location.pathname !== "/network" &&
             window.location.pathname !== "/network-floating" &&
             window.location.pathname !== "/network-alt" &&
             !window.location.pathname.startsWith("/signup/rezoprospec") &&
             !window.location.pathname.match(/^\/network\/[^\/]+$/) &&
             !window.location.pathname.match(/^\/network-alt\/[^\/]+$/) && (
              <NetworkHeaderWithProvider/>
            )}
            <Box component="main" sx={{ 
              flex: 1, 
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
            {/* Public Routes */}
            <Route path="/" element={<SimpleConclavLanding/>}/>
            <Route path="/simple-conclav" element={<SimpleConclavLanding/>}/>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/signup/rezoprospec" element={<RezoProSpecSignupPage />} />
            <Route path="/password-reset" element={<PasswordResetPage />} />
            <Route path="/update-password" element={<PasswordUpdatePage />} />
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
            <Route path="/micro/:moodboardSlug" element={<MicroConclavPage />} />
            
            {/* Public Wiki routes */}
            <Route path="/network/:networkId/wiki" element={<WikiListPage />} />
            <Route path="/network/:networkId/wiki/category/:categorySlug" element={<WikiListPage />} />
            <Route path="/network/:networkId/wiki/:pageSlug" element={<WikiPage />} />
            
            {/* Protected Wiki routes - need to be inside ProtectedRoute */}
            <Route element={<ProtectedRoute />}>
              <Route path="/network/:networkId/wiki/new" element={<ProfileAwareRoute><WikiEditPage /></ProfileAwareRoute>} />
              <Route path="/network/:networkId/wiki/edit/:pageSlug" element={<ProfileAwareRoute><WikiEditPage /></ProfileAwareRoute>} />
            </Route>

            {/* Public Course routes */}
            <Route path="/network/:networkId/courses" element={<CoursesPage />} />
            <Route path="/network/:networkId/courses/:courseId" element={<CourseDetailPage />} />
            
            {/* Protected Course routes - need authentication for enrollment */}
            <Route element={<ProtectedRoute />}>
              <Route path="/courses" element={<ProfileAwareRoute><CoursesPage /></ProfileAwareRoute>} />
              <Route path="/courses/:courseId" element={<ProfileAwareRoute><CourseDetailPage /></ProfileAwareRoute>} />
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
            <Route path="/network/:networkId/engagement-demo" element={<EngagementDemoPage />} />
            <Route path="/network/:networkId/news/:newsId" element={<NewsPostPage />} />
            <Route path="/network/:networkId/event/:eventId" element={<EventPage />} />
            
            {/* Individual post route */}
            <Route path="/post/:postId" element={<PostPage />} />
            
            {/* Join network via invitation link */}
            <Route path="/join/:code" element={<JoinNetworkPage />} />
            
            {/* Catch-all Route for 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
            </Box>
            <Footer />
            <Analytics />
            <SpeedInsights />
          </Box>
            </DirectMessagesProvider>
          </AppWithProfileContext>
        </ThemeProvider>
      </ProfileProvider>
    </LanguageProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;