// src/components/MemberOnboardingWizard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { useTranslation } from '../hooks/useTranslation';
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
  Chip,
  Autocomplete,
  Avatar,
  LinearProgress,
  Tooltip,
  IconButton,
  useTheme,
  alpha,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Divider,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Switch
} from '@mui/material';
import Spinner from './Spinner';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Mail as MailIcon,
  Badge as BadgeIcon,
  LinkedIn as LinkedInIcon,
  Language as LanguageIcon,
  Groups as GroupsIcon,
  Info as InfoIcon,
  Upload as UploadIcon,
  Close as CloseIcon,
  PostAdd as PostAddIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  PictureAsPdf as PdfIcon,
  Notifications as NotificationsIcon,
  Article as NewsIcon,
  Event as EventIcon,
  AlternateEmail as MentionIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import MediaUpload from './MediaUpload';
import UserContent from './UserContent';

const MemberOnboardingWizard = ({ profile, network }) => {
  const { user } = useAuth();
  const { refreshActiveProfile } = useProfile();
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  console.log('MemberOnboardingWizard rendered with:', {
    profile: profile?.id,
    network: network?.name,
    user: user?.email
  });

  // State for the wizard
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Profile data
  const [profileData, setProfileData] = useState({
    fullName: '',
    contactEmail: user?.email || '',
    emailPublic: false,
    bio: '',
    tagline: '',
    portfolioUrl: '',
    linkedinUrl: '',
    skills: [],
    avatarUrl: '',
    avatarFile: null
  });

  // State for avatar upload
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  
  // Intro post state - default to true to encourage users to post
  const [createIntroPost, setCreateIntroPost] = useState(true);
  const [introPostTitle, setIntroPostTitle] = useState('');
  const [introPostContent, setIntroPostContent] = useState('');
  const [examplePost, setExamplePost] = useState(null);
  const [loadingExample, setLoadingExample] = useState(false);
  
  // Intro post media state
  const [introMediaUrl, setIntroMediaUrl] = useState(null);
  const [introMediaType, setIntroMediaType] = useState(null);
  const [introMediaMetadata, setIntroMediaMetadata] = useState({});

  // Notification preferences state
  const [notificationPreferences, setNotificationPreferences] = useState({
    email_notifications_enabled: true,
    notify_on_news: true,
    notify_on_events: true,
    notify_on_mentions: true,
    notify_on_direct_messages: true
  });

  // State for featured members
  const [featuredMembers, setFeaturedMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Fetch up to 3 random members with profile pictures
  // Will display 1, 2, or 3 members depending on availability
  useEffect(() => {
    const fetchFeaturedMembers = async () => {
      if (!network?.id) return;

      try {
        setLoadingMembers(true);

        // Fetch members with profile pictures - filter for non-null and non-empty
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, profile_picture_url')
          .eq('network_id', network.id)
          .not('profile_picture_url', 'is', null)
          .not('full_name', 'is', null)
          .limit(20); // Get more than we need for randomization

        if (!error && data && data.length > 0) {
          // Additional filter to ensure profile_picture_url is not empty string
          const validMembers = data.filter(
            member => member.profile_picture_url &&
                     member.profile_picture_url.trim() !== '' &&
                     member.full_name &&
                     member.full_name.trim() !== ''
          );

          if (validMembers.length > 0) {
            // Randomly select up to 3 members (will show 1, 2, or 3 depending on availability)
            const shuffled = validMembers.sort(() => 0.5 - Math.random());
            setFeaturedMembers(shuffled.slice(0, 3));
          }
        }
      } catch (error) {
        console.log('No featured members found:', error);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchFeaturedMembers();
  }, [network?.id]);

  // Fetch an example presentation post created during onboarding from the network
  useEffect(() => {
    const fetchExamplePost = async () => {
      if (!network?.id) return;

      try {
        setLoadingExample(true);

        // Fetch recent posts with profile creation dates
        const { data, error } = await supabase
          .from('portfolio_items')
          .select(`
            id,
            title,
            description,
            created_at,
            profile_id,
            profiles!inner(
              id,
              full_name,
              profile_picture_url,
              network_id,
              created_at
            )
          `)
          .eq('profiles.network_id', network.id)
          .not('title', 'is', null)
          .not('description', 'is', null)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data && data.length > 0) {
          // Find a post that was created within 24 hours of profile creation (likely an intro post)
          const introPost = data.find(post => {
            const profileCreatedAt = new Date(post.profiles.created_at);
            const postCreatedAt = new Date(post.created_at);
            const hoursDiff = Math.abs(postCreatedAt - profileCreatedAt) / 36e5; // Convert to hours
            return hoursDiff <= 24; // Post created within 24 hours of profile creation
          });

          // Use intro post if found, otherwise fallback to most recent post
          setExamplePost(introPost || data[0]);
        }
      } catch (error) {
        console.log('No example post found:', error);
      } finally {
        setLoadingExample(false);
      }
    };

    fetchExamplePost();
  }, [network?.id]);

  // Common skill suggestions
  const commonSkills = [
    'JavaScript', 'React', 'Angular', 'Vue.js', 'Node.js', 'Python', 'Java', 'C#', 'PHP', 
    'HTML', 'CSS', 'SQL', 'Git', 'Docker', 'AWS', 'Azure', 'UI/UX Design', 'Product Management',
    'Agile', 'Scrum', 'Project Management', 'Data Analysis', 'Machine Learning', 'Artificial Intelligence',
    'DevOps', 'Marketing', 'SEO', 'Content Creation', 'Graphic Design', 'Social Media',
    'Communication', 'Leadership', 'Team Management', 'Problem Solving'
  ];

  // Steps of the wizard
  const steps = [
    {
      label: t('memberOnboarding.steps.welcome'),
      description: t('memberOnboarding.welcome.description', { networkName: network?.name || 'the network' }),
      component: (
        <WelcomeStep
          network={network}
          featuredMembers={featuredMembers}
          loadingMembers={loadingMembers}
        />
      )
    },
    {
      label: t('memberOnboarding.steps.basicInfo'),
      description: t('memberOnboarding.basicInfo.description'),
      component: (
        <BasicInfoStep 
          profileData={profileData} 
          setProfileData={setProfileData}
        />
      )
    },
    {
      label: t('memberOnboarding.steps.profilePicture'),
      description: t('memberOnboarding.profilePicture.description'),
      component: (
        <AvatarStep 
          profileData={profileData} 
          setProfileData={setProfileData}
          uploadProgress={uploadProgress}
          isDraggingAvatar={isDraggingAvatar}
          setIsDraggingAvatar={setIsDraggingAvatar}
        />
      )
    },
    {
      label: t('memberOnboarding.steps.onlinePresence'),
      description: t('memberOnboarding.onlinePresence.description'),
      component: (
        <OnlinePresenceStep
          profileData={profileData}
          setProfileData={setProfileData}
        />
      )
    },
    {
      label: t('memberOnboarding.steps.introPost'),
      description: t('memberOnboarding.introPost.description'),
      component: (
        <IntroPostStep
          createIntroPost={createIntroPost}
          setCreateIntroPost={setCreateIntroPost}
          introPostTitle={introPostTitle}
          setIntroPostTitle={setIntroPostTitle}
          introPostContent={introPostContent}
          setIntroPostContent={setIntroPostContent}
          introMediaUrl={introMediaUrl}
          setIntroMediaUrl={setIntroMediaUrl}
          introMediaType={introMediaType}
          setIntroMediaType={setIntroMediaType}
          introMediaMetadata={introMediaMetadata}
          setIntroMediaMetadata={setIntroMediaMetadata}
          network={network}
          user={user}
          examplePost={examplePost}
        />
      )
    },
    {
      label: t('memberOnboarding.steps.notifications'),
      description: t('memberOnboarding.notifications.description'),
      component: (
        <NotificationSettingsStep
          preferences={notificationPreferences}
          setPreferences={setNotificationPreferences}
          network={network}
        />
      )
    },
    {
      label: t('memberOnboarding.steps.review'),
      description: t('memberOnboarding.review.description'),
      component: (
        <ReviewStep
          profileData={profileData}
          network={network}
          createIntroPost={createIntroPost}
          introPostTitle={introPostTitle}
          introPostContent={introPostContent}
          introMediaUrl={introMediaUrl}
          introMediaType={introMediaType}
          introMediaMetadata={introMediaMetadata}
          notificationPreferences={notificationPreferences}
        />
      )
    }
  ];

  // Handle next button click
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleCompleteProfile();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  // Handle back button click
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Upload avatar helper
  const uploadAvatar = async () => {
    if (!profileData.avatarFile) return profileData.avatarUrl;
    
    try {
      
      const fileExt = profileData.avatarFile.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, profileData.avatarFile);
        
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
      
      // Reset progress after a delay  
      setTimeout(() => setUploadProgress(0), 1000);
      return data.publicUrl;
    } catch (error) {
      setUploadProgress(0);
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  // Handle profile completion
  const handleCompleteProfile = async () => {
    if (!user || !profile) {
      setError(t('memberOnboarding.errors.sessionError'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Upload avatar if present
      let avatarUrl = profileData.avatarUrl;
      if (profileData.avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      // Update profile in the database including notification preferences
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.fullName,
          contact_email: profileData.contactEmail,
          email_public: profileData.emailPublic,
          bio: profileData.bio,
          tagline: profileData.tagline,
          portfolio_url: profileData.portfolioUrl,
          linkedin_url: profileData.linkedinUrl,
          skills: profileData.skills,
          profile_picture_url: avatarUrl,
          email_notifications_enabled: notificationPreferences.email_notifications_enabled,
          notify_on_news: notificationPreferences.notify_on_news,
          notify_on_events: notificationPreferences.notify_on_events,
          notify_on_mentions: notificationPreferences.notify_on_mentions,
          notify_on_direct_messages: notificationPreferences.notify_on_direct_messages,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Refresh the active profile in context
      await refreshActiveProfile();

      // Create introduction post if requested
      if (createIntroPost && introPostTitle.trim() && introPostContent.trim()) {
        try {
          const { createPost } = await import('../api/posts');
          await createPost({
            title: introPostTitle,
            description: introPostContent,
            profile_id: profile.id,
            category_id: null,
            mediaUrl: introMediaUrl,
            mediaType: introMediaType,
            mediaMetadata: introMediaMetadata
          });
          console.log('Introduction post created successfully');
        } catch (postError) {
          console.error('Error creating introduction post:', postError);
          // Don't fail the onboarding if post creation fails
        }
      }

      // Mark onboarding as completed to prevent future triggers
      if (typeof window !== 'undefined' && profile?.id && profile?.network_id) {
        localStorage.setItem(`member_onboarding_completed_${profile.network_id}_${profile.id}`, 'true');
        localStorage.setItem(`member_onboarding_completed_user_${user.id}_network_${profile.network_id}`, 'true');
      }

      setSuccess(true);
      
      // Redirect to dashboard with invite flag to trigger WelcomeMessage
      setTimeout(() => {
        console.log('Profile completed, redirecting to dashboard with invite flag for WelcomeMessage');
        navigate('/dashboard?from_invite=true');
      }, 2000);
      
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.message || t('memberOnboarding.errors.updateError'));
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
          {t('memberOnboarding.success.title')}
        </Typography>
        <Typography variant="body1" paragraph color="text.secondary">
          {t('memberOnboarding.success.message', { networkName: network?.name })}
        </Typography>
        <Spinner size={60} sx={{ mt: 2, mb: 3 }} />
        <Typography variant="body2" color="text.secondary">
          {t('memberOnboarding.success.redirecting')}
        </Typography>
      </Paper>
    );
  }

  // Main wizard render
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
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
                      (index === 1 && !profileData.fullName) || 
                      (index === 4 && createIntroPost && (!introPostTitle.trim() || !introPostContent.trim())) ||
                      (index === steps.length - 1 && loading)
                    }
                    endIcon={index === steps.length - 1 ? <SaveIcon /> : <ArrowForwardIcon />}
                  >
                    {index === steps.length - 1 ? (
                      loading ? (
                        <>
                          <Spinner size={48} sx={{ mr: 1, color: 'white' }} />
                          {t('memberOnboarding.buttons.saving')}
                        </>
                      ) : t('memberOnboarding.buttons.completeProfile')
                    ) : t('memberOnboarding.buttons.continue')}
                  </Button>
                  <Button
                    disabled={index === 0 || loading}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    {t('memberOnboarding.buttons.back')}
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

// Step 1: Welcome
const WelcomeStep = ({ network, featuredMembers, loadingMembers }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ textAlign: 'center', py: 2 }}>
          {network?.logo_url && (
            <Box
              component="img"
              src={network.logo_url}
              alt={network.name}
              sx={{
                width: 100,
                height: 100,
                objectFit: 'contain',
                borderRadius: 2,
                mb: 3
              }}
            />
          )}

          <Typography variant="h5" gutterBottom>
            {t('memberOnboarding.welcome.title', { networkName: network?.name || 'our network' })}
          </Typography>

          <Typography variant="body1" paragraph color="text.secondary">
            {t('memberOnboarding.welcome.subtitle')}
          </Typography>
        </Box>

          {/* Featured Members Section */}
          {!loadingMembers && featuredMembers.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                textAlign="center"
                sx={{ mb: 2, fontWeight: 500 }}
              >
                {t('memberOnboarding.welcome.meetMembers')}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  gap: 3,
                  flexWrap: 'wrap'
                }}
              >
                {featuredMembers.map((member, index) => (
                  <Box
                    key={member.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      maxWidth: 120,
                      animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                      '@keyframes fadeInUp': {
                        from: {
                          opacity: 0,
                          transform: 'translateY(20px)'
                        },
                        to: {
                          opacity: 1,
                          transform: 'translateY(0)'
                        }
                      }
                    }}
                  >
                    <Avatar
                      src={member.profile_picture_url}
                      alt={member.full_name}
                      sx={{
                        width: 72,
                        height: 72,
                        mb: 1,
                        border: `3px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.08)',
                          boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.25)}`
                        }
                      }}
                    >
                      {member.full_name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      textAlign="center"
                      sx={{
                        lineHeight: 1.3,
                        color: theme.palette.text.primary
                      }}
                    >
                      {member.full_name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {network?.description && (
            <UserContent
              content={network.description}
            />
          )}

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha('#2196f3', 0.1),
              mt: 3
            }}
          >
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <InfoIcon fontSize="small" sx={{ mr: 1 }} />
              {t('memberOnboarding.welcome.whatHappensNext')}
            </Typography>
            <Stack spacing={1} sx={{ textAlign: 'left', ml: 3 }}>
              <Typography variant="body2">• {t('memberOnboarding.welcome.setupProfile')}</Typography>
              <Typography variant="body2">• {t('memberOnboarding.welcome.addPicture')}</Typography>
              <Typography variant="body2">• {t('memberOnboarding.welcome.shareSkills')}</Typography>
              <Typography variant="body2">• {t('memberOnboarding.welcome.joinCommunity', { networkName: network?.name })}</Typography>
            </Stack>
          </Paper>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
            {t('memberOnboarding.welcome.timeEstimate')}
          </Typography>
      </CardContent>
    </Card>
  );
};

// Step 2: Basic Information
const BasicInfoStep = ({ profileData, setProfileData }) => {
  const { t } = useTranslation();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Stack spacing={3}>
      <TextField
        label={t('memberOnboarding.basicInfo.fullName')}
        name="fullName"
        value={profileData.fullName}
        onChange={handleChange}
        fullWidth
        required
        helperText={t('memberOnboarding.basicInfo.fullNameHelper')}
        variant="outlined"
        InputProps={{
          startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />
        }}
      />

      <TextField
        label={t('memberOnboarding.basicInfo.contactEmail')}
        name="contactEmail"
        type="email"
        value={profileData.contactEmail}
        onChange={handleChange}
        fullWidth
        required
        helperText={
          profileData.emailPublic
            ? t('memberOnboarding.basicInfo.contactEmailHelperPublic', { defaultValue: 'This email will be visible to all network members. You can change this below.' })
            : t('memberOnboarding.basicInfo.contactEmailHelper', { defaultValue: 'Your email is private by default. You can choose to make it visible below.' })
        }
        variant="outlined"
        InputProps={{
          startAdornment: <MailIcon color="action" sx={{ mr: 1 }} />
        }}
      />

      {/* Email Privacy Toggle */}
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: alpha('#2196f3', 0.05)
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={profileData.emailPublic}
              onChange={(e) => setProfileData(prev => ({ ...prev, emailPublic: e.target.checked }))}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {t('memberOnboarding.basicInfo.emailVisibility.label', { defaultValue: 'Make email visible to network members' })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profileData.emailPublic
                  ? t('memberOnboarding.basicInfo.emailVisibility.public', { defaultValue: 'Your email will be visible to all network members' })
                  : t('memberOnboarding.basicInfo.emailVisibility.private', { defaultValue: 'Your email will be hidden from other members (recommended for privacy)' })
                }
              </Typography>
            </Box>
          }
        />
      </Paper>

      <TextField
        label={t('memberOnboarding.basicInfo.bio')}
        name="bio"
        value={profileData.bio}
        onChange={handleChange}
        multiline
        rows={4}
        fullWidth
        helperText={t('memberOnboarding.basicInfo.bioHelper')}
        variant="outlined"
      />

      <TextField
        label={t('memberOnboarding.basicInfo.tagline')}
        name="tagline"
        value={profileData.tagline}
        onChange={handleChange}
        fullWidth
        inputProps={{ maxLength: 60 }}
        helperText={t('memberOnboarding.basicInfo.taglineHelper', { count: profileData.tagline.length })}
        variant="outlined"
      />
    </Stack>
  );
};

// Step 3: Avatar Upload
const AvatarStep = ({ profileData, setProfileData, uploadProgress, isDraggingAvatar, setIsDraggingAvatar }) => {
  const { t } = useTranslation();
  
  const handleAvatarChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    const file = e.target.files[0];
    setProfileData(prev => ({
      ...prev,
      avatarFile: file,
      avatarUrl: URL.createObjectURL(file)
    }));
  };

  const handleAvatarDrop = (e) => {
    e.preventDefault();
    setIsDraggingAvatar(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setProfileData(prev => ({
          ...prev,
          avatarFile: file,
          avatarUrl: URL.createObjectURL(file)
        }));
      }
    }
  };

  const handleRemoveAvatar = () => {
    setProfileData(prev => ({
      ...prev,
      avatarFile: null,
      avatarUrl: ''
    }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box
        sx={{
          position: 'relative',
          mb: 3,
          width: 200,
          height: 200
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingAvatar(true);
        }}
        onDragLeave={() => setIsDraggingAvatar(false)}
        onDrop={handleAvatarDrop}
      >
        <Avatar
          src={profileData.avatarUrl}
          sx={{
            width: 200,
            height: 200,
            border: isDraggingAvatar 
              ? '3px dashed #2196f3' 
              : '3px solid #e0e0e0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease',
            bgcolor: 'grey.100'
          }}
        >
          {profileData.fullName ? 
            <Typography variant="h2" color="primary">{profileData.fullName.charAt(0).toUpperCase()}</Typography> : 
            <PersonIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
          }
        </Avatar>
        
        {uploadProgress > 0 && (
          <Box 
            sx={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              p: 1,
              bgcolor: 'rgba(0,0,0,0.6)',
              borderBottomLeftRadius: '50%',
              borderBottomRightRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              gap: 0.5
            }}
          >
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{ width: '80%', borderRadius: 1 }}
            />
            <Typography variant="caption" color="white">
              {t('memberOnboarding.profilePicture.uploadProgress', { progress: uploadProgress })}
            </Typography>
          </Box>
        )}
        
        <Tooltip title={t('memberOnboarding.profilePicture.changePhoto')}>
          <IconButton
            sx={{
              position: 'absolute',
              bottom: 5,
              right: 5,
              bgcolor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '&:hover': {
                bgcolor: 'grey.100'
              }
            }}
            component="label"
          >
            <EditIcon fontSize="small" />
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {t('memberOnboarding.profilePicture.dragDrop')}
      </Typography>
      
      <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
        {t('memberOnboarding.profilePicture.recommended')}
      </Typography>
      
      {profileData.avatarUrl && (
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={handleRemoveAvatar}
          startIcon={<CloseIcon />}
          sx={{ mt: 2 }}
        >
          {t('memberOnboarding.profilePicture.removePhoto')}
        </Button>
      )}
      
      <Alert severity="info" sx={{ mt: 3, width: '100%' }}>
        {t('memberOnboarding.profilePicture.infoMessage')}
      </Alert>
    </Box>
  );
};

// Step 4: Online Presence (formerly Professional Details)
const OnlinePresenceStep = ({ profileData, setProfileData }) => {
  const { t } = useTranslation();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Stack spacing={3}>
      <Alert severity="info" icon={<InfoIcon />}>
        {t('memberOnboarding.onlinePresence.infoMessage')}
      </Alert>

      <TextField
        label={t('memberOnboarding.onlinePresence.websiteUrl')}
        name="portfolioUrl"
        value={profileData.portfolioUrl}
        onChange={handleChange}
        fullWidth
        placeholder={t('memberOnboarding.onlinePresence.websiteUrlPlaceholder')}
        helperText={t('memberOnboarding.onlinePresence.websiteUrlHelper')}
        variant="outlined"
        InputProps={{
          startAdornment: <LanguageIcon color="action" sx={{ mr: 1 }} />
        }}
      />

      <TextField
        label={t('memberOnboarding.onlinePresence.linkedinUrl')}
        name="linkedinUrl"
        value={profileData.linkedinUrl}
        onChange={handleChange}
        fullWidth
        placeholder={t('memberOnboarding.onlinePresence.linkedinUrlPlaceholder')}
        helperText={t('memberOnboarding.onlinePresence.linkedinUrlHelper')}
        variant="outlined"
        InputProps={{
          startAdornment: <LinkedInIcon color="action" sx={{ mr: 1 }} />
        }}
      />
    </Stack>
  );
};

// Step 5: Introduction Post (Optional)
const IntroPostStep = ({
  createIntroPost,
  setCreateIntroPost,
  introPostTitle,
  setIntroPostTitle,
  introPostContent,
  setIntroPostContent,
  introMediaUrl,
  setIntroMediaUrl,
  introMediaType,
  setIntroMediaType,
  introMediaMetadata,
  setIntroMediaMetadata,
  network,
  user,
  examplePost
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  // Handle media upload - same pattern as CreatePostModal
  const handleMediaUpload = (uploadResult) => {
    console.log("=== Introduction post media upload ===");
    console.log("Upload result received:", uploadResult);
    
    setIntroMediaUrl(uploadResult.url);
    setIntroMediaType(uploadResult.type);
    setIntroMediaMetadata({
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
  };

  // Handle media deletion
  const handleDeleteMedia = () => {
    setIntroMediaUrl(null);
    setIntroMediaType(null);
    setIntroMediaMetadata({});
  };

  // Get media icon
  const getMediaIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'image': return <ImageIcon fontSize="small" />;
      case 'video': return <VideoIcon fontSize="small" />;
      case 'audio': return <AudioIcon fontSize="small" />;
      case 'pdf': return <PdfIcon fontSize="small" />;
      default: return <AddIcon fontSize="small" />;
    }
  };
  return (
    <Stack spacing={3}>
      {/* Example post display */}
      {examplePost && (
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            {t('memberOnboarding.introPost.exampleTitle')}
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.primary.main, 0.02)
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
              <Avatar
                src={examplePost.profiles?.profile_picture_url}
                sx={{ width: 40, height: 40 }}
              >
                {examplePost.profiles?.full_name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {examplePost.profiles?.full_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(examplePost.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}>
              {examplePost.title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {examplePost.description}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Encouraging message */}
      <Alert severity="success" icon={<GroupsIcon />}>
        {t('memberOnboarding.introPost.encouragement', { networkName: network?.name })}
      </Alert>

      {/* Toggle options - reversed order, Yes first */}
      <Box>
        <FormControlLabel
          control={
            <Radio
              checked={createIntroPost}
              onChange={() => setCreateIntroPost(true)}
              value={true}
            />
          }
          label={
            <Box>
              <Typography variant="body1" fontWeight={500}>
                {t('memberOnboarding.introPost.yesCreate')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('memberOnboarding.introPost.yesCreateHelper')}
              </Typography>
            </Box>
          }
        />

        <FormControlLabel
          control={
            <Radio
              checked={!createIntroPost}
              onChange={() => setCreateIntroPost(false)}
              value={false}
            />
          }
          label={
            <Box>
              <Typography variant="body1" fontWeight={500}>
                {t('memberOnboarding.introPost.skipForNow')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('memberOnboarding.introPost.skipHelper')}
              </Typography>
            </Box>
          }
        />
      </Box>

      {createIntroPost && (
        <Box sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label={t('memberOnboarding.introPost.postTitle')}
              value={introPostTitle}
              onChange={(e) => setIntroPostTitle(e.target.value)}
              fullWidth
              required
              placeholder={t('memberOnboarding.introPost.postTitlePlaceholder')}
              variant="outlined"
              InputProps={{
                startAdornment: <PostAddIcon color="action" sx={{ mr: 1 }} />
              }}
            />

            <TextField
              label={t('memberOnboarding.introPost.postContent')}
              value={introPostContent}
              onChange={(e) => setIntroPostContent(e.target.value)}
              fullWidth
              required
              multiline
              rows={4}
              placeholder={t('memberOnboarding.introPost.postContentPlaceholder')}
              variant="outlined"
            />
            
            {/* Media Upload Section - Same pattern as CreatePostModal */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                {t('memberOnboarding.introPost.addMedia')}
              </Typography>
              
              {introMediaUrl ? (
                <Card sx={{ position: 'relative', mb: 2 }}>
                  {introMediaType === 'image' ? (
                    <CardMedia
                      component="img"
                      image={introMediaUrl}
                      alt="Preview"
                      sx={{ 
                        maxHeight: 200, 
                        objectFit: 'contain',
                        bgcolor: 'rgba(0,0,0,0.02)'
                      }}
                    />
                  ) : (
                    <Box 
                      sx={{ 
                        p: 3, 
                        textAlign: 'center',
                        bgcolor: 'rgba(0,0,0,0.02)'
                      }}
                    >
                      {getMediaIcon(introMediaType)}
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {introMediaMetadata?.fileName || t('memberOnboarding.introPost.mediaUploaded')}
                      </Typography>
                      <Chip 
                        label={introMediaType?.toUpperCase() || 'FILE'} 
                        size="small" 
                        sx={{ mt: 1 }} 
                      />
                    </Box>
                  )}
                  <IconButton
                    onClick={handleDeleteMedia}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.8)'
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Card>
              ) : (
                <MediaUpload
                  onUpload={handleMediaUpload}
                  allowedTypes={['IMAGE', 'VIDEO', 'AUDIO', 'PDF']}
                  bucket="profiles"
                  path={`portfolios/${user?.id}`}
                  maxFiles={1}
                  autoUpload={true}
                  showPreview={false}
                  compact={true}
                />
              )}
            </Box>
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

// Step 6: Notification Settings
const NotificationSettingsStep = ({ preferences, setPreferences, network }) => {
  const { t } = useTranslation();

  const handlePreferenceChange = (field, value) => {
    // If turning off master toggle, turn off all specific notifications
    if (field === 'email_notifications_enabled' && !value) {
      setPreferences({
        email_notifications_enabled: false,
        notify_on_news: false,
        notify_on_events: false,
        notify_on_mentions: false,
        notify_on_direct_messages: false
      });
    } else {
      setPreferences(prev => ({ ...prev, [field]: value }));
    }
  };

  const notificationTypes = [
    {
      key: 'notify_on_news',
      label: t('notificationSettings.types.news.label'),
      description: t('notificationSettings.types.news.description'),
      icon: <NewsIcon />
    },
    {
      key: 'notify_on_events',
      label: t('notificationSettings.types.events.label'),
      description: t('notificationSettings.types.events.description'),
      icon: <EventIcon />
    },
    {
      key: 'notify_on_mentions',
      label: t('notificationSettings.types.mentions.label'),
      description: t('notificationSettings.types.mentions.description'),
      icon: <MentionIcon />
    },
    {
      key: 'notify_on_direct_messages',
      label: t('notificationSettings.types.messages.label'),
      description: t('notificationSettings.types.messages.description'),
      icon: <MessageIcon />
    }
  ];

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <NotificationsIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            {t('memberOnboarding.notifications.title')}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          {t('memberOnboarding.notifications.infoMessage')}
        </Alert>

        <Stack spacing={3}>
          {/* Master toggle */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.email_notifications_enabled}
                  onChange={(e) => handlePreferenceChange('email_notifications_enabled', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {t('notificationSettings.masterToggle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('notificationSettings.masterToggleDescription')}
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Divider />

          {/* Specific notification types */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('notificationSettings.typesTitle')}
            </Typography>
            <Stack spacing={2}>
              {notificationTypes.map((type) => (
                <FormControlLabel
                  key={type.key}
                  control={
                    <Switch
                      checked={preferences[type.key] && preferences.email_notifications_enabled}
                      onChange={(e) => handlePreferenceChange(type.key, e.target.checked)}
                      disabled={!preferences.email_notifications_enabled}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="flex-start" gap={2} sx={{ opacity: preferences.email_notifications_enabled ? 1 : 0.5 }}>
                      <Box color="primary.main" mt={0.5}>
                        {type.icon}
                      </Box>
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {type.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {type.description}
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{
                    alignItems: 'flex-start',
                    ml: 0,
                    '& .MuiFormControlLabel-label': {
                      flex: 1,
                      mt: 1
                    }
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Step 7: Review
const ReviewStep = ({ profileData, network, createIntroPost, introPostTitle, introPostContent, introMediaUrl, introMediaType, introMediaMetadata, notificationPreferences }) => {
  const { t } = useTranslation();
  // Get media icon for preview
  const getMediaIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'image': return <ImageIcon fontSize="small" />;
      case 'video': return <VideoIcon fontSize="small" />;
      case 'audio': return <AudioIcon fontSize="small" />;
      case 'pdf': return <PdfIcon fontSize="small" />;
      default: return <AddIcon fontSize="small" />;
    }
  };
  return (
    <Box>
      <Alert severity="success" sx={{ mb: 3 }}>
        {t('memberOnboarding.review.successMessage', { networkName: network?.name })}
      </Alert>
      
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={profileData.avatarUrl}
            sx={{
              width: 80,
              height: 80,
              mr: 2
            }}
          >
            {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : <PersonIcon />}
          </Avatar>
          
          <Box>
            <Typography variant="h5">
              {profileData.fullName}
            </Typography>
            {profileData.tagline && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                "{profileData.tagline}"
              </Typography>
            )}
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">{t('memberOnboarding.review.email')}</Typography>
                <Typography variant="body1">{profileData.contactEmail}</Typography>
              </Box>
              
              {profileData.bio && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">{t('memberOnboarding.review.bio')}</Typography>
                  <Typography variant="body2">{profileData.bio}</Typography>
                </Box>
              )}
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Stack spacing={2}>
              {profileData.portfolioUrl && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">{t('memberOnboarding.review.website')}</Typography>
                  <Typography variant="body2">{profileData.portfolioUrl}</Typography>
                </Box>
              )}
              
              {profileData.linkedinUrl && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">{t('memberOnboarding.review.linkedin')}</Typography>
                  <Typography variant="body2">{profileData.linkedinUrl}</Typography>
                </Box>
              )}
              
              {profileData.skills.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>{t('memberOnboarding.review.skills')}</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {profileData.skills.map((skill, index) => (
                      <Chip 
                        key={index}
                        label={skill} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>
      
      {createIntroPost && introPostTitle && introPostContent && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            {t('memberOnboarding.review.introPostPreview')}
          </Typography>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha('#2196f3', 0.05) }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              {introPostTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {introPostContent}
            </Typography>

            {/* Show media preview if uploaded */}
            {introMediaUrl && (
              <Box sx={{ mt: 2 }}>
                {introMediaType === 'image' ? (
                  <CardMedia
                    component="img"
                    image={introMediaUrl}
                    alt="Media preview"
                    sx={{
                      maxHeight: 150,
                      objectFit: 'contain',
                      borderRadius: 1,
                      bgcolor: 'rgba(0,0,0,0.02)'
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      bgcolor: 'rgba(0,0,0,0.02)',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    {getMediaIcon(introMediaType)}
                    <Typography variant="body2">
                      {introMediaMetadata?.fileName || t('memberOnboarding.review.mediaFile')}
                    </Typography>
                    <Chip
                      label={introMediaType?.toUpperCase() || 'FILE'}
                      size="small"
                    />
                  </Box>
                )}
              </Box>
            )}

            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <PostAddIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="caption" color="primary.main">
                {t('memberOnboarding.introPost.postWillBePublished')}
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Notification Preferences Preview */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
          {t('memberOnboarding.review.notificationPreferences')}
        </Typography>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <NotificationsIcon color={notificationPreferences.email_notifications_enabled ? 'primary' : 'disabled'} fontSize="small" />
            <Typography variant="body2" fontWeight={500}>
              {notificationPreferences.email_notifications_enabled
                ? t('memberOnboarding.review.emailNotificationsEnabled')
                : t('memberOnboarding.review.emailNotificationsDisabled')}
            </Typography>
          </Box>
          {notificationPreferences.email_notifications_enabled && (
            <Stack spacing={0.5} sx={{ ml: 4 }}>
              {notificationPreferences.notify_on_news && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon fontSize="small" color="success" />
                  <Typography variant="body2">{t('notificationSettings.types.news.label')}</Typography>
                </Box>
              )}
              {notificationPreferences.notify_on_events && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon fontSize="small" color="success" />
                  <Typography variant="body2">{t('notificationSettings.types.events.label')}</Typography>
                </Box>
              )}
              {notificationPreferences.notify_on_mentions && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon fontSize="small" color="success" />
                  <Typography variant="body2">{t('notificationSettings.types.mentions.label')}</Typography>
                </Box>
              )}
              {notificationPreferences.notify_on_direct_messages && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon fontSize="small" color="success" />
                  <Typography variant="body2">{t('notificationSettings.types.messages.label')}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </Paper>
      </Box>

      <Box sx={{ mt: 3, p: 2, bgcolor: alpha('#2196f3', 0.1), borderRadius: 1 }}>
        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
          <GroupsIcon sx={{ mr: 1 }} />
          {t('memberOnboarding.review.readyToJoin', { networkName: network?.name })}
        </Typography>
      </Box>
    </Box>
  );
};

export default MemberOnboardingWizard;