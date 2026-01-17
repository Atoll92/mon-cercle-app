// src/components/NetworkOnboardingWizard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { useTranslation } from '../hooks/useTranslation';
import { createProfileForNetwork } from '../api/profiles';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  TextField,
  Paper,
  Alert,
  Stack,
  Checkbox,
  FormControlLabel,
  FormControl,
  FormLabel,
  FormGroup,
  Radio,
  RadioGroup,
  Divider,
  Chip,
  Switch,
  useTheme,
  alpha,
  MenuItem,
  Select,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardActionArea
} from '@mui/material';
import Spinner from './Spinner';
import {
  CreateNewFolder as CreateIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  EventNote as EventIcon,
  Forum as ForumIcon,
  FileCopy as FileIcon,
  Groups as GroupsIcon,
  Article as ArticleIcon,
  MenuBook as WikiIcon,
  Palette as ThemeIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Settings as SettingsIcon,
  CloudUpload as UploadIcon,
  FolderShared as SharedFolderIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  DragIndicator as DragIndicatorIcon,
  School as CoursesIcon,
  Store as MarketplaceIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as SocialWallIcon,
  AddReactionOutlined as ReactionsIcon,
  Feed as ActivityFeedIcon,
  LocationOn as LocationIcon,
  NotificationsActive as NotificationsIcon,
  RssFeed as BlogIcon,
  Comment as CommentIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { checkSubdomainAvailability } from '../api/blog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import {
  CSS
} from '@dnd-kit/utilities';

// Sortable Chip Component for the wizard
const SortableWizardTabChip = ({ tab, isSelected, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Chip
      ref={setNodeRef}
      style={style}
      {...attributes}
      icon={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            {...listeners}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'grab',
              '&:active': { cursor: 'grabbing' },
              color: 'inherit',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <DragIndicatorIcon sx={{ fontSize: '0.75rem' }} />
          </Box>
          {tab.icon}
        </Box>
      }
      label={tab.label}
      clickable
      color={isSelected ? 'primary' : 'default'}
      variant={isSelected ? 'filled' : 'outlined'}
      onClick={onToggle}
      sx={{
        '& .MuiChip-icon': {
          gap: 0.5,
        },
        cursor: isDragging ? 'grabbing' : 'pointer',
        pl: 0.5
      }}
    />
  );
};

const NetworkOnboardingWizard = ({ profile }) => {
  const { user } = useAuth();
  const { loadUserProfiles, setActiveProfile } = useProfile();
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  // LocalStorage key for persisting form data
  const STORAGE_KEY = 'network_onboarding_form_data';
  const STORAGE_STEP_KEY = 'network_onboarding_active_step';

  // State for the wizard
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);

  // Default network data structure
  const defaultNetworkData = {
    name: '',
    description: '',
    networkType: 'network', // 'network' or 'blog'
    purpose: 'general',
    privacyLevel: 'private',
    logoUrl: '',
    backgroundImageUrl: '',
    features: {
      events: true,
      news: true,
      files: true,
      chat: true,
      wiki: true,
      moodboards: true,
      social: true,
      location: false,
      notifications: true,
      courses: false,
      marketplace: false,
      reactions: true,
      activity_feed: false
    },
    enabledTabs: ['news', 'members', 'events', 'chat', 'files', 'wiki', 'social'],
    themeColor: theme.palette.primary.main,
    // Blog-specific fields
    subdomain: '',
    blogSettings: {
      comments_enabled: true,
      anonymous_comments: true,
      comment_moderation: true,
      newsletter_enabled: true,
      rss_enabled: true,
      about_page_content: '',
      social_links: {}
    },
    seoSettings: {
      meta_title: '',
      meta_description: '',
      og_image_url: ''
    }
  };

  // Initialize state from localStorage or defaults
  const getInitialNetworkData = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Merge with defaults to ensure all fields exist
        return {
          ...defaultNetworkData,
          ...parsed,
          features: {
            ...defaultNetworkData.features,
            ...(parsed.features || {})
          }
        };
      }
    } catch (error) {
      console.error('Error loading saved network data:', error);
    }
    return defaultNetworkData;
  };

  const getInitialStep = () => {
    try {
      const savedStep = localStorage.getItem(STORAGE_STEP_KEY);
      if (savedStep !== null) {
        return parseInt(savedStep, 10);
      }
    } catch (error) {
      console.error('Error loading saved step:', error);
    }
    return 0;
  };

  // Network creation data with persistence
  const [networkData, setNetworkData] = useState(getInitialNetworkData);

  // Load saved step on mount
  useEffect(() => {
    const savedStep = getInitialStep();
    if (savedStep > 0) {
      setActiveStep(savedStep);
      // Show a brief indicator that data was restored
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }
  }, []);

  // Auto-save networkData to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(networkData));
      // Show auto-save indicator briefly
      setAutoSaved(true);
      const timer = setTimeout(() => setAutoSaved(false), 1000);
      return () => clearTimeout(timer);
    } catch (error) {
      console.error('Error saving network data:', error);
    }
  }, [networkData]);

  // Save active step to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_STEP_KEY, activeStep.toString());
    } catch (error) {
      console.error('Error saving active step:', error);
    }
  }, [activeStep]);

  // Clear saved data function
  const clearSavedData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_STEP_KEY);
    } catch (error) {
      console.error('Error clearing saved data:', error);
    }
  };

  // Steps of the wizard - different steps for blog vs network
  const isBlog = networkData.networkType === 'blog';

  const networkSteps = [
    {
      label: t('networkOnboarding.steps.basics'),
      description: t('networkOnboarding.basics.description'),
      component: (
        <BasicInfoStep
          networkData={networkData}
          setNetworkData={setNetworkData}
        />
      )
    },
    {
      label: t('networkOnboarding.steps.privacy'),
      description: t('networkOnboarding.privacy.description'),
      component: (
        <PrivacyStep
          networkData={networkData}
          setNetworkData={setNetworkData}
        />
      )
    },
    {
      label: t('networkOnboarding.steps.features'),
      description: t('networkOnboarding.features.description'),
      component: (
        <FeaturesStep
          networkData={networkData}
          setNetworkData={setNetworkData}
        />
      )
    },
    {
      label: t('networkOnboarding.steps.branding'),
      description: t('networkOnboarding.branding.description'),
      component: (
        <NavigationStep
          networkData={networkData}
          setNetworkData={setNetworkData}
        />
      )
    },
    {
      label: t('networkOnboarding.steps.review'),
      description: t('networkOnboarding.review.description'),
      component: (
        <ReviewStep
          networkData={networkData}
        />
      )
    }
  ];

  const blogSteps = [
    {
      label: t('networkOnboarding.steps.basics'),
      description: t('networkOnboarding.blog.basics.description', 'Set up your personal blog'),
      component: (
        <BasicInfoStep
          networkData={networkData}
          setNetworkData={setNetworkData}
        />
      )
    },
    {
      label: t('networkOnboarding.blog.steps.subdomain', 'Blog Address'),
      description: t('networkOnboarding.blog.subdomain.description', 'Choose your blog URL'),
      component: (
        <BlogSubdomainStep
          networkData={networkData}
          setNetworkData={setNetworkData}
        />
      )
    },
    {
      label: t('networkOnboarding.steps.branding'),
      description: t('networkOnboarding.blog.branding.description', 'Customize your blog appearance'),
      component: (
        <BlogBrandingStep
          networkData={networkData}
          setNetworkData={setNetworkData}
        />
      )
    },
    {
      label: t('networkOnboarding.blog.steps.settings', 'Blog Settings'),
      description: t('networkOnboarding.blog.settings.description', 'Configure comments and features'),
      component: (
        <BlogSettingsStep
          networkData={networkData}
          setNetworkData={setNetworkData}
        />
      )
    },
    {
      label: t('networkOnboarding.steps.review'),
      description: t('networkOnboarding.review.description'),
      component: (
        <BlogReviewStep
          networkData={networkData}
        />
      )
    }
  ];

  const steps = isBlog ? blogSteps : networkSteps;

  // Handle next button click
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleCreateNetwork();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  // Handle back button click
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Handle network creation
  const handleCreateNetwork = async () => {
    if (!user) {
      setError(t('networkOnboarding.errors.notLoggedIn'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const isBlogNetwork = networkData.networkType === 'blog';

      // Build the network record based on type
      const networkRecord = {
        name: networkData.name,
        description: networkData.description,
        created_by: user.id,
        logo_url: networkData.logoUrl || null,
        theme_color: networkData.themeColor,
        background_image_url: networkData.backgroundImageUrl || null,
        network_type: networkData.networkType
      };

      if (isBlogNetwork) {
        // Blog-specific settings
        networkRecord.privacy_level = 'public'; // Blogs are always public
        networkRecord.purpose = 'general';
        networkRecord.subdomain = networkData.subdomain?.toLowerCase() || null;
        networkRecord.blog_settings = networkData.blogSettings;
        networkRecord.seo_settings = networkData.seoSettings;
        networkRecord.features_config = {
          events: false,
          news: false,
          files: false,
          chat: false,
          wiki: false,
          moodboards: false,
          social: false,
          location_sharing: false,
          notifications: true,
          courses: false,
          marketplace: false,
          reactions: false,
          activity_feed: false
        };
        networkRecord.enabled_tabs = []; // Blog doesn't use tabs
      } else {
        // Regular network settings
        networkRecord.privacy_level = networkData.privacyLevel;
        networkRecord.purpose = networkData.purpose;
        networkRecord.enabled_tabs = networkData.enabledTabs;
        networkRecord.features_config = {
          events: networkData.features.events,
          news: networkData.features.news,
          files: networkData.features.files,
          chat: networkData.features.chat,
          wiki: networkData.features.wiki,
          moodboards: networkData.features.moodboards,
          social: networkData.features.social,
          location_sharing: networkData.features.location,
          notifications: networkData.features.notifications,
          courses: networkData.features.courses,
          marketplace: networkData.features.marketplace,
          reactions: networkData.features.reactions,
          activity_feed: networkData.features.activity_feed
        };
      }

      // Create network in the database
      const { data: network, error: networkError } = await supabase
        .from('networks')
        .insert([networkRecord])
        .select()
        .single();

      if (networkError) throw networkError;

      // Create a profile for the new network (user is the admin)
      const { data: newProfile, error: profileError } = await createProfileForNetwork(
        user.id,
        network.id,
        {
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
          contact_email: user.email,
          bio: '',
          skills: [],
          role: 'admin' // Network creator is always admin
        }
      );

      if (profileError) throw new Error(profileError);

      // Refresh the user session to ensure the profile update is reflected
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) console.error('Error refreshing session:', sessionError);

      // Reload user profiles to pick up the new network
      await loadUserProfiles();

      // The newProfile returned from createProfileForNetwork should be set as active
      if (newProfile) {
        console.log('Setting newly created profile as active:', newProfile);
        await setActiveProfile(newProfile);
      }

      // Track network/blog creation event (fire and forget - don't block)
      supabase.from('analytics_events').insert({
        event_type: isBlogNetwork ? 'blog_created' : 'network_created',
        user_id: user.id,
        network_id: network.id,
        profile_id: newProfile?.id,
        metadata: {
          network_name: network.name,
          network_type: networkData.networkType,
          privacy_level: isBlogNetwork ? 'public' : networkData.privacyLevel,
          purpose: networkData.purpose,
          subdomain: isBlogNetwork ? networkData.subdomain : null,
          features_enabled: isBlogNetwork ? [] : Object.keys(networkData.features).filter(k => networkData.features[k])
        }
      }).then(() => {
        // Analytics tracked successfully
      }).catch((analyticsError) => {
        console.error('Analytics tracking error:', analyticsError);
        // Fail silently
      });

      setSuccess(true);

      // Clear the saved form data since network was successfully created
      clearSavedData();

      // Set a flag to show onboarding guide when the admin arrives at their network
      if (typeof window !== 'undefined' && newProfile) {
        sessionStorage.setItem(`show_admin_onboarding_${network.id}_${newProfile.id}`, 'true');
      }

      // Redirect based on network type
      setTimeout(() => {
        if (isBlogNetwork) {
          // Redirect to blog admin dashboard using the subdomain
          console.log('Redirecting to blog admin after blog creation');
          window.location.href = `/blog/${networkData.subdomain.toLowerCase()}/admin`;
        } else {
          // Do a hard reload to ensure all contexts are properly refreshed with the new network
          console.log('Redirecting to dashboard with hard reload after network creation');
          window.location.href = '/dashboard';
        }
      }, 2000);
      
    } catch (error) {
      console.error("Error creating network:", error);
      setError(error.message || t('networkOnboarding.errors.createError'));
    } finally {
      setLoading(false);
    }
  };

  // If creation is complete, show success message
  if (success) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 2, 
          maxWidth: 600, 
          mx: 'auto',
          textAlign: 'center',
          bgcolor: alpha(theme.palette.success.light, 0.1)
        }}
      >
        <Box 
          sx={{ 
            width: 80, 
            height: 80, 
            bgcolor: 'success.main', 
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3
          }}
        >
          <CheckIcon sx={{ fontSize: 40, color: '#fff' }} />
        </Box>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium', color: 'success.dark' }}>
          {t('networkOnboarding.success.title')}
        </Typography>
        <Typography variant="body1" paragraph color="text.secondary">
          {t('networkOnboarding.success.message', { networkName: networkData.name })}
        </Typography>
        <Spinner size={60} sx={{ mt: 2, mb: 3 }} />
        <Typography variant="body2" color="text.secondary">
          {t('networkOnboarding.success.redirecting')}
        </Typography>
      </Paper>
    );
  }

  // Main wizard render
  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Auto-save indicator */}
      {autoSaved && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            p: 1,
            bgcolor: alpha(theme.palette.success.light, 0.1),
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main', mr: 0.5 }} />
          <Typography variant="body2" color="success.dark">
            {t('networkOnboarding.autoSaved', 'Progress saved automatically')}
          </Typography>
        </Box>
      )}

      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>
              <Typography variant="h6">{step.label}</Typography>
            </StepLabel>
            <StepContent>
              <Typography variant="body1" color="text.secondary" paragraph>
                {step.description}
              </Typography>
              
              {step.component}
              
              <Box sx={{ mb: 2, mt: 3 }}>
                <div>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                    disabled={loading ||
                      (index === 0 && !networkData.name) ||
                      (isBlog && index === 1 && (!networkData.subdomain || networkData.subdomain.length < 3)) ||
                      (index === steps.length - 1 && loading)
                    }
                    endIcon={index === steps.length - 1 ? <CreateIcon /> : <ArrowForwardIcon />}
                  >
                    {index === steps.length - 1 ? (
                      loading ? (
                        <>
                          <Spinner size={48} sx={{ mr: 1, color: 'white' }} />
                          {t('networkOnboarding.buttons.creating')}
                        </>
                      ) : t('networkOnboarding.buttons.createNetwork')
                    ) : t('networkOnboarding.buttons.continue')}
                  </Button>
                  <Button
                    disabled={index === 0 || loading}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    {t('networkOnboarding.buttons.back')}
                  </Button>
                </div>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

// Step 1: Basic network information
const BasicInfoStep = ({ networkData, setNetworkData }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNetworkData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNetworkTypeChange = (type) => {
    setNetworkData(prev => ({
      ...prev,
      networkType: type
    }));
  };

  const isBlog = networkData.networkType === 'blog';

  return (
    <Stack spacing={3}>
      {/* Network Type Selection */}
      <Box>
        <FormLabel sx={{ mb: 2, display: 'block' }}>
          {t('networkOnboarding.basics.whatToCreate', 'What would you like to create?')}
        </FormLabel>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card
              variant="outlined"
              sx={{
                cursor: 'pointer',
                borderWidth: 2,
                borderColor: !isBlog ? theme.palette.primary.main : 'divider',
                bgcolor: !isBlog ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.06)
                }
              }}
              onClick={() => handleNetworkTypeChange('network')}
            >
              <CardActionArea sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: !isBlog ? alpha(theme.palette.primary.main, 0.1) : 'grey.100'
                    }}
                  >
                    <GroupsIcon sx={{ fontSize: 32, color: !isBlog ? 'primary.main' : 'grey.500' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {t('networkOnboarding.basics.networkOption.title', 'Community Network')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('networkOnboarding.basics.networkOption.description', 'Full-featured community with events, chat, wiki, files, and more')}
                    </Typography>
                  </Box>
                  {!isBlog && (
                    <CheckCircleIcon sx={{ color: 'primary.main' }} />
                  )}
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card
              variant="outlined"
              sx={{
                cursor: 'pointer',
                borderWidth: 2,
                borderColor: isBlog ? theme.palette.primary.main : 'divider',
                bgcolor: isBlog ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.06)
                }
              }}
              onClick={() => handleNetworkTypeChange('blog')}
            >
              <CardActionArea sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: isBlog ? alpha(theme.palette.primary.main, 0.1) : 'grey.100'
                    }}
                  >
                    <BlogIcon sx={{ fontSize: 32, color: isBlog ? 'primary.main' : 'grey.500' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {t('networkOnboarding.basics.blogOption.title', 'Personal Blog')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('networkOnboarding.basics.blogOption.description', 'Simple public blog with posts, media, and optional comments')}
                    </Typography>
                  </Box>
                  {isBlog && (
                    <CheckCircleIcon sx={{ color: 'primary.main' }} />
                  )}
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Divider />

      <TextField
        label={isBlog
          ? t('networkOnboarding.basics.blogName', 'Blog Name')
          : t('networkOnboarding.basics.networkName')}
        name="name"
        value={networkData.name}
        onChange={handleChange}
        fullWidth
        required
        helperText={isBlog
          ? t('networkOnboarding.basics.blogNameHelper', 'This will be displayed as your blog title')
          : t('networkOnboarding.basics.networkNameHelper')}
        variant="outlined"
      />

      <TextField
        label={isBlog
          ? t('networkOnboarding.basics.blogDescription', 'Blog Description')
          : t('networkOnboarding.basics.networkDescription')}
        name="description"
        value={networkData.description}
        onChange={handleChange}
        multiline
        rows={3}
        fullWidth
        helperText={isBlog
          ? t('networkOnboarding.basics.blogDescriptionHelper', 'A short description that appears in search results and your blog header')
          : t('networkOnboarding.basics.descriptionHelper')}
        variant="outlined"
      />

      {/* Only show purpose selection for networks, not blogs */}
      {!isBlog && (
        <FormControl fullWidth>
          <FormLabel id="purpose-type-label">{t('networkOnboarding.basics.networkType')}</FormLabel>
          <RadioGroup
            aria-labelledby="purpose-type-label"
            name="purpose"
            value={networkData.purpose}
            onChange={handleChange}
            row
          >
            <FormControlLabel value="general" control={<Radio />} label={t('networkOnboarding.basics.types.general')} />
            <FormControlLabel value="professional" control={<Radio />} label={t('networkOnboarding.basics.types.professional')} />
            <FormControlLabel value="interest" control={<Radio />} label={t('networkOnboarding.basics.types.interest')} />
            <FormControlLabel value="education" control={<Radio />} label={t('networkOnboarding.basics.types.education')} />
            <FormControlLabel value="nonprofit" control={<Radio />} label={t('networkOnboarding.basics.types.nonprofit')} />
          </RadioGroup>
        </FormControl>
      )}
    </Stack>
  );
};

// Step 2: Privacy settings
const PrivacyStep = ({ networkData, setNetworkData }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNetworkData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Stack spacing={3}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2, 
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.background.paper, 0.7)
        }}
      >
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          {t('networkOnboarding.privacy.title')}
        </Typography>
        
        <FormControl component="fieldset">
          <RadioGroup
            name="privacyLevel"
            value={networkData.privacyLevel}
            onChange={handleChange}
          >
            <FormControlLabel 
              value="private" 
              control={<Radio />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LockIcon color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="body1">{t('networkOnboarding.privacy.private')}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('networkOnboarding.privacy.privateDesc')}
                    </Typography>
                  </Box>
                </Box>
              } 
            />
            
            <FormControlLabel 
              value="restricted" 
              control={<Radio />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <GroupsIcon color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="body1">{t('networkOnboarding.privacy.restricted')}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('networkOnboarding.privacy.restrictedDesc')}
                    </Typography>
                  </Box>
                </Box>
              } 
            />
            
            <FormControlLabel 
              value="public" 
              control={<Radio />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PublicIcon color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="body1">{t('networkOnboarding.privacy.public')}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('networkOnboarding.privacy.publicDesc')}
                    </Typography>
                  </Box>
                </Box>
              } 
            />
          </RadioGroup>
        </FormControl>
      </Paper>
      
      <Alert severity="info">
        {t('networkOnboarding.privacy.changeInfo')}
      </Alert>
    </Stack>
  );
};

// Step 3: Features and modules
const FeaturesStep = ({ networkData, setNetworkData }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // Map features to their corresponding tab IDs
  // Note: 'members' tab has no feature toggle (always available)
  // Note: 'moodboards', 'location', 'notifications', 'reactions', 'activity_feed' features have no dedicated tab
  const featureToTabMap = {
    events: ['events'],
    news: ['news'],
    files: ['files'],
    chat: ['chat'],
    wiki: ['wiki'],
    social: ['social'],
    courses: ['courses'],
    marketplace: ['marketplace']
  };

  const handleFeatureChange = (feature) => (e) => {
    const isEnabled = e.target.checked;
    const tabIds = featureToTabMap[feature] || [];

    setNetworkData(prev => {
      let newEnabledTabs = [...prev.enabledTabs];

      if (isEnabled) {
        // Add tabs if not already present
        tabIds.forEach(tabId => {
          if (!newEnabledTabs.includes(tabId)) {
            newEnabledTabs.push(tabId);
          }
        });
      } else {
        // Remove tabs when feature is disabled
        newEnabledTabs = newEnabledTabs.filter(t => !tabIds.includes(t));
      }

      return {
        ...prev,
        features: {
          ...prev.features,
          [feature]: isEnabled
        },
        enabledTabs: newEnabledTabs
      };
    });
  };

  // Feature cards with toggles - matching NetworkSettingsTab features
  const featureCards = [
    {
      name: 'events',
      title: t('networkOnboarding.features.events'),
      icon: <EventIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />,
      description: t('networkOnboarding.features.eventsDesc'),
    },
    {
      name: 'news',
      title: t('networkOnboarding.features.news'),
      icon: <ArticleIcon fontSize="large" sx={{ color: theme.palette.secondary.main }} />,
      description: t('networkOnboarding.features.newsDesc'),
    },
    {
      name: 'files',
      title: t('networkOnboarding.features.files'),
      icon: <FileIcon fontSize="large" sx={{ color: theme.palette.success.main }} />,
      description: t('networkOnboarding.features.filesDesc'),
    },
    {
      name: 'chat',
      title: t('networkOnboarding.features.chat'),
      icon: <ForumIcon fontSize="large" sx={{ color: theme.palette.info.main }} />,
      description: t('networkOnboarding.features.chatDesc'),
    },
    {
      name: 'wiki',
      title: t('networkOnboarding.features.wiki'),
      icon: <WikiIcon fontSize="large" sx={{ color: theme.palette.warning.main }} />,
      description: t('networkOnboarding.features.wikiDesc'),
    },
    {
      name: 'social',
      title: t('networkOnboarding.features.social'),
      icon: <SocialWallIcon fontSize="large" sx={{ color: theme.palette.info.light }} />,
      description: t('networkOnboarding.features.socialDesc'),
    },
    {
      name: 'reactions',
      title: t('networkOnboarding.features.reactions'),
      icon: <ReactionsIcon fontSize="large" sx={{ color: theme.palette.success.dark }} />,
      description: t('networkOnboarding.features.reactionsDesc'),
    },
    {
      name: 'notifications',
      title: t('networkOnboarding.features.notifications'),
      icon: <NotificationsIcon fontSize="large" sx={{ color: theme.palette.warning.dark }} />,
      description: t('networkOnboarding.features.notificationsDesc'),
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: 1.5,
          width: '100%'
        }}
      >
        {featureCards.map((feature) => {
          const isEnabled = networkData.features[feature.name];
          return (
            <Box
              key={feature.name}
              onClick={() => handleFeatureChange(feature.name)({target: {checked: !isEnabled}})}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                border: '1.5px solid',
                borderColor: isEnabled ? theme.palette.primary.main : theme.palette.divider,
                bgcolor: isEnabled ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: 0,
                overflow: 'hidden',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.06)
                }
              }}
            >
              {/* Icon */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: isEnabled
                    ? alpha(theme.palette.primary.main, 0.1)
                    : alpha(theme.palette.grey[500], 0.08),
                  flexShrink: 0
                }}
              >
                {React.cloneElement(feature.icon, {
                  fontSize: 'small',
                  sx: {
                    color: isEnabled
                      ? feature.icon.props.sx?.color
                      : theme.palette.grey[500]
                  }
                })}
              </Box>

              {/* Text content */}
              <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    fontWeight: 600,
                    color: isEnabled ? theme.palette.text.primary : theme.palette.text.secondary,
                    lineHeight: 1.3
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    color: theme.palette.text.secondary,
                    display: 'block',
                    lineHeight: 1.3
                  }}
                >
                  {feature.description}
                </Typography>
              </Box>

              {/* Switch */}
              <Switch
                checked={isEnabled}
                onChange={handleFeatureChange(feature.name)}
                color="primary"
                size="small"
                onClick={(e) => e.stopPropagation()}
                sx={{ flexShrink: 0 }}
              />
            </Box>
          );
        })}
      </Box>

      <Alert
        severity="info"
        sx={{
          mt: 2,
          borderRadius: 2,
          py: 0.5,
          '& .MuiAlert-message': { py: 0.5 }
        }}
      >
        <Typography variant="caption">
          {t('networkOnboarding.features.changeInfo')}
        </Typography>
      </Alert>
    </Box>
  );
};

// Step 4: Navigation configuration
const NavigationStep = ({ networkData, setNetworkData }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [backgroundUploadError, setBackgroundUploadError] = useState(null);
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const availableTabs = [
    { id: 'news', label: t('networkOnboarding.branding.navigation.tabs.news'), icon: <ArticleIcon fontSize="small" />, featureKey: 'news' },
    { id: 'members', label: t('networkOnboarding.branding.navigation.tabs.members'), icon: <GroupsIcon fontSize="small" />, featureKey: null }, // Always available
    { id: 'events', label: t('networkOnboarding.branding.navigation.tabs.events'), icon: <EventIcon fontSize="small" />, featureKey: 'events' },
    { id: 'chat', label: t('networkOnboarding.branding.navigation.tabs.chat'), icon: <ForumIcon fontSize="small" />, featureKey: 'chat' },
    { id: 'files', label: t('networkOnboarding.branding.navigation.tabs.files'), icon: <FileIcon fontSize="small" />, featureKey: 'files' },
    { id: 'wiki', label: t('networkOnboarding.branding.navigation.tabs.wiki'), icon: <WikiIcon fontSize="small" />, featureKey: 'wiki' },
    { id: 'social', label: t('networkOnboarding.branding.navigation.tabs.social'), icon: <SocialWallIcon fontSize="small" />, featureKey: 'social' },
    { id: 'courses', label: t('networkOnboarding.branding.navigation.tabs.courses'), icon: <CoursesIcon fontSize="small" />, featureKey: 'courses' },
    { id: 'marketplace', label: t('networkOnboarding.branding.navigation.tabs.marketplace'), icon: <MarketplaceIcon fontSize="small" />, featureKey: 'marketplace' }
  ];

  // Helper to check if a tab should be visible based on its feature
  const isTabAvailable = (tab) => {
    if (tab.featureKey === null) return true; // Always available (like members)
    return networkData.features[tab.featureKey] !== false;
  };
  
  // Handle logo upload
  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError(t('networkOnboarding.branding.logo.error.invalidType'));
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError(t('networkOnboarding.branding.logo.error.tooLarge'));
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `temp-logos/${Date.now()}-network-logo.${fileExt}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('networks')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('networks')
        .getPublicUrl(fileName);

      // Update network data with logo URL
      setNetworkData(prev => ({
        ...prev,
        logoUrl: publicUrl
      }));
    } catch (error) {
      console.error('Error uploading logo:', error);
      setUploadError(t('networkOnboarding.branding.logo.error.failed'));
    } finally {
      setUploading(false);
    }
  };

  // Handle logo removal
  const handleRemoveLogo = () => {
    setNetworkData(prev => ({
      ...prev,
      logoUrl: ''
    }));
  };
  
  // Handle background image upload
  const handleBackgroundUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setBackgroundUploadError(t('networkOnboarding.branding.background.error.invalidType'));
      return;
    }

    // Check file size (max 10MB for backgrounds)
    if (file.size > 10 * 1024 * 1024) {
      setBackgroundUploadError(t('networkOnboarding.branding.background.error.tooLarge'));
      return;
    }

    try {
      setUploadingBackground(true);
      setBackgroundUploadError(null);

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `temp-backgrounds/${Date.now()}-network-background.${fileExt}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('networks')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('networks')
        .getPublicUrl(fileName);

      // Update network data with background URL
      setNetworkData(prev => ({
        ...prev,
        backgroundImageUrl: publicUrl
      }));
    } catch (error) {
      console.error('Error uploading background:', error);
      setBackgroundUploadError(t('networkOnboarding.branding.background.error.failed'));
    } finally {
      setUploadingBackground(false);
    }
  };

  // Handle background removal
  const handleRemoveBackground = () => {
    setNetworkData(prev => ({
      ...prev,
      backgroundImageUrl: ''
    }));
  };
  
  // Handle theme color change
  const handleColorChange = (e) => {
    setNetworkData(prev => ({
      ...prev,
      themeColor: e.target.value
    }));
  };
  
  // Handle tab order change (add/remove/reorder)
  const handleTabToggle = (tabId) => {
    setNetworkData(prev => {
      const currentTabs = [...prev.enabledTabs];
      
      if (currentTabs.includes(tabId)) {
        // Remove tab if it's already selected
        return {
          ...prev,
          enabledTabs: currentTabs.filter(id => id !== tabId)
        };
      } else {
        // Add tab if it's not selected
        return {
          ...prev,
          enabledTabs: [...currentTabs, tabId]
        };
      }
    });
  };
  
  // Handle drag end for tab reordering
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setNetworkData(prev => {
        const items = [...prev.enabledTabs];
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return {
          ...prev,
          enabledTabs: arrayMove(items, oldIndex, newIndex)
        };
      });
    }
  };

  return (
    <Stack spacing={3}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2, 
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ImageIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="subtitle1" fontWeight="medium">
            {t('networkOnboarding.branding.logo.title')}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {t('networkOnboarding.branding.logo.description')}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {networkData.logoUrl ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                component="img"
                src={networkData.logoUrl}
                alt="Network Logo"
                sx={{
                  width: 80,
                  height: 80,
                  objectFit: 'contain',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper'
                }}
              />
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={handleRemoveLogo}
                startIcon={<CloseIcon />}
              >
                {t('networkOnboarding.branding.logo.remove')}
              </Button>
            </Box>
          ) : (
            <Button
              variant="outlined"
              component="label"
              startIcon={uploading ? <Spinner size={40} /> : <UploadIcon />}
              disabled={uploading}
            >
              {uploading ? t('networkOnboarding.branding.logo.uploading') : t('networkOnboarding.branding.logo.upload')}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleLogoUpload}
              />
            </Button>
          )}
        </Box>

        {uploadError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {uploadError}
          </Alert>
        )}
      </Paper>

      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2, 
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          {t('networkOnboarding.branding.navigation.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('networkOnboarding.branding.navigation.description')}
        </Typography>
        
        {/* Enabled Tabs - Sortable */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
            {t('networkOnboarding.branding.navigation.enabledTabs')}
          </Typography>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={networkData.enabledTabs}
              strategy={verticalListSortingStrategy}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {networkData.enabledTabs
                  .map(tabId => availableTabs.find(tab => tab.id === tabId))
                  .filter(tab => tab && isTabAvailable(tab))
                  .map((tab) => (
                    <SortableWizardTabChip
                      key={tab.id}
                      tab={tab}
                      isSelected={true}
                      onToggle={() => handleTabToggle(tab.id)}
                    />
                  ))}
              </Box>
            </SortableContext>
          </DndContext>
        </Box>

        {/* Available Tabs - Not enabled */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
            {t('networkOnboarding.branding.navigation.availableTabs')}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {availableTabs
              .filter(tab => !networkData.enabledTabs.includes(tab.id) && isTabAvailable(tab))
              .map((tab) => (
                <Chip
                  key={tab.id}
                  icon={tab.icon}
                  label={tab.label}
                  clickable
                  color="default"
                  variant="outlined"
                  onClick={() => handleTabToggle(tab.id)}
                  sx={{ pl: 0.5 }}
                />
              ))}
          </Box>
        </Box>
      </Paper>
      
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2, 
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ThemeIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="subtitle1" fontWeight="medium">
            {t('networkOnboarding.branding.theme.title')}
          </Typography>
        </Box>
        
        <FormControl fullWidth>
          <InputLabel id="theme-color-label">{t('networkOnboarding.branding.theme.title')}</InputLabel>
          <Select
            labelId="theme-color-label"
            value={networkData.themeColor}
            onChange={handleColorChange}
            label="Theme Color"
          >
            <MenuItem value={theme.palette.primary.main}>{t('networkOnboarding.branding.theme.colors.blue')}</MenuItem>
            <MenuItem value={theme.palette.secondary.main}>{t('networkOnboarding.branding.theme.colors.purple')}</MenuItem>
            <MenuItem value={theme.palette.success.main}>{t('networkOnboarding.branding.theme.colors.green')}</MenuItem>
            <MenuItem value={theme.palette.error.main}>{t('networkOnboarding.branding.theme.colors.red')}</MenuItem>
            <MenuItem value={theme.palette.warning.main}>{t('networkOnboarding.branding.theme.colors.orange')}</MenuItem>
            <MenuItem value={theme.palette.info.main}>{t('networkOnboarding.branding.theme.colors.lightBlue')}</MenuItem>
            <MenuItem value="#000000">{t('networkOnboarding.branding.theme.colors.black')}</MenuItem>
            <MenuItem value="#424242">{t('networkOnboarding.branding.theme.colors.gray')}</MenuItem>
          </Select>
        </FormControl>
        
        <Box 
          sx={{ 
            mt: 2, 
            height: 20, 
            bgcolor: networkData.themeColor,
            borderRadius: 1
          }} 
        />
      </Paper>

      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2, 
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ImageIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="subtitle1" fontWeight="medium">
            {t('networkOnboarding.branding.background.title')}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {t('networkOnboarding.branding.background.description')}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {networkData.backgroundImageUrl ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Box
                sx={{
                  width: '100%',
                  height: 200,
                  backgroundImage: `url(${networkData.backgroundImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    fontSize: '0.8rem'
                  }}
                >
                  {t('networkOnboarding.branding.background.preview')}
                </Box>
              </Box>
            </Box>
          ) : (
            <Box 
              sx={{ 
                width: '100%',
                height: 200,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: '1px dashed #aaa',
                borderRadius: 1,
                backgroundColor: 'grey.100',
                flexDirection: 'column'
              }}
            >
              <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {t('networkOnboarding.branding.background.noImage')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('networkOnboarding.branding.background.defaultGradient')}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={uploadingBackground ? <Spinner size={40} /> : <UploadIcon />}
            disabled={uploadingBackground}
          >
            {uploadingBackground ? t('networkOnboarding.branding.background.uploading') : networkData.backgroundImageUrl ? t('networkOnboarding.branding.background.change') : t('networkOnboarding.branding.background.upload')}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleBackgroundUpload}
            />
          </Button>

          {networkData.backgroundImageUrl && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleRemoveBackground}
              startIcon={<CloseIcon />}
            >
              {t('networkOnboarding.branding.background.remove')}
            </Button>
          )}
        </Box>

        {backgroundUploadError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {backgroundUploadError}
          </Alert>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          {t('networkOnboarding.branding.background.recommendation')}
        </Typography>
      </Paper>
    </Stack>
  );
};

// Step 5: Review configuration before creating
const ReviewStep = ({ networkData }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  
  // Helper function to get readable privacy level
  const getPrivacyLabel = (level) => {
    switch (level) {
      case 'private': return t('networkOnboarding.privacy.private') + ' (' + t('networkOnboarding.privacy.privateDesc').substring(0, 15) + '...)';
      case 'restricted': return t('networkOnboarding.privacy.restricted') + ' (' + t('networkOnboarding.privacy.restrictedDesc').substring(0, 15) + '...)';
      case 'public': return t('networkOnboarding.privacy.public') + ' (' + t('networkOnboarding.privacy.publicDesc').substring(0, 15) + '...)';
      default: return level;
    }
  };
  
  // Helper function to get readable purpose type
  const getPurposeLabel = (purpose) => {
    switch (purpose) {
      case 'general': return t('networkOnboarding.basics.types.general');
      case 'professional': return t('networkOnboarding.basics.types.professional');
      case 'interest': return t('networkOnboarding.basics.types.interest');
      case 'education': return t('networkOnboarding.basics.types.education');
      case 'nonprofit': return t('networkOnboarding.basics.types.nonprofit');
      default: return purpose;
    }
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        {t('networkOnboarding.review.infoMessage')}
      </Alert>
      
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {networkData.logoUrl && (
            <Box
              component="img"
              src={networkData.logoUrl}
              alt="Network Logo"
              sx={{
                width: 60,
                height: 60,
                objectFit: 'contain',
                borderRadius: 1,
                mr: 2
              }}
            />
          )}
          <Typography variant="h5" sx={{ color: theme.palette.primary.main }}>
            {networkData.name}
          </Typography>
        </Box>
        
        {networkData.description && (
          <Typography variant="body1" paragraph>
            {networkData.description}
          </Typography>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">{t('networkOnboarding.review.networkType')}</Typography>
                <Typography variant="body1">{getPurposeLabel(networkData.purpose)}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">{t('networkOnboarding.review.privacyLevel')}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {networkData.privacyLevel === 'private' && <LockIcon fontSize="small" sx={{ mr: 0.5 }} />}
                  {networkData.privacyLevel === 'public' && <PublicIcon fontSize="small" sx={{ mr: 0.5 }} />}
                  {networkData.privacyLevel === 'restricted' && <GroupsIcon fontSize="small" sx={{ mr: 0.5 }} />}
                  <Typography>{getPrivacyLabel(networkData.privacyLevel)}</Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">{t('networkOnboarding.review.themeColor')}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      bgcolor: networkData.themeColor,
                      mr: 1
                    }} 
                  />
                  <Typography>{t('networkOnboarding.review.custom')}</Typography>
                </Box>
              </Box>
              
              {networkData.backgroundImageUrl && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">{t('networkOnboarding.review.backgroundImage')}</Typography>
                  <Typography variant="body1">{t('networkOnboarding.review.customBackground')}</Typography>
                  <Box
                    sx={{
                      width: 120,
                      height: 80,
                      mt: 1,
                      backgroundImage: `url(${networkData.backgroundImageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  />
                </Box>
              )}
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('networkOnboarding.review.enabledFeatures')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Object.entries(networkData.features)
                .filter(([_, enabled]) => enabled)
                .map(([feature]) => (
                  <Chip 
                    key={feature}
                    label={feature.charAt(0).toUpperCase() + feature.slice(1)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
            </Box>
            
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 0.5 }}>
              {t('networkOnboarding.review.defaultNavTabs')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {networkData.enabledTabs.map((tab) => (
                <Chip 
                  key={tab}
                  label={tab.charAt(0).toUpperCase() + tab.slice(1)}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

// ============================================
// Blog-Specific Wizard Steps
// ============================================

// Blog Step 2: Subdomain Selection
const BlogSubdomainStep = ({ networkData, setNetworkData }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState(null); // null, 'available', 'taken'
  const [checkError, setCheckError] = useState(null);

  const handleSubdomainChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setNetworkData(prev => ({
      ...prev,
      subdomain: value
    }));
    // Reset availability check
    setAvailability(null);
    setCheckError(null);
  };

  const handleCheckAvailability = async () => {
    if (!networkData.subdomain || networkData.subdomain.length < 3) {
      setCheckError(t('networkOnboarding.blog.subdomain.tooShort', 'Subdomain must be at least 3 characters'));
      return;
    }

    setChecking(true);
    setCheckError(null);

    try {
      const isAvailable = await checkSubdomainAvailability(networkData.subdomain);
      setAvailability(isAvailable ? 'available' : 'taken');
    } catch (error) {
      setCheckError(t('networkOnboarding.blog.subdomain.checkError', 'Error checking availability'));
    } finally {
      setChecking(false);
    }
  };

  const blogUrl = networkData.subdomain
    ? `${networkData.subdomain}.conclav.club`
    : 'yourblog.conclav.club';

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.info.light, 0.05)
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LinkIcon sx={{ mr: 1, color: 'info.main' }} />
          <Typography variant="subtitle1" fontWeight="medium">
            {t('networkOnboarding.blog.subdomain.title', 'Choose Your Blog Address')}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {t('networkOnboarding.blog.subdomain.helper', 'This will be your blog\'s unique web address. Choose something memorable!')}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TextField
            value={networkData.subdomain}
            onChange={handleSubdomainChange}
            placeholder="myblog"
            variant="outlined"
            size="small"
            sx={{ width: 200 }}
            inputProps={{
              maxLength: 63,
              style: { fontFamily: 'monospace' }
            }}
          />
          <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            .conclav.club
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={handleCheckAvailability}
            disabled={checking || !networkData.subdomain || networkData.subdomain.length < 3}
          >
            {checking ? <Spinner size={20} /> : t('networkOnboarding.blog.subdomain.check', 'Check')}
          </Button>
        </Box>

        {availability === 'available' && (
          <Alert severity="success" sx={{ mt: 1 }}>
            <Typography variant="body2">
              <strong>{blogUrl}</strong> {t('networkOnboarding.blog.subdomain.available', 'is available!')}
            </Typography>
          </Alert>
        )}

        {availability === 'taken' && (
          <Alert severity="error" sx={{ mt: 1 }}>
            <Typography variant="body2">
              <strong>{blogUrl}</strong> {t('networkOnboarding.blog.subdomain.taken', 'is already taken. Please choose another.')}
            </Typography>
          </Alert>
        )}

        {checkError && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {checkError}
          </Alert>
        )}

        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px dashed',
            borderColor: 'divider'
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            {t('networkOnboarding.blog.subdomain.preview', 'Preview')}
          </Typography>
          <Typography variant="h6" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
            https://{blogUrl}
          </Typography>
        </Box>
      </Paper>

      <Alert severity="info">
        {t('networkOnboarding.blog.subdomain.customDomainInfo', 'You can add a custom domain (like myblog.com) later in settings.')}
      </Alert>
    </Stack>
  );
};

// Blog Step 3: Branding (simplified version)
const BlogBrandingStep = ({ networkData, setNetworkData }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Handle logo upload
  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError(t('networkOnboarding.branding.logo.error.invalidType'));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError(t('networkOnboarding.branding.logo.error.tooLarge'));
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const fileExt = file.name.split('.').pop();
      const fileName = `temp-logos/${Date.now()}-blog-logo.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('networks')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('networks')
        .getPublicUrl(fileName);

      setNetworkData(prev => ({
        ...prev,
        logoUrl: publicUrl
      }));
    } catch (error) {
      console.error('Error uploading logo:', error);
      setUploadError(t('networkOnboarding.branding.logo.error.failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setNetworkData(prev => ({ ...prev, logoUrl: '' }));
  };

  const handleColorChange = (e) => {
    setNetworkData(prev => ({ ...prev, themeColor: e.target.value }));
  };

  return (
    <Stack spacing={3}>
      {/* Logo Upload */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ImageIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="subtitle1" fontWeight="medium">
            {t('networkOnboarding.blog.branding.logo', 'Blog Logo')}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {t('networkOnboarding.blog.branding.logoHelper', 'Add a logo or profile picture for your blog')}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {networkData.logoUrl ? (
            <>
              <Box
                component="img"
                src={networkData.logoUrl}
                alt="Blog Logo"
                sx={{
                  width: 80,
                  height: 80,
                  objectFit: 'contain',
                  borderRadius: '50%',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              />
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={handleRemoveLogo}
                startIcon={<CloseIcon />}
              >
                {t('networkOnboarding.branding.logo.remove')}
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              component="label"
              startIcon={uploading ? <Spinner size={20} /> : <UploadIcon />}
              disabled={uploading}
            >
              {uploading ? t('networkOnboarding.branding.logo.uploading') : t('networkOnboarding.branding.logo.upload')}
              <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
            </Button>
          )}
        </Box>

        {uploadError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {uploadError}
          </Alert>
        )}
      </Paper>

      {/* Theme Color */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ThemeIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="subtitle1" fontWeight="medium">
            {t('networkOnboarding.branding.theme.title')}
          </Typography>
        </Box>

        <FormControl fullWidth>
          <InputLabel id="blog-theme-color-label">{t('networkOnboarding.branding.theme.title')}</InputLabel>
          <Select
            labelId="blog-theme-color-label"
            value={networkData.themeColor}
            onChange={handleColorChange}
            label="Theme Color"
          >
            <MenuItem value={theme.palette.primary.main}>{t('networkOnboarding.branding.theme.colors.blue')}</MenuItem>
            <MenuItem value={theme.palette.secondary.main}>{t('networkOnboarding.branding.theme.colors.purple')}</MenuItem>
            <MenuItem value={theme.palette.success.main}>{t('networkOnboarding.branding.theme.colors.green')}</MenuItem>
            <MenuItem value={theme.palette.error.main}>{t('networkOnboarding.branding.theme.colors.red')}</MenuItem>
            <MenuItem value={theme.palette.warning.main}>{t('networkOnboarding.branding.theme.colors.orange')}</MenuItem>
            <MenuItem value={theme.palette.info.main}>{t('networkOnboarding.branding.theme.colors.lightBlue')}</MenuItem>
            <MenuItem value="#000000">{t('networkOnboarding.branding.theme.colors.black')}</MenuItem>
            <MenuItem value="#424242">{t('networkOnboarding.branding.theme.colors.gray')}</MenuItem>
          </Select>
        </FormControl>

        <Box
          sx={{
            mt: 2,
            height: 20,
            bgcolor: networkData.themeColor,
            borderRadius: 1
          }}
        />
      </Paper>
    </Stack>
  );
};

// Blog Step 4: Settings (comments, newsletter, social links)
const BlogSettingsStep = ({ networkData, setNetworkData }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const handleBlogSettingChange = (setting) => (e) => {
    setNetworkData(prev => ({
      ...prev,
      blogSettings: {
        ...prev.blogSettings,
        [setting]: e.target.checked
      }
    }));
  };

  const handleSocialLinkChange = (platform) => (e) => {
    setNetworkData(prev => ({
      ...prev,
      blogSettings: {
        ...prev.blogSettings,
        social_links: {
          ...prev.blogSettings.social_links,
          [platform]: e.target.value
        }
      }
    }));
  };

  const handleAboutChange = (e) => {
    setNetworkData(prev => ({
      ...prev,
      blogSettings: {
        ...prev.blogSettings,
        about_page_content: e.target.value
      }
    }));
  };

  return (
    <Stack spacing={3}>
      {/* Comments Settings */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CommentIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="subtitle1" fontWeight="medium">
            {t('networkOnboarding.blog.settings.comments.title', 'Comments')}
          </Typography>
        </Box>

        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={networkData.blogSettings.comments_enabled}
                onChange={handleBlogSettingChange('comments_enabled')}
                color="primary"
              />
            }
            label={t('networkOnboarding.blog.settings.comments.enable', 'Enable comments on posts')}
          />

          {networkData.blogSettings.comments_enabled && (
            <>
              <FormControlLabel
                control={
                  <Switch
                    checked={networkData.blogSettings.anonymous_comments}
                    onChange={handleBlogSettingChange('anonymous_comments')}
                    color="primary"
                  />
                }
                label={t('networkOnboarding.blog.settings.comments.anonymous', 'Allow anonymous comments (visitors can comment without an account)')}
                sx={{ ml: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={networkData.blogSettings.comment_moderation}
                    onChange={handleBlogSettingChange('comment_moderation')}
                    color="primary"
                  />
                }
                label={t('networkOnboarding.blog.settings.comments.moderation', 'Require approval before comments are visible')}
                sx={{ ml: 2 }}
              />
            </>
          )}
        </FormGroup>
      </Paper>

      {/* Newsletter & RSS */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BlogIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="subtitle1" fontWeight="medium">
            {t('networkOnboarding.blog.settings.features.title', 'Features')}
          </Typography>
        </Box>

        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={networkData.blogSettings.newsletter_enabled}
                onChange={handleBlogSettingChange('newsletter_enabled')}
                color="primary"
              />
            }
            label={t('networkOnboarding.blog.settings.features.newsletter', 'Enable newsletter subscription (collect email subscribers)')}
          />

          <FormControlLabel
            control={
              <Switch
                checked={networkData.blogSettings.rss_enabled}
                onChange={handleBlogSettingChange('rss_enabled')}
                color="primary"
              />
            }
            label={t('networkOnboarding.blog.settings.features.rss', 'Enable RSS feed')}
          />
        </FormGroup>
      </Paper>

      {/* About Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          {t('networkOnboarding.blog.settings.about.title', 'About You')}
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          {t('networkOnboarding.blog.settings.about.helper', 'Tell your readers a bit about yourself. This will appear on your blog\'s About page.')}
        </Typography>

        <TextField
          multiline
          rows={4}
          fullWidth
          value={networkData.blogSettings.about_page_content || ''}
          onChange={handleAboutChange}
          placeholder={t('networkOnboarding.blog.settings.about.placeholder', 'Hello! I\'m a writer passionate about...')}
          variant="outlined"
        />
      </Paper>

      {/* Social Links */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          {t('networkOnboarding.blog.settings.social.title', 'Social Links')}
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          {t('networkOnboarding.blog.settings.social.helper', 'Add links to your social profiles (optional)')}
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Twitter / X"
            placeholder="https://twitter.com/yourhandle"
            value={networkData.blogSettings.social_links?.twitter || ''}
            onChange={handleSocialLinkChange('twitter')}
            size="small"
            fullWidth
          />
          <TextField
            label="LinkedIn"
            placeholder="https://linkedin.com/in/yourprofile"
            value={networkData.blogSettings.social_links?.linkedin || ''}
            onChange={handleSocialLinkChange('linkedin')}
            size="small"
            fullWidth
          />
          <TextField
            label="Instagram"
            placeholder="https://instagram.com/yourhandle"
            value={networkData.blogSettings.social_links?.instagram || ''}
            onChange={handleSocialLinkChange('instagram')}
            size="small"
            fullWidth
          />
          <TextField
            label="Website"
            placeholder="https://yourwebsite.com"
            value={networkData.blogSettings.social_links?.website || ''}
            onChange={handleSocialLinkChange('website')}
            size="small"
            fullWidth
          />
        </Stack>
      </Paper>
    </Stack>
  );
};

// Blog Step 5: Review
const BlogReviewStep = ({ networkData }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const blogUrl = networkData.subdomain
    ? `https://${networkData.subdomain}.conclav.club`
    : null;

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        {t('networkOnboarding.blog.review.info', 'Review your blog settings before creating. You can change these anytime in settings.')}
      </Alert>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        {/* Header with logo and name */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          {networkData.logoUrl ? (
            <Box
              component="img"
              src={networkData.logoUrl}
              alt="Blog Logo"
              sx={{
                width: 60,
                height: 60,
                objectFit: 'contain',
                borderRadius: '50%',
                mr: 2
              }}
            />
          ) : (
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: networkData.themeColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}
            >
              <BlogIcon sx={{ fontSize: 30, color: 'white' }} />
            </Box>
          )}
          <Box>
            <Typography variant="h5" sx={{ color: networkData.themeColor }}>
              {networkData.name || 'Your Blog'}
            </Typography>
            {blogUrl && (
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {blogUrl}
              </Typography>
            )}
          </Box>
        </Box>

        {networkData.description && (
          <Typography variant="body1" paragraph color="text.secondary">
            {networkData.description}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} sm={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('networkOnboarding.blog.review.visibility', 'Visibility')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <PublicIcon fontSize="small" sx={{ mr: 0.5, color: 'success.main' }} />
                  <Typography variant="body1">
                    {t('networkOnboarding.blog.review.public', 'Public - Anyone can view your blog')}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('networkOnboarding.blog.review.themeColor', 'Theme Color')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: networkData.themeColor,
                      mr: 1
                    }}
                  />
                  <Typography variant="body1">{t('networkOnboarding.review.custom')}</Typography>
                </Box>
              </Box>
            </Stack>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('networkOnboarding.blog.review.features', 'Features')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {networkData.blogSettings.comments_enabled && (
                <Chip
                  icon={<CommentIcon />}
                  label={networkData.blogSettings.anonymous_comments ? 'Anonymous Comments' : 'Comments'}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {networkData.blogSettings.comment_moderation && (
                <Chip
                  label="Comment Moderation"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
              {networkData.blogSettings.newsletter_enabled && (
                <Chip
                  label="Newsletter"
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              )}
              {networkData.blogSettings.rss_enabled && (
                <Chip
                  icon={<BlogIcon />}
                  label="RSS Feed"
                  size="small"
                  color="info"
                  variant="outlined"
                />
              )}
            </Box>

            {/* Social Links Preview */}
            {Object.values(networkData.blogSettings.social_links || {}).some(v => v) && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('networkOnboarding.blog.review.socialLinks', 'Social Links')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {networkData.blogSettings.social_links?.twitter && (
                    <Chip label="Twitter" size="small" variant="outlined" />
                  )}
                  {networkData.blogSettings.social_links?.linkedin && (
                    <Chip label="LinkedIn" size="small" variant="outlined" />
                  )}
                  {networkData.blogSettings.social_links?.instagram && (
                    <Chip label="Instagram" size="small" variant="outlined" />
                  )}
                  {networkData.blogSettings.social_links?.website && (
                    <Chip label="Website" size="small" variant="outlined" />
                  )}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default NetworkOnboardingWizard;