// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseclient';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
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
import ProfileSelector from '../components/ProfileSelector';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfiles, isLoadingProfiles } = useProfile();
  
  // Get redirect URL and email from query params
  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect');
  const prefillEmail = searchParams.get('email');
  
  // Prefill email if provided
  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [prefillEmail]);

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
      
      // AuthProvider's onAuthStateChange will handle setting session state
      // Wait a bit for the profile context to load
      setTimeout(() => {
        setShowProfileSelector(true);
      }, 500);
    } catch (error) {
      setError(error.message || "Failed to log in");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSelected = (profile) => {
    // Check if there's a redirect URL, otherwise go to dashboard
    if (redirectUrl) {
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
  if (showProfileSelector && !isLoadingProfiles && userProfiles.length > 0) {
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
            <ProfileSelector onProfileSelected={handleProfileSelected} />
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
                Welcome Back
              </Typography>
              <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                Sign in to your account to continue
              </Typography>
            </Box>
            
            <CardContent sx={{ p: 4 }}>
              {/* Show invitation notice if coming from join page */}
              {redirectUrl && redirectUrl.includes('/join/') && (
                <Alert 
                  severity="info" 
                  sx={{ mb: 3 }}
                >
                  Please sign in with your existing account to join the network
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
                    label="Email Address"
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
                    <InputLabel htmlFor="password">Password</InputLabel>
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
                      label="Password"
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
                        Forgot password?
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
                        <CircularProgress
                          size={24}
                          sx={{
                            position: 'absolute',
                            left: '50%',
                            marginLeft: '-12px',
                          }}
                        />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      'Sign In'
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
                  OR
                </Typography>
              </Divider>
              
              <Button
                fullWidth
                variant="outlined"
                onClick={handleDemoLogin}
                sx={{ mb: 2 }}
              >
                Try Demo Account
              </Button>
              
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link 
                    to="/signup" 
                    style={{ 
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Sign up now
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