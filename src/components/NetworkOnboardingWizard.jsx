// src/components/NetworkOnboardingWizard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
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
  CircularProgress,
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
  LocationOn as LocationIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Settings as SettingsIcon,
  CloudUpload as UploadIcon,
  FolderShared as SharedFolderIcon,
  Image as ImageIcon,
  NotificationsActive as NotificationsIcon,
  Close as CloseIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
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
  const navigate = useNavigate();
  const theme = useTheme();

  // State for the wizard
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Network creation data
  const [networkData, setNetworkData] = useState({
    name: '',
    description: '',
    purpose: 'general',
    privacyLevel: 'private',
    logoUrl: '',
    features: {
      events: true,
      news: true,
      files: true,
      chat: true,
      wiki: true,
      moodboards: true,
      location: false,
      notifications: true
    },
    enabledTabs: ['news', 'members', 'events', 'chat', 'files', 'wiki', 'social'],
    themeColor: theme.palette.primary.main
  });

  // Steps of the wizard
  const steps = [
    {
      label: 'Network Basics',
      description: `Let's start by creating your network. What would you like to call it?`,
      component: (
        <BasicInfoStep 
          networkData={networkData} 
          setNetworkData={setNetworkData} 
        />
      )
    },
    {
      label: 'Privacy & Access',
      description: 'Configure how members will join and what they can see',
      component: (
        <PrivacyStep 
          networkData={networkData} 
          setNetworkData={setNetworkData} 
        />
      )
    },
    {
      label: 'Features & Modules',
      description: 'Select which features you\'d like to enable for your network',
      component: (
        <FeaturesStep 
          networkData={networkData} 
          setNetworkData={setNetworkData} 
        />
      )
    },
    {
      label: 'Branding & Layout',
      description: 'Configure your network logo, theme, and navigation',
      component: (
        <NavigationStep 
          networkData={networkData} 
          setNetworkData={setNetworkData} 
        />
      )
    },
    {
      label: 'Review & Create',
      description: 'Review your settings and create your network',
      component: (
        <ReviewStep 
          networkData={networkData} 
        />
      )
    }
  ];

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
      setError("You must be logged in to create a network");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create network in the database
      const { data: network, error: networkError } = await supabase
        .from('networks')
        .insert([{
          name: networkData.name,
          description: networkData.description,
          created_by: user.id,
          logo_url: networkData.logoUrl || null,
          features_config: JSON.stringify({
            events: networkData.features.events,
            news: networkData.features.news,
            files: networkData.features.files,
            chat: networkData.features.chat,
            wiki: networkData.features.wiki,
            moodboards: networkData.features.moodboards,
            location_sharing: networkData.features.location,
            notifications: networkData.features.notifications
          }),
          privacy_level: networkData.privacyLevel,
          purpose: networkData.purpose,
          enabled_tabs: networkData.enabledTabs,
          theme_color: networkData.themeColor,
          background_image_url: null
        }])
        .select()
        .single();

      if (networkError) throw networkError;

      // Check if user already has a profile, if not create one
      // Detect schema version first
      const { data: schemaCheck } = await supabase
        .from('profiles')
        .select('user_id')
        .limit(1);
      
      const hasUserIdColumn = schemaCheck !== null;
      
      let checkQuery;
      if (hasUserIdColumn) {
        // NEW SCHEMA: Look up by user_id
        checkQuery = supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id);
      } else {
        // OLD SCHEMA: Look up by id
        checkQuery = supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id);
      }
      
      const { data: existingProfile, error: checkError } = await checkQuery.single();

      let isNewUser = false;

      if (checkError && checkError.code === 'PGRST116') {
        // No profile exists, create one
        isNewUser = true;
        
        const profileData = {
          network_id: network.id,
          role: 'admin',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
          contact_email: user.email,
          bio: '',
          skills: [],
          created_at: new Date().toISOString()
        };
        
        if (hasUserIdColumn) {
          // NEW SCHEMA: profiles.user_id = auth.users.id, profiles.id = generated UUID
          profileData.user_id = user.id;
        } else {
          // OLD SCHEMA: profiles.id = auth.users.id
          profileData.id = user.id;
        }
        
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (createProfileError) throw createProfileError;
      } else if (checkError) {
        throw checkError;
      } else {
        // Profile exists, update it with the new network_id
        let updateQuery;
        if (hasUserIdColumn) {
          // NEW SCHEMA: Update by profile id (existingProfile.id)
          updateQuery = supabase
            .from('profiles')
            .update({ 
              network_id: network.id, 
              role: 'admin'
            })
            .eq('id', existingProfile.id);
        } else {
          // OLD SCHEMA: Update by user id
          updateQuery = supabase
            .from('profiles')
            .update({ 
              network_id: network.id, 
              role: 'admin'
            })
            .eq('id', user.id);
        }

        const { error: profileError } = await updateQuery;
        if (profileError) throw profileError;
      }

      // Refresh the user session to ensure the profile update is reflected
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) console.error('Error refreshing session:', sessionError);

      setSuccess(true);
      
      setTimeout(() => {
        if (isNewUser) {
          navigate('/profile/edit', { 
            state: { 
              isFirstTime: true, 
              message: 'Welcome! Please complete your profile to get started.' 
            }
          });
        } else {
          navigate('/network');
        }
      }, 2000);
      
    } catch (error) {
      console.error("Error creating network:", error);
      setError(error.message || "An error occurred while creating your network");
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
          Network Created Successfully!
        </Typography>
        <Typography variant="body1" paragraph color="text.secondary">
          Your network "{networkData.name}" has been created. You can now start inviting members and customizing your space.
        </Typography>
        <CircularProgress size={30} sx={{ mt: 2, mb: 3 }} />
        <Typography variant="body2" color="text.secondary">
          Redirecting to your network...
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
                      (index === 0 && !networkData.name) || 
                      (index === steps.length - 1 && loading)
                    }
                    endIcon={index === steps.length - 1 ? <CreateIcon /> : <ArrowForwardIcon />}
                  >
                    {index === steps.length - 1 ? (
                      loading ? (
                        <>
                          <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                          Creating...
                        </>
                      ) : 'Create Network'
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

// Step 1: Basic network information
const BasicInfoStep = ({ networkData, setNetworkData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNetworkData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Stack spacing={3}>
      <TextField
        label="Network Name"
        name="name"
        value={networkData.name}
        onChange={handleChange}
        fullWidth
        required
        helperText="Choose a name for your network"
        variant="outlined"
      />
      
      <TextField
        label="Description"
        name="description"
        value={networkData.description}
        onChange={handleChange}
        multiline
        rows={3}
        fullWidth
        helperText="Briefly describe your network's purpose"
        variant="outlined"
      />
      
      <FormControl fullWidth>
        <FormLabel id="purpose-type-label">Network Type</FormLabel>
        <RadioGroup
          aria-labelledby="purpose-type-label"
          name="purpose"
          value={networkData.purpose}
          onChange={handleChange}
          row
        >
          <FormControlLabel value="general" control={<Radio />} label="General Community" />
          <FormControlLabel value="professional" control={<Radio />} label="Professional Team" />
          <FormControlLabel value="interest" control={<Radio />} label="Interest Group" />
          <FormControlLabel value="education" control={<Radio />} label="Educational" />
          <FormControlLabel value="nonprofit" control={<Radio />} label="Non-profit" />
        </RadioGroup>
      </FormControl>
    </Stack>
  );
};

// Step 2: Privacy settings
const PrivacyStep = ({ networkData, setNetworkData }) => {
  const theme = useTheme();

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
          Network Privacy
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
                    <Typography variant="body1">Private Network</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Only invited members can join and view content
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
                    <Typography variant="body1">Restricted Membership</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Members need approval, but non-members can see basic info
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
                    <Typography variant="body1">Public Network</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Anyone can join and view content
                    </Typography>
                  </Box>
                </Box>
              } 
            />
          </RadioGroup>
        </FormControl>
      </Paper>
      
      <Alert severity="info">
        You can always change these settings later from the Admin Panel.
      </Alert>
    </Stack>
  );
};

// Step 3: Features and modules
const FeaturesStep = ({ networkData, setNetworkData }) => {
  const theme = useTheme();
  
  const handleFeatureChange = (feature) => (e) => {
    setNetworkData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: e.target.checked
      }
    }));
  };

  // Feature cards with toggles
  const featureCards = [
    {
      name: 'events',
      title: 'Events',
      icon: <EventIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />,
      description: 'Create and manage events for your network',
    },
    {
      name: 'news',
      title: 'News & Announcements',
      icon: <ArticleIcon fontSize="large" sx={{ color: theme.palette.secondary.main }} />,
      description: 'Share news, updates and announcements',
    },
    {
      name: 'files',
      title: 'File Sharing',
      icon: <FileIcon fontSize="large" sx={{ color: theme.palette.success.main }} />,
      description: 'Share files and documents with your members',
    },
    {
      name: 'chat',
      title: 'Group Chat',
      icon: <ForumIcon fontSize="large" sx={{ color: theme.palette.info.main }} />,
      description: 'Real-time communication between members',
    },
    {
      name: 'wiki',
      title: 'Knowledge Wiki',
      icon: <WikiIcon fontSize="large" sx={{ color: theme.palette.warning.main }} />,
      description: 'Create and maintain knowledge resources',
    },
    {
      name: 'moodboards',
      title: 'Moodboards',
      icon: <ImageIcon fontSize="large" sx={{ color: theme.palette.error.main }} />,
      description: 'Visual collaboration and inspiration boards',
    },
    {
      name: 'location',
      title: 'Location Sharing',
      icon: <LocationIcon fontSize="large" sx={{ color: theme.palette.grey[700] }} />,
      description: 'Allow members to share their location',
    },
    {
      name: 'notifications',
      title: 'Notifications',
      icon: <NotificationsIcon fontSize="large" sx={{ color: theme.palette.primary.dark }} />,
      description: 'Alert members of important updates',
    }
  ];

  return (
    <Box>
      <Typography variant="body1" paragraph>
        Select which features to enable for your network:
      </Typography>
      
      <Grid container spacing={2}>
        {featureCards.map((feature) => (
          <Grid item xs={12} sm={6} key={feature.name}>
            <Card 
              variant="outlined" 
              sx={{ 
                borderRadius: 2,
                borderColor: networkData.features[feature.name] 
                  ? theme.palette.primary.main 
                  : theme.palette.divider,
                bgcolor: networkData.features[feature.name] 
                  ? alpha(theme.palette.primary.main, 0.05)
                  : 'transparent',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }
              }}
            >
              <CardActionArea 
                onClick={() => handleFeatureChange(feature.name)({target: {checked: !networkData.features[feature.name]}})}
                sx={{ 
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start'
                }}
              >
                <Box sx={{ display: 'flex', width: '100%', mb: 1 }}>
                  <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                    {feature.icon}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {feature.title}
                    </Typography>
                  </Box>
                  <Switch
                    checked={networkData.features[feature.name]}
                    onChange={handleFeatureChange(feature.name)}
                    color="primary"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Alert severity="info" sx={{ mt: 3 }}>
        You can enable or disable features later from the Admin Panel.
      </Alert>
    </Box>
  );
};

// Step 4: Navigation configuration
const NavigationStep = ({ networkData, setNetworkData }) => {
  const theme = useTheme();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const availableTabs = [
    { id: 'news', label: 'News', icon: <ArticleIcon fontSize="small" /> },
    { id: 'members', label: 'Members', icon: <GroupsIcon fontSize="small" /> },
    { id: 'events', label: 'Events', icon: <EventIcon fontSize="small" /> },
    { id: 'chat', label: 'Chat', icon: <ForumIcon fontSize="small" /> },
    { id: 'files', label: 'Files', icon: <FileIcon fontSize="small" /> },
    { id: 'wiki', label: 'Wiki', icon: <WikiIcon fontSize="small" /> },
    { id: 'social', label: 'Social Wall', icon: <ImageIcon fontSize="small" /> }
  ];
  
  // Handle logo upload
  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size must be less than 2MB');
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
      setUploadError('Failed to upload logo. Please try again.');
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
            Network Logo
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Upload a logo for your network. This will appear in the header and represent your network.
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
                Remove
              </Button>
            </Box>
          ) : (
            <Button
              variant="outlined"
              component="label"
              startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Logo'}
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
          Navigation Tabs
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select which tabs will appear in your network navigation. Drag to reorder them.
        </Typography>
        
        {/* Enabled Tabs - Sortable */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
            Enabled Tabs (Drag to reorder)
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
                  .filter(tab => tab && networkData.features[tab.id] !== false)
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
            Available Tabs (Click to enable)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {availableTabs
              .filter(tab => !networkData.enabledTabs.includes(tab.id) && networkData.features[tab.id] !== false)
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
            Theme Color
          </Typography>
        </Box>
        
        <FormControl fullWidth>
          <InputLabel id="theme-color-label">Theme Color</InputLabel>
          <Select
            labelId="theme-color-label"
            value={networkData.themeColor}
            onChange={handleColorChange}
            label="Theme Color"
          >
            <MenuItem value={theme.palette.primary.main}>Blue (Default)</MenuItem>
            <MenuItem value={theme.palette.secondary.main}>Purple</MenuItem>
            <MenuItem value={theme.palette.success.main}>Green</MenuItem>
            <MenuItem value={theme.palette.error.main}>Red</MenuItem>
            <MenuItem value={theme.palette.warning.main}>Orange</MenuItem>
            <MenuItem value={theme.palette.info.main}>Light Blue</MenuItem>
            <MenuItem value="#000000">Black</MenuItem>
            <MenuItem value="#424242">Gray</MenuItem>
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

// Step 5: Review configuration before creating
const ReviewStep = ({ networkData }) => {
  const theme = useTheme();
  
  // Helper function to get readable privacy level
  const getPrivacyLabel = (level) => {
    switch (level) {
      case 'private': return 'Private (Invite Only)';
      case 'restricted': return 'Restricted (Approval Required)';
      case 'public': return 'Public (Open)';
      default: return level;
    }
  };
  
  // Helper function to get readable purpose type
  const getPurposeLabel = (purpose) => {
    switch (purpose) {
      case 'general': return 'General Community';
      case 'professional': return 'Professional Team';
      case 'interest': return 'Interest Group';
      case 'education': return 'Educational';
      case 'nonprofit': return 'Non-profit';
      default: return purpose;
    }
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Please review your network settings before creating. You can modify all these settings later from the admin panel.
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
                <Typography variant="subtitle2" color="text.secondary">Network Type</Typography>
                <Typography variant="body1">{getPurposeLabel(networkData.purpose)}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Privacy Level</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {networkData.privacyLevel === 'private' && <LockIcon fontSize="small" sx={{ mr: 0.5 }} />}
                  {networkData.privacyLevel === 'public' && <PublicIcon fontSize="small" sx={{ mr: 0.5 }} />}
                  {networkData.privacyLevel === 'restricted' && <GroupsIcon fontSize="small" sx={{ mr: 0.5 }} />}
                  <Typography>{getPrivacyLabel(networkData.privacyLevel)}</Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Theme Color</Typography>
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
                  <Typography>Custom</Typography>
                </Box>
              </Box>
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Enabled Features
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
              Default Navigation Tabs
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

export default NetworkOnboardingWizard;