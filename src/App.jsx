// src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/authcontext';
import { CircularProgress, Box } from '@mui/material';

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

// Import Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';
import NetworkLandingPage from './pages/NetworkLandingPage';
import DemoPage from './pages/DemoPage';

function App() {
  const { loading, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    <div className="App">
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
  );
}

export default App;