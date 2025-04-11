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

function App() {
  const { loading, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Add a redirect effect to handle authentication state
  useEffect(() => {
    if (!loading) {
      // Only run after initial auth check is complete
      console.log('App auth state:', { hasSession: !!session, currentPath: location.pathname });
      
      // Redirect logic
      if (session) {
        // If user is logged in and on auth pages, redirect to dashboard
        if (['/login', '/signup', '/password-reset'].includes(location.pathname)) {
          console.log('User is authenticated but on auth page, redirecting to dashboard');
          navigate('/', { replace: true });
        }
      }
    }
  }, [loading, session, location.pathname, navigate]);

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

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/admin" element={<NetworkAdminPage />} />
        </Route>

        {/* Catch-all Route for 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;