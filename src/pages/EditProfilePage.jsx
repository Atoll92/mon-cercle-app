// src/pages/EditProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import { fetchNetworkCategories } from '../api/categories';
import {
  Box,
  Button,
  Card,
  CardContent,
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
  Fade,
  Chip,
  Autocomplete,
  Tabs,
  Tab,
  LinearProgress,
  CardMedia,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  LinkedIn as LinkedInIcon,
  Language as LanguageIcon,
  Mail as MailIcon,
  Badge as BadgeIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  FileUpload as FileUploadIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import NotificationSettings from '../components/NotificationSettings';

function EditProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [bio, setBio] = useState('');
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
  
  // New state for the "Create New Post" form
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostLink, setNewPostLink] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  
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
          .eq('profile_id', user.id);
  
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
          .eq('id', user.id)
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
  }, [user]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      if (!user) return;
      
      // Get user's network ID from their profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('network_id')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profileData?.network_id) return;
      
      const { data, error } = await fetchNetworkCategories(profileData.network_id, true); // Only active categories
      if (data && !error) {
        setCategories(data);
      }
    };
    loadCategories();
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAddPostItem = () => {
    setPostItems([...postItems, {
      title: '',
      description: '',
      url: '',
      fileType: 'image', // Default to image type
      imageFile: null,
      imageUrl: '',
      pdfFile: null,
      pdfUrl: '',
      pdfThumbnail: ''
    }]);
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
  
  // Handle publishing a new post - immediately saves to database
  const handlePublishNewPost = async () => {
    // Validate the form
    if (!newPostTitle.trim()) {
      setError('Post title is required');
      return;
    }
    
    try {
      setSaving(true);
      console.log("Publishing and saving new post:", newPostTitle);
      console.log("Saving directly to portfolio_items table in the database");
      
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
      // Using the correct schema from portfolio_items table
      const newPost = {
        profile_id: user.id,
        title: newPostTitle,
        description: newPostContent,
        url: newPostLink,
        category_id: selectedCategory || null,
        // The only image field in the schema is image_url
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
      
      // Add the new item to the local state for immediate UI update
      setPostItems([...postItems, data]);
      
      // Reset the form
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostLink('');
      setNewPostImage(null);
      setNewPostImagePreview('');
      setSelectedCategory('');
      
      // Show success message
      setMessage('Post published successfully!');
      
    } catch (err) {
      console.error('Error publishing post:', err);
      setError('Failed to publish post. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handlePostItemChange = (index, field, value) => {
    const updatedItems = [...postItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setPostItems(updatedItems);
  };
  
  const handlePostImageChange = async (index, file) => {
    if (!file) return;
    
    const updatedItems = [...postItems];
    updatedItems[index] = {
      ...updatedItems[index],
      fileType: 'image',
      imageFile: file,
      imageUrl: URL.createObjectURL(file),
      pdfFile: null,
      pdfUrl: '',
      pdfThumbnail: ''
    };
    setPostItems(updatedItems);
  };
  
  const handlePostPdfChange = async (index, file) => {
    if (!file) return;
    
    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      setError('PDF file size must be less than 20MB');
      return;
    }
    
    const updatedItems = [...postItems];
    
    // For the PDF thumbnail, we'll use a standard PDF icon for now
    // In a production app, you might want to generate a real thumbnail from the first page
    
    updatedItems[index] = {
      ...updatedItems[index],
      fileType: 'pdf',
      pdfFile: file,
      pdfUrl: URL.createObjectURL(file),
      // We'll set the thumbnail to empty string. A proper thumbnail would be generated on the server
      // or we could use pdf.js to generate one on the client
      pdfThumbnail: '',
      imageFile: null,
      imageUrl: ''
    };
    
    setPostItems(updatedItems);
  };
  
  const handlePostItemRemove = (index) => {
    const updatedItems = postItems.filter((_, i) => i !== index);
    setPostItems(updatedItems);
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
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
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
          const fileName = `${user.id}-${Date.now()}-${index}.${fileExt}`;
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
          profile_id: user.id,
          title: item.title,
          description: item.description,
          url: item.url,
          image_url: fileUrl
        });
        
        const { error, data } = await supabase
          .from('portfolio_items')
          .upsert({
            id: item.id || undefined,
            profile_id: user.id,
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
          .eq('id', user.id)
          .maybeSingle();
        
        if (existingProfile) {
          // Profile exists but was incomplete, use update
          result = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', user.id);
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
          .eq('id', user.id);
      }
      
      if (result.error) throw result.error;
      
      // Fetch the updated profile to get network_id
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
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
            navigate(`/network/${currentProfile.network_id}?from_invite=true`);
          } else {
            // Regular redirect to network page
            navigate(`/network/${currentProfile.network_id}`);
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
        
        {isNewProfile && (
          <Alert severity="info" sx={{ mx: 3, mb: 3 }}>
            Welcome! Please take a moment to set up your profile information.
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

                {/* New Post Entry - Always at the top */}
                <Paper 
                  sx={{ 
                    p: 3, 
                    mb: 4, 
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <AddIcon sx={{ mr: 1, color: 'primary.main' }} />
                    Create New Post
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      label="Post Title"
                      placeholder="What's on your mind?"
                      variant="outlined"
                      sx={{ mb: 2 }}
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      required
                    />
                    
                    <TextField
                      fullWidth
                      label="Post Content"
                      placeholder="Share your thoughts with the community..."
                      multiline
                      rows={3}
                      variant="outlined"
                      sx={{ mb: 2 }}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                    />
                    
                    {/* Category selection */}
                    {categories.length > 0 && (
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
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
                      <Box sx={{ mb: 2, position: 'relative', width: '100%', maxHeight: '200px', overflow: 'hidden', borderRadius: 1 }}>
                        <img 
                          src={newPostImagePreview} 
                          alt="Post preview" 
                          style={{ 
                            width: '100%', 
                            objectFit: 'cover',
                            maxHeight: '200px'
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
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
                          sx={{ mr: 2 }}
                        >
                          {newPostImage ? 'Change Image' : 'Add Image'}
                        </Button>
                      </label>
                      
                      <TextField
                        label="Add Link (Optional)"
                        placeholder="https://example.com"
                        variant="outlined"
                        size="small"
                        sx={{ flexGrow: 1 }}
                        value={newPostLink}
                        onChange={(e) => setNewPostLink(e.target.value)}
                        InputProps={{
                          startAdornment: <LanguageIcon color="action" sx={{ mr: 1 }} fontSize="small" />
                        }}
                      />
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained" 
                      color="primary"
                      onClick={handlePublishNewPost}
                      disabled={!newPostTitle.trim() || saving}
                      startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                      {saving ? 'Publishing...' : 'Publish Post'}
                    </Button>
                  </Box>
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
                      <Typography variant="body1" color="text.secondary" paragraph>
                        You haven't created any posts yet.
                      </Typography>
                    </Paper>
                  ) : (
                    <Grid container spacing={3}>
                      {postItems.map((item, index) => (
                        <Grid item xs={12} md={6} key={item.id || index}>
                          <Card 
                            sx={{ 
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              borderRadius: 2,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                              }
                            }}
                          >
                            <Box sx={{ position: 'relative' }}>
                              {/* Image Preview */}
                              {item.fileType === 'image' && item.imageUrl ? (
                                <CardMedia
                                  component="img"
                                  height="180"
                                  image={item.imageUrl}
                                  alt={item.title || 'Post image'}
                                  sx={{ objectFit: 'cover' }}
                                />
                              ) : item.fileType === 'pdf' && item.pdfUrl ? (
                                /* PDF Preview */
                                <Box 
                                  sx={{ 
                                    height: 180, 
                                    bgcolor: '#f5f9ff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    p: 2,
                                    position: 'relative'
                                  }}
                                >
                                  <PdfIcon fontSize="large" color="primary" sx={{ mb: 1, fontSize: 60 }} />
                                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                                    {item.pdfFile ? item.pdfFile.name : 'PDF Document'}
                                  </Typography>
                                  {item.pdfUrl && (
                                    <Box 
                                      sx={{ 
                                        position: 'absolute', 
                                        top: 8, 
                                        left: 8,
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        borderRadius: 1,
                                        px: 1,
                                        py: 0.5,
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      PDF
                                    </Box>
                                  )}
                                </Box>
                              ) : (
                                /* No File Uploaded Yet */
                                <Box 
                                  sx={{ 
                                    height: 180, 
                                    bgcolor: 'grey.100',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    p: 2
                                  }}
                                >
                                  <FileUploadIcon fontSize="large" color="action" sx={{ mb: 1, opacity: 0.5 }} />
                                  <Typography variant="body2" color="text.secondary" align="center">
                                    Upload an image or PDF
                                  </Typography>
                                </Box>
                              )}
                              
                              {/* Upload Controls */}
                              <Box 
                                sx={{ 
                                  position: 'absolute',
                                  bottom: 8,
                                  right: 8,
                                  display: 'flex',
                                  gap: 1
                                }}
                              >
                                {/* Image Upload Button */}
                                <label htmlFor={`portfolio-image-${index}`}>
                                  <input
                                    accept="image/*"
                                    type="file"
                                    onChange={(e) => handlePostImageChange(index, e.target.files[0])}
                                    id={`portfolio-image-${index}`}
                                    hidden
                                  />
                                  <Tooltip title="Upload Image">
                                    <IconButton
                                      component="span"
                                      sx={{
                                        bgcolor: 'white',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        '&:hover': {
                                          bgcolor: 'grey.100'
                                        }
                                      }}
                                    >
                                      <ImageIcon />
                                    </IconButton>
                                  </Tooltip>
                                </label>
                                
                                {/* PDF Upload Button */}
                                <label htmlFor={`portfolio-pdf-${index}`}>
                                  <input
                                    accept="application/pdf"
                                    type="file"
                                    onChange={(e) => handlePostPdfChange(index, e.target.files[0])}
                                    id={`portfolio-pdf-${index}`}
                                    hidden
                                  />
                                  <Tooltip title="Upload PDF">
                                    <IconButton
                                      component="span"
                                      sx={{
                                        bgcolor: 'white',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        '&:hover': {
                                          bgcolor: 'grey.100'
                                        }
                                      }}
                                    >
                                      <PdfIcon />
                                    </IconButton>
                                  </Tooltip>
                                </label>
                              </Box>
                            </Box>
                            
                            <CardContent sx={{ flexGrow: 1, p: 3 }}>
                              <TextField
                                fullWidth
                                label="Post Title"
                                value={item.title}
                                onChange={(e) => handlePostItemChange(index, 'title', e.target.value)}
                                placeholder="Give your post a title"
                                variant="outlined"
                                sx={{ mb: 2 }}
                                required
                              />
                              
                              {/* Category display */}
                              {item.category_id && categories.find(c => c.id === item.category_id) && (
                                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                  <Box
                                    sx={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 0.5,
                                      px: 1.5,
                                      py: 0.5,
                                      borderRadius: '16px',
                                      bgcolor: alpha(categories.find(c => c.id === item.category_id).color, 0.12),
                                      border: `1px solid ${alpha(categories.find(c => c.id === item.category_id).color, 0.3)}`,
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        bgcolor: alpha(categories.find(c => c.id === item.category_id).color, 0.18),
                                        borderColor: alpha(categories.find(c => c.id === item.category_id).color, 0.4),
                                      }
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        bgcolor: categories.find(c => c.id === item.category_id).color,
                                        flexShrink: 0
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: categories.find(c => c.id === item.category_id).color,
                                        letterSpacing: '0.02em'
                                      }}
                                    >
                                      {categories.find(c => c.id === item.category_id).name}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                              
                              <TextField
                                fullWidth
                                label="Post Content"
                                value={item.description}
                                onChange={(e) => handlePostItemChange(index, 'description', e.target.value)}
                                placeholder="Share your thoughts with the community..."
                                multiline
                                rows={4}
                                variant="outlined"
                                sx={{ mb: 2 }}
                              />
                              
                              <TextField
                                fullWidth
                                label="Link (Optional)"
                                value={item.url}
                                onChange={(e) => handlePostItemChange(index, 'url', e.target.value)}
                                placeholder="https://example.com"
                                variant="outlined"
                                helperText="Add a link to your post (optional)"
                                InputProps={{
                                  startAdornment: <LanguageIcon color="action" sx={{ mr: 1 }} />
                                }}
                              />
                            </CardContent>
                            
                            <CardActions sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  startIcon={<DeleteIcon />}
                                  onClick={() => handlePostItemRemove(index)}
                                  size="small"
                                >
                                  Delete Post
                                </Button>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Chip 
                                  size="small" 
                                  label="Published" 
                                  color="success" 
                                  variant="outlined"
                                  sx={{ mr: 1 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Draft'}
                                </Typography>
                              </Box>
                            </CardActions>
                          </Card>
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
                <NotificationSettings />
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
    </Container>
  );
}

export default EditProfilePage;