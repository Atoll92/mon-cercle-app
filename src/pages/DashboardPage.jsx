// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import { useNavigate, Link } from 'react-router-dom';
import PersonalMoodboardWidget from '../components/PersonalMoodboardWidget';
import { 
  AttachMoney as AttachMoneyIcon,
  Star as StarIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Add as AddIcon,
  Image as ImageIcon,
  Language as LanguageIcon,
  Delete as DeleteIcon
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
  Badge,
  TextField
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Edit as EditIcon,
  AdminPanelSettings as AdminIcon,
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
    console.log('Subscription plan:', data?.subscription_plan);
    console.log('Subscription status:', data?.subscription_status);
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
  const [loadingNetworkDetails, setLoadingNetworkDetails] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  
  // State for Create New Post widget
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostLink, setNewPostLink] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState('');
  const [publishingPost, setPublishingPost] = useState(false);
  const [postMessage, setPostMessage] = useState('');

  console.log("Component render cycle. States:", { 
    loadingProfile, 
    loadingMembers,
    loadingNetworkDetails,
    hasProfile: !!profile, 
    memberCount: networkMembers?.length,
    hasNetworkDetails: !!networkDetails,
    networkDetails: networkDetails
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loadingProfile || loadingMembers || loadingNetworkDetails) {
        console.log("Force-resetting loading states after timeout");
        setLoadingProfile(false);
        setLoadingMembers(false);
        setLoadingNetworkDetails(false);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  // Force re-render when networkDetails changes
  useEffect(() => {
    console.log('Network details updated:', networkDetails);
  }, [networkDetails]);

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
          setLoadingNetworkDetails(true);
          fetchNetworkDetails(data.network_id).then(details => {
            console.log('Network details fetched:', details);
            setNetworkDetails(details);
            setLoadingNetworkDetails(false);
          });
          
          // Fetch upcoming events for the network
          fetchUpcomingEvents(data.network_id);
        } else {
          setLoadingMembers(false);
          setLoadingEvents(false);
          setLoadingNetworkDetails(false);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load your profile. Please try again later.");
        setLoadingProfile(false);
        setLoadingNetworkDetails(false);
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
      setLoadingNetworkDetails(false);
    }
  }, [user, retryCount, navigate]);

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
  
  const refreshNetworkDetails = async () => {
    if (profile?.network_id) {
      setLoadingNetworkDetails(true);
      try {
        const details = await fetchNetworkDetails(profile.network_id);
        console.log('Refreshed network details:', details);
        setNetworkDetails(details);
      } catch (error) {
        console.error("Error refreshing network details:", error);
      } finally {
        setLoadingNetworkDetails(false);
      }
    }
  };
  
  // Handle new post image change
  const handleNewPostImageChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    setNewPostImage(file);
    setNewPostImagePreview(URL.createObjectURL(file));
    
    console.log("New post image selected:", file.name);
  };
  
  // Handle publishing a new post
  const handlePublishNewPost = async () => {
    // Validate the form
    if (!newPostTitle.trim()) {
      setPostMessage('Post title is required');
      return;
    }
    
    try {
      setPublishingPost(true);
      console.log("Publishing post:", newPostTitle);
      
      // First, upload the image if any
      let fileUrl = null;
      if (newPostImage) {
        // Upload new image
        const fileExt = newPostImage.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}-post.${fileExt}`;
        const filePath = `portfolios/${fileName}`;

        console.log('Uploading post image:', filePath);
        
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, newPostImage);

        if (uploadError) {
          console.error('Error uploading post image:', uploadError);
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
        
        fileUrl = urlData.publicUrl;
        console.log('Generated image URL:', fileUrl);
      }
      
      // Save post directly to the database
      const newPost = {
        profile_id: user.id,
        title: newPostTitle,
        description: newPostContent,
        url: newPostLink,
        image_url: fileUrl
      };
      
      console.log('Saving post to portfolio_items table:', newPost);
      
      const { error, data } = await supabase
        .from('portfolio_items')
        .insert(newPost)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      console.log('Post saved successfully:', data);
      
      // Reset the form
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostLink('');
      setNewPostImage(null);
      setNewPostImagePreview('');
      
      // Show success message
      setPostMessage('Post published successfully!');
      setTimeout(() => setPostMessage(''), 3000);
      
    } catch (err) {
      console.error('Error publishing post:', err);
      setPostMessage('Failed to publish post. Please try again.');
    } finally {
      setPublishingPost(false);
    }
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
    <Container maxWidth="lg" sx={{ py: 3, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)' }}>
      {/* Header Card */}
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          mb: 2
        }}
      >
        {/* Blue header banner */}
        <Box 
          sx={{ 
            p: 2, 
            background: 'linear-gradient(120deg, #2196f3, #3f51b5)', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon sx={{ mr: 2, fontSize: 28 }} />
            <Typography variant="h5" component="h1" fontWeight="500">
              Dashboard
            </Typography>
          </Box>

          {profile.network_id && (
            <Button
              variant="contained" 
              color="error" 
              component={Link}
              to={`/network/${profile.network_id}`}
              endIcon={<ArrowForwardIcon />}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.15)', 
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,0.25)'
                },
                color: 'white'
              }}
              size="small"
            >
              Go to Network
            </Button>
          )}
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
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Overview Tab */}
          {activeTab === 0 && (
            <Grid container spacing={2} alignItems="stretch" sx={{ height: '100%', width: '100%', flexGrow: 1 }}>
              {/* Row 1: Profile and Network Management */}
              <Grid item xs={12} sx={{ minHeight: '300px', width: '100%' }}>
                <Grid container spacing={2} sx={{ height: '100%', width: '100%' }}>
                  {/* Profile Card - Left Column */}
                  <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
                    <Card sx={{ 
                      borderRadius: 2, 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      width: '100%'
                    }}>
                      <CardMedia
                        sx={{ 
                          height: 100, 
                          bgcolor: 'primary.main',
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                      >
                        <Avatar 
                          sx={{ 
                            width: 80, 
                            height: 80, 
                            border: '4px solid white',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                            position: 'absolute',
                            bottom: '-30px',
                            bgcolor: 'grey.200'
                          }}
                          src={profile.profile_picture_url} 
                        >
                          {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : <PersonIcon fontSize="large" />}
                        </Avatar>
                      </CardMedia>
                      
                      <CardContent sx={{ pt: 4, pb: 1 }}>
                        <Box sx={{ textAlign: 'center', mb: 1 }}>
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
                        
                        <Divider sx={{ mb: 1.5 }} />
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Email:</strong> {user?.email}
                        </Typography>
                        
                        {profile.contact_email && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>Contact:</strong> {profile.contact_email}
                          </Typography>
                        )}
                        
                        {profile.bio && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Bio:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {profile.bio.length > 80 ? profile.bio.substring(0, 80) + '...' : profile.bio}
                            </Typography>
                          </Box>
                        )}
                        
                        {profile.skills && profile.skills.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Skills:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {profile.skills.slice(0, 3).map((skill, index) => (
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
                              {profile.skills.length > 3 && (
                                <Chip 
                                  label={`+${profile.skills.length - 3}`} 
                                  size="small" 
                                  color="primary"
                                />
                              )}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                      
                      <Box sx={{ flexGrow: 1 }} />
                      
                      <CardActions sx={{ p: 1, justifyContent: 'space-between' }}>
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
                          View Profile
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                  
                  {/* Network Management Widget */}
                  <Grid item xs={12} md={8} sx={{flexGrow:2}}>
                    {profile.network_id ? (
                      <Card sx={{ 
                        borderRadius: 2, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                      }}>
                        <CardHeader
                          title="Network Management"
                          titleTypographyProps={{ variant: 'h6' }}
                          avatar={<NetworkIcon color="primary" />}
                          sx={{ 
                            py: 1,
                            bgcolor: 'rgba(33, 150, 243, 0.05)'
                          }}
                        />
                        
                        <CardContent sx={{ py: 1, flexGrow: 1 }}>
                          {/* Network Name and Subscription Badge */}
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'flex-start', 
                            mb: 1.5
                          }}>
                            <Typography variant="subtitle1" color="primary.main" fontWeight="medium">
                              {networkDetails?.name || 'My Network'}
                            </Typography>
                            
                            {/* Subscription Badge */}
                            {!loadingNetworkDetails && networkDetails?.subscription_status === 'active' && (
                              <SubscriptionBadge 
                                plan={networkDetails.subscription_plan} 
                                status={networkDetails.subscription_status} 
                              />
                            )}
                          </Box>
                          
                          {/* Admin Quick Links */}
                          {profile.role === 'admin' && (
                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                <Button 
                                  variant="contained" 
                                  color="secondary" 
                                  component={Link} 
                                  to="/admin"
                                  startIcon={<AdminIcon />}
                                  size="small"
                                  sx={{ flexGrow: 1 }}
                                >
                                  Admin Panel
                                </Button>
                                
                                <Button 
                                  variant="outlined" 
                                  color="secondary" 
                                  component={Link} 
                                  to="/admin"
                                  startIcon={<PersonAddIcon />}
                                  size="small"
                                  sx={{ flexGrow: 1 }}
                                >
                                  Invite Members
                                </Button>
                              </Box>
                              
                              <Typography variant="caption" color="text.secondary">
                                You have admin privileges for this network
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Subscription Status Card */}
                          <Box sx={{ mb: 2 }}>
                            {loadingNetworkDetails ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CircularProgress size={20} sx={{ mr: 1 }} />
                                <Typography variant="body2">Loading subscription info...</Typography>
                              </Box>
                            ) : networkDetails?.subscription_status === 'active' ? (
                              <Card variant="outlined" sx={{ 
                                p: 1, 
                                borderRadius: 1, 
                                bgcolor: 'rgba(33, 150, 243, 0.05)',
                                mb: 1
                              }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box>
                                    <Typography variant="body2" color="primary.main" fontWeight="medium">
                                      {(networkDetails.subscription_plan || 'Organization').charAt(0).toUpperCase() + 
                                        (networkDetails.subscription_plan || 'Organization').slice(1)} Plan
                                    </Typography>
                                    
                                    <Typography variant="caption" color="text.secondary">
                                      Active premium subscription
                                    </Typography>
                                  </Box>
                                  
                                  <Chip 
                                    icon={<StarIcon fontSize="small" />}
                                    label="Premium" 
                                    color="success" 
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>
                                
                                {networkDetails?.subscription_end_date && (
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                    Next billing: {new Date(networkDetails.subscription_end_date).toLocaleDateString()}
                                  </Typography>
                                )}

                                {profile.role === 'admin' && (
                                  <Button 
                                    variant="outlined" 
                                    color="primary" 
                                    fullWidth
                                    component={Link}
                                    to="/billing"
                                    size="small"
                                    sx={{ mt: 1 }}
                                    startIcon={<AttachMoneyIcon />}
                                  >
                                    Manage Subscription
                                  </Button>
                                )}
                              </Card>
                            ) : networkDetails?.subscription_status === 'canceled' ? (
                              <Card variant="outlined" sx={{ 
                                p: 1, 
                                borderRadius: 1, 
                                bgcolor: 'rgba(255, 152, 0, 0.05)',
                                mb: 1
                              }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box>
                                    <Typography variant="body2" color="warning.main" fontWeight="medium">
                                      Subscription Ending
                                    </Typography>
                                    
                                    <Typography variant="caption" color="text.secondary">
                                      Benefits continue until end of billing period
                                    </Typography>
                                  </Box>
                                  
                                  <Chip 
                                    icon={<HourglassEmptyIcon fontSize="small" />}
                                    label="Ending Soon" 
                                    color="warning" 
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>
                                
                                {networkDetails?.subscription_end_date && (
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                    Access until: {new Date(networkDetails.subscription_end_date).toLocaleDateString()}
                                  </Typography>
                                )}

                                {profile.role === 'admin' && (
                                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                    <Button 
                                      variant="contained" 
                                      color="primary" 
                                      component={Link}
                                      to="/pricing"
                                      size="small"
                                      fullWidth
                                    >
                                      Renew Plan
                                    </Button>
                                    
                                    <Button 
                                      variant="outlined" 
                                      color="primary" 
                                      component={Link}
                                      to="/billing"
                                      size="small"
                                      fullWidth
                                    >
                                      Billing
                                    </Button>
                                  </Box>
                                )}
                              </Card>
                            ) : (
                              <Card variant="outlined" sx={{ 
                                p: 1, 
                                borderRadius: 1, 
                                mb: 1
                              }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box>
                                    <Typography variant="body2" fontWeight="medium">
                                      Community Plan
                                    </Typography>
                                    
                                    <Typography variant="caption" color="text.secondary">
                                      Free tier with basic features
                                    </Typography>
                                  </Box>
                                  
                                  <Chip 
                                    label="Free Plan" 
                                    variant="outlined"
                                    size="small"
                                  />
                                </Box>
                                
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
                                    Limited to 20 members & 2GB storage
                                  </Typography>
                                </Box>
                                
                                {profile.role === 'admin' && (
                                  <Button 
                                    variant="contained" 
                                    color="primary" 
                                    fullWidth
                                    component={Link}
                                    to="/pricing"
                                    sx={{ mt: 1 }}
                                    startIcon={<StarIcon />}
                                  >
                                    Upgrade Plan
                                  </Button>
                                )}
                              </Card>
                            )}
                          </Box>
                          
                          {/* Network Stats */}
                          <Grid container spacing={1.5}>
                            <Grid item xs={6}>
                              <Paper sx={{ 
                                p: 1, 
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
                            
                            <Grid item xs={6}>
                              <Paper sx={{ 
                                p: 1, 
                                textAlign: 'center',
                                bgcolor: 'rgba(76, 175, 80, 0.1)',
                                borderRadius: 2
                              }}>
                                <Typography variant="h5" fontWeight="500" color="success.main">
                                  {recentEvents.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Events
                                </Typography>
                              </Paper>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card sx={{ 
                        borderRadius: 2, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                      }}>
                        <CardHeader
                          title="Create Network"
                          titleTypographyProps={{ variant: 'h6' }}
                          avatar={<CreateNewFolderIcon color="primary" />}
                          sx={{ py: 1 }}
                        />
                        
                        <CardContent sx={{ py: 1 }}>
                          <Box sx={{ textAlign: 'center', py: 1 }}>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              Create your own network to connect with friends, colleagues, or community members.
                            </Typography>
                            
                            <Button 
                              variant="contained" 
                              color="primary" 
                              startIcon={<CreateNewFolderIcon />}
                              onClick={handleCreateNetwork}
                              fullWidth
                              sx={{ mb: 1 }}
                            >
                              Create Network
                            </Button>
                            
                            <Chip
                              icon={<InvitationIcon fontSize="small" />}
                              label="Waiting for Invitations" 
                              variant="outlined"
                              color="primary"
                              size="small"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                  </Grid>
                </Grid>
              </Grid>
              
              {/* Row 2: Create Post and Events */}
              <Grid item xs={12} sx={{ minHeight: '300px', width:'100%' }}>
                <Grid container spacing={2} sx={{ height: '100%', width: '100%' }}>
                  {/* Left Column: Create Post */}
                  <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
                    <Card sx={{ 
                      borderRadius: 2, 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      height: '100%',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <CardHeader
                        title="Create New Post"
                        titleTypographyProps={{ variant: 'subtitle1' }}
                        avatar={<AddIcon color="primary" />}
                        sx={{ 
                          bgcolor: 'rgba(25, 118, 210, 0.05)',
                          py: 1
                        }}
                      />
                      <CardContent sx={{ pt: 1, pb: 1.5, flexGrow: 1 }}>
                        {postMessage && (
                          <Alert 
                            severity={postMessage.includes('successfully') ? "success" : "error"} 
                            sx={{ mb: 1 }}
                            onClose={() => setPostMessage('')}
                          >
                            {postMessage}
                          </Alert>
                        )}
                        
                        <Box sx={{ mb: 1 }}>
                          <TextField
                            fullWidth
                            label="Post Title"
                            placeholder="What's on your mind?"
                            variant="outlined"
                            sx={{ mb: 1.5 }}
                            value={newPostTitle}
                            onChange={(e) => setNewPostTitle(e.target.value)}
                            required
                            size="small"
                          />
                          
                          <TextField
                            fullWidth
                            label="Post Content"
                            placeholder="Share your thoughts..."
                            multiline
                            rows={2}
                            variant="outlined"
                            sx={{ mb: 1.5 }}
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            size="small"
                          />
                          
                          {/* Display image preview if available */}
                          {newPostImagePreview && (
                            <Box sx={{ mb: 1.5, position: 'relative', width: '100%', maxHeight: '120px', overflow: 'hidden', borderRadius: 1 }}>
                              <img 
                                src={newPostImagePreview} 
                                alt="Post preview" 
                                style={{ 
                                  width: '100%', 
                                  objectFit: 'cover',
                                  maxHeight: '120px'
                                }} 
                              />
                              <IconButton
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  bgcolor: 'rgba(0,0,0,0.5)',
                                  color: 'white',
                                  '&:hover': {
                                    bgcolor: 'rgba(0,0,0,0.7)'
                                  }
                                }}
                                onClick={() => {
                                  setNewPostImage(null);
                                  setNewPostImagePreview('');
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <label htmlFor="quick-post-image">
                              <input
                                accept="image/*"
                                type="file"
                                id="quick-post-image"
                                hidden
                                onChange={handleNewPostImageChange}
                              />
                              <Button 
                                variant="outlined" 
                                component="span"
                                startIcon={<ImageIcon />}
                                size="small"
                              >
                                {newPostImage ? 'Change' : 'Add Image'}
                              </Button>
                            </label>
                            
                            <Button
                              variant="contained" 
                              color="primary"
                              onClick={handlePublishNewPost}
                              disabled={!newPostTitle.trim() || publishingPost}
                              startIcon={publishingPost ? <CircularProgress size={16} color="inherit" /> : null}
                              size="small"
                            >
                              {publishingPost ? 'Publishing...' : 'Publish'}
                            </Button>
                            
                            <TextField
                              placeholder="Add link (optional)"
                              variant="outlined"
                              size="small"
                              sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 'auto' }, mt: { xs: 1, sm: 0 } }}
                              value={newPostLink}
                              onChange={(e) => setNewPostLink(e.target.value)}
                              InputProps={{
                                startAdornment: <LanguageIcon color="action" sx={{ mr: 1 }} fontSize="small" />
                              }}
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Middle Column: Upcoming Events */}
                  <Grid item xs={12} md={8} sx={{ display: 'flex', flexGrow: '1' }}>
                    {profile.network_id && recentEvents.length > 0 ? (
                      <Card sx={{ 
                        borderRadius: 2, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <CardHeader
                          title="Upcoming Events"
                          titleTypographyProps={{ variant: 'h6' }}
                          avatar={<EventIcon color="primary" />}
                          action={
                            <Button 
                              component={Link}
                              to={`/network/${profile.network_id}`}
                              endIcon={<ArrowForwardIcon />}
                              size="small"
                            >
                              View All
                            </Button>
                          }
                          sx={{ py: 1 }}
                        />
                        
                        {loadingEvents ? (
                          <Box sx={{ p: 2, textAlign: 'center' }}>
                            <CircularProgress size={30} />
                          </Box>
                        ) : (
                          <CardContent sx={{ py: 0.5, flexGrow: 1, overflow: 'auto' }}>
                            <Stack spacing={1}>
                              {recentEvents.map(event => (
                                <Paper
                                  key={event.id}
                                  variant="outlined"
                                  sx={{ 
                                    p: 1, 
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                  }}
                                >
                                  <Box sx={{ 
                                    width: 40, 
                                    height: 40, 
                                    bgcolor: event.cover_image_url ? 'transparent' : 'primary.light',
                                    borderRadius: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    overflow: 'hidden',
                                    flexShrink: 0
                                  }}>
                                    {event.cover_image_url ? (
                                      <img 
                                        src={event.cover_image_url} 
                                        alt={event.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    ) : (
                                      <>
                                        <Typography variant="caption" fontWeight="bold" sx={{ lineHeight: 1 }}>
                                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                                        </Typography>
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ lineHeight: 1 }}>
                                          {new Date(event.date).getDate()}
                                        </Typography>
                                      </>
                                    )}
                                  </Box>
                                  
                                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                    <Typography variant="subtitle2" noWrap>
                                      {event.title}
                                    </Typography>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
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
                                    sx={{ flexShrink: 0, minWidth: 'auto', px: 1 }}
                                  >
                                    View
                                  </Button>
                                </Paper>
                              ))}
                            </Stack>
                          </CardContent>
                        )}
                      </Card>
                    ) : (
                      // No events, show empty state
                      <Card sx={{ 
                        borderRadius: 2, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <CardHeader
                          title="Upcoming Events"
                          titleTypographyProps={{ variant: 'h6' }}
                          avatar={<EventIcon color="primary" />}
                          sx={{ py: 1 }}
                        />
                        <CardContent sx={{ py: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                          <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              No upcoming events scheduled
                            </Typography>
                            
                            {profile.network_id && profile.role === 'admin' && (
                              <Button 
                                variant="outlined" 
                                component={Link} 
                                to="/admin"
                                startIcon={<AddIcon />}
                                size="small"
                              >
                                Create Event
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                  </Grid>
                  
                </Grid>
              </Grid>
              
              {/* Row 3: Moodboard (Full Width) */}
              <Grid item xs={12} sx={{ minHeight: '350px', width: '100%' }}>
                <Grid container spacing={2} sx={{ height: '100%', width: '100%' }}>
                  <Grid item xs={12} sx={{ display: 'flex', height: '100%', width: '100%' }}>
                    <PersonalMoodboardWidget user={user} />
                  </Grid>
                </Grid>
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
                sx={{ py: 1 }}
              />
              
              <Divider />
              
              <CardContent sx={{ py: 1.5 }}>
                {(loadingMembers && networkMembers.length === 0) ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : networkMembers.length > 0 ? (
                  <Grid container spacing={2} sx={{ height: '100%', width: '100%' }}>
                    {networkMembers.map(member => (
                      <Grid item xs={12} sm={6} md={4} key={member.id}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 1.5,
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
                            sx={{ mr: 2, width: 40, height: 40 }}
                            src={member.profile_picture_url}
                          >
                            {member.full_name ? member.full_name.charAt(0).toUpperCase() : '?'}
                          </Avatar>
                          
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" noWrap>
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