// src/pages/NetworkOnboardingPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import NetworkOnboardingWizard from '../components/NetworkOnboardingWizard';
import { useTranslation } from '../hooks/useTranslation';
import {
  Box,
  Container,
  Typography,
  Paper,
  useTheme,
  alpha,
  Divider,
  Alert
} from '@mui/material';
import Spinner from '../components/Spinner';
import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';

const NetworkOnboardingPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  // Fetch user profile (if exists) or allow network creation without profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setLoadingProfile(true);
        
        // Detect schema version by checking if user_id column exists
        const { data: schemaCheck } = await supabase
          .from('profiles')
          .select('user_id')
          .limit(1);
        
        const hasUserIdColumn = schemaCheck !== null;
        
        let query;
        if (hasUserIdColumn) {
          // NEW SCHEMA: Look up by user_id
          query = supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id);
        } else {
          // OLD SCHEMA: Look up by id  
          query = supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id);
        }
        
        const { data, error } = await query.single();
          
        if (error && error.code === 'PGRST116') {
          // No profile exists yet - this is fine for new users creating their first network
          console.log("No profile found - new user creating first network");
          setProfile(null);
          setLoadingProfile(false);
          return;
        }
        
        if (error) throw error;
        
        setProfile(data);
        
        // Redirect if user already has a network
        if (data && data.network_id) {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(t('networkOnboarding.page.errorLoadingProfile'));
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
        <Spinner size={120} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          {t('networkOnboarding.page.loading')}
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
  
  // If no user after loading is complete
  if (!user) {
    return (
      <Box sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Alert severity="warning" sx={{ maxWidth: 500 }}>
          {t('networkOnboarding.page.loginRequired')}
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
              {t('networkOnboarding.page.title')}
            </Typography>
          </Box>
          
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'normal' }}>
            {t('networkOnboarding.page.welcome', { name: profile?.full_name || user?.email?.split('@')[0] || 'there' })}
          </Typography>
          
          <Typography variant="body1">
            {t('networkOnboarding.page.description')}
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
            {t('networkOnboarding.page.questionsHelp')}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default NetworkOnboardingPage;