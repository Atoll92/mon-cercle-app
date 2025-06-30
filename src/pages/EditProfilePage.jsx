// src/pages/EditProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { useApp } from '../context/appContext';
import { NetworkProvider } from '../context/networkContext';
import { supabase } from '../supabaseclient';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  TextField,
  Typography,
  Avatar,
  Paper,
  Alert,
  IconButton,
  Grid,
  Stack,
  Tooltip,
  Chip,
  Autocomplete,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  LinkedIn as LinkedInIcon,
  Language as LanguageIcon,
  Mail as MailIcon,
  Badge as BadgeIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import NotificationSettings from '../components/NotificationSettings';
import NotificationSystemManager from '../components/NotificationSystemManager';
import NotificationDebugger from '../components/NotificationDebugger';
import CreatePostModal from '../components/CreatePostModal';
import PostCard from '../components/PostCard';

function EditProfilePage() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [fullName, setFullName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [bio, setBio] = useState('');
  const [tagline, setTagline] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [skillsInput, setSkillsInput] = useState([]);
  const [skillOptions, setSkillOptions] = useState([]);
  const [avatar, setAvatar] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [postItems, setPostItems] = useState([]);
  const [initialPostItems, setInitialPostItems] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // State for Create Post Modal
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  
  // Handle post updates and deletions
  const handlePostUpdated = (updatedPost) => {
    setPostItems(prev => prev.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ));
  };
  
  const handlePostDeleted = (deletedPostId) => {
    setPostItems(prev => prev.filter(post => post.id !== deletedPostId));
  };
  
  const handlePostCreated = (newPost) => {
    setPostItems(prev => [newPost, ...prev]);
    setCreatePostModalOpen(false);
  };
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [profile, setProfile] = useState(null);

  // Common skill suggestions
  const commonSkills = [
    'JavaScript', 'React', 'Angular', 'Vue.js', 'Node.js', 'Python', 'Java', 'C#', 'PHP', 
    'HTML', 'CSS', 'SQL', 'Git', 'Docker', 'AWS', 'Azure', 'UI/UX Design', 'Product Management',
    'Agile', 'Scrum', 'Project Management', 'Data Analysis', 'Machine Learning', 'Artificial Intelligence',
    'DevOps', 'Marketing', 'SEO', 'Content Creation', 'Graphic Design', 'Social Media',
    'Communication', 'Leadership', 'Team Management', 'Problem Solving'
  ];

  useEffect(() => {
    const getProfile = async () => {
      if (!user) return;

      try {
        const { data: postData, error: postError } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('profile_id', activeProfile.id);
  
        if (postError) throw postError;
        
        // Process post items to handle both images and PDFs
        const postsWithPreviews = postData ? postData.map(item => {
          // Determine file type - backward compatibility with old data
          const fileType = item.file_type || (item.image_url ? 'image' : 'pdf');
          
          return {
            ...item,
            fileType: fileType,
            // For images
            imageUrl: fileType === 'image' ? (item.file_url || item.image_url || '') : '',
            // For PDFs
            pdfUrl: fileType === 'pdf' ? (item.file_url || '') : '',
            pdfThumbnail: fileType === 'pdf' ? (item.pdf_thumbnail || '') : ''
          };
        }) : [];
        
        setPostItems(postsWithPreviews);
        setInitialPostItems(postsWithPreviews);
      } catch (error) {
        console.error('Error loading posts:', error);
        setError('Failed to load posts');
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', activeProfile.id)
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (!data) {
          console.log('No profile found. Setting up for new profile creation');
          setIsNewProfile(true);
          // Default values for new users
          setContactEmail(user.email || '');
          setLoading(false);
          return;
        }
        
        // Store the profile data
        setProfile(data);
        
        // Set the form data
        setFullName(data.full_name || '');
        setContactEmail(data.contact_email || user.email || '');
        setBio(data.bio || '');
        setTagline(data.tagline || '');
        setPortfolioUrl(data.portfolio_url || '');
        setLinkedinUrl(data.linkedin_url || '');
        setSkillsInput(data.skills || []);
        setAvatarUrl(data.profile_picture_url || '');
        
        // Fetch common skills from the database if available or use default ones
        try {
          const { data: allSkills, error: skillsError } = await supabase
            .from('common_skills')
            .select('name');
            
          if (!skillsError && allSkills && allSkills.length > 0) {
            setSkillOptions(allSkills.map(skill => skill.name));
          } else {
            setSkillOptions(commonSkills);
          }
        } catch (err) {
          console.error('Error loading skills:', err);
          setSkillOptions(commonSkills);
        }
        
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    getProfile();
  }, [user?.id]);


  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };
  
  
  const handleAvatarChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    const file = e.target.files[0];
    setAvatar(file);
    // Create a preview URL
    setAvatarUrl(URL.createObjectURL(file));
  };

  const handleAvatarDrop = (e) => {
    e.preventDefault();
    setIsDraggingAvatar(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setAvatar(file);
        setAvatarUrl(URL.createObjectURL(file));
      }
    }
  };
  
  const uploadAvatar = async () => {
    if (!avatar) return avatarUrl;
    
    try {
      const fileExt = avatar.name.split('.').pop();
      const fileName = `${activeProfile.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
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
        .upload(filePath, avatar);
        
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setMessage('');
      
      // Process post items
      // Delete removed items
      const currentIds = postItems.map(item => item.id).filter(Boolean);
      const deletedItems = initialPostItems.filter(item => !currentIds.includes(item.id));
      
      for (const item of deletedItems) {
        const { error } = await supabase
          .from('portfolio_items')
          .delete()
          .eq('id', item.id);
        if (error) throw error;
      }

      // Upsert post items
      for (const [index, item] of postItems.entries()) {
        // Skip empty items
        if (!item.title.trim()) continue;
        
        // According to the schema, we only have image_url field
      let fileUrl = item.image_url || null;
        
        // Upload new file (only support images per schema)
        if (item.imageFile) {
          // Upload new image
          const fileExt = item.imageFile.name.split('.').pop();
          const fileName = `${activeProfile.id}-${Date.now()}-${index}.${fileExt}`;
          const filePath = `portfolios/${fileName}`;

          console.log('Uploading post image:', filePath);
          
          const { error: uploadError } = await supabase.storage
            .from('profiles')
            .upload(filePath, item.imageFile);

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

        console.log('Saving post to portfolio_items table:', {
          id: item.id || undefined,
          profile_id: activeProfile.id,
          title: item.title,
          description: item.description,
          url: item.url,
          image_url: fileUrl
        });
        
        const { error } = await supabase
          .from('portfolio_items')
          .upsert({
            id: item.id || undefined,
            profile_id: activeProfile.id,
            title: item.title,
            description: item.description,
            url: item.url,
            // Per schema, image_url is the only image field
            image_url: fileUrl
          }, { returning: 'minimal' });

        if (error) {
          console.error('Error saving portfolio item:', error);
          throw error;
        }
        
        console.log('Post saved successfully');
      }
      
      // Upload avatar if changed
      let newAvatarUrl = avatarUrl;
      if (avatar) {
        newAvatarUrl = await uploadAvatar();
      }
      
      const profileData = {
        full_name: fullName,
        contact_email: contactEmail,
        bio,
        tagline,
        portfolio_url: portfolioUrl,
        linkedin_url: linkedinUrl,
        skills: skillsInput,
        profile_picture_url: newAvatarUrl,
        updated_at: new Date()
      };
      
      let result;
      
      if (isNewProfile) {
        // For a new profile, we need to check if there's a network_id
        // if not, the AuthProvider should have created one, so we'll fetch the profile first
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('network_id, role')
          .eq('id', activeProfile.id)
          .maybeSingle();
        
        if (existingProfile) {
          // Profile exists but was incomplete, use update
          result = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', activeProfile.id);
        } else {
          // Create a new network and profile
          // This should ideally not happen as AuthProvider should have created it
          setError('Unable to create profile. Please try logging out and back in.');
          return;
        }
      } else {
        // Update existing profile
        result = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', activeProfile.id);
      }
      
      if (result.error) throw result.error;
      
      // Fetch the updated profile to get network_id
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeProfile.id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching updated profile:', fetchError);
      }
      
      setMessage(isNewProfile ? 'Profile created successfully!' : 'Profile updated successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        // Use updated profile or fall back to existing profile
        const currentProfile = updatedProfile || profile;
        
        // If user has a network, redirect to network page, otherwise dashboard
        if (currentProfile?.network_id) {
          // Check if this is the first profile setup (coming from invitation)
          const urlParams = new URLSearchParams(window.location.search);
          const fromInvite = urlParams.get('from_invite') === 'true';
          
          console.log('Redirecting to network:', {
            networkId: currentProfile.network_id,
            fromInvite,
            isNewProfile
          });
          
          if (fromInvite || isNewProfile) {
            // Redirect to network page with welcome flag
            navigate('/network?from_invite=true');
          } else {
            // Regular redirect to network page
            navigate('/network');
          }
        } else {
          console.log('No network_id found, redirecting to dashboard');
          // No network, go to dashboard
          navigate('/dashboard?from_profile_setup=true');
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
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
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading your profile...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        {/* Header */}
        <Box 
          sx={{ 
            p: 3, 
            background: 'linear-gradient(120deg, #2196f3, #3f51b5)', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <IconButton 
            sx={{ 
              mr: 1,
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.15)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.25)'
              }
            }} 
            onClick={() => navigate('/dashboard')}
            aria-label="Back to dashboard"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="500">
            {isNewProfile ? 'Complete Your Profile' : 'Edit Profile'}
          </Typography>
        </Box>
        
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            mb: 3 
          }}
        >
          <Tab 
            label="Basic Information" 
            icon={<PersonIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Posts" 
            icon={<LanguageIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Notifications" 
            icon={<NotificationsIcon />} 
            iconPosition="start"
          />
        </Tabs>
        
        {(isNewProfile || location.state?.isFirstTime) && (
          <Alert severity="info" sx={{ mx: 3, mb: 3 }}>
            {location.state?.message || "Welcome! Please take a moment to set up your profile information."}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mx: 3, mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {message && (
          <Alert severity="success" sx={{ mx: 3, mb: 3 }} onClose={() => setMessage(null)}>
            {message}
          </Alert>
        )}
        
        <Box sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            {/* Basic Information Tab */}
            {activeTab === 0 && (
              <Grid container spacing={4}>
                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box
                    sx={{
                      position: 'relative',
                      mb: 3,
                      width: 180,
                      height: 180
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingAvatar(true);
                    }}
                    onDragLeave={() => setIsDraggingAvatar(false)}
                    onDrop={handleAvatarDrop}
                  >
                    <Avatar
                      src={avatarUrl}
                      sx={{
                        width: 180,
                        height: 180,
                        border: isDraggingAvatar 
                          ? '3px dashed #2196f3' 
                          : '3px solid #e0e0e0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        transition: 'all 0.2s ease',
                        bgcolor: 'grey.100'
                      }}
                    >
                      {fullName ? 
                        <Typography variant="h2" color="primary">{fullName.charAt(0).toUpperCase()}</Typography> : 
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
                  
                  <Paper 
                    elevation={0} 
                    variant="outlined" 
                    sx={{ 
                      mt: 4, 
                      p: 2, 
                      borderRadius: 2,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                      width: '100%'
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                      Profile Preview
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <Avatar
                        src={avatarUrl}
                        sx={{ width: 50, height: 50, mr: 2 }}
                      >
                        {fullName ? fullName.charAt(0).toUpperCase() : <PersonIcon />}
                      </Avatar>
                      
                      <Box>
                        <Typography variant="body1" fontWeight="500">
                          {fullName || 'Your Name'}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {bio ? (bio.length > 50 ? bio.substring(0, 50) + '...' : bio) : 'Your bio will appear here'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
                      {skillsInput.slice(0, 3).map((skill, i) => (
                        <Chip key={i} label={skill} size="small" />
                      ))}
                      {skillsInput.length > 3 && (
                        <Chip 
                          label={`+${skillsInput.length - 3}`} 
                          size="small"
                          color="primary"
                        />
                      )}
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      InputLabelProps={{ shrink: true }}
                      required={isNewProfile}
                      helperText={isNewProfile ? "Please enter your name" : ""}
                      InputProps={{
                        startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />
                      }}
                      variant="outlined"
                    />
                    
                    <TextField
                      fullWidth
                      label="Contact Email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="Email address visible to network members"
                      InputLabelProps={{ shrink: true }}
                      required
                      helperText="This email will be visible to other network members"
                      InputProps={{
                        startAdornment: <MailIcon color="action" sx={{ mr: 1 }} />
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell others about yourself"
                      multiline
                      rows={4}
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                    />
                    
                    <TextField
                      fullWidth
                      label="Tagline"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="Your motto or catchphrase (max 60 characters)"
                      inputProps={{ maxLength: 60 }}
                      helperText={`${tagline.length}/60 characters - A short, memorable phrase that represents you`}
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                    />
                    
                    <TextField
                      fullWidth
                      label="Portfolio URL"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://your-portfolio.com"
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: <LanguageIcon color="action" sx={{ mr: 1 }} />
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="LinkedIn URL"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/your-profile"
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: <LinkedInIcon color="action" sx={{ mr: 1 }} />
                      }}
                    />
                    
                    <Autocomplete
                      multiple
                      freeSolo
                      options={skillOptions}
                      value={skillsInput}
                      onChange={(_, newValue) => setSkillsInput(newValue)}
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
                          helperText="Enter your skills and press Enter"
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
                  </Stack>
                </Grid>
              </Grid>
            )}
            
            {/* Posts Tab */}
            {activeTab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">
                    Your Posts
                  </Typography>
                </Box>

                {/* Create New Post Button */}
                <Paper 
                  sx={{ 
                    p: 3, 
                    mb: 4, 
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    border: '1px solid #e0e0e0',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AddIcon sx={{ mr: 1, color: 'primary.main' }} />
                    Create New Post
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Create a portfolio post to showcase your projects and share your work with the community.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setCreatePostModalOpen(true)}
                    startIcon={<AddIcon />}
                    size="large"
                  >
                    Create Post
                  </Button>
                </Paper>
                
                {/* Previously Published Posts Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, borderBottom: '1px solid #e0e0e0', pb: 1 }}>
                    Previously Published Posts
                  </Typography>
                  
                  {postItems.length === 0 ? (
                    <Paper 
                      variant="outlined"
                      sx={{ 
                        p: 4, 
                        textAlign: 'center',
                        borderRadius: 2,
                        borderStyle: 'dashed',
                        bgcolor: 'grey.50'
                      }}
                    >
                      <Typography variant="body1" color="text.secondary">
                        You haven't created any posts yet.
                      </Typography>
                    </Paper>
                  ) : (
                    <Grid container spacing={3}>
                      {postItems.map((post) => (
                        <Grid item xs={12} md={6} key={post.id}>
                          <PostCard
                            post={post}
                            author={profile}
                            isOwner={true}
                            onPostUpdated={handlePostUpdated}
                            onPostDeleted={handlePostDeleted}
                            sx={{ height: '100%' }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              </Box>
            )}
            
            {/* Notifications Tab */}
            {activeTab === 2 && (
              <Box>
                <Stack spacing={3}>
                  <NotificationSettings />
                  <NotificationSystemManager />
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Notification System Diagnostics
                    </Typography>
                    <NotificationDebugger />
                  </Box>
                </Stack>
              </Box>
            )}
            
            <Divider sx={{ my: 4 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/dashboard')}
                disabled={saving}
                startIcon={<CancelIcon />}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                sx={{ px: 4 }}
              >
                {saving ? 'Saving...' : (isNewProfile ? 'Create Profile' : 'Save Changes')}
              </Button>
            </Box>
          </form>
        </Box>
      </Paper>
      
      {/* Create Post Modal */}
      <CreatePostModal 
        open={createPostModalOpen}
        onClose={() => setCreatePostModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </Container>
  );
}

// Wrapper component that provides NetworkProvider
const EditProfilePageWrapper = () => {
  const { userNetworkId, fetchingNetwork } = useApp();

  if (fetchingNetwork) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '50vh' 
        }}
      >
        <CircularProgress size={40} color="primary" />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading profile...
        </Typography>
      </Box>
    );
  }

  if (userNetworkId) {
    return (
      <NetworkProvider networkId={userNetworkId}>
        <EditProfilePage />
      </NetworkProvider>
    );
  } else {
    // No network - render without NetworkProvider
    return <EditProfilePage />;
  }
};

export default EditProfilePageWrapper;