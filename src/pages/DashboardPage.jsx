// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CircularProgress, 
  Box, 
  Typography, 
  Button, 
  Alert, 
  Container,
  Paper,
  Divider,
  Avatar,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Edit as EditIcon,
  Add as AddIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon, 
  ArrowBack,
  ArrowForward
} from '@mui/icons-material';
import { fetchNetworkMembers } from '../api/networks';

function DashboardPage() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [networkMembers, setNetworkMembers] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  console.log("Component render cycle. States:", { 
    loadingProfile, 
    loadingMembers, 
    hasProfile: !!profile, 
    memberCount: networkMembers?.length
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loadingProfile || loadingMembers) {
        console.log("Force-resetting loading states after timeout");
        setLoadingProfile(false);
        setLoadingMembers(false);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Fetch the user's profile data when the component mounts or user changes
    const fetchProfile = async () => {
      if (!user) return;
      
      setLoadingProfile(true);
      setError(null);
      
      try {
        console.log('Fetching profile for user:', user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(); // Use maybeSingle instead of single to handle missing profiles

        if (error) {
          console.error("Error fetching profile:", error);
          // If we're getting a 'not found' error and we haven't retried too many times
          if (error.code === 'PGRST116' && retryCount < 3) {
            console.log(`Profile not found, retrying in 1 second (attempt ${retryCount + 1}/3)`);
            setRetryCount(prev => prev + 1);
            setTimeout(() => fetchProfile(), 1000); // Retry after 1 second
            return;
          }
          throw error;
        }

        if (!data) {
          console.log('No profile data found for user:', user.id);
          setError("Your profile hasn't been created yet. Redirecting to profile setup...");
          setLoadingProfile(false);
          
          // Redirect to profile edit page
          setTimeout(() => {
            navigate('/profile/edit');
          }, 1500);
          return;
        }

        // Check if profile is incomplete (e.g., no full name or other important fields)
        if (!data.full_name || data.full_name.trim() === '') {
          console.log('Profile found but incomplete, redirecting to profile edit page');
          setProfile(data);
          setLoadingProfile(false);
          
          // Redirect to profile edit page
          setTimeout(() => {
            navigate('/profile/edit');
          }, 1500);
          return;
        }

        console.log('Profile loaded successfully:', data);
        setProfile(data);
        setLoadingProfile(false);
        setRetryCount(0); // Reset retry count on success

        // Once profile is fetched, fetch members of the same network
        if (data?.network_id) {
          fetchNetworkMembers(data.network_id).then(members => {
            setNetworkMembers(members);
            setLoadingMembers(false);
          });
        } else {
          setLoadingMembers(false);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load your profile. Please try again later.");
        setLoadingProfile(false);
      }
    };
    
    if (user) {
      fetchProfile();
    } else {
      setLoadingProfile(false);
      setLoadingMembers(false);
    }
  }, [user, retryCount, navigate]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // AuthProvider's onAuthStateChange will handle state update
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  const handleCreateNetwork = async () => {
    try {
      // Create a new network
      const { data: network, error: networkError } = await supabase
        .from('networks')
        .insert([{ name: 'My Network', created_by: user.id }])
        .select()
        .single();
      
      if (networkError) throw networkError;
      
      // Update the user's profile with the new network_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ network_id: network.id, role: 'admin' })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      // Refresh the profile data
      setProfile({ ...profile, network_id: network.id, role: 'admin' });
      
      alert('Network created successfully!');
    } catch (error) {
      console.error("Error creating network:", error);
      alert('Failed to create network. Please try again.');
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loadingProfile) {
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
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  if (error && error.includes("Redirecting")) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
        >
          Please complete your profile setup to continue.
        </Alert>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress size={30} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button 
            variant="contained" 
            onClick={handleRefresh}
          >
            Refresh Page
          </Button>
        </Box>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Profile Setup in Progress
          </Typography>
          <CircularProgress size={30} sx={{ my: 2 }} />
          <Typography variant="body1" paragraph>
            We're setting up your profile. This should only take a moment.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/profile/edit')}
            sx={{ mt: 2 }}
          >
            Go to Profile Setup
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Box>
      </Paper>

      {session && profile ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Your Profile
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ width: 60, height: 60, mr: 2 }}
                    src={profile.profile_picture_url} 
                  >
                    {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : <PersonIcon />}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {profile.full_name || user?.email || 'Not set'}
                    </Typography>
                    <Chip 
                      label={profile.role || 'Member'} 
                      color={profile.role === 'admin' ? 'primary' : 'default'} 
                      size="small" 
                    />
                  </Box>
                </Box>
                
                <Box sx={{ ml: 1, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Email:</strong> {user?.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Network ID:</strong> {profile.network_id ? profile.network_id.substring(0, 8) + '...' : 'Not assigned'}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<EditIcon />}
                  component={Link} 
                  to="/profile/edit"
                >
                  Edit Profile
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {!profile.network_id ? (
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Network
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography paragraph>
                    You're not part of any network yet.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<AddIcon />}
                    onClick={handleCreateNetwork}
                  >
                    Create My Network
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Or wait for an invitation from a network admin.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Network Members
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {(loadingMembers && networkMembers.length === 0) ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress size={30} />
                    </Box>
                    ) : networkMembers.length > 0 ? (
                    <Box>
                      {networkMembers.map(member => (
                        <Paper 
                          key={member.id} 
                          elevation={1} 
                          sx={{ 
                            p: 2, 
                            mb: 2, 
                            display: 'flex', 
                            alignItems: 'center',
                            backgroundColor: member.id === user.id ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                          }}
                        >
                          <Avatar 
                            sx={{ mr: 2 }} 
                            src={member.profile_picture_url}
                          >
                            {member.full_name ? member.full_name.charAt(0).toUpperCase() : '?'}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1">
                              {member.full_name || 'Unnamed User'}
                              {member.id === user.id && ' (You)'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {member.contact_email || member.id}
                            </Typography>
                          </Box>
                          {member.role === 'admin' && (
                            <Chip 
                              label="Admin" 
                              color="primary" 
                              size="small" 
                              sx={{ mr: 1 }}
                            />
                          )}
                          <Button 
                            variant="outlined" 
                            size="small"
                            component={Link} 
                            to={`/profile/${member.id}`}
                          >
                            View Profile
                          </Button>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Typography>
                      No other members found in your network.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {profile.role === 'admin' && profile.network_id && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Admin Controls
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography paragraph>
                    As an admin, you can manage your network settings and members.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    component={Link} 
                    to="/admin"
                    startIcon={<AdminIcon />}
                  >
                    Go to Network Admin Panel
                  </Button>
                  <br />
                  <Button
                    variant="outlined" 
                    color="primary" 
                    component={Link}
                    to={`/network/${profile.network_id}`}
                    endIcon={<ArrowForward />}
                    sx={{ mt: 2 }}
                  >
                    Go to Network Landing Page
                  </Button>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography paragraph>
            You're not logged in or your session has expired.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </Paper>
      )}
    </Container>
  );
}

export default DashboardPage;