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
  LinearProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  LockOutlined as LockIcon,
  GroupAdd as GroupAddIcon, // Added for invitation icon
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ThreeJSBackground from '../components/ThreeJSBackground';
import { useProfile } from '../context/profileContext';
import { validatePassword, getPasswordStrength, getPasswordStrengthLabel, getPasswordRequirementsText } from '../utils/passwordValidation';

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
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const location = useLocation(); // Added to access URL params
  const { loadUserProfiles } = useProfile(); // Add ProfileContext

  // Invitation data states
  const [inviteCode, setInviteCode] = useState(null);
  const [invitationData, setInvitationData] = useState(null);
  const [networkName, setNetworkName] = useState('');
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [invitationError, setInvitationError] = useState(null);

  // Extract redirect URL and email from query params
  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect');
  const prefillEmail = searchParams.get('email');

  // Extract invite code from redirect URL when component mounts
  useEffect(() => {
    // Prefill email if provided
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
    
    if (redirectUrl && redirectUrl.includes('/join/')) {
      const code = redirectUrl.split('/join/')[1];
      if (code) {
        setInviteCode(code);
        // Fetch invitation info based on the code
        fetchInvitationInfo(code);
      }
    }
  }, [redirectUrl, prefillEmail]);

  
  const ensureProfile = async (userId, email, networkId = null, role = 'member') => {
    try {
      // Detect schema version by checking if user_id column exists
      const { data: schemaCheck } = await supabase
        .from('profiles')
        .select('user_id')
        .limit(1);
      
      const hasUserIdColumn = schemaCheck !== null;
      
      if (hasUserIdColumn) {
        // NEW SCHEMA: profiles.user_id = auth.users.id, profiles.id = generated UUID
        console.log('Using new schema (post-migration)');
        
        // Check if profile exists for this user and network combination
        let query = supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId);
          
        if (networkId) {
          query = query.eq('network_id', networkId);
        }
        
        const { data: existingProfile, error: checkError } = await query.maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking profile:', checkError);
          return false;
        }
        
        if (existingProfile) {
          // Profile exists, update if needed
          if (networkId) {
            console.log('Updating existing profile with role:', role);
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ 
                contact_email: email,
                role: role,
                updated_at: new Date()
              })
              .eq('id', existingProfile.id);
              
            if (updateError) {
              console.error('Error updating profile:', updateError);
              return false;
            }
          }
          return true;
        }
        
        // Create new profile with new schema
        const profileData = {
          user_id: userId,  // References auth.users.id
          contact_email: email,
          role: networkId ? role : null,
          network_id: networkId,
          updated_at: new Date()
          // id will be auto-generated UUID
        };
        
        console.log('Creating new profile (new schema):', profileData);
        const { error: createError } = await supabase
          .from('profiles')
          .insert([profileData]);
          
        if (createError) {
          console.error('Error creating profile:', createError);
          return false;
        }
        
        return true;
        
      } else {
        // OLD SCHEMA: profiles.id = auth.users.id (current behavior)
        console.log('Using old schema (pre-migration)');
        
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
    
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking profile:', checkError);
          return false;
        }
    
        if (existingProfile) {
          if (networkId) {
            console.log('Updating existing profile with role:', role);
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ 
                network_id: networkId,
                contact_email: email,
                role: role,
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
    
        // Create profile with old schema
        const profileData = {
          id: userId,  // Same as auth.users.id
          contact_email: email,
          role: networkId ? role : null,
          network_id: networkId,
          updated_at: new Date()
        };
        
        console.log('Creating new profile (old schema):', profileData);
        const { error: createError } = await supabase
          .from('profiles')
          .insert([profileData]);
    
        if (createError) {
          console.error('Error creating profile:', createError);
          return false;
        }
    
        return true;
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      return false;
    }
  };
  
  // Fetch invitation info based on the code
  const fetchInvitationInfo = async (code) => {
    if (!code) return;
    
    setInvitationLoading(true);
    setInvitationError(null);
    
    try {
      // Import the API function
      const { getInvitationByCode } = await import('../api/invitations');
      const invitation = await getInvitationByCode(code);
      
      if (invitation) {
        console.log('Fetched invitation data:', invitation);
        console.log('Invitation role:', invitation.role);
        setInvitationData(invitation);
        setNetworkName(invitation.networks?.name || '');
      } else {
        setInvitationError('Invalid or expired invitation');
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
  
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join(' '));
      return;
    }

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
          emailRedirectTo: import.meta.env.VITE_SITE_URL 
            ? `${import.meta.env.VITE_SITE_URL}/auth/callback`
            : `${window.location.origin}/auth/callback`
        }
      });
  
      if (signUpError) throw signUpError;
  
      if (!data?.user?.id) {
        throw new Error("No user ID returned from signup process");
      }
  
      // 2. Process invitation if present
      if (inviteCode && invitationData && !invitationError) {
        try {
          // Make sure there's a delay to allow Supabase to create any default records
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Use the ensureProfile function instead of manual update/insert
          console.log('Creating profile with network:', invitationData.network_id);
          console.log('Invitation role:', invitationData.role);
          const profileCreated = await ensureProfile(data.user.id, email, invitationData.network_id, invitationData.role || 'member');
          
          if (!profileCreated) {
            throw new Error("Failed to create or update profile with network information");
          }
          
          // Increment invitation link usage count
          await supabase.rpc('increment_invitation_link_uses', { link_code: inviteCode });
          
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

      // Refresh ProfileContext to load the newly created profile
      await loadUserProfiles();
  
      // Redirect after profile is loaded (reduced timeout since we ensured profile loading)
      setTimeout(() => {
        if (inviteCode && invitationData) {
          // If coming from invitation, redirect to dashboard with from_invite flag
          // Dashboard will handle profile check and redirect appropriately
          navigate(`/dashboard?from_invite=true`);
        } else {
          // Otherwise redirect to login
          navigate('/login');
        }
      }, 1000);
  
    } catch (error) {
      setError(error.message || "Failed to sign up");
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

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
              overflow: 'hidden', // Match login style
              zIndex:9
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
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <GroupAddIcon color="primary" />
                    <Typography variant="body1">
                      You're invited to join <strong>{networkName}</strong>
                    </Typography>
                  </Stack>
                  {invitationData?.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {invitationData.description}
                    </Typography>
                  )}
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
                      onChange={(e) => {
                        const newPassword = e.target.value;
                        setPassword(newPassword);
                        
                        // Validate password
                        const validation = validatePassword(newPassword);
                        setPasswordErrors(validation.errors);
                        
                        // Get password strength
                        const strength = getPasswordStrength(newPassword);
                        setPasswordStrength(strength);
                      }}
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
                     {/* Password strength indicator */}
                     {password && (
                       <Box sx={{ mt: 1 }}>
                         <LinearProgress 
                           variant="determinate" 
                           value={(passwordStrength / 5) * 100}
                           sx={{ 
                             height: 8, 
                             borderRadius: 1,
                             backgroundColor: '#e0e0e0',
                             '& .MuiLinearProgress-bar': {
                               backgroundColor: getPasswordStrengthLabel(passwordStrength).color
                             }
                           }}
                         />
                         <Typography variant="caption" sx={{ color: getPasswordStrengthLabel(passwordStrength).color, mt: 0.5 }}>
                           {getPasswordStrengthLabel(passwordStrength).label}
                         </Typography>
                       </Box>
                     )}
                     <FormHelperText>
                       {passwordErrors.length > 0 ? passwordErrors[0] : getPasswordRequirementsText()}
                     </FormHelperText>
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
                    disabled={loading || (inviteCode && (invitationLoading || invitationError))}
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