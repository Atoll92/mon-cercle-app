// src/pages/DashboardPage.jsx
import { useState, useEffect, useLayoutEffect } from 'react';
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
import EventDetailsDialog from '../components/EventDetailsDialog';
import CreateEventDialog from '../components/CreateEventDialog';
import UpcomingEventsWidget from '../components/UpcomingEventsWidget';
import { useFadeIn, useStaggeredAnimation, ANIMATION_DURATION } from '../hooks/useAnimation';
import { ProfileSkeleton, GridSkeleton } from '../components/LoadingSkeleton';
import OnboardingGuide from '../components/OnboardingGuide';
import WelcomeMessage from '../components/WelcomeMessage';
import { fetchNetworkDetails, fetchNetworkMembers } from '../api/networks';
import Spinner from '../components/Spinner';
import { formatEventDate } from '../utils/dateFormatting';
import { 
  AttachMoney as AttachMoneyIcon,
  Star as StarIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Add as AddIcon,
  Preview as PreviewIcon,
  Person as PersonIcon, 
  Edit as EditIcon,
  AdminPanelSettings as AdminIcon,
  ArrowForward as ArrowForwardIcon,
  Event as EventIcon,
  Refresh as RefreshIcon,
  NetworkWifi as NetworkIcon,
  LocationOn as LocationOnIcon,
  PersonAdd as PersonAddIcon,
  WorkspacePremium as PremiumIcon,
  Verified as VerifiedIcon,
  Groups as GroupsIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  HourglassTop as HourglassTopIcon
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
  CardHeader
} from '@mui/material';

// Subscription Badge Component
const SubscriptionBadge = ({ plan, status }) => {
  const { t } = useTranslation();
  if (status !== 'active' || !plan) return null;
  
  const planDetails = {
    community: { icon: <GroupsIcon fontSize="small" />, color: 'primary' },
    organization: { icon: <BusinessIcon fontSize="small" />, color: 'primary' },
    network: { icon: <PremiumIcon fontSize="small" />, color: 'secondary' },
    nonprofit: { icon: <SchoolIcon fontSize="small" />, color: 'success' },
    business: { icon: <VerifiedIcon fontSize="small" />, color: 'info' }
  }[plan] || { icon: <VerifiedIcon fontSize="small" />, color: 'primary' };

  return (
    <Tooltip title={t(`dashboard.subscription.badge.${plan}.tooltip`, t('dashboard.subscription.badge.premium.tooltip'))}>
      <Chip
        icon={planDetails.icon}
        label={t(`dashboard.subscription.badge.${plan}.label`, t('dashboard.subscription.badge.premium.label'))}
        color={planDetails.color}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 500, '& .MuiChip-icon': { color: `${planDetails.color}.main` } }}
      />
    </Tooltip>
  );
};

// Subscription Status Card Component
const SubscriptionStatusCard = ({ networkDetails, loadingNetworkDetails, profile, t }) => {
  if (loadingNetworkDetails) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Spinner size={40} sx={{ mr: 1 }} />
        <Typography variant="body2">{t('dashboard.network.loadingSubscription')}</Typography>
      </Box>
    );
  }

  const status = networkDetails?.subscription_status;
  const isAdmin = profile?.role === 'admin';
  
  const statusConfig = {
    trial: {
      bgcolor: 'rgba(255, 193, 7, 0.05)',
      color: 'warning.main',
      chipIcon: <AccessTimeIcon fontSize="small" />,
      chipColor: 'warning'
    },
    active: {
      bgcolor: 'rgba(33, 150, 243, 0.05)',
      color: 'primary.main',
      chipIcon: <StarIcon fontSize="small" />,
      chipColor: 'success'
    },
    canceled: {
      bgcolor: 'rgba(255, 152, 0, 0.05)',
      color: 'warning.main',
      chipIcon: <HourglassEmptyIcon fontSize="small" />,
      chipColor: 'warning'
    },
    free: {
      bgcolor: 'transparent',
      color: 'text.primary'
    }
  }[status] || statusConfig.free;

  // Calculate trial days remaining
  const getTrialDaysRemaining = () => {
    if (!networkDetails?.trial_end_date) return null;
    const now = new Date();
    const trialEnd = new Date(networkDetails.trial_end_date);
    const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 3600 * 24)));
    return daysLeft > 0 ? t('dashboard.subscription.trial.daysRemaining', { days: daysLeft }) : t('dashboard.subscription.trial.expired');
  };

  return (
    <Card variant="outlined" sx={{ p: 1, borderRadius: 1, bgcolor: statusConfig.bgcolor, mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="body2" color={statusConfig.color} fontWeight="medium">
            {status === 'active' 
              ? t('dashboard.subscription.active.planName', { plan: (networkDetails.subscription_plan || 'Organization').charAt(0).toUpperCase() + (networkDetails.subscription_plan || 'Organization').slice(1) })
              : t(`dashboard.subscription.${status || 'free'}.title`)}
          </Typography>
          
          <Typography variant="caption" color="text.secondary">
            {status === 'trial' && networkDetails?.trial_end_date ? getTrialDaysRemaining() : t(`dashboard.subscription.${status || 'free'}.description`)}
          </Typography>
        </Box>
        
        {status !== 'free' && statusConfig.chipIcon && (
          <Chip 
            icon={statusConfig.chipIcon}
            label={t(`dashboard.subscription.${status}.${status === 'active' ? 'premium' : status === 'canceled' ? 'endingSoon' : 'active'}`)} 
            color={statusConfig.chipColor} 
            size="small"
            variant="outlined"
          />
        )}
        {status === 'free' && (
          <Chip label={t('dashboard.subscription.free.label')} variant="outlined" size="small" />
        )}
      </Box>
      
      {/* End date info */}
      {(status === 'trial' && networkDetails?.trial_end_date) && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          {t('dashboard.subscription.trial.endsOn', { date: new Date(networkDetails.trial_end_date).toLocaleDateString() })}
        </Typography>
      )}
      {(status === 'active' && networkDetails?.subscription_end_date) && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          {t('dashboard.subscription.active.nextBilling', { date: new Date(networkDetails.subscription_end_date).toLocaleDateString() })}
        </Typography>
      )}
      {(status === 'canceled' && networkDetails?.subscription_end_date) && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          {t('dashboard.subscription.canceled.accessUntil', { date: new Date(networkDetails.subscription_end_date).toLocaleDateString() })}
        </Typography>
      )}
      
      {/* Admin buttons */}
      {isAdmin && (
        <Box sx={{ mt: 1 }}>
          {(status === 'trial' || status === 'free') && (
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              component={Link}
              to="/pricing"
              size="small"
              startIcon={<StarIcon />}
            >
              {t(status === 'trial' ? 'dashboard.buttons.upgradeNow' : 'dashboard.buttons.upgradePlan')}
            </Button>
          )}
          {status === 'active' && (
            <Button 
              variant="outlined" 
              color="primary" 
              fullWidth
              component={Link}
              to="/billing"
              size="small"
              startIcon={<AttachMoneyIcon />}
            >
              {t('dashboard.buttons.manageSubscription')}
            </Button>
          )}
          {status === 'canceled' && (
            <Box sx={{ display: 'flex', gap: 1 }}>
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
        </Box>
      )}
    </Card>
  );
};

// Event Card Component - Reusable for both admin and non-admin
const EventCard = ({ event, participationStatus, onViewDetails, t }) => {
  const getParticipationIcon = (status) => {
    switch (status) {
      case 'attending': return <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />;
      case 'declined': return <CancelIcon fontSize="small" sx={{ color: 'error.main' }} />;
      case 'maybe': return <HelpIcon fontSize="small" sx={{ color: 'warning.main' }} />;
      default: return null;
    }
  };
  
  return (
    <Paper
      variant="outlined"
      sx={{ p: 1, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 80, flexWrap: 'wrap' }}
    >
      <Box sx={{ 
        width: 120, height: 80,
        bgcolor: event.cover_image_url ? 'transparent' : 'primary.light',
        borderRadius: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: 'white', overflow: 'hidden', flexShrink: 0
      }}>
        {event.cover_image_url ? (
          <img src={event.cover_image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
        <Typography variant="subtitle2" noWrap sx={{ mb: 0.5 }}>{event.title}</Typography>
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
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {participationStatus ? (
            <>
              {getParticipationIcon(participationStatus)}
              <Typography variant="caption" color="text.secondary">
                {t(`dashboard.events.participation.${participationStatus === 'declined' ? 'notAttending' : participationStatus}`)}
              </Typography>
            </>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {t('dashboard.events.participation.noResponse')}
            </Typography>
          )}
        </Box>
      </Box>
      
      <Button variant="outlined" size="small" onClick={onViewDetails} sx={{ flexShrink: 0, minWidth: 'auto', px: 1 }}>
        {t('dashboard.buttons.view')}
      </Button>
    </Paper>
  );
};

// Rezo Pro Spec network ID
const REZOPROSPEC_NETWORK_ID = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508';

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
  const [loadingNetworkDetails, setLoadingNetworkDetails] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [recentEvents, setRecentEvents] = useState([]);
  const [eventParticipation, setEventParticipation] = useState({});
  
  // Modal states
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [showOnboardingGuide, setShowOnboardingGuide] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [checkingModerationStatus, setCheckingModerationStatus] = useState(false);

  // Animation setup - must be at top level, not conditional
  const headerRef = useFadeIn(0, ANIMATION_DURATION.normal);
  const getItemRef = useStaggeredAnimation(10, 100, 50);

  // Scroll to top when component mounts - using useLayoutEffect for immediate scroll before paint
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Redirect to create-network if user has no profiles
  useEffect(() => {
    if (!isLoadingProfiles && user && userProfiles.length === 0) {
      // Check if coming from invitation signup
      const searchParams = new URLSearchParams(location.search);
      const fromInvite = searchParams.get('from_invite');
      
      if (fromInvite) {
        setError(t('dashboard.errors.profileLoadFailed'));
        return;
      }
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
        const timer = setTimeout(() => {
          setShowOnboardingGuide(true);
        }, 1500);

        return () => clearTimeout(timer);
      }
    }
  }, [profile, user, loadingProfile, showOnboardingGuide]);

  // Check moderation status for Rezo Pro Spec network
  useEffect(() => {
    if (!profile || profile.network_id !== REZOPROSPEC_NETWORK_ID || profile.role === 'admin') return;


    // Only check if moderation status is pending
    if (profile.moderation_status === 'approved') return;

    let intervalId;

    const checkModerationStatus = async () => {
      setCheckingModerationStatus(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('moderation_status')
          .eq('id', profile.id)
          .single();

        if (!error && data && data.moderation_status !== 'pending') {
          // Status changed, reload the profile
          window.location.reload();
        }
      } catch (err) {
        console.error('Error checking moderation status:', err);
      } finally {
        setCheckingModerationStatus(false);
      }
    };

    // Set up periodic checking every 10 seconds
    intervalId = setInterval(checkModerationStatus, 10000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [profile]);




  useEffect(() => {
    // Fetch the user's profile data when the component mounts or user changes
    const fetchProfile = async () => {
      if (!user) return;
      
      setLoadingProfile(true);
      setError(null);
      
      try {
        
        // If ProfileContext is still loading, wait
        if (isLoadingProfiles) return;
        
        // Use activeProfile from context
        const data = activeProfile;
        
        if (!data) {
          console.error("Error fetching profile: No active profile found");
          // Only retry if we haven't exceeded retry count and we're expecting a profile (from_invite)
          const params = new URLSearchParams(location.search);
          const fromInvite = params.get('from_invite');
          
          if (fromInvite && retryCount < 3) {
            setRetryCount(prev => prev + 1);
            setTimeout(() => fetchProfile(), 1000);
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
        
        
        // If user just joined via invitation and hasn't completed onboarding, redirect them to complete profile
        if ((fromInvite || hasRecentJoinFlag) && data.network_id && !hasCompletedOnboarding) {
          setProfile(data);
          setLoadingProfile(false);
          setTimeout(() => navigate('/profile/edit?from_invite=true'), 1000);
          return;
        }
        
        // Check if profile is incomplete (for non-invited users)
        if (!data.full_name || data.full_name.trim() === '') {
          // Check if user just joined (within last 5 minutes)
          const joinedAt = new Date(data.updated_at);
          const now = new Date();
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
          const justJoined = joinedAt > fiveMinutesAgo;
          
          // If user just joined or is coming back from profile setup, don't redirect
          if (justJoined || fromProfileSetup) {
            setProfile(data);
            setLoadingProfile(false);
            
            // Clear the flags after a delay
            setTimeout(() => {
              if (fromProfileSetup) {
                urlParams.delete('from_profile_setup');
                const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
                window.history.replaceState({}, '', newUrl);
              }
            }, 2000);
          } else {
            // Otherwise redirect to regular profile edit
            setProfile(data);
            setLoadingProfile(false);
            setTimeout(() => navigate('/profile/edit'), 1500);
            return;
          }
        } else {
          setProfile(data);
          setLoadingProfile(false);
        }

        setRetryCount(0); // Reset retry count on success

        // Once profile is fetched, fetch members of the same network
        if (data?.network_id) {
          // Fetch network members
          fetchNetworkMembers(data.network_id).then(response => {
            // Handle both old array format and new paginated format
            const members = Array.isArray(response) ? response : response.members || [];
            setNetworkMembers(members);
          });
          
          // Fetch network details (for subscription info)
          setLoadingNetworkDetails(true);
          fetchNetworkDetails(data.network_id).then(details => {
            setNetworkDetails(details);
            setLoadingNetworkDetails(false);
          });
          
          // Fetch upcoming events for the network
          fetchUpcomingEvents(data.network_id);
        } else {
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

  // Handle participation status change
  const handleParticipationChange = (eventId, newStatus) => {
    setEventParticipation(prev => ({
      ...prev,
      [eventId]: newStatus
    }));
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

  const isAdmin = profile?.role === 'admin';

  // Show moderation pending screen for Rezo Pro Spec network with pending status
  if (profile && profile.network_id === REZOPROSPEC_NETWORK_ID && profile.moderation_status !== 'approved' && profile.role !== 'admin') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999
        }}
      >
        <Paper
          elevation={10}
          sx={{
            p: 6,
            maxWidth: 500,
            width: '90%',
            borderRadius: 3,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.98)'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <HourglassTopIcon sx={{ fontSize: 60, color: '#667eea' }} />
          </Box>

          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#333' }}>
            Demande en cours de validation
          </Typography>

          <Typography variant="body1" sx={{ mb: 3, color: '#666', lineHeight: 1.6 }}>
            Votre demande d'adhésion à Rezo Pro Spec est en cours d'examen par un administrateur.
          </Typography>

          <Box sx={{
            p: 3,
            bgcolor: '#f5f5f5',
            borderRadius: 2,
            mb: 3,
            border: '1px solid #e0e0e0'
          }}>
            <Typography variant="body2" sx={{ color: '#555' }}>
              Vous recevrez un email dès que votre demande sera approuvée. La validation est généralement effectuée dans les 24 à 48 heures.
            </Typography>
          </Box>
        </Paper>
      </Box>
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
              {/* Row 1: Profile and Network Management/Upcoming Events */}
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                width: '100%', 
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'flex-start'
              }}>
                  {/* Profile Card - Left Column */}
                  <Box sx={{ 
                    flex: { xs: '1 1 100%', md: '0 0 350px' },
                    width: { xs: '100%', md: '350px' },
                    maxWidth: { xs: '100%', md: '350px' },
                    minWidth: { xs: '100%', md: '350px' }
                  }}>
                    <Card 
                      ref={getItemRef(0)}
                      sx={{ 
                        borderRadius: 2, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        height: { xs: 'auto', md: 400 },
                        minHeight: { xs: 'auto', md: 400 },
                        width: '100%',
                        flex: 1,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                     
                    >
                      {/* Thin Colored Header */}
                      <Box sx={{ 
                        height: 6,
                        background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                        borderRadius: '4px 4px 0 0'
                      }} />
                      
                      <CardContent sx={{ pt: 2, pb: 1 }}>
                        {/* Modern Header with Profile Picture on Right */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2, 
                          mb: 2,
                          p: 1,
                          borderRadius: 2,
                          bgcolor: 'rgba(0, 0, 0, 0.02)'
                        }}>
                          {/* Name and Role Section */}
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography 
                              variant="h6" 
                              component="h2" 
                              sx={{ 
                                fontWeight: 600, 
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {profile.full_name || user?.email?.split('@')[0] || t('dashboard.profile.notSet')}
                            </Typography>
                            
                            {/* Role and Status Chips */}
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              <Chip 
                                label={profile.role === 'admin' ? t('dashboard.profile.role.admin') : t('dashboard.profile.role.member')} 
                                color={profile.role === 'admin' ? 'primary' : 'default'} 
                                size="small"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                              
                              {profile.network_id && (
                                <Chip 
                                  icon={<NetworkIcon sx={{ fontSize: 12 }} />}
                                  label={t('dashboard.profile.connected')} 
                                  color="success" 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              )}
                            </Box>
                          </Box>
                          
                          {/* Profile Picture on Right */}
                          <Avatar 
                            sx={{ 
                              width: 64, 
                              height: 64, 
                              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                              border: '2px solid',
                              borderColor: 'background.paper',
                              bgcolor: 'grey.200',
                              flexShrink: 0,
                              outline: '2px solid #1976d2',
                              outlineOffset: '1px'
                            }}
                            src={profile.profile_picture_url} 
                          >
                            {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : <PersonIcon fontSize="large" />}
                          </Avatar>
                        </Box>
                        
                        <Divider sx={{ mb: 1.5 }} />
                        
                        {/* Compact Information Section */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            <strong>{t('dashboard.profile.email')}:</strong> {user?.email}
                          </Typography>
                        </Box>
                        
                        {profile.bio && (
                          <Box sx={{ mt: 1.5 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ 
                              fontSize: '0.85rem',
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {profile.bio}
                            </Typography>
                          </Box>
                        )}
                        
                        {profile.skills && profile.skills.length > 0 && (
                          <Box sx={{ mt: 1.5 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {profile.skills.slice(0, 4).map((skill, index) => (
                                <Chip 
                                  key={index} 
                                  label={skill} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: 'rgba(63, 81, 181, 0.08)',
                                    fontSize: '0.7rem',
                                    height: 22,
                                    fontWeight: 400
                                  }}
                                />
                              ))}
                              {profile.skills.length > 4 && (
                                <Chip 
                                  label={`+${profile.skills.length - 4}`} 
                                  size="small" 
                                  color="primary"
                                  sx={{ fontSize: '0.7rem', height: 22 }}
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
                        justifyContent: 'center',
                        gap: 1
                      }}>
                        <Tooltip title={t('dashboard.buttons.editProfile')} placement="top">
                          <Button 
                            size="small" 
                            component={Link} 
                            to="/profile/edit"
                            variant="outlined"
                            sx={{ 
                              minWidth: 'auto',
                              width: 40,
                              height: 40,
                              p: 0.5
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        
                        <Tooltip title={t('dashboard.buttons.viewProfile')} placement="top">
                          <Button 
                            size="small" 
                            component={Link} 
                            to={`/profile/${activeProfile.id}`}
                            variant="outlined"
                            color="secondary"
                            sx={{ 
                              minWidth: 'auto',
                              width: 40,
                              height: 40,
                              p: 0.5
                            }}
                          >
                            <PersonIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        
                        <Tooltip title={t('dashboard.buttons.myMicroConclav')} placement="top">
                          <Button
                            size="small"
                            component={Link}
                            to={activeProfile?.moodboard_slug ? `/micro/${activeProfile.moodboard_slug}` : `/micro-conclav/${activeProfile.id}`}
                            target="_blank"
                            variant="outlined"
                            color="primary"
                            sx={{ 
                              minWidth: 'auto',
                              width: 40,
                              height: 40,
                              p: 0.5
                            }}
                          >
                            <PreviewIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        
                        <Tooltip title={t('dashboard.buttons.settings')} placement="top">
                          <Button 
                            size="small" 
                            component={Link} 
                            to="/profile/edit?tab=settings"
                            variant="outlined"
                            sx={{ 
                              minWidth: 'auto',
                              width: 40,
                              height: 40,
                              p: 0.5
                            }}
                          >
                            <SettingsIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  </Box>
                  
                  {/* Right Column - Network Management (Admin) or Upcoming Events (Non-Admin) */}
                  {profile.network_id && profile.role === 'admin' ? (
                    <Box sx={{ 
                      flex: { xs: '1 1 100%', md: '1 1 auto' },
                      width: { xs: '100%', md: 'auto' },
                      minWidth: 0
                    }}>
                      <Card 
                        ref={getItemRef(1)}
                        sx={{ 
                          borderRadius: 2, 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          height: { xs: 'auto', md : 400},
                          minHeight: { xs: 'auto', md : 400},
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
                              <SubscriptionStatusCard 
                                networkDetails={networkDetails}
                                loadingNetworkDetails={loadingNetworkDetails}
                                profile={profile}
                                t={t}
                              />
                            </Box>
                            
                            {/* Network Stats */}
                            <Grid container spacing={1.5}>
                              <Grid item xs={6} style={{maxWidth: '100px'}}>
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
                              
                              <Grid item xs={6} style={{maxWidth: '100px'}}>
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
                    </Box>
                  ) : profile.network_id && profile.role !== 'admin' && (
                    <Box sx={{
                      flex: { xs: '1 1 100%', md: '1 1 auto' },
                      width: { xs: '100%', md: 'auto' },
                      minWidth: 0,
                      maxWidth: '100%'
                    }}>
                      <UpcomingEventsWidget
                        events={recentEvents}
                        loading={loadingEvents}
                        eventParticipation={eventParticipation}
                        onViewDetails={(event) => {
                          setSelectedEvent(event);
                          setShowEventDialog(true);
                        }}
                        isAdmin={false}
                        wrapperRef={getItemRef(1)}
                      />
                    </Box>
                  )}
              </Box>
              
              {/* Second Row: Upcoming Events (admin only) */}
              {profile?.role === 'admin' && profile.network_id && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <UpcomingEventsWidget
                    events={recentEvents}
                    loading={loadingEvents}
                    eventParticipation={eventParticipation}
                    onViewDetails={(event) => {
                      setSelectedEvent(event);
                      setShowEventDialog(true);
                    }}
                    onCreateEvent={() => setCreateEventOpen(true)}
                    isAdmin={true}
                  />
                </Box>
              )}
              
              {/* Third Row: Latest News and Latest Posts - Full width for all users */}
              {profile.network_id && (
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 2,
                  width: '100%',
                  mt: 2
                }}>
                  <Box sx={{ 
                    flex: 1,
                    minWidth: 0,
                    display: 'flex'
                  }}>
                    <LatestNewsWidget networkId={profile.network_id} onMemberClick={handleMemberClick} />
                  </Box>
                  <Box sx={{ 
                    flex: 1,
                    minWidth: 0,
                    display: 'flex'
                  }}>
                    <LatestPostsWidget networkId={profile.network_id} onMemberClick={handleMemberClick} />
                  </Box>
                </Box>
              )}
              
              {/* Micro Conclav Widget - Always visible, full width row */}
              <Box sx={{ 
                mt: 2, 
                minHeight: 400, 
                width: '100%'
              }}>
                <MicroConclavWidget />
              </Box>

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
        onParticipationChange={handleParticipationChange}
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
        isAdmin={isAdmin}
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