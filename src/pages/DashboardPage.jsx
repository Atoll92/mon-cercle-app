// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import { useNavigate, Link } from 'react-router-dom';
import { 
  AttachMoney as AttachMoneyIcon,
  Star as StarIcon,
  HourglassEmpty as HourglassEmptyIcon
} from '@mui/icons-material';
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
  Chip,
  IconButton,
  Stack,
  Tooltip,
  LinearProgress,
  CardMedia,
  CardHeader,
  Fade,
  Tab,
  Tabs,
  Badge
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Edit as EditIcon,
  Add as AddIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon, 
  ArrowForward as ArrowForwardIcon,
  Dashboard as DashboardIcon,
  Groups as GroupsIcon,
  Mail as MailIcon,
  Event as EventIcon,
  Article as ArticleIcon,
  MenuBook as MenuBookIcon,
  Refresh as RefreshIcon,
  NetworkWifi as NetworkIcon,
  LocationOn as LocationOnIcon,
  CreateNewFolder as CreateNewFolderIcon,
  InsertInvitation as InvitationIcon,
  PersonAdd as PersonAddIcon,
  WorkspacePremium as PremiumIcon,
  Verified as VerifiedIcon,
  Business as BusinessIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { fetchNetworkMembers } from '../api/networks';

// Subscription Badge Component
const SubscriptionBadge = ({ plan, status }) => {
  // Only show badge for active subscriptions
  if (status !== 'active' || plan === 'community' || !plan) {
    return null;
  }


  
  // Helper function to determine icon and color based on plan
  const getPlanDetails = (plan) => {
    switch (plan) {
      case 'organization':
        return {
          label: 'Organization Plan',
          icon: <BusinessIcon fontSize="small" />,
          color: 'primary',
          tooltip: 'Organization Plan: Up to 500 members & 100GB storage'
        };
      case 'network':
        return {
          label: 'Network Plan',
          icon: <PremiumIcon fontSize="small" />,
          color: 'secondary',
          tooltip: 'Network Plan: Up to 2,500 members & 1TB storage'
        };
      case 'nonprofit':
        return {
          label: 'Non-Profit Plan',
          icon: <SchoolIcon fontSize="small" />,
          color: 'success',
          tooltip: 'Non-Profit Plan: Up to 500 members & 50GB storage'
        };
      case 'business':
        return {
          label: 'Business Plan',
          icon: <VerifiedIcon fontSize="small" />,
          color: 'info',
          tooltip: 'Business Plan: Up to 10,000 members & 5TB storage'
        };
      default:
        return {
          label: 'Premium Plan',
          icon: <VerifiedIcon fontSize="small" />,
          color: 'primary',
          tooltip: 'Premium subscription'
        };
    }
  };

  const planDetails = getPlanDetails(plan);

  return (
    <Tooltip title={planDetails.tooltip}>
      <Chip
        icon={planDetails.icon}
        label={planDetails.label}
        color={planDetails.color}
        size="small"
        variant="outlined"
        sx={{
          fontWeight: 500,
          '& .MuiChip-icon': {
            color: `${planDetails.color}.main`
          }
        }}
      />
    </Tooltip>
  );
};

// Network details fetching function
const fetchNetworkDetails = async (networkId) => {
  try {
    console.log('Fetching network details for network:', networkId);
    const { data, error } = await supabase
      .from('networks')
      .select('*')
      .eq('id', networkId)
      .single();
      
    if (error) throw error;
    console.log('Network details:', data);
    return data;
  } catch (error) {
    console.error("Error fetching network details:", error);
    return null;
  }
};

function DashboardPage() {
  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [networkMembers, setNetworkMembers] = useState([]);
  const [networkDetails, setNetworkDetails] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  console.log("Component render cycle. States:", { 
    loadingProfile, 
    loadingMembers, 
    hasProfile: !!profile, 
    memberCount: networkMembers?.length,
    hasNetworkDetails: !!networkDetails
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
          // Fetch network members
          fetchNetworkMembers(data.network_id).then(members => {
            setNetworkMembers(members);
            setLoadingMembers(false);
          });
          
          // Fetch network details (for subscription info)
          fetchNetworkDetails(data.network_id).then(details => {
            setNetworkDetails(details);
          });
          
          // Fetch upcoming events for the network
          fetchUpcomingEvents(data.network_id);
        } else {
          setLoadingMembers(false);
          setLoadingEvents(false);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load your profile. Please try again later.");
        setLoadingProfile(false);
      }
    };
    
    const fetchUpcomingEvents = async (networkId) => {
      try {
        setLoadingEvents(true);
        const now = new Date().toISOString();
        
        const { data, error } = await supabase
          .from('network_events')
          .select('*')
          .eq('network_id', networkId)
          .gte('date', now)
          .order('date', { ascending: true })
          .limit(3);
          
        if (error) throw error;
        
        setRecentEvents(data || []);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoadingEvents(false);
      }
    };
    
    if (user) {
      fetchProfile();
    } else {
      setLoadingProfile(false);
      setLoadingMembers(false);
      setLoadingEvents(false);
    }
  }, [user, retryCount, navigate]);

  const handleLogout = async () => {
    try {
      console.log("Attempting to log out...");
      // Force clear local storage first to ensure clean state
      localStorage.removeItem('supabase.auth.token');
      
      // Then call the signOut method from context
      const { error } = await signOut();
      
      if (error) {
        console.error("Logout error from context:", error);
        // If context signOut fails, try direct supabase logout as fallback
        await supabase.auth.signOut();
      }
      
      // Force navigation regardless of outcome
      navigate('/login', { replace: true });
      
      // Optional: force page reload to clear any remaining state
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      alert(`Failed to log out: ${error.message}`);
      
      // Even if everything fails, force redirect to login
      navigate('/login', { replace: true });
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
        <CircularProgress size={40} color="primary" />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  if (error && error.includes("Redirecting")) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper 
          elevation={3}
          sx={{ 
            p: 4, 
            borderRadius: 2,
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom>
            Profile Setup Required
          </Typography>
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
          >
            Please complete your profile setup to continue.
          </Alert>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress size={30} />
          </Box>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper 
          elevation={3}
          sx={{ 
            p: 4, 
            borderRadius: 2,
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom>
            Something Went Wrong
          </Typography>
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
          >
            Refresh Page
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper 
          elevation={3}
          sx={{ 
            p: 4, 
            borderRadius: 2,
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}
        >
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
            startIcon={<EditIcon />}
            sx={{ mt: 2 }}
          >
            Go to Profile Setup
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Card */}
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          mb: 3
        }}
      >
        {/* Blue header banner */}
        <Box 
          sx={{ 
            p: 3, 
            background: 'linear-gradient(120deg, #2196f3, #3f51b5)', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant="h4" component="h1" fontWeight="500">
              Dashboard
            </Typography>
          </Box>
          
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.15)', 
              '&:hover': { 
                bgcolor: 'rgba(255,255,255,0.25)'
              },
              color: 'white'
            }}
          >
            Logout
          </Button>
        </Box>

        {/* Tabs Navigation */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider'
          }}
        >
          <Tab 
            label="Overview" 
            icon={<DashboardIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Network" 
            icon={<GroupsIcon />} 
            iconPosition="start"
            disabled={!profile.network_id}
          />
        </Tabs>
      </Paper>

      {session && profile ? (
        <Box>
          {/* Overview Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Left Column */}
              <Grid item xs={12} md={4}>
                <Card sx={{ 
                  borderRadius: 2, 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardMedia
                    sx={{ 
                      height: 120, 
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 100, 
                        height: 100, 
                        border: '4px solid white',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                        position: 'absolute',
                        bottom: '-40px',
                        bgcolor: 'grey.200'
                      }}
                      src={profile.profile_picture_url} 
                    >
                      {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : <PersonIcon fontSize="large" />}
                    </Avatar>
                  </CardMedia>
                  
                  <CardContent sx={{ pt: 6, pb: 2 }}>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <Typography variant="h5" component="h2" gutterBottom>
                        {profile.full_name || user?.email?.split('@')[0] || 'Not set'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Chip 
                          label={profile.role === 'admin' ? 'Admin' : 'Member'} 
                          color={profile.role === 'admin' ? 'primary' : 'default'} 
                          size="small" 
                        />
                        
                        {profile.network_id && (
                          <Chip 
                            icon={<NetworkIcon fontSize="small" />}
                            label="Connected" 
                            color="success" 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Email:</strong> {user?.email}
                    </Typography>
                    
                    {profile.contact_email && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Contact:</strong> {profile.contact_email}
                      </Typography>
                    )}
                    
                    {profile.network_id && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Network ID:</strong> {profile.network_id.substring(0, 8) + '...'}
                      </Typography>
                    )}
                    
                    {profile.bio && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Bio:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {profile.bio.length > 120 ? profile.bio.substring(0, 120) + '...' : profile.bio}
                        </Typography>
                      </Box>
                    )}
                    
                    {profile.skills && profile.skills.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Skills:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {profile.skills.slice(0, 5).map((skill, index) => (
                            <Chip 
                              key={index} 
                              label={skill} 
                              size="small" 
                              sx={{ 
                                bgcolor: 'rgba(63, 81, 181, 0.1)',
                                fontWeight: 400
                              }}
                            />
                          ))}
                          {profile.skills.length > 5 && (
                            <Chip 
                              label={`+${profile.skills.length - 5}`} 
                              size="small" 
                              color="primary"
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                  
                  <Box sx={{ flexGrow: 1 }} />
                  
                  <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />}
                      component={Link} 
                      to="/profile/edit"
                      variant="outlined"
                    >
                      Edit Profile
                    </Button>
                    
                    <Button 
                      size="small" 
                      startIcon={<PersonIcon />}
                      component={Link} 
                      to={`/profile/${user.id}`}
                      variant="outlined"
                      color="secondary"
                    >
                      View Public Profile
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              {/* Right Column */}
              <Grid item xs={12} md={8}>
                <Stack spacing={3}>
                  {/* Network Status Card */}
                  <Card sx={{ 
                    borderRadius: 2, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}>
                    <CardHeader
                      title="Network Status"
                      titleTypographyProps={{ variant: 'h6' }}
                      avatar={<NetworkIcon color="primary" />}
                    />
                    
                    <Divider />
                    {profile.network_id && (
  <Card sx={{ 
    borderRadius: 2, 
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    mb: 3
  }}>
    <CardHeader
      title="Subscription Status"
      titleTypographyProps={{ variant: 'h6' }}
      avatar={<AttachMoneyIcon color="primary" />}
      sx={{ bgcolor: 'rgba(33, 150, 243, 0.05)' }}
    />
    
    <Divider />
    
    <CardContent>
      {profile.networks?.subscription_status === 'active' ? (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" color="primary.main">
                {(profile.networks.subscription_plan || 'Organization').charAt(0).toUpperCase() + 
                  (profile.networks.subscription_plan || 'Organization').slice(1)} Plan
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Active subscription
              </Typography>
            </Box>
            
            <Chip 
              icon={<StarIcon />}
              label="Premium" 
              color="success" 
              size="small"
            />
          </Box>
          
          {profile.networks?.subscription_end_date && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Next billing: {new Date(profile.networks.subscription_end_date).toLocaleDateString()}
            </Typography>
          )}
          
          {profile.role === 'admin' && (
            <Button 
              variant="outlined" 
              color="primary" 
              fullWidth
              sx={{ mt: 2 }}
              component={Link}
              to="/billing"
            >
              Manage Subscription
            </Button>
          )}
        </Box>
      ) : profile.networks?.subscription_status === 'canceled' ? (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" color="warning.main">
                Subscription Ending
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Your benefits will continue until the end of your billing period
              </Typography>
            </Box>
            
            <Chip 
              icon={<HourglassEmptyIcon />}
              label="Ending Soon" 
              color="warning" 
              size="small"
            />
          </Box>
          
          {profile.networks?.subscription_end_date && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Access until: {new Date(profile.networks.subscription_end_date).toLocaleDateString()}
            </Typography>
          )}
          
          {profile.role === 'admin' && (
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              sx={{ mt: 2 }}
              component={Link}
              to="/pricing"
            >
              Renew Subscription
            </Button>
          )}
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6">
                Community Plan
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Free tier with basic features
              </Typography>
            </Box>
            
            <Chip 
              label="Free Plan" 
              variant="outlined"
              size="small"
            />
          </Box>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Upgrade to access premium features like white labeling, more storage, and advanced admin controls.
          </Alert>
          
          {profile.role === 'admin' && (
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              component={Link}
              to="/pricing"
            >
              Upgrade to Premium
            </Button>
          )}
        </Box>
      )}
    </CardContent>
  </Card>
)}
                    
                    <CardContent>
                      {!profile.network_id ? (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                          <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>
                            You're not part of any network yet
                          </Typography>
                          
                          <Typography paragraph color="text.secondary">
                            Create your own network or wait for an invitation from a network admin.
                          </Typography>
                          
                          <Button 
                            variant="contained" 
                            color="primary" 
                            startIcon={<CreateNewFolderIcon />}
                            onClick={handleCreateNetwork}
                            size="large"
                            sx={{ mt: 1 }}
                          >
                            Create My Network
                          </Button>
                          
                          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                            <Chip
                              icon={<InvitationIcon fontSize="small" />}
                              label="Waiting for Invitations" 
                              variant="outlined"
                              color="primary"
                            />
                          </Box>
                        </Box>
                      ) : (
                        <Box>
                          {/* Subscription Badge */}
                          {networkDetails && networkDetails.subscription_status === 'active' && (
                            <Box sx={{ mb: 2 }}>
                              <SubscriptionBadge 
                                plan={networkDetails.subscription_plan} 
                                status={networkDetails.subscription_status} 
                              />
                            </Box>
                          )}
                          
                          <Box sx={{ 
                            display: 'flex',
                            justifyContent: 'space-between',
                            mb: 2
                          }}>
                            <Typography variant="h6">
                              {networkDetails?.name || 'My Network'}
                            </Typography>
                            
                            <Button
                              variant="contained" 
                              color="primary" 
                              component={Link}
                              to={`/network/${profile.network_id}`}
                              endIcon={<ArrowForwardIcon />}
                              size="small"
                            >
                              Go to Network
                            </Button>
                          </Box>
                          
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6} sm={3}>
                              <Paper sx={{ 
                                p: 2, 
                                textAlign: 'center',
                                bgcolor: 'rgba(33, 150, 243, 0.1)',
                                borderRadius: 2
                              }}>
                                <Typography variant="h5" fontWeight="500" color="primary.main">
                                  {networkMembers.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Members
                                </Typography>
                              </Paper>
                            </Grid>
                            
                            <Grid item xs={6} sm={3}>
                              <Paper sx={{ 
                                p: 2, 
                                textAlign: 'center',
                                bgcolor: 'rgba(76, 175, 80, 0.1)',
                                borderRadius: 2
                              }}>
                                <Typography variant="h5" fontWeight="500" color="success.main">
                                  {recentEvents.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Upcoming Events
                                </Typography>
                              </Paper>
                            </Grid>
                            
                            <Grid item xs={6} sm={3}>
                              <Paper sx={{ 
                                p: 2, 
                                textAlign: 'center',
                                bgcolor: 'rgba(244, 67, 54, 0.1)',
                                borderRadius: 2
                              }}>
                                <Typography variant="h5" fontWeight="500" color="error.main">
                                  {networkMembers.filter(m => m.role === 'admin').length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Admins
                                </Typography>
                              </Paper>
                            </Grid>
                            
                            <Grid item xs={6} sm={3}>
                              <Paper sx={{ 
                                p: 2, 
                                textAlign: 'center',
                                bgcolor: 'rgba(156, 39, 176, 0.1)',
                                borderRadius: 2
                              }}>
                                <Typography variant="h5" fontWeight="500" sx={{ color: 'secondary.main' }}>
                                  {profile.role === 'admin' ? 'Admin' : 'Member'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Your Role
                                </Typography>
                              </Paper>
                            </Grid>
                          </Grid>
                          
                          <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                            <Button
                              variant="outlined"
                              component={Link}
                              to={`/network/${profile.network_id}`}
                              startIcon={<GroupsIcon />}
                              size="small"
                            >
                              Members
                            </Button>
                            
                            <Button
                              variant="outlined"
                              component={Link}
                              to={`/network/${profile.network_id}`}
                              startIcon={<EventIcon />}
                              size="small"
                            >
                              Events
                            </Button>
                            
                            <Button
                              variant="outlined"
                              component={Link}
                              to={`/network/${profile.network_id}`}
                              startIcon={<ArticleIcon />}
                              size="small"
                            >
                              News
                            </Button>
                            
                            <Button
                              variant="outlined"
                              component={Link}
                              to={`/network/${profile.network_id}`}
                              startIcon={<MenuBookIcon />}
                              size="small"
                            >
                              Wiki
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>

                  {/* Admin Controls Card */}
                  {profile.role === 'admin' && profile.network_id && (
                    <Card sx={{ 
                      borderRadius: 2, 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}>
                      <CardHeader
                        title="Admin Controls"
                        titleTypographyProps={{ variant: 'h6' }}
                        avatar={<AdminIcon color="secondary" />}
                        sx={{ bgcolor: 'rgba(156, 39, 176, 0.05)' }}
                      />
                      
                      <CardContent>
                        <Typography paragraph>
                          As an admin, you can manage your network settings, members, and events.
                        </Typography>
                        
                        <Button 
                          variant="contained" 
                          color="secondary" 
                          component={Link} 
                          to="/admin"
                          startIcon={<AdminIcon />}
                          sx={{ mr: 2 }}
                        >
                          Admin Panel
                        </Button>
                        
                        <Button 
                          variant="outlined" 
                          color="secondary" 
                          component={Link} 
                          to="/admin"
                          startIcon={<PersonAddIcon />}
                        >
                          Invite Members
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Upcoming Events Card */}
                  {profile.network_id && recentEvents.length > 0 && (
                    <Card sx={{ 
                      borderRadius: 2, 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}>
                      <CardHeader
                        title="Upcoming Events"
                        titleTypographyProps={{ variant: 'h6' }}
                        avatar={<EventIcon color="primary" />}
                      />
                      
                      <Divider />
                      
                      {loadingEvents ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                          <CircularProgress size={30} />
                        </Box>
                      ) : (
                        <CardContent>
                          <Stack spacing={2}>
                            {recentEvents.map(event => (
                              <Paper
                                key={event.id}
                                variant="outlined"
                                sx={{ 
                                  p: 2, 
                                  borderRadius: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2
                                }}
                              >
                                <Box sx={{ 
                                  width: 60, 
                                  height: 60, 
                                  bgcolor: event.cover_image_url ? 'transparent' : 'primary.light',
                                  borderRadius: 2,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  overflow: 'hidden'
                                }}>
                                  {event.cover_image_url ? (
                                    <img 
                                      src={event.cover_image_url} 
                                      alt={event.title}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <>
                                      <Typography variant="caption" fontWeight="bold">
                                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                                      </Typography>
                                      <Typography variant="subtitle1" fontWeight="bold">
                                        {new Date(event.date).getDate()}
                                      </Typography>
                                    </>
                                  )}
                                </Box>
                                
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                  <Typography variant="subtitle1" noWrap>
                                    {event.title}
                                  </Typography>
                                  
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                      <EventIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                                      {new Date(event.date).toLocaleDateString()}
                                    </Typography>
                                    
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                      <LocationOnIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                                      {event.location}
                                    </Typography>
                                  </Box>
                                </Box>
                                
                                <Button
                                  variant="outlined"
                                  size="small"
                                  component={Link}
                                  to={`/network/${profile.network_id}`}
                                >
                                  Details
                                </Button>
                              </Paper>
                            ))}
                          </Stack>
                          
                          <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Button
                              component={Link}
                              to={`/network/${profile.network_id}`}
                              endIcon={<ArrowForwardIcon />}
                            >
                              View All Events
                            </Button>
                          </Box>
                        </CardContent>
                      )}
                    </Card>
                  )}
                </Stack>
              </Grid>
            </Grid>
          )}
          
          {/* Network Tab */}
          {activeTab === 1 && profile.network_id && (
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}>
              <CardHeader
                title="Network Members"
                titleTypographyProps={{ variant: 'h6' }}
                avatar={<GroupsIcon color="primary" />}
                action={
                  <Button 
                    component={Link}
                    to={`/network/${profile.network_id}`}
                    endIcon={<ArrowForwardIcon />}
                    size="small"
                  >
                    Network Page
                  </Button>
                }
              />
              
              <Divider />
              
              <CardContent>
                {(loadingMembers && networkMembers.length === 0) ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : networkMembers.length > 0 ? (
                  <Grid container spacing={2}>
                    {networkMembers.map(member => (
                      <Grid item xs={12} sm={6} md={4} key={member.id}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: member.id === user.id ? 'rgba(33, 150, 243, 0.05)' : 'inherit',
                            border: member.id === user.id ? '1px solid rgba(33, 150, 243, 0.2)' : '1px solid transparent',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          <Avatar
                            sx={{ mr: 2, width: 50, height: 50 }}
                            src={member.profile_picture_url}
                          >
                            {member.full_name ? member.full_name.charAt(0).toUpperCase() : '?'}
                          </Avatar>
                          
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" noWrap>
                              {member.full_name || 'Unnamed User'}
                              {member.id === user.id && ' (You)'}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {member.role === 'admin' && (
                                <Chip
                                  label="Admin"
                                  color="primary"
                                  size="small"
                                  sx={{ height: 20 }}
                                />
                              )}
                              
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {member.contact_email || member.id.substring(0, 8) + '...'}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="View Profile">
                              <IconButton
                                size="small"
                                component={Link}
                                to={`/profile/${member.id}`}
                                color="primary"
                              >
                                <PersonIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            {member.id !== user.id && (
                              <Tooltip title="Message">
                                <IconButton
                                  size="small"
                                  component={Link}
                                  to={`/messages/${member.id}`}
                                  color="primary"
                                >
                                  <MailIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert severity="info">
                    No other members found in your network.
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      ) : (
        <Paper 
          sx={{ 
            p: 4, 
            borderRadius: 2,
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}
        >
          <Typography paragraph>
            You're not logged in or your session has expired.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/login')}
            startIcon={<ArrowForwardIcon />}
          >
            Go to Login
          </Button>
        </Paper>
      )}
    </Container>
  );
}

export default DashboardPage;