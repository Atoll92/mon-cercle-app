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

 // Update redirect effect
 useEffect(() => {
  if (!loading) {
    if (session) {
      // Redirect logged-in users from auth pages to /dashboard
      if (['/login', '/signup', '/password-reset'].includes(location.pathname)) {
        console.log('User authenticated, redirecting from auth page to /dashboard');
        navigate('/dashboard', { replace: true }); // <-- CHANGE HERE
      }
      // Optional: Redirect logged-in users from landing page '/' to '/dashboard'
      // else if (location.pathname === '/') {
      //    console.log('User authenticated, redirecting from / to /dashboard');
      //    navigate('/dashboard', { replace: true });
      // }
    }
    // Optional: If user is logged OUT and tries to access a protected path
    // that isn't handled by ProtectedRoute (e.g., direct load before ProtectedRoute checks),
    // you might redirect them to login, but ProtectedRoute should handle this.
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
          <Route path="/dashboard" element={<DashboardPage />} />
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