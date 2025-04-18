// src/pages/EditProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
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
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

function EditProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [bio, setBio] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [skills, setSkills] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [portfolioItems, setPortfolioItems] = useState([]);
const [initialPortfolioItems, setInitialPortfolioItems] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [isNewProfile, setIsNewProfile] = useState(false);

  useEffect(() => {
    const getProfile = async () => {
      if (!user) return;

      try {
        const { data: portfolioData, error: portfolioError } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('profile_id', user.id);
  
        if (portfolioError) throw portfolioError;
        
        setPortfolioItems(portfolioData || []);
        setInitialPortfolioItems(portfolioData || []);
      } catch (error) {
        console.error('Error loading portfolio items:', error);
        setError('Failed to load portfolio items');
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
        
        // Set the form data
        setFullName(data.full_name || '');
        setContactEmail(data.contact_email || user.email || '');
        setBio(data.bio || '');
        setPortfolioUrl(data.portfolio_url || '');
        setLinkedinUrl(data.linkedin_url || '');
        setSkills(data.skills ? data.skills.join(', ') : '');
        setAvatarUrl(data.profile_picture_url || '');
        
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    

    
    
    getProfile();
  }, [user]);

  const handleAddPortfolioItem = () => {
    setPortfolioItems([...portfolioItems, {
      title: '',
      description: '',
      url: '',
      imageFile: null,
      imageUrl: ''
    }]);
  };
  
  const handlePortfolioItemChange = (index, field, value) => {
    const updatedItems = [...portfolioItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setPortfolioItems(updatedItems);
  };
  
  const handlePortfolioImageChange = async (index, file) => {
    if (!file) return;
    
    const updatedItems = [...portfolioItems];
    updatedItems[index] = {
      ...updatedItems[index],
      imageFile: file,
      imageUrl: URL.createObjectURL(file)
    };
    setPortfolioItems(updatedItems);
  };
  
  const handlePortfolioItemRemove = (index) => {
    const updatedItems = portfolioItems.filter((_, i) => i !== index);
    setPortfolioItems(updatedItems);
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
  
  const uploadAvatar = async () => {
    if (!avatar) return avatarUrl;
    
    try {
      const fileExt = avatar.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, avatar);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Process portfolio items
    // Delete removed items
    const currentIds = portfolioItems.map(item => item.id).filter(Boolean);
    const deletedItems = initialPortfolioItems.filter(item => !currentIds.includes(item.id));
    
    for (const item of deletedItems) {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', item.id);
      if (error) throw error;
    }

    // Upsert portfolio items
    for (const [index, item] of portfolioItems.entries()) {
      let imageUrl = item.image_url;
      
      // Upload new image
      if (item.imageFile) {
        const fileExt = item.imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}-${index}.${fileExt}`;
        const filePath = `portfolios/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, item.imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
        
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('portfolio_items')
        .upsert({
          id: item.id || undefined,
          profile_id: user.id,
          title: item.title,
          description: item.description,
          url: item.url,
          image_url: imageUrl
        });

      if (error) throw error;
    }
    
    try {
      setSaving(true);
      setError(null);
      setMessage('');
      
      // Process skills from comma-separated string to array
      const skillsArray = skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
      
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
        skills: skillsArray,
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
      
      setMessage(isNewProfile ? 'Profile created successfully!' : 'Profile updated successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/dashboard');
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            sx={{ mr: 2 }} 
            onClick={() => navigate('/dashboard')}
            aria-label="Back to dashboard"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {isNewProfile ? 'Complete Your Profile' : 'Edit Profile'}
          </Typography>
        </Box>
        
        {isNewProfile && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Welcome! Please take a moment to set up your profile information.
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {message && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMessage(null)}>
            {message}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={avatarUrl}
                sx={{
                  width: 150,
                  height: 150,
                  mb: 2,
                  border: '1px solid #eee',
                  boxShadow: 1
                }}
              >
                {fullName ? fullName.charAt(0).toUpperCase() : <PersonIcon sx={{ fontSize: 80 }} />}
              </Avatar>
              
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                sx={{ mb: 1 }}
              >
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarChange}
                />
              </Button>
              
              <Typography variant="caption" color="text.secondary" textAlign="center">
                Recommended: Square image, at least 200x200px
              </Typography>
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
                />
                
                <TextField
                  fullWidth
                  label="Portfolio URL"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://your-portfolio.com"
                  InputLabelProps={{ shrink: true }}
                />
                
                <TextField
                  fullWidth
                  label="LinkedIn URL"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/your-profile"
                  InputLabelProps={{ shrink: true }}
                />
                
                <TextField
                  fullWidth
                  label="Skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, JavaScript, UI Design (comma-separated)"
                  InputLabelProps={{ shrink: true }}
                  helperText="Enter skills separated by commas"
                />
              </Stack>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 4 }} />
          <Grid item xs={12}>
  <Typography variant="h6" gutterBottom>
    Portfolio Items
  </Typography>
  
  {portfolioItems.map((item, index) => (
    <Paper key={item.id || index} sx={{ p: 2, mb: 2, border: '1px solid #eee' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <input
              accept="image/*"
              type="file"
              onChange={(e) => handlePortfolioImageChange(index, e.target.files[0])}
              id={`portfolio-image-${index}`}
              hidden
            />
            <label htmlFor={`portfolio-image-${index}`}>
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
              >
                Upload Image
              </Button>
            </label>
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt="Preview"
                style={{ maxWidth: '100%', borderRadius: '4px' }}
              />
            )}
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={8}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Title"
              value={item.title}
              onChange={(e) => handlePortfolioItemChange(index, 'title', e.target.value)}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={item.description}
              onChange={(e) => handlePortfolioItemChange(index, 'description', e.target.value)}
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Project URL"
              value={item.url}
              onChange={(e) => handlePortfolioItemChange(index, 'url', e.target.value)}
              placeholder="https://example.com"
            />
          </Stack>
        </Grid>
        
        <Grid item xs={12}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => handlePortfolioItemRemove(index)}
          >
            Remove Item
          </Button>
        </Grid>
      </Grid>
    </Paper>
  ))}
  
  <Button
    variant="contained"
    onClick={handleAddPortfolioItem}
    startIcon={<AddIcon />}
    sx={{ mt: 2 }}
  >
    Add Portfolio Item
  </Button>
</Grid>
          
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
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {saving ? 'Saving...' : (isNewProfile ? 'Create Profile' : 'Save Changes')}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

export default EditProfilePage;

