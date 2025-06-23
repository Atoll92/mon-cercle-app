// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { supabase } from '../supabaseclient';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import MembersDetailModal from '../components/MembersDetailModal';
import PersonalMoodboardWidget from '../components/PersonalMoodboardWidget';
import LatestNewsWidget from '../components/LatestNewsWidget';
import LatestPostsWidget from '../components/LatestPostsWidget';
import TestNotificationSystem from '../components/TestNotificationSystem';
import MediaUpload from '../components/MediaUpload';
import EventDetailsDialog from '../components/EventDetailsDialog';
import { useFadeIn, useStaggeredAnimation, ANIMATION_DURATION } from '../hooks/useAnimation';
import { ProfileSkeleton, GridSkeleton } from '../components/LoadingSkeleton';
import OnboardingGuide from '../components/OnboardingGuide';
import WelcomeMessage from '../components/WelcomeMessage';
import { 
  AttachMoney as AttachMoneyIcon,
  Star as StarIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Add as AddIcon,
  Image as ImageIcon,
  Language as LanguageIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon
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
  CardMedia,
  CardHeader,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Edit as EditIcon,
  AdminPanelSettings as AdminIcon,
  ArrowForward as ArrowForwardIcon,
  Dashboard as DashboardIcon,
  Event as EventIcon,
  Refresh as RefreshIcon,
  NetworkWifi as NetworkIcon,
  LocationOn as LocationOnIcon,
  CreateNewFolder as CreateNewFolderIcon,
  InsertInvitation as InvitationIcon,
  PersonAdd as PersonAddIcon,
  WorkspacePremium as PremiumIcon,
  Verified as VerifiedIcon,
  Groups as GroupsIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  SupervisorAccount as SuperAdminIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { fetchNetworkMembers } from '../api/networks';
import { fetchNetworkCategories } from '../api/categories';
import { alpha } from '@mui/material';

// Subscription Badge Component
const SubscriptionBadge = ({ plan, status }) => {
  // Only show badge for active subscriptions
  if (status !== 'active' || !plan) {
    return null;
  }
  
  // Helper function to determine icon and color based on plan
  const getPlanDetails = (plan) => {
    switch (plan) {
      case 'community':
        return {
          label: 'Community Plan',
          icon: <GroupsIcon fontSize="small" />,
          color: 'primary',
          tooltip: 'Community Plan: Up to 100 members & 10GB storage'
        };
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
  const { user, session } = useAuth();
  const { activeProfile, userProfiles, isLoadingProfiles } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [networkMembers, setNetworkMembers] = useState([]);
  const [networkDetails, setNetworkDetails] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingNetworkDetails, setLoadingNetworkDetails] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  
  // State for Create New Post widget
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostLink, setNewPostLink] = useState('');
  const [newPostImagePreview, setNewPostImagePreview] = useState('');
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaMetadata, setMediaMetadata] = useState({});
  const [mediaUploading, setMediaUploading] = useState(false);
  const [publishingPost, setPublishingPost] = useState(false);
  const [postMessage, setPostMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  
  // Member detail modal state
  const [selectedMember, setSelectedMember] = useState(null);
  
  // Event details dialog state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  
  // Onboarding guide state
  const [showOnboardingGuide, setShowOnboardingGuide] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  // Animation setup - must be at top level, not conditional
  const headerRef = useFadeIn(0, ANIMATION_DURATION.normal);
  const getItemRef = useStaggeredAnimation(10, 100, 50);

  // Redirect to create-network if user has no profiles
  useEffect(() => {
    if (!isLoadingProfiles && user && userProfiles.length === 0) {
      // Check if coming from invitation signup
      const searchParams = new URLSearchParams(location.search);
      const fromInvite = searchParams.get('from_invite');
      
      if (fromInvite) {
        console.log('Coming from invitation signup but no profiles found - showing error');
        setError('Failed to load your profile. Please try again later.');
        return;
      }
      
      console.log('User has no profiles, redirecting to create-network');
      navigate('/create-network', { replace: true });
    }
  }, [user, userProfiles, isLoadingProfiles, navigate, location.search]);
  
  // Check for from_invite parameter and show appropriate welcome
  useEffect(() => {
    if (!profile || !user || loadingProfile) return;
    
    const searchParams = new URLSearchParams(location.search);
    const fromInvite = searchParams.get('from_invite');
    
    if (fromInvite === 'true') {
      console.log('[Dashboard] User came from invitation');
      
      // Clean up the URL parameter after a delay
      setTimeout(() => {
        searchParams.delete('from_invite');
        const newUrl = `${location.pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
      }, 3000);
      
      // Show WelcomeMessage for regular members who were invited
      if (profile.role !== 'admin') {
        // Check if we've already shown the welcome message
        const welcomeShownKey = `dashboard_welcome_shown_${profile.network_id}_${profile.id}`;
        const hasShownWelcome = localStorage.getItem(welcomeShownKey);
        
        if (!hasShownWelcome) {
          console.log('[Dashboard] Regular member from invitation, showing welcome message');
          setTimeout(() => {
            setShowWelcomeMessage(true);
            localStorage.setItem(welcomeShownKey, 'true');
          }, 2000);
        }
      }
    }
  }, [profile, user, loadingProfile, location.search]);

  // Show onboarding guide for admin members only
  useEffect(() => {
    if (!profile || !user || loadingProfile) return;
    
    // Check if the user is an admin and hasn't seen the onboarding guide
    if (profile.role === 'admin') {
      // Check if onboarding has been dismissed using the same key as OnboardingGuide component
      const onboardingDismissedKey = `onboarding-dismissed-${profile.network_id}`;
      const isOnboardingDismissed = localStorage.getItem(onboardingDismissedKey);
      
      // Also check the legacy key for backward compatibility
      const hasSeenGuideKey = `onboarding_guide_seen_${profile.network_id}_${user.id}`;
      const hasSeenGuide = localStorage.getItem(hasSeenGuideKey);
      
      if (!isOnboardingDismissed && !hasSeenGuide && !showOnboardingGuide) {
        console.log('[Dashboard] Admin member detected, showing onboarding guide');
        // Wait a bit for the page to fully load
        const timer = setTimeout(() => {
          setShowOnboardingGuide(true);
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [profile, user, loadingProfile, showOnboardingGuide]);

  console.log("Component render cycle. States:", { 
    loadingProfile, 
    loadingMembers,
    loadingNetworkDetails,
    hasProfile: !!profile, 
    memberCount: networkMembers?.length,
    hasNetworkDetails: !!networkDetails,
    networkDetails: networkDetails,
    userProfilesCount: userProfiles.length,
    isLoadingProfiles
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
        console.log('Using active profile from context:', activeProfile?.id);
        
        // If ProfileContext is still loading, wait
        if (isLoadingProfiles) {
          console.log('ProfileContext still loading, waiting...');
          return;
        }
        
        // Use activeProfile from context
        const data = activeProfile;
        
        if (!data) {
          console.error("Error fetching profile: No active profile found");
          // Only retry if we haven't exceeded retry count and we're expecting a profile (from_invite)
          const params = new URLSearchParams(location.search);
          const fromInvite = params.get('from_invite');
          
          if (fromInvite && retryCount < 3) {
            console.log(`Profile not found, retrying in 1 second (attempt ${retryCount + 1}/3)`);
            setRetryCount(prev => prev + 1);
            setTimeout(() => fetchProfile(), 1000); // Retry after 1 second
            return;
          }
          throw { message: 'No active profile found' };
        }

        // Profile found, update state
        setProfile(data);
        setLoadingProfile(false);
        setRetryCount(0); // Reset retry count on success
        
        // Check if profile is incomplete (e.g., no full name or other important fields)
        if (!data.full_name || data.full_name.trim() === '') {
          console.log('Profile found but incomplete');
          
          // Check if user just joined via invitation (within last 5 minutes)
          const joinedAt = new Date(data.updated_at);
          const now = new Date();
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
          const justJoined = joinedAt > fiveMinutesAgo;
          
          // Check for from_profile_setup flag in URL
          const urlParams = new URLSearchParams(window.location.search);
          const fromProfileSetup = urlParams.get('from_profile_setup') === 'true';
          const fromInvite = urlParams.get('from_invite') === 'true';
          
          console.log('Profile completion check:', {
            justJoined,
            fromProfileSetup,
            fromInvite,
            joinedAt: joinedAt.toISOString(),
            now: now.toISOString(),
            hasNetwork: !!data.network_id
          });
          
          // If user just joined or is coming back from profile setup, don't redirect
          if (justJoined || fromProfileSetup || fromInvite) {
            console.log('User just joined or coming from profile setup, showing dashboard');
            setProfile(data);
            setLoadingProfile(false);
            
            // Clear the flags after a delay to ensure everything is loaded properly
            setTimeout(() => {
              if (fromProfileSetup) {
                urlParams.delete('from_profile_setup');
              }
              if (fromInvite) {
                urlParams.delete('from_invite');
              }
              if (fromProfileSetup || fromInvite) {
                const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
                window.history.replaceState({}, '', newUrl);
                console.log('Cleaned up URL parameters after successful profile load');
              }
            }, 2000); // Wait 2 seconds before cleaning up parameters
          } else {
            // Otherwise redirect to complete profile
            console.log('Redirecting to profile edit page');
            setProfile(data);
            setLoadingProfile(false);
            
            // Check if we have from_invite in the current URL to pass it along
            const currentUrlParams = new URLSearchParams(window.location.search);
            const hasFromInvite = currentUrlParams.get('from_invite') === 'true';
            
            // Redirect to profile edit page
            setTimeout(() => {
              if (hasFromInvite) {
                navigate('/profile/edit?from_invite=true');
              } else {
                navigate('/profile/edit');
              }
            }, 1500);
            return;
          }
        } else {
          setProfile(data);
          setLoadingProfile(false);
        }

        console.log('Profile loaded successfully:', data);
        setRetryCount(0); // Reset retry count on success

        // Once profile is fetched, fetch members of the same network
        if (data?.network_id) {
          // Fetch network members
          fetchNetworkMembers(data.network_id).then(response => {
            // Handle both old array format and new paginated format
            const members = Array.isArray(response) ? response : response.members || [];
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
          
          // Fetch categories for the network
          fetchNetworkCategories(data.network_id, true).then(response => {
            if (response.data && !response.error) {
              setCategories(response.data);
            }
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
  }, [user, activeProfile, retryCount, navigate, isLoadingProfiles, location.search]);

  const handleRefresh = () => {
    window.location.reload();
  };
  
  // Handle media upload
  const handleMediaUpload = (uploadResult) => {
    console.log("=== handleMediaUpload called ===");
    console.log("Upload result received:", uploadResult);
    console.log("Upload result URL:", uploadResult.url);
    console.log("Upload result type:", uploadResult.type);
    console.log("Upload result metadata:", uploadResult.metadata);
    
    setMediaUrl(uploadResult.url);
    setMediaType(uploadResult.type);
    setMediaMetadata({
      fileName: uploadResult.metadata?.fileName || uploadResult.fileName,
      fileSize: uploadResult.metadata?.fileSize || uploadResult.fileSize,
      mimeType: uploadResult.metadata?.mimeType || uploadResult.mimeType,
      duration: uploadResult.metadata?.duration,
      thumbnail: uploadResult.metadata?.thumbnail,
      title: uploadResult.metadata?.title,
      artist: uploadResult.metadata?.artist,
      album: uploadResult.metadata?.album,
      albumArt: uploadResult.metadata?.albumArt
    });
    
    console.log("State after setting - mediaUrl:", uploadResult.url);
    console.log("State after setting - mediaType:", uploadResult.type);
    
    // For backward compatibility with existing image preview
    if (uploadResult.type === 'image') {
      setNewPostImagePreview(uploadResult.url);
    } else {
      setNewPostImagePreview('');
    }
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
      console.log("Current media state:", { mediaUrl, mediaType, mediaMetadata });
      
      // Save post directly to the database
      const newPost = {
        profile_id: activeProfile.id,
        title: newPostTitle,
        description: newPostContent,
        url: newPostLink,
        category_id: selectedCategory || null
      };

      // Add media fields if media was uploaded via MediaUpload component
      if (mediaUrl) {
        newPost.media_url = mediaUrl;
        newPost.media_type = mediaType;
        newPost.media_metadata = mediaMetadata;
        
        // For backward compatibility, also set image_url if it's an image
        if (mediaType === 'image') {
          newPost.image_url = mediaUrl;
        }
      } else {
        console.log("No media URL found - mediaUrl is:", mediaUrl);
      }
      
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
      console.log('Saved post media fields:', {
        media_url: data.media_url,
        media_type: data.media_type,
        media_metadata: data.media_metadata
      });
      
      // Reset the form
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostLink('');
      setNewPostImagePreview('');
      setMediaUrl(null);
      setMediaType(null);
      setMediaMetadata({});
      setSelectedCategory('');
      
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

  // Handle member click
  const handleMemberClick = async (memberId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      // First check if member is in networkMembers
      let member = networkMembers.find(m => m.id === memberId);
      
      if (!member) {
        // If not found in networkMembers, fetch from profiles table
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', memberId)
          .single();
          
        if (error) throw error;
        member = profileData;
      }
      
      if (member) {
        setSelectedMember(member);
        setMemberModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching member details:', err);
      // Fallback to profile page if modal fails
      navigate(`/profile/${memberId}`);
    }
  };

  if (loadingProfile) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <ProfileSkeleton />
        <Box sx={{ mt: 3 }}>
          <GridSkeleton items={4} columns={2} />
        </Box>
      </Container>
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
          <Typography variant="body1" sx={{ mb: 2 }}>
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
    <Container maxWidth="lg" sx={{ py: 3, display: 'flex', flexDirection: 'column' }}>
      {/* Header Card */}
      <Paper 
        ref={headerRef}
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

          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Super Admin Button */}
            {(user?.email === 'admin@conclav.com' || user?.app_metadata?.role === 'super_admin') && (
              <Button
                variant="contained"
                component={Link}
                to="/super-admin"
                startIcon={<SuperAdminIcon />}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.15)', 
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.25)'
                  },
                  color: 'white'
                }}
                size="small"
              >
                Super Admin
              </Button>
            )}
            
            {profile.network_id && (
              <Button
                variant="contained" 
                color="error" 
                component={Link}
                to="/network"
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
        </Box>

      </Paper>

      {session && profile ? (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Grid container spacing={2} sx={{ width: '100%' }}>
              {/* Row 1: Profile and Network Management */}
              <Grid item xs={12} sx={{ minHeight: '300px', width: '100%' }}>
                <Grid container spacing={2} sx={{ height: '100%', width: '100%' }}>
                  {/* Profile Card - Left Column */}
                  <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
                    <Card 
                      ref={getItemRef(0)}
                      sx={{ 
                        borderRadius: 2, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        width: '100%',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                     
                    >
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
                      
                      <CardActions sx={{ p: 1, justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
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
                          to={`/profile/${activeProfile.id}`}
                          variant="outlined"
                          color="secondary"
                        >
                          View Profile
                        </Button>
                        
                        <Button 
                          size="small" 
                          startIcon={<PreviewIcon />}
                          component={Link} 
                          to={`/micro-conclav/${activeProfile.id}`}
                          target="_blank"
                          variant="outlined"
                          color="primary"
                        >
                          Micro Conclav
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                  
                  {/* Network Management Widget - Only for Admins */}
                  <Grid item xs={12} md={8} sx={{flexGrow:2}}>
                    {profile.network_id && profile.role === 'admin' ? (
                      <Card 
                        ref={getItemRef(1)}
                        sx={{ 
                          borderRadius: 2, 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          height: '100%',
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                       
                      >
                        <CardHeader
                          title={<Typography variant="subtitle1">Network Management</Typography>}
                          avatar={<NetworkIcon color="primary" />}
                          sx={{ 
                            py: 1,
                            bgcolor: 'rgba(25, 118, 210, 0.05)'
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
                                  to="/admin?tab=members"
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
                            ) : networkDetails?.subscription_status === 'trial' ? (
                              <Card variant="outlined" sx={{ 
                                p: 1, 
                                borderRadius: 1, 
                                bgcolor: 'rgba(255, 193, 7, 0.05)',
                                mb: 1
                              }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box>
                                    <Typography variant="body2" color="warning.main" fontWeight="medium">
                                      Free Trial Active
                                    </Typography>
                                    
                                    <Typography variant="caption" color="text.secondary">
                                      {networkDetails.trial_end_date && (() => {
                                        const now = new Date();
                                        const trialEnd = new Date(networkDetails.trial_end_date);
                                        const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 3600 * 24)));
                                        return daysLeft > 0 ? `${daysLeft} days remaining` : 'Trial expired';
                                      })()}
                                    </Typography>
                                  </Box>
                                  
                                  <Chip 
                                    icon={<AccessTimeIcon fontSize="small" />}
                                    label="Trial" 
                                    color="warning" 
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>
                                
                                {networkDetails?.trial_end_date && (
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                    Trial ends: {new Date(networkDetails.trial_end_date).toLocaleDateString()}
                                  </Typography>
                                )}

                                {profile.role === 'admin' && (
                                  <Button 
                                    variant="contained" 
                                    color="primary" 
                                    fullWidth
                                    component={Link}
                                    to="/pricing"
                                    size="small"
                                    sx={{ mt: 1 }}
                                    startIcon={<StarIcon />}
                                  >
                                    Upgrade Now
                                  </Button>
                                )}
                              </Card>
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
                    ) : profile.network_id && profile.role !== 'admin' ? (
                      // Network Info Widget for Non-Admin Members
                      <Card 
                        ref={getItemRef(1)}
                        sx={{ 
                          borderRadius: 2, 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          height: '100%',
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        <CardHeader
                          title={<Typography variant="subtitle1">My Network</Typography>}
                          avatar={<NetworkIcon color="primary" />}
                          sx={{ 
                            py: 1,
                            bgcolor: 'rgba(25, 118, 210, 0.05)'
                          }}
                        />
                        
                        <CardContent sx={{ py: 1, flexGrow: 1 }}>
                          {/* Network Name */}
                          <Typography variant="h6" color="primary.main" fontWeight="medium" gutterBottom>
                            {networkDetails?.name || 'Loading...'}
                          </Typography>
                          
                          {/* Network Stats */}
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Paper sx={{ 
                                p: 2, 
                                textAlign: 'center',
                                bgcolor: 'rgba(33, 150, 243, 0.1)',
                                borderRadius: 2
                              }}>
                                <Typography variant="h4" fontWeight="500" color="primary.main">
                                  {networkMembers.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Members
                                </Typography>
                              </Paper>
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Paper sx={{ 
                                p: 2, 
                                textAlign: 'center',
                                bgcolor: 'rgba(76, 175, 80, 0.1)',
                                borderRadius: 2
                              }}>
                                <Typography variant="h4" fontWeight="500" color="success.main">
                                  {recentEvents.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Upcoming Events
                                </Typography>
                              </Paper>
                            </Grid>
                          </Grid>
                          
                          {/* View Network Button */}
                          <Button 
                            variant="contained" 
                            fullWidth
                            component={Link}
                            to="/network"
                            startIcon={<ArrowForwardIcon />}
                          >
                            Go to Network
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      // Create Network Widget for Users without Network
                      <Card sx={{ 
                        borderRadius: 2, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                      }}>
                        <CardHeader
                          title={<Typography variant="subtitle1">Create Network</Typography>}
                          avatar={<CreateNewFolderIcon color="primary" />}
                          sx={{ 
                            py: 1,
                            bgcolor: 'rgba(25, 118, 210, 0.05)'
                          }}
                        />
                        
                        <CardContent sx={{ py: 1 }}>
                          <Box sx={{ textAlign: 'center', py: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Create your own network to connect with friends, colleagues, or community members.
                            </Typography>
                            
                            <Button 
                              variant="contained" 
                              color="primary" 
                              component={Link}
                              startIcon={<CreateNewFolderIcon />}
                              to="/create-network"
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
                  <Grid item xs={12} md={6} sx={{ display: 'flex', maxWidth: { md: '50%' } }}>
                    <Card sx={{ 
                      borderRadius: 2, 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      height: '100%',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <CardHeader
                        title={<Typography variant="subtitle1">Create New Post</Typography>}
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
                          
                          <TextField
                            fullWidth
                            placeholder="Add link (optional)"
                            variant="outlined"
                            size="small"
                            sx={{ mb: 1.5 }}
                            value={newPostLink}
                            onChange={(e) => setNewPostLink(e.target.value)}
                            slotProps={{
                              input: {
                                startAdornment: <LanguageIcon color="action" sx={{ mr: 1 }} fontSize="small" />
                              }
                            }}
                          />
                          
                          {/* Category selection */}
                          {categories.length > 0 && (
                            <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                              <InputLabel shrink>Category (optional)</InputLabel>
                              <Select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                label="Category (optional)"
                                displayEmpty
                              >
                                <MenuItem value="">
                                  <em>No category</em>
                                </MenuItem>
                                {categories.map((category) => (
                                  <MenuItem key={category.id} value={category.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Box
                                        sx={{
                                          width: 12,
                                          height: 12,
                                          borderRadius: '50%',
                                          bgcolor: category.color,
                                          flexShrink: 0
                                        }}
                                      />
                                      {category.name}
                                    </Box>
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                          
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
                                  setNewPostImagePreview('');
                                  setMediaUrl(null);
                                  setMediaType(null);
                                  setMediaMetadata({});
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <MediaUpload
                              onUpload={handleMediaUpload}
                              allowedTypes={['IMAGE', 'VIDEO', 'AUDIO', 'PDF']}
                              bucket="profiles"
                              path={`portfolios/${activeProfile.id}`}
                              maxFiles={1}
                              autoUpload={true}
                              showPreview={false}
                              compact={true}
                            />
                            
                            {/* Media upload feedback */}
                            {mediaUrl && (
                              <Chip 
                                label={`${mediaType?.toUpperCase()}: ${mediaMetadata?.fileName}`}
                                color="success"
                                size="small"
                                onDelete={() => {
                                  setMediaUrl(null);
                                  setMediaType(null);
                                  setMediaMetadata({});
                                  setNewPostImagePreview('');
                                }}
                              />
                            )}
                            
                            
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
                            
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Right Column: Upcoming Events */}
                  <Grid item xs={12} md={6} sx={{ display: 'flex', flexGrow: '1', width: { md: '40%' } }}>
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
                          title={<Typography variant="subtitle1">Upcoming Events</Typography>}
                          avatar={<EventIcon color="primary" />}
                          action={
                            <Button 
                              component={Link}
                              to="/network?tab=events"
                              endIcon={<ArrowForwardIcon />}
                              size="small"
                            >
                              View All
                            </Button>
                          }
                          sx={{ 
                            bgcolor: 'rgba(25, 118, 210, 0.05)',
                            py: 1
                          }}
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
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setShowEventDialog(true);
                                    }}
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
                          title={<Typography variant="subtitle1">Upcoming Events</Typography>}
                          avatar={<EventIcon color="primary" />}
                          sx={{ 
                            bgcolor: 'rgba(25, 118, 210, 0.05)',
                            py: 1
                          }}
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
                                to="/admin?tab=events"
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
              
              {/* Row 3: Latest News, Latest Posts, and Moodboard */}
              <Grid item xs={12} sx={{ width: '100%' }}>
                <Grid container spacing={2} sx={{ minHeight: 400}}>
                  {profile.network_id && (
                    <>
                      <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
                        <LatestNewsWidget networkId={profile.network_id} onMemberClick={handleMemberClick} />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
                        <LatestPostsWidget networkId={profile.network_id} onMemberClick={handleMemberClick} />
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12} md={profile.network_id ? 6 : 12} sx={{ display: 'flex', flexGrow: 1 }}>
                    <PersonalMoodboardWidget user={user} />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

          {/* Test Notification System (temporary) */}
          {process.env.NODE_ENV === 'development' && (
            <TestNotificationSystem />
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
          <Typography sx={{ mb: 2 }}>
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
      
      {/* Member Detail Modal */}
      <MembersDetailModal 
        open={memberModalOpen}
        onClose={() => {
          setMemberModalOpen(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        darkMode={false}
      />
      
      {/* Event Details Dialog */}
      <EventDetailsDialog
        open={showEventDialog}
        onClose={() => {
          setShowEventDialog(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        user={user}
      />
      
      {/* Onboarding Guide */}
      <OnboardingGuide
        networkId={profile?.network_id}
        isNetworkAdmin={profile?.role === 'admin'}
        memberCount={networkMembers?.length || 0}
        currentPage="dashboard"
        forceShow={showOnboardingGuide}
        onComplete={() => {
          setShowOnboardingGuide(false);
          // Mark that the admin has seen the guide
          if (profile?.role === 'admin') {
            const hasSeenGuideKey = `onboarding_guide_seen_${profile.network_id}_${user.id}`;
            localStorage.setItem(hasSeenGuideKey, 'true');
          }
        }}
      />
      
      {/* Welcome Message for invited regular members */}
      <WelcomeMessage
        open={showWelcomeMessage}
        onClose={() => setShowWelcomeMessage(false)}
        network={networkDetails}
        user={user}
        onStartTour={() => {
          // Navigate to network page if user wants a tour
          if (profile?.network_id) {
            navigate(`/network/${profile.network_id}`);
          }
        }}
      />
    </Container>
  );
}

export default DashboardPage;