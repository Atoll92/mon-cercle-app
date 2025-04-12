// src/pages/SignupPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseclient'; // Adjust path if needed
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  FormHelperText, // Added for potential future use
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  TextField,
  Typography,
  Chip, // Added for showing invitation info
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  LockOutlined as LockIcon,
  GroupAdd as GroupAddIcon, // Added for invitation icon
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Reuse or import the same theme as LoginPage
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Same primary color as login
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Added confirm password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Added state for confirm field
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(''); // For success message
  const navigate = useNavigate();
  const location = useLocation(); // Added to access URL params

  // Invitation data states
  const [inviteToken, setInviteToken] = useState(null);
  const [networkName, setNetworkName] = useState('');
  const [invitationId, setInvitationId] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [invitationError, setInvitationError] = useState(null);

  // Extract invite token from URL when component mounts
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const invite = searchParams.get('invite');
    
    if (invite) {
      setInviteToken(invite);
      // Fetch network info based on the invite token
      fetchNetworkInfo(invite);
    }
  }, [location]);

  
  

  // Fetch network info based on the invite token
  const fetchNetworkInfo = async (token) => {
    if (!token) return;
    
    setInvitationLoading(true);
    setInvitationError(null);
    
    try {
      // Decode the token
      const decoded = atob(token);
      const parts = decoded.split(':');
      
      // Check if token has a valid format
      if (parts.length !== 3 || parts[0] !== 'invite') {
        throw new Error('Invalid invitation format');
      }
      
      const invId = parts[1];
      const netId = parts[2];
      
      setInvitationId(invId);
      setNetworkId(netId);
      
      // Fetch network name
      const { data: network, error } = await supabase
        .from('networks')
        .select('name')
        .eq('id', netId)
        .single();
        
      if (error) throw error;
      
      if (network) {
        setNetworkName(network.name);
        
        // Optionally, also check if the invitation is still valid
        const { data: invitation, error: inviteError } = await supabase
          .from('invitations')
          .select('status')
          .eq('id', invId)
          .single();
          
        if (inviteError) throw inviteError;
        
        if (invitation && invitation.status !== 'pending') {
          throw new Error(`This invitation has already been ${invitation.status}.`);
        }
      } else {
        throw new Error('Network not found');
      }
    } catch (error) {
      console.error('Error processing invitation:', error);
      setInvitationError(error.message || 'Invalid or expired invitation');
    } finally {
      setInvitationLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => { // Handler for confirm field
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage('');
  
    // Password Confirmation Check
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
  
    setLoading(true);
  
    try {
      // 1. Create the auth account
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
  
      if (signUpError) throw signUpError;
  
      // 2. Process invitation if present
      if (inviteToken && networkId && invitationId && !invitationError) {
        try {
          // Make sure there's a delay to allow Supabase to create the profile
          // This is crucial - the profile might not be ready immediately
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update the user's profile with the network_id when they sign up
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              network_id: networkId,
              contact_email: email,
              role: 'member'
            })
            .eq('id', data.user.id);
            
          if (profileError) {
            console.error('Error updating profile with network:', profileError);
            // Try a different approach if update fails - insert instead of update
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([{ 
                id: data.user.id,
                network_id: networkId,
                contact_email: email,
                role: 'member'
              }]);
              
            if (insertError) {
              console.error('Error inserting profile:', insertError);
              throw insertError;
            }
          }
          
          // Update invitation status
          const { error: inviteError } = await supabase
            .from('invitations')
            .update({ status: 'accepted' })
            .eq('id', invitationId);
            
          if (inviteError) {
            console.error('Error updating invitation status:', inviteError);
          }
          
          setMessage('Signup successful! You have been added to ' + networkName + '. Please check your email to confirm your account.');
        } catch (inviteError) {
          console.error('Error processing invitation:', inviteError);
          setMessage('Signup successful, but there was an issue with the invitation. Please check your email to confirm your account.');
        }
      } else {
        // Regular signup without invitation
        setMessage('Signup successful! Please check your email to confirm your account.');
      }
  
      // Clear form on success
      setEmail(''); 
      setPassword('');
      setConfirmPassword('');
  
      // Wait a bit before redirecting to login
      setTimeout(() => {
        navigate('/login');
      }, 3000);
  
    } catch (error) {
      setError(error.message || "Failed to sign up");
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Card
            elevation={3}
            sx={{
              width: '100%',
              borderRadius: 2,
              overflow: 'hidden', // Match login style
            }}
          >
            {/* --- Card Header --- */}
            <Box
              sx={{
                p: 3,
                bgcolor: 'primary.main', // Use theme color
                color: 'white',
              }}
            >
              <Typography variant="h4" component="h1" align="center">
                Create Your Account
              </Typography>
              <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                Join the Mon Cercle community today!
              </Typography>
            </Box>

            {/* --- Card Content / Form --- */}
            <CardContent sx={{ p: 4 }}>
              {/* Invitation Info Banner */}
              {invitationLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Loading invitation details...
                  </Typography>
                </Box>
              ) : invitationError ? (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {invitationError}
                </Alert>
              ) : networkName && (
                <Box 
                  sx={{ 
                    p: 2, 
                    mb: 3, 
                    border: '1px solid rgba(25, 118, 210, 0.3)', 
                    borderRadius: 1,
                    backgroundColor: 'rgba(25, 118, 210, 0.08)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <GroupAddIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">
                      Network Invitation
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    You're signing up to join: <Chip label={networkName} size="small" sx={{ fontWeight: 'bold' }} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.85rem' }}>
                    Your account will be automatically added to this network when you register.
                  </Typography>
                </Box>
              )}

              {error && (
                <Alert
                  severity="error"
                  sx={{ mb: 3 }}
                  onClose={() => setError(null)} // Allow dismissing error
                >
                  {error}
                </Alert>
              )}
              {message && ( // Display success message
                <Alert
                  severity="success"
                  sx={{ mb: 3 }}
                  onClose={() => setMessage('')} // Allow dismissing message
                >
                  {message}
                </Alert>
              )}

              <form onSubmit={handleSignup}>
                <Stack spacing={3}>
                  {/* --- Email Field --- */}
                  <TextField
                    fullWidth
                    required
                    id="email"
                    label="Email Address"
                    name="email"
                    type="email"
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

                  {/* --- Password Field --- */}
                  <FormControl variant="outlined" fullWidth required error={!!error && error.includes('password')}>
                    <InputLabel htmlFor="password">Password</InputLabel>
                    <OutlinedInput
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      inputProps={{ minLength: 6 }} // Enforce minimum length visually
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
                     {/* Optional: Add helper text for password requirements */}
                     <FormHelperText>Minimum 6 characters</FormHelperText>
                  </FormControl>

                  {/* --- Confirm Password Field --- */}
                  <FormControl variant="outlined" fullWidth required error={!!error && error.includes('Passwords do not match')}>
                    <InputLabel htmlFor="confirm-password">Confirm Password</InputLabel>
                    <OutlinedInput
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                       inputProps={{ minLength: 6 }}
                      startAdornment={
                        <InputAdornment position="start">
                          <LockIcon />
                        </InputAdornment>
                      }
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={handleClickShowConfirmPassword}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      }
                      label="Confirm Password"
                    />
                  </FormControl>

                  {/* --- Submit Button --- */}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading || (inviteToken && (invitationLoading || invitationError))}
                    sx={{
                      mt: 2, // Margin top consistent with login
                      py: 1.2, // Padding vertical consistent with login
                      position: 'relative', // For spinner positioning
                    }}
                  >
                    {loading ? (
                      <>
                        <CircularProgress
                          size={24}
                          sx={{
                            color: 'white', // Make spinner visible on button
                            position: 'absolute',
                            left: '50%',
                            marginLeft: '-12px', // Center spinner
                          }}
                        />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </Stack>
              </form>

              {/* --- Link to Login Page --- */}
              <Box sx={{ textAlign: 'center', mt: 4 }}> {/* Increased margin top */}
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <RouterLink // Use RouterLink for client-side nav
                    to="/login"
                    style={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Log In
                  </RouterLink>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default SignupPage;