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

  
  const ensureProfile = async (userId, email, networkId = null) => {
    try {
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
  
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking profile:', checkError);
        return false;
      }
  
      // If profile exists and we need to update network_id
      if (existingProfile) {
        if (networkId) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              network_id: networkId,
              contact_email: email,
              updated_at: new Date()
            })
            .eq('id', userId);
  
          if (updateError) {
            console.error('Error updating profile:', updateError);
            return false;
          }
        }
        return true;
      }
  
      // Profile doesn't exist, create it
      const profileData = {
        id: userId,
        contact_email: email,
        role: networkId ? 'member' : null,
        network_id: networkId,
        updated_at: new Date()
      };
  
      const { error: createError } = await supabase
        .from('profiles')
        .insert([profileData]);
  
      if (createError) {
        console.error('Error creating profile:', createError);
        return false;
      }
  
      return true;
    } catch (error) {
      console.error('Profile creation error:', error);
      return false;
    }
  };
  
  // Fetch network info based on the invite token
  const fetchNetworkInfo = async (token) => {
    if (!token) return;
    
    setInvitationLoading(true);
    setInvitationError(null);
    
    try {
      // Decode the token - use try/catch for decoding to handle potential errors
      let decoded;
      try {
        decoded = atob(token);
      } catch (decodeError) {
        console.error('Failed to decode token:', decodeError);
        throw new Error('Invalid invitation format: Could not decode token');
      }
      
      const parts = decoded.split(':');
      
      // Check if token has a valid format
      if (parts.length !== 3 || parts[0] !== 'invite') {
        throw new Error('Invalid invitation format: Incorrect structure');
      }
      
      const invId = parts[1];
      const netId = parts[2];
      
      if (!invId || !netId) {
        throw new Error('Invalid invitation: Missing required data');
      }
      
      setInvitationId(invId);
      setNetworkId(netId);
      
      // Fetch network name
      const { data: network, error } = await supabase
        .from('networks')
        .select('name')
        .eq('id', netId)
        .single();
        
      if (error) {
        console.error('Error fetching network:', error);
        throw new Error(`Network error: ${error.message}`);
      }
      
      if (network) {
        setNetworkName(network.name);
        
        // Also check if the invitation is still valid
        const { data: invitation, error: inviteError } = await supabase
          .from('invitations')
          .select('status, expires_at')
          .eq('id', invId)
          .single();
          
        if (inviteError) {
          console.error('Error fetching invitation:', inviteError);
          throw new Error(`Invitation error: ${inviteError.message}`);
        }
        
        if (!invitation) {
          throw new Error('Invitation not found');
        }
        
        // Check invitation status
        if (invitation.status !== 'pending') {
          throw new Error(`This invitation has already been ${invitation.status}.`);
        }
        
        // Check if invitation has expired (if expires_at is set)
        if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
          throw new Error('This invitation has expired.');
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
        // Add site URL to ensure correct redirect in production
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
  
      if (signUpError) throw signUpError;
  
      if (!data?.user?.id) {
        throw new Error("No user ID returned from signup process");
      }
  
      // 2. Process invitation if present
      if (inviteToken && networkId && invitationId && !invitationError) {
        try {
          // Make sure there's a delay to allow Supabase to create any default records
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Use the ensureProfile function instead of manual update/insert
          const profileCreated = await ensureProfile(data.user.id, email, networkId);
          
          if (!profileCreated) {
            throw new Error("Failed to create or update profile with network information");
          }
          
          // Update invitation status
          const { error: inviteError } = await supabase
            .from('invitations')
            .update({ status: 'accepted' })
            .eq('id', invitationId);
            
          if (inviteError) {
            console.error('Error updating invitation status:', inviteError);
          }
          
          setMessage(`Signup successful! You have been added to ${networkName}. Please check your email to confirm your account.`);
        } catch (inviteError) {
          console.error('Error processing invitation:', inviteError);
          setMessage('Signup successful, but there was an issue with the invitation. Please check your email to confirm your account.');
        }
      } else {
        // Regular signup without invitation - still create a profile
        const profileCreated = await ensureProfile(data.user.id, email);
        
        if (!profileCreated) {
          // Create the profile here (fallback)
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                contact_email: email,
                role: 'member', // Default role
                updated_at: new Date(),
              },
            ]);
          if (profileError) {
            console.error('Error creating profile:', profileError);
            setError('Failed to create profile. Please try again.');
            return;
          }
          setMessage('Signup successful! Please check your email to confirm your account, then complete your profile setup.');
        } else {
          setMessage('Signup successful! Please check your email to confirm your account.');
        }
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