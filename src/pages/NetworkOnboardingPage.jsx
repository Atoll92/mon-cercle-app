// src/pages/NetworkOnboardingPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import NetworkOnboardingWizard from '../components/NetworkOnboardingWizard';
import {
  Box,
  Container,
  Typography,
  Paper,
  useTheme,
  alpha,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';

const NetworkOnboardingPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setLoadingProfile(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        setProfile(data);
        
        // Redirect if user already has a network
        if (data && data.network_id) {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile information. Please try again.");
      } finally {
        setLoadingProfile(false);
      }
    };
    
    fetchProfile();
  }, [user, navigate]);

  // If still loading
  if (authLoading || loadingProfile) {
    return (
      <Box sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }
  
  // If there's an error
  if (error) {
    return (
      <Box sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          {error}
        </Alert>
      </Box>
    );
  }
  
  // If no user or profile after loading is complete
  if (!user || !profile) {
    return (
      <Box sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Alert severity="warning" sx={{ maxWidth: 500 }}>
          Please complete your profile first before creating a network.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      pt: 5,
      pb: 8,
      bgcolor: (theme) => alpha(theme.palette.primary.light, 0.05)
    }}>
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            pt: { xs: 3, sm: 4 },
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            background: 'linear-gradient(120deg, #2196f3, #3f51b5)',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AdminIcon sx={{ mr: 1.5, fontSize: 32 }} />
            <Typography variant="h4" component="h1" fontWeight="500">
              Set Up Your Network
            </Typography>
          </Box>
          
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'normal' }}>
            Welcome, {profile.full_name || 'there'}! Let's configure your new community space.
          </Typography>
          
          <Typography variant="body1">
            This wizard will guide you through creating and customizing your network.
            You can change any of these settings later through the admin panel.
          </Typography>
        </Paper>
        
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <NetworkOnboardingWizard profile={profile} />
        </Paper>
        
        <Box sx={{ 
          mt: 4, 
          textAlign: 'center',
          color: theme.palette.text.secondary
        }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2">
            Still have questions? Refer to our documentation for more detailed information about setting up your network.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default NetworkOnboardingPage;