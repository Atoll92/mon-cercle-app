// src/components/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { Box, Typography } from '@mui/material';
import Spinner from './Spinner';

function ProtectedRoute() {
  const { session, user, loading } = useAuth();
  const location = useLocation();

  // // Add debugging
  // useEffect(() => {
  //   console.log('ProtectedRoute state:', { 
  //     loading, 
  //     hasSession: !!session, 
  //     hasUser: !!user,
  //     path: location.pathname
  //   });
  // }, [loading, session, user, location]);

  if (loading) {
    // Show a better loading indicator
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh' 
        }}
      >
        <Spinner size={80} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Verifying your credentials...
        </Typography>
      </Box>
    );
  }

  // If not logged in (and loading is finished), redirect to login page
  if (!session) {
    console.log('No session found, redirecting to login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If logged in and loading is finished, render the nested route
  // console.log('User authenticated, rendering protected content');
  return <Outlet />;
}

export default ProtectedRoute;