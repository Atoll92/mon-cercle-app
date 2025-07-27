// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { useApp } from '../context/appContext';
import { NetworkProvider } from '../context/networkContext';
import { supabase } from '../supabaseclient';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import MembersDetailModal from '../components/MembersDetailModal';
import MicroConclavWidget from '../components/MicroConclavWidget';
import LatestNewsWidget from '../components/LatestNewsWidget';
import LatestPostsWidget from '../components/LatestPostsWidget';
import TestNotificationSystem from '../components/TestNotificationSystem';
import EventDetailsDialog from '../components/EventDetailsDialog';
import CreateEventDialog from '../components/CreateEventDialog';
import { useFadeIn, useStaggeredAnimation, ANIMATION_DURATION } from '../hooks/useAnimation';
import { ProfileSkeleton, GridSkeleton } from '../components/LoadingSkeleton';
import OnboardingGuide from '../components/OnboardingGuide';
import WelcomeMessage from '../components/WelcomeMessage';
import { fetchNetworkDetails } from '../api/networks';
import Spinner from '../components/Spinner';
import { formatEventDate } from '../utils/dateFormatting';
import { 
  AttachMoney as AttachMoneyIcon,
  Star as StarIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Add as AddIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import { 
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
  Stack,
  Tooltip,
  CardMedia,
  CardHeader
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Edit as EditIcon,
  AdminPanelSettings as AdminIcon,
  ArrowForward as ArrowForwardIcon,
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
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { fetchNetworkMembers } from '../api/networks';
import { fetchNetworkCategories } from '../api/categories';
import FlexFlowBox from '../components/FlexFlowBox';

// Subscription Badge Component
const SubscriptionBadge = ({ plan, status }) => {
  const { t } = useTranslation();
  // Only show badge for active subscriptions
  if (status !== 'active' || !plan) {
    return null;
  }
  
  // Helper function to determine icon and color based on plan
  const getPlanDetails = (plan) => {
    switch (plan) {
      case 'community':
        return {
          label: t('dashboard.subscription.badge.community.label'),
          icon: <GroupsIcon fontSize="small" />,
          color: 'primary',
          tooltip: t('dashboard.subscription.badge.community.tooltip')
        };
      case 'organization':
        return {
          label: t('dashboard.subscription.badge.organization.label'),
          icon: <BusinessIcon fontSize="small" />,
          color: 'primary',
          tooltip: t('dashboard.subscription.badge.organization.tooltip')
        };
      case 'network':
        return {
          label: t('dashboard.subscription.badge.network.label'),
          icon: <PremiumIcon fontSize="small" />,
          color: 'secondary',
          tooltip: t('dashboard.subscription.badge.network.tooltip')
        };
      case 'nonprofit':
        return {
          label: t('dashboard.subscription.badge.nonprofit.label'),
          icon: <SchoolIcon fontSize="small" />,
          color: 'success',
          tooltip: t('dashboard.subscription.badge.nonprofit.tooltip')
        };
      case 'business':
        return {
          label: t('dashboard.subscription.badge.business.label'),
          icon: <VerifiedIcon fontSize="small" />,
          color: 'info',
          tooltip: t('dashboard.subscription.badge.business.tooltip')
        };
      default:
        return {
          label: t('dashboard.subscription.badge.premium.label'),
          icon: <VerifiedIcon fontSize="small" />,
          color: 'primary',
          tooltip: t('dashboard.subscription.badge.premium.tooltip')
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

function DashboardPage() {
  const { user, session } = useAuth();
  const { activeProfile, userProfiles, isLoadingProfiles } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
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
  const [eventParticipation, setEventParticipation] = useState({});
  
  
  // Member detail modal state
  const [selectedMember, setSelectedMember] = useState(null);
  
  // Event details dialog state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  
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
        setError(t('dashboard.errors.profileLoadFailed'));
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
    
    // Check if member onboarding has been completed
    const onboardingCompletedFlags = [
      `member_onboarding_completed_${profile.network_id}_${profile.id}`,
      `member_onboarding_completed_user_${user.id}_network_${profile.network_id}`
    ];
    const hasCompletedOnboarding = onboardingCompletedFlags.some(flag => 
      localStorage.getItem(flag) === 'true'
    );
    
    if (fromInvite === 'true') {
      console.log('[Dashboard] User came from invitation', {
        role: profile.role,
        hasCompletedOnboarding,
        profileComplete: !!(profile.full_name && profile.full_name.trim())
      });
      
      // Clean up the URL parameter after a delay
      setTimeout(() => {
        searchParams.delete('from_invite');
        const newUrl = `${location.pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
      }, 3000);
      
      // Show WelcomeMessage for regular members who completed onboarding
      if (profile.role !== 'admin' && hasCompletedOnboarding) {
        // Check if we've already shown the welcome message
        const welcomeShownKey = `dashboard_welcome_shown_${profile.network_id}_${profile.id}`;
        const hasShownWelcome = localStorage.getItem(welcomeShownKey);
        
        if (!hasShownWelcome) {
          console.log('[Dashboard] Regular member completed onboarding, showing welcome message');
          setTimeout(() => {
            setShowWelcomeMessage(true);
            localStorage.setItem(welcomeShownKey, 'true');
          }, 1500);
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
          throw { message: t('dashboard.errors.noActiveProfile') };
        }

        // Profile found, update state
        setProfile(data);
        setLoadingProfile(false);
        setRetryCount(0); // Reset retry count on success
        
        // Check for invited member flags first
        const urlParams = new URLSearchParams(window.location.search);
        const fromProfileSetup = urlParams.get('from_profile_setup') === 'true';
        const fromInvite = urlParams.get('from_invite') === 'true';
        
        // Also check session storage for recent join flags (more reliable than URL params)
        const recentJoinFlags = [
          `recent_join_${data.network_id}_${data.id}`,
          `recent_join_user_${user.id}_network_${data.network_id}`,
          `profile_created_${data.network_id}_${data.id}`,
          `profile_created_user_${user.id}_network_${data.network_id}`
        ];
        const hasRecentJoinFlag = recentJoinFlags.some(flag => 
          sessionStorage.getItem(flag) === 'true' || localStorage.getItem(flag) === 'true'
        );
        
        // Check if member onboarding has already been completed
        const onboardingCompletedFlags = [
          `member_onboarding_completed_${data.network_id}_${data.id}`,
          `member_onboarding_completed_user_${user.id}_network_${data.network_id}`
        ];
        const hasCompletedOnboarding = onboardingCompletedFlags.some(flag => 
          localStorage.getItem(flag) === 'true'
        );
        
        console.log('Dashboard profile check:', {
          fromProfileSetup,
          fromInvite,
          hasRecentJoinFlag,
          hasCompletedOnboarding,
          hasNetwork: !!data.network_id,
          fullName: data.full_name,
          profileId: data.id,
          userId: user.id
        });
        
        // If user just joined via invitation and hasn't completed onboarding, redirect them to complete profile
        if ((fromInvite || hasRecentJoinFlag) && data.network_id && !hasCompletedOnboarding) {
          console.log('Redirecting invited member to profile edit page for onboarding');
          setProfile(data);
          setLoadingProfile(false);
          
          // Redirect to profile edit page with member onboarding wizard
          setTimeout(() => {
            navigate('/profile/edit?from_invite=true');
          }, 1000);
          return;
        }
        
        // Check if profile is incomplete (for non-invited users)
        if (!data.full_name || data.full_name.trim() === '') {
          console.log('Profile found but incomplete (non-invited user)');
          
          // Check if user just joined (within last 5 minutes)
          const joinedAt = new Date(data.updated_at);
          const now = new Date();
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
          const justJoined = joinedAt > fiveMinutesAgo;
          
          console.log('Non-invited profile completion check:', {
            justJoined,
            fromProfileSetup,
            joinedAt: joinedAt.toISOString(),
            now: now.toISOString(),
            hasNetwork: !!data.network_id
          });
          
          // If user just joined or is coming back from profile setup, don't redirect
          if (justJoined || fromProfileSetup) {
            console.log('User just joined or coming from profile setup, showing dashboard');
            setProfile(data);
            setLoadingProfile(false);
            
            // Clear the flags after a delay to ensure everything is loaded properly
            setTimeout(() => {
              if (fromProfileSetup) {
                urlParams.delete('from_profile_setup');
              }
              if (fromProfileSetup) {
                const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
                window.history.replaceState({}, '', newUrl);
                console.log('Cleaned up URL parameters after successful profile load');
              }
            }, 2000); // Wait 2 seconds before cleaning up parameters
          } else {
            // Otherwise redirect to regular profile edit
            console.log('Redirecting to profile edit page');
            setProfile(data);
            setLoadingProfile(false);
            
            setTimeout(() => {
              navigate('/profile/edit');
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
        setError(t('dashboard.errors.profileLoadFailed'));
        setLoadingProfile(false);
        setLoadingNetworkDetails(false);
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

  // Define fetchUpcomingEvents as a standalone function
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
      
      // Fetch participation status for each event
      if (data && data.length > 0 && activeProfile?.id) {
        const eventIds = data.map(event => event.id);
        
        const { data: participationData, error: participationError } = await supabase
          .from('event_participations')
          .select('event_id, status')
          .eq('profile_id', activeProfile.id)
          .in('event_id', eventIds);
          
        if (!participationError && participationData) {
          const participationMap = {};
          participationData.forEach(p => {
            participationMap[p.event_id] = p.status;
          });
          setEventParticipation(participationMap);
        }
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
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
      <Container maxWidth="sm" sx={{ py: 4 }}>
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
            {t('dashboard.profileSetup.required')}
          </Typography>
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
          >
            {t('dashboard.profileSetup.message')}
          </Alert>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Spinner size={120} />
          </Box>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
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
            {t('dashboard.errors.somethingWrong')}
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
            {t('dashboard.buttons.refreshPage')}
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
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
            {t('dashboard.profileSetup.inProgress')}
          </Typography>
          <Spinner size={120} sx={{ my: 2 }} />
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('dashboard.profileSetup.settingUp')}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/profile/edit')}
            startIcon={<EditIcon />}
            sx={{ mt: 2 }}
          >
            {t('dashboard.profileSetup.goToSetup')}
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 3, display: 'flex', flexDirection: 'column' }}>
        {/* Dashboard Title */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
              color: theme => theme.palette.text.primary,
              letterSpacing: '-0.5px'
            }}
          >
            {t('dashboard.title')}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: theme => theme.palette.text.secondary,
              mt: 0.5
            }}
          >
            {t('dashboard.welcome', { name: profile?.full_name || user?.email?.split('@')[0] || 'there' })}
          </Typography>
        </Box>
        
        {/* Header Card */}
        <Paper 
        ref={headerRef}
        elevation={3} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          mb: 2,
          display: 'none' // Hide the old header since we're using NetworkHeader
        }}
      >
      </Paper>

      {session && profile ? (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* <Grid container spacing={2} sx={{ width: '100%' }}> */}
              {/* Row 1: Profile and Network Management */}
              <FlexFlowBox>
                {/* <Grid container spacing={2} sx={{ height: '100%', width: '100%' }}> */}
                  {/* Profile Card - Left Column */}
                  <Grid item xs={12} md={4}>
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
                            {profile.full_name || user?.email?.split('@')[0] || t('dashboard.profile.notSet')}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Chip 
                              label={profile.role === 'admin' ? t('dashboard.profile.role.admin') : t('dashboard.profile.role.member')} 
                              color={profile.role === 'admin' ? 'primary' : 'default'} 
                              size="small" 
                            />
                            
                            {profile.network_id && (
                              <Chip 
                                icon={<NetworkIcon fontSize="small" />}
                                label={t('dashboard.profile.connected')} 
                                color="success" 
                                size="small" 
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                        
                        <Divider sx={{ mb: 1.5 }} />
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>{t('dashboard.profile.email')}:</strong> {user?.email}
                        </Typography>
                        
                        {profile.contact_email && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>{t('dashboard.profile.contact')}:</strong> {profile.contact_email}
                          </Typography>
                        )}
                        
                        {profile.bio && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              {t('dashboard.profile.bio')}:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {profile.bio.length > 80 ? profile.bio.substring(0, 80) + '...' : profile.bio}
                            </Typography>
                          </Box>
                        )}
                        
                        {profile.skills && profile.skills.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              {t('dashboard.profile.skills')}:
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
                      
                      <CardActions sx={{ 
                        p: 1, 
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 1,
                        '& .MuiButton-root': {
                          width: { xs: '100%', sm: 'auto' }
                        }
                      }}>
                        <Button 
                          size="small" 
                          startIcon={<EditIcon />}
                          component={Link} 
                          to="/profile/edit"
                          variant="outlined"
                          style={{margin: '0 auto'}}
                        >
                          {t('dashboard.buttons.editProfile')}
                        </Button>
                        
                        <Button 
                          size="small" 
                          startIcon={<PersonIcon />}
                          component={Link} 
                          to={`/profile/${activeProfile.id}`}
                          variant="outlined"
                          color="secondary"
                          style={{margin: '0 auto'}}
                        >
                          {t('dashboard.buttons.viewProfile')}
                        </Button>
                        
                        <Button 
                          size="small" 
                          startIcon={<PreviewIcon />}
                          component={Link} 
                          to={activeProfile?.username ? `/micro/${activeProfile.username}` : `/micro-conclav/${activeProfile.id}`}
                          target="_blank"
                          variant="outlined"
                          color="primary"
                          style={{margin: '0 auto'}}
                        >
                          {t('dashboard.buttons.myMicroConclav')}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                  
                  {/* Network Management Widget - Only for Admins */}
                  <Grid item xs={12} md={8}>
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
                          title={<Typography variant="subtitle1">{t('dashboard.network.management')}</Typography>}
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
                                  {t('dashboard.buttons.adminPanel')}
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
                                  {t('dashboard.buttons.inviteMembers')}
                                </Button>
                              </Box>
                              
                              <Typography variant="caption" color="text.secondary">
                                {t('dashboard.network.adminPrivileges')}
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Super Admin Button - Only for super admin accounts */}
                          {(user?.email === 'admin@conclav.com' || user?.app_metadata?.role === 'super_admin') && (
                            <Box sx={{ mb: 2 }}>
                              <Button 
                                variant="contained" 
                                color="warning" 
                                component={Link} 
                                to="/super-admin"
                                startIcon={<AdminIcon />}
                                size="small"
                                fullWidth
                              >
                                Super Admin Panel
                              </Button>
                              
                              <Typography variant="caption" color="text.secondary">
                                System-wide administration
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Subscription Status Card */}
                          <Box sx={{ mb: 2 }}>
                            {loadingNetworkDetails ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Spinner size={40} sx={{ mr: 1 }} />
                                <Typography variant="body2">{t('dashboard.network.loadingSubscription')}</Typography>
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
                                      {t('dashboard.subscription.trial.active')}
                                    </Typography>
                                    
                                    <Typography variant="caption" color="text.secondary">
                                      {networkDetails.trial_end_date && (() => {
                                        const now = new Date();
                                        const trialEnd = new Date(networkDetails.trial_end_date);
                                        const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 3600 * 24)));
                                        return daysLeft > 0 ? t('dashboard.subscription.trial.daysRemaining', { days: daysLeft }) : t('dashboard.subscription.trial.expired');
                                      })()}
                                    </Typography>
                                  </Box>
                                  
                                  <Chip 
                                    icon={<AccessTimeIcon fontSize="small" />}
                                    label={t('dashboard.subscription.trial.active')} 
                                    color="warning" 
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>
                                
                                {networkDetails?.trial_end_date && (
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                    {t('dashboard.subscription.trial.endsOn', { date: new Date(networkDetails.trial_end_date).toLocaleDateString() })}
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
                                    {t('dashboard.buttons.upgradeNow')}
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
                                      {t('dashboard.subscription.active.planName', { plan: (networkDetails.subscription_plan || 'Organization').charAt(0).toUpperCase() + (networkDetails.subscription_plan || 'Organization').slice(1) })}
                                    </Typography>
                                    
                                    <Typography variant="caption" color="text.secondary">
                                      {t('dashboard.subscription.active.description')}
                                    </Typography>
                                  </Box>
                                  
                                  <Chip 
                                    icon={<StarIcon fontSize="small" />}
                                    label={t('dashboard.subscription.active.premium')} 
                                    color="success" 
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>
                                
                                {networkDetails?.subscription_end_date && (
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                    {t('dashboard.subscription.active.nextBilling', { date: new Date(networkDetails.subscription_end_date).toLocaleDateString() })}
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
                                    {t('dashboard.buttons.manageSubscription')}
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
                                      {t('dashboard.subscription.canceled.title')}
                                    </Typography>
                                    
                                    <Typography variant="caption" color="text.secondary">
                                      {t('dashboard.subscription.canceled.description')}
                                    </Typography>
                                  </Box>
                                  
                                  <Chip 
                                    icon={<HourglassEmptyIcon fontSize="small" />}
                                    label={t('dashboard.subscription.canceled.endingSoon')} 
                                    color="warning" 
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>
                                
                                {networkDetails?.subscription_end_date && (
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                    {t('dashboard.subscription.canceled.accessUntil', { date: new Date(networkDetails.subscription_end_date).toLocaleDateString() })}
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
                                      {t('dashboard.buttons.renewPlan')}
                                    </Button>
                                    
                                    <Button 
                                      variant="outlined" 
                                      color="primary" 
                                      component={Link}
                                      to="/billing"
                                      size="small"
                                      fullWidth
                                    >
                                      {t('dashboard.buttons.billing')}
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
                                      {t('dashboard.subscription.free.title')}
                                    </Typography>
                                    
                                    <Typography variant="caption" color="text.secondary">
                                      {t('dashboard.subscription.free.description')}
                                    </Typography>
                                  </Box>
                                  
                                  <Chip 
                                    label={t('dashboard.subscription.free.label')} 
                                    variant="outlined"
                                    size="small"
                                  />
                                </Box>
                                
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
                                    {t('dashboard.subscription.free.limits')}
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
                                    {t('dashboard.buttons.upgradePlan')}
                                  </Button>
                                )}
                              </Card>
                            )}
                          </Box>
                          
                          {/* Network Stats */}
                          <Grid container spacing={1.5}>
                            <Grid item size={6} style={{maxWidth: '100px'}}>
                              <Paper sx={{ 
                                p: 1, 
                                textAlign: 'center',
                                bgcolor: 'rgba(33, 150, 243, 0.1)',
                                borderRadius: 2,
                                height: '100%',
                                minHeight: '80px',
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                boxSizing: 'border-box'
                              }}>
                                <Typography variant="h5" fontWeight="500" color="primary.main">
                                  {networkMembers.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {t('dashboard.network.members')}
                                </Typography>
                              </Paper>
                            </Grid>
                            
                            <Grid item size={6} style={{maxWidth: '100px'}}>
                              <Paper sx={{ 
                                p: 1, 
                                textAlign: 'center',
                                bgcolor: 'rgba(76, 175, 80, 0.1)',
                                borderRadius: 2,
                                height: '100%',
                                minHeight: '80px',
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                boxSizing: 'border-box'
                              }}>
                                <Typography variant="h5" fontWeight="500" color="success.main">
                                  {recentEvents.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {t('dashboard.network.events')}
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
                          title={<Typography variant="subtitle1">{t('dashboard.network.myNetwork')}</Typography>}
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
                                  {t('dashboard.network.members')}
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
                                  {t('dashboard.network.upcomingEvents')}
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
                            {t('dashboard.buttons.goToNetwork')}
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
                          title={<Typography variant="subtitle1">{t('dashboard.network.createNetwork')}</Typography>}
                          avatar={<CreateNewFolderIcon color="primary" />}
                          sx={{ 
                            py: 1,
                            bgcolor: 'rgba(25, 118, 210, 0.05)'
                          }}
                        />
                        
                        <CardContent sx={{ py: 1 }}>
                          <Box sx={{ textAlign: 'center', py: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {t('dashboard.network.createDescription')}
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
                              {t('dashboard.buttons.createNetwork')}
                            </Button>
                            
                            <Chip
                              icon={<InvitationIcon fontSize="small" />}
                              label={t('dashboard.network.waitingForInvitations')} 
                              variant="outlined"
                              color="primary"
                              size="small"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                  </Grid>

                  {/* {t('dashboard.network.upcomingEvents')} - Full width */}
                  <Grid item xs={12} sx={{ display: 'flex', flexGrow: '1' }}>
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
                          title={<Typography variant="subtitle1">{t('dashboard.network.upcomingEvents')}</Typography>}
                          avatar={<EventIcon color="primary" />}
                          action={
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {profile.role === 'admin' && (
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={() => setCreateEventOpen(true)}
                                >
                                  {t('dashboard.buttons.createEvent')}
                                </Button>
                              )}
                              <Button 
                                component={Link}
                                to="/network?tab=events"
                                endIcon={<ArrowForwardIcon />}
                                size="small"
                              >
                                {t('dashboard.buttons.viewAll')}
                              </Button>
                            </Box>
                          }
                          sx={{ 
                            bgcolor: 'rgba(25, 118, 210, 0.05)',
                            py: 1
                          }}
                        />
                        
                        {loadingEvents ? (
                          <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Spinner size={120} />
                          </Box>
                        ) : (
                          <CardContent sx={{ py: 0.5, flexGrow: 1, overflow: 'auto' }}>
                            <Stack spacing={1}>
                              {recentEvents.map(event => {
                                const participationStatus = eventParticipation[event.id];
                                const getParticipationIcon = (status) => {
                                  switch (status) {
                                    case 'attending':
                                      return <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />;
                                    case 'not_attending':
                                      return <CancelIcon fontSize="small" sx={{ color: 'error.main' }} />;
                                    case 'maybe':
                                      return <HelpIcon fontSize="small" sx={{ color: 'warning.main' }} />;
                                    default:
                                      return null;
                                  }
                                };
                                
                                return (
                                  <Paper
                                    key={event.id}
                                    variant="outlined"
                                    sx={{ 
                                      p: 1, 
                                      borderRadius: 2,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1.5,
                                      minHeight: 80
                                    }}
                                  >
                                    <Box sx={{ 
                                      width: 120, // 3x larger than original 40px
                                      height: 80,  // Landscape aspect ratio
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
                                          <Typography variant="body2" fontWeight="bold" sx={{ lineHeight: 1 }}>
                                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                                          </Typography>
                                          <Typography variant="h5" fontWeight="bold" sx={{ lineHeight: 1 }}>
                                            {new Date(event.date).getDate()}
                                          </Typography>
                                        </>
                                      )}
                                    </Box>
                                    
                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                      <Typography variant="subtitle2" noWrap sx={{ mb: 0.5 }}>
                                        {event.title}
                                      </Typography>
                                      
                                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                          <EventIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                                          {formatEventDate(event.date)}
                                        </Typography>
                                        
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                          <LocationOnIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                                          {event.location}
                                        </Typography>
                                      </Box>
                                      
                                      {/* Participation Status */}
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {participationStatus ? (
                                          <>
                                            {getParticipationIcon(participationStatus)}
                                            <Typography variant="caption" color="text.secondary">
                                              {participationStatus === 'attending' ? t('dashboard.events.participation.attending') :
                                               participationStatus === 'not_attending' ? t('dashboard.events.participation.notAttending') :
                                               participationStatus === 'maybe' ? t('dashboard.events.participation.maybe') : ''}
                                            </Typography>
                                          </>
                                        ) : (
                                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            {t('dashboard.events.participation.noResponse')}
                                          </Typography>
                                        )}
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
                                      {t('dashboard.buttons.view')}
                                    </Button>
                                  </Paper>
                                );
                              })}
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
                          title={<Typography variant="subtitle1">{t('dashboard.network.upcomingEvents')}</Typography>}
                          avatar={<EventIcon color="primary" />}
                          sx={{ 
                            bgcolor: 'rgba(25, 118, 210, 0.05)',
                            py: 1
                          }}
                        />
                        <CardContent sx={{ py: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                          <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {t('dashboard.events.noUpcoming')}
                            </Typography>
                            
                            {profile.network_id && profile.role === 'admin' && (
                              <Button 
                                variant="outlined" 
                                component={Link} 
                                to="/admin?tab=events"
                                startIcon={<AddIcon />}
                                size="small"
                              >
                                {t('dashboard.buttons.createEvent')}
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                  </Grid>
                  
                  {/* Latest News and Latest Posts - Side by side */}
                  {profile.network_id && (
                    <>
                      <Grid item xs={12} sm={6} md={6}>
                        <LatestNewsWidget networkId={profile.network_id} onMemberClick={handleMemberClick} />
                      </Grid>
                      <Grid item xs={12} sm={6} md={6}>
                        <LatestPostsWidget networkId={profile.network_id} onMemberClick={handleMemberClick} />
                      </Grid>
                    </>
                  )}
                  
              </FlexFlowBox>
              
              {/* Micro Conclav Widget - Always visible, full width row */}
              <Box sx={{ 
                mt: 2, 
                minHeight: 400, 
                width: '100%'
              }}>
                <MicroConclavWidget />
              </Box>

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
            {t('dashboard.notLoggedIn')}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/login')}
            startIcon={<ArrowForwardIcon />}
          >
            {t('dashboard.buttons.goToLogin')}
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
      
      {/* Create Event Dialog */}
      <CreateEventDialog
        open={createEventOpen}
        onClose={() => setCreateEventOpen(false)}
        networkId={profile?.network_id}
        profileId={profile?.id}
        onEventCreated={() => {
          // Refresh events by triggering fetchUpcomingEvents
          if (profile?.network_id) {
            fetchUpcomingEvents(profile.network_id);
          }
        }}
      />
      
      </Container>
    </Box>
  );
}

// Wrapper component that provides NetworkProvider
const DashboardPageWrapper = () => {
  const { userNetworkId, fetchingNetwork } = useApp();

  if (fetchingNetwork) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <GridSkeleton items={6} columns={3} />
      </Container>
    );
  }

  if (userNetworkId) {
    return (
      <NetworkProvider networkId={userNetworkId}>
        <DashboardPage />
      </NetworkProvider>
    );
  } else {
    // No network - render without NetworkProvider
    return <DashboardPage />;
  }
};

export default DashboardPageWrapper;