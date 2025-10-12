// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseclient';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import Spinner from '../components/Spinner';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email as EmailIcon, 
  LockOutlined as LockIcon 
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ThreeJSBackground from '../components/ThreeJSBackground';
import { useProfile } from '../context/profileContext';
import NetworkSelector from '../components/NetworkSelector';

// You can customize this theme or import from a separate theme file
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfiles, isLoadingProfiles, loadUserProfiles } = useProfile();
  
  // Get redirect URL, email, and intent from query params
  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect');
  const prefillEmail = searchParams.get('email');
  const intent = searchParams.get('intent');
  
  // Prefill email if provided
  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [prefillEmail]);

  // Handle profile selection logic after login
  useEffect(() => {
    // Only run this logic if we've triggered the profile selector AND profiles are done loading
    if (showProfileSelector && !isLoadingProfiles) {
      console.log('Profile selection logic - userProfiles:', userProfiles.length);
      
      // Add a small delay to ensure state is fully updated
      const timer = setTimeout(() => {
        if (userProfiles.length === 0 || intent === 'create-network') {
          console.log('Redirecting to create-network (no profiles or create-network intent)');
          navigate('/create-network', { replace: true });
        } else if (userProfiles.length === 1) {
          console.log('Redirecting to dashboard (1 profile)');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('Showing NetworkSelector (multiple profiles)');
          // If userProfiles.length > 1, stay on this page to show selector
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [showProfileSelector, isLoadingProfiles, userProfiles.length, navigate, intent]);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Manually trigger profile loading after successful login
      console.log('Login successful, loading profiles...');
      await loadUserProfiles();
      
      // Set flag to show profile selector logic will be handled by useEffect
      console.log('Setting showProfileSelector to true');
      setShowProfileSelector(true);
    } catch (error) {
      setError(error.message || t('login.errors.loginFailed'));
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSelected = (profile) => {
    // Check priority: intent, redirectUrl, or default to dashboard
    if (intent === 'create-network') {
      navigate('/create-network', { replace: true });
    } else if (redirectUrl) {
      navigate(redirectUrl, { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleDemoLogin = async () => {
    // For demo purposes - replace with your own demo credentials or remove if not needed
    setEmail('demo@example.com');
    setPassword('demopassword');
    // You can auto-submit the form here if you want
  };

  // If profile selector should be shown, render it instead of login form
  console.log('Render check:', { showProfileSelector, isLoadingProfiles, profileCount: userProfiles.length });
  if (showProfileSelector && !isLoadingProfiles && userProfiles.length > 1) {
    console.log('Rendering NetworkSelector');
    return (
      <ThemeProvider theme={theme}>
        <ThreeJSBackground/>
        <Container maxWidth="lg">
          <Box
            sx={{
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 9
            }}
          >
            <NetworkSelector onProfileSelected={handleProfileSelected} />
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <ThreeJSBackground/>
      <Container maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex:9
          }}
        >
          <Card 
            elevation={3} 
            sx={{ 
              width: '100%', 
              borderRadius: 2,
              overflow: 'hidden',
              zIndex:9
            }}
          >
            <Box 
              sx={{ 
                p: 3, 
                bgcolor: 'primary.main', 
                color: 'white',
              }}
            >
              <Typography variant="h4" component="h1" align="center">
                {t('login.title')}
              </Typography>
              <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                {t('login.subtitle')}
              </Typography>
            </Box>
            
            <CardContent sx={{ p: 4 }}>
              {/* Show invitation notice if coming from join page */}
              {redirectUrl && redirectUrl.includes('/join/') && (
                <Alert
                  severity="info"
                  sx={{ mb: 3 }}
                >
                  {t('login.joinNetworkNotice')}
                </Alert>
              )}
              
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 3 }}
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              )}
              
              <form onSubmit={handleLogin}>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    required
                    id="email"
                    label={t('login.form.emailAddress')}
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  <FormControl variant="outlined" fullWidth required>
                    <InputLabel htmlFor="password">{t('login.form.password')}</InputLabel>
                    <OutlinedInput
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      startAdornment={
                        <InputAdornment position="start">
                          <LockIcon />
                        </InputAdornment>
                      }
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      }
                      label={t('login.form.password')}
                    />
                    <Box 
                      display="flex" 
                      justifyContent="flex-end" 
                      mt={1}
                    >
                      <Link
                        to="/password-reset"
                        style={{
                          color: theme.palette.primary.main,
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                        }}
                      >
                        {t('login.forgotPassword')}
                      </Link>
                    </Box>
                  </FormControl>
                  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ 
                      mt: 2, 
                      py: 1.2,
                      position: 'relative'
                    }}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          size={24}
                          sx={{
                            position: 'absolute',
                            left: '50%',
                            marginLeft: '-12px',
                          }}
                        />
                        <span>{t('login.form.signingIn')}</span>
                      </>
                    ) : (
                      t('login.form.signIn')
                    )}
                  </Button>
                </Stack>
              </form>
              
              <Divider sx={{ my: 3 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ px: 1 }}
                >
                  {t('login.or')}
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                onClick={handleDemoLogin}
                sx={{ mb: 2 }}
              >
                {t('login.tryDemoAccount')}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('login.noAccount')}{' '}
                  <Link
                    to="/signup"
                    style={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {t('login.signUpNow')}
                  </Link>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default LoginPage;