// src/components/MemberOnboardingWizard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
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
  Close as CloseIcon
} from '@mui/icons-material';

const MemberOnboardingWizard = ({ profile, network }) => {
  const { user } = useAuth();
  const { refreshActiveProfile } = useProfile();
  const navigate = useNavigate();
  const theme = useTheme();

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
      label: 'Welcome',
      description: `Welcome to ${network?.name || 'the network'}! Let's set up your profile.`,
      component: (
        <WelcomeStep 
          network={network}
        />
      )
    },
    {
      label: 'Basic Information',
      description: 'Tell us about yourself',
      component: (
        <BasicInfoStep 
          profileData={profileData} 
          setProfileData={setProfileData}
        />
      )
    },
    {
      label: 'Profile Picture',
      description: 'Add a photo to help others recognize you',
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
      label: 'Professional Details',
      description: 'Share your skills and professional links',
      component: (
        <ProfessionalStep 
          profileData={profileData} 
          setProfileData={setProfileData}
          commonSkills={commonSkills}
        />
      )
    },
    {
      label: 'Review',
      description: 'Review your profile before joining',
      component: (
        <ReviewStep 
          profileData={profileData}
          network={network}
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
      setError("Session error. Please try logging in again.");
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
      setError(error.message || "An error occurred while updating your profile");
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
          Profile Completed!
        </Typography>
        <Typography variant="body1" paragraph color="text.secondary">
          Welcome to {network?.name}! You're all set to start exploring and connecting.
        </Typography>
        <Spinner size={60} sx={{ mt: 2, mb: 3 }} />
        <Typography variant="body2" color="text.secondary">
          Taking you to your dashboard...
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
                      (index === steps.length - 1 && loading)
                    }
                    endIcon={index === steps.length - 1 ? <SaveIcon /> : <ArrowForwardIcon />}
                  >
                    {index === steps.length - 1 ? (
                      loading ? (
                        <>
                          <Spinner size={48} sx={{ mr: 1, color: 'white' }} />
                          Saving...
                        </>
                      ) : 'Complete Profile'
                    ) : 'Continue'}
                  </Button>
                  <Button
                    disabled={index === 0 || loading}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
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
            Welcome to {network?.name || 'our network'}!
          </Typography>
          
          <Typography variant="body1" paragraph color="text.secondary">
            You've been invited to join this private network. Before you can access the full experience, 
            we need you to complete your profile.
          </Typography>
          
          {network?.description && (
            <Typography variant="body2" paragraph color="text.secondary" sx={{ fontStyle: 'italic' }}>
              "{network.description}"
            </Typography>
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
              What happens next:
            </Typography>
            <Stack spacing={1} sx={{ textAlign: 'left', ml: 3 }}>
              <Typography variant="body2">• Set up your basic profile information</Typography>
              <Typography variant="body2">• Add a profile picture</Typography>
              <Typography variant="body2">• Share your skills and interests</Typography>
              <Typography variant="body2">• Join the {network?.name} community!</Typography>
            </Stack>
          </Paper>
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
            This will only take a few minutes
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Step 2: Basic Information
const BasicInfoStep = ({ profileData, setProfileData }) => {
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
        label="Full Name"
        name="fullName"
        value={profileData.fullName}
        onChange={handleChange}
        fullWidth
        required
        helperText="How you'll appear to other members"
        variant="outlined"
        InputProps={{
          startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />
        }}
      />
      
      <TextField
        label="Contact Email"
        name="contactEmail"
        type="email"
        value={profileData.contactEmail}
        onChange={handleChange}
        fullWidth
        required
        helperText="This will be visible to other network members"
        variant="outlined"
        InputProps={{
          startAdornment: <MailIcon color="action" sx={{ mr: 1 }} />
        }}
      />
      
      <TextField
        label="Bio"
        name="bio"
        value={profileData.bio}
        onChange={handleChange}
        multiline
        rows={4}
        fullWidth
        helperText="Tell others about yourself (optional)"
        variant="outlined"
      />
      
      <TextField
        label="Tagline"
        name="tagline"
        value={profileData.tagline}
        onChange={handleChange}
        fullWidth
        inputProps={{ maxLength: 60 }}
        helperText={`${profileData.tagline.length}/60 - A short phrase that represents you (optional)`}
        variant="outlined"
      />
    </Stack>
  );
};

// Step 3: Avatar Upload
const AvatarStep = ({ profileData, setProfileData, uploadProgress, isDraggingAvatar, setIsDraggingAvatar }) => {
  
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
              {uploadProgress}%
            </Typography>
          </Box>
        )}
        
        <Tooltip title="Change profile picture">
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
        Drag & drop an image or click the edit icon
      </Typography>
      
      <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
        Recommended: Square image, at least 200x200px
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
          Remove Photo
        </Button>
      )}
      
      <Alert severity="info" sx={{ mt: 3, width: '100%' }}>
        Adding a profile picture helps other members recognize and connect with you
      </Alert>
    </Box>
  );
};

// Step 4: Professional Details
const ProfessionalStep = ({ profileData, setProfileData, commonSkills }) => {
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
        label="Portfolio URL"
        name="portfolioUrl"
        value={profileData.portfolioUrl}
        onChange={handleChange}
        fullWidth
        placeholder="https://your-portfolio.com"
        helperText="Your personal website or portfolio (optional)"
        variant="outlined"
        InputProps={{
          startAdornment: <LanguageIcon color="action" sx={{ mr: 1 }} />
        }}
      />
      
      <TextField
        label="LinkedIn URL"
        name="linkedinUrl"
        value={profileData.linkedinUrl}
        onChange={handleChange}
        fullWidth
        placeholder="https://linkedin.com/in/your-profile"
        helperText="Your LinkedIn profile (optional)"
        variant="outlined"
        InputProps={{
          startAdornment: <LinkedInIcon color="action" sx={{ mr: 1 }} />
        }}
      />
      
      <Autocomplete
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
            label="Skills"
            placeholder="Add a skill"
            helperText="Enter your skills and press Enter (optional)"
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
      />
      
      <Alert severity="info">
        These professional details help other members understand your expertise and interests
      </Alert>
    </Stack>
  );
};

// Step 5: Review
const ReviewStep = ({ profileData, network }) => {
  return (
    <Box>
      <Alert severity="success" sx={{ mb: 3 }}>
        Great! Your profile is ready. Review your information before joining {network?.name}.
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
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{profileData.contactEmail}</Typography>
              </Box>
              
              {profileData.bio && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Bio</Typography>
                  <Typography variant="body2">{profileData.bio}</Typography>
                </Box>
              )}
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Stack spacing={2}>
              {profileData.portfolioUrl && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Portfolio</Typography>
                  <Typography variant="body2">{profileData.portfolioUrl}</Typography>
                </Box>
              )}
              
              {profileData.linkedinUrl && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">LinkedIn</Typography>
                  <Typography variant="body2">{profileData.linkedinUrl}</Typography>
                </Box>
              )}
              
              {profileData.skills.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Skills</Typography>
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
      
      <Box sx={{ mt: 3, p: 2, bgcolor: alpha('#2196f3', 0.1), borderRadius: 1 }}>
        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
          <GroupsIcon sx={{ mr: 1 }} />
          Ready to join {network?.name}?
        </Typography>
      </Box>
    </Box>
  );
};

export default MemberOnboardingWizard;