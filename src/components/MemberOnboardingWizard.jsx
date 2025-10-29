// src/components/MemberOnboardingWizard.jsx
import React, { useState } from 'react';
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
  Grid
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
  PictureAsPdf as PdfIcon
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
  
  // Intro post state
  const [createIntroPost, setCreateIntroPost] = useState(false);
  const [introPostTitle, setIntroPostTitle] = useState('');
  const [introPostContent, setIntroPostContent] = useState('');
  
  // Intro post media state
  const [introMediaUrl, setIntroMediaUrl] = useState(null);
  const [introMediaType, setIntroMediaType] = useState(null);
  const [introMediaMetadata, setIntroMediaMetadata] = useState({});

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
      label: t('memberOnboarding.steps.professionalDetails'),
      description: t('memberOnboarding.professionalDetails.description'),
      component: (
        <ProfessionalStep 
          profileData={profileData} 
          setProfileData={setProfileData}
          commonSkills={commonSkills}
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

      // Update profile in the database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.fullName,
          contact_email: profileData.contactEmail,
          bio: profileData.bio,
          tagline: profileData.tagline,
          portfolio_url: profileData.portfolioUrl,
          linkedin_url: profileData.linkedinUrl,
          skills: profileData.skills,
          profile_picture_url: avatarUrl,
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
const WelcomeStep = ({ network }) => {
  const { t } = useTranslation();
  
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
        helperText={t('memberOnboarding.basicInfo.contactEmailHelper')}
        variant="outlined"
        InputProps={{
          startAdornment: <MailIcon color="action" sx={{ mr: 1 }} />
        }}
      />
      
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

// Step 4: Professional Details
const ProfessionalStep = ({ profileData, setProfileData, commonSkills }) => {
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
        label={t('memberOnboarding.professionalDetails.websiteUrl')}
        name="portfolioUrl"
        value={profileData.portfolioUrl}
        onChange={handleChange}
        fullWidth
        placeholder={t('memberOnboarding.professionalDetails.websiteUrlPlaceholder')}
        helperText={t('memberOnboarding.professionalDetails.websiteUrlHelper')}
        variant="outlined"
        InputProps={{
          startAdornment: <LanguageIcon color="action" sx={{ mr: 1 }} />
        }}
      />
      
      <TextField
        label={t('memberOnboarding.professionalDetails.linkedinUrl')}
        name="linkedinUrl"
        value={profileData.linkedinUrl}
        onChange={handleChange}
        fullWidth
        placeholder={t('memberOnboarding.professionalDetails.linkedinUrlPlaceholder')}
        helperText={t('memberOnboarding.professionalDetails.linkedinUrlHelper')}
        variant="outlined"
        InputProps={{
          startAdornment: <LinkedInIcon color="action" sx={{ mr: 1 }} />
        }}
      />
      
      {/* <Autocomplete
        multiple
        freeSolo
        options={commonSkills}
        value={profileData.skills}
        onChange={(_, newValue) => setProfileData(prev => ({ ...prev, skills: newValue }))}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              label={option}
              {...getTagProps({ index })}
              key={index}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label={t('memberOnboarding.professionalDetails.skills')}
            placeholder={t('memberOnboarding.professionalDetails.skillsPlaceholder')}
            helperText={t('memberOnboarding.professionalDetails.skillsHelper')}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <BadgeIcon color="action" sx={{ mr: 1 }} />
                  {params.InputProps.startAdornment}
                </>
              )
            }}
          />
        )}
      /> */}
      
      <Alert severity="info">
        {t('memberOnboarding.professionalDetails.infoMessage')}
      </Alert>
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
  user
}) => {
  const { t } = useTranslation();
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
      <Alert severity="info">
        {t('memberOnboarding.introPost.wouldYouLike', { networkName: network?.name })}
      </Alert>
      
      <FormControlLabel
        control={
          <Radio
            checked={!createIntroPost}
            onChange={() => setCreateIntroPost(false)}
            value={false}
          />
        }
        label={t('memberOnboarding.introPost.skipForNow')}
      />
      
      <FormControlLabel
        control={
          <Radio
            checked={createIntroPost}
            onChange={() => setCreateIntroPost(true)}
            value={true}
          />
        }
        label={t('memberOnboarding.introPost.yesCreate')}
      />
      
      {createIntroPost && (
        <Box sx={{ pl: 4, pt: 2 }}>
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
            
            <Alert severity="success" sx={{ mt: 2 }}>
              {t('memberOnboarding.introPost.successMessage')}
            </Alert>
            
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

// Step 6: Review
const ReviewStep = ({ profileData, network, createIntroPost, introPostTitle, introPostContent, introMediaUrl, introMediaType, introMediaMetadata }) => {
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