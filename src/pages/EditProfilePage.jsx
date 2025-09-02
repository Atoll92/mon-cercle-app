// src/pages/EditProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { useApp } from '../context/appContext';
import { NetworkProvider } from '../context/networkContext';
import { useTranslation } from '../hooks/useTranslation';
import { supabase } from '../supabaseclient';
import Spinner from '../components/Spinner';
import {
  Box,
  Button,
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
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha
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
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  GitHub as GitHubIcon,
  YouTube as YouTubeIcon,
  Link as LinkIcon,
  Close as CloseIcon,
  AudioFile as AudioFileIcon,
  VideoFile as VideoFileIcon,
  Cloud as CloudIcon,
  SportsEsports as SportsEsportsIcon,
  Chat as ChatIcon,
  LiveTv as LiveTvIcon,
  Forum as ForumIcon,
  Article as ArticleIcon,
  Palette as PaletteIcon,
  Brush as BrushIcon
} from '@mui/icons-material';
import NotificationSettings from '../components/NotificationSettings';
import CreatePostModal from '../components/CreatePostModal';
import PostCard from '../components/PostCard';
import MemberOnboardingWizard from '../components/MemberOnboardingWizard';

// Import real brand logos from react-icons
import {
  FaLinkedinIn,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaGithub,
  FaYoutube,
  FaSoundcloud,
  FaVimeoV,
  FaTiktok,
  FaDiscord,
  FaTwitch,
  FaMastodon,
  FaMediumM,
  FaBehance,
  FaDribbble,
  FaGlobe,
  FaLink
} from 'react-icons/fa';
import { SiBluesky } from 'react-icons/si';

function EditProfilePage() {
  const { user } = useAuth();
  const { activeProfile, refreshActiveProfile } = useProfile();
  const { t, language, changeLanguage } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [fullName, setFullName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [bio, setBio] = useState('');
  const [tagline, setTagline] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState([]);
  const [skillsInput, setSkillsInput] = useState([]);
  const [skillOptions, setSkillOptions] = useState([]);
  const [avatar, setAvatar] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [postItems, setPostItems] = useState([]);
  const [initialPostItems, setInitialPostItems] = useState([]);
  const [activeTab, setActiveTab] = useState(() => {
    // Check URL params for tab parameter
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'settings') return 2;
    return 0;
  });
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  
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
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [networkDetails, setNetworkDetails] = useState(null);

  // Social media platform options with real brand logos
  const socialPlatforms = [
    { value: 'linkedin', label: 'LinkedIn', icon: FaLinkedinIn, color: '#0A66C2', patterns: ['linkedin.com', 'linkedin.fr'] },
    { value: 'facebook', label: 'Facebook', icon: FaFacebookF, color: '#1877f2', patterns: ['facebook.com', 'fb.com', 'fb.me'] },
    { value: 'twitter', label: 'Twitter/X', icon: FaTwitter, color: '#1DA1F2', patterns: ['twitter.com', 'x.com'] },
    { value: 'instagram', label: 'Instagram', icon: FaInstagram, color: '#E4405F', patterns: ['instagram.com', 'instagr.am'] },
    { value: 'github', label: 'GitHub', icon: FaGithub, color: '#181717', patterns: ['github.com'] },
    { value: 'youtube', label: 'YouTube', icon: FaYoutube, color: '#FF0000', patterns: ['youtube.com', 'youtu.be'] },
    { value: 'soundcloud', label: 'SoundCloud', icon: FaSoundcloud, color: '#FF5500', patterns: ['soundcloud.com'] },
    { value: 'vimeo', label: 'Vimeo', icon: FaVimeoV, color: '#1AB7EA', patterns: ['vimeo.com'] },
    { value: 'bluesky', label: 'Bluesky', icon: SiBluesky, color: '#00A8E8', patterns: ['bsky.app'] },
    { value: 'tiktok', label: 'TikTok', icon: FaTiktok, color: '#000000', patterns: ['tiktok.com', 'vm.tiktok.com'] },
    { value: 'discord', label: 'Discord', icon: FaDiscord, color: '#5865F2', patterns: ['discord.gg', 'discord.com'] },
    { value: 'twitch', label: 'Twitch', icon: FaTwitch, color: '#9146FF', patterns: ['twitch.tv'] },
    { value: 'mastodon', label: 'Mastodon', icon: FaMastodon, color: '#6364FF', patterns: ['mastodon.social', 'mstdn.'] },
    { value: 'medium', label: 'Medium', icon: FaMediumM, color: '#00AB6C', patterns: ['medium.com', 'medium.'] },
    { value: 'behance', label: 'Behance', icon: FaBehance, color: '#1769FF', patterns: ['behance.net'] },
    { value: 'dribbble', label: 'Dribbble', icon: FaDribbble, color: '#EA4C89', patterns: ['dribbble.com'] },
    { value: 'website', label: 'Website', icon: FaGlobe, color: '#00c853', patterns: [] },
    { value: 'other', label: 'Other', icon: FaLink, color: '#757575', patterns: [] }
  ];
  
  // Function to detect platform from URL
  const detectPlatform = (url) => {
    if (!url) return 'other';
    
    const urlLower = url.toLowerCase();
    
    for (const platform of socialPlatforms) {
      if (platform.patterns && platform.patterns.length > 0) {
        for (const pattern of platform.patterns) {
          if (urlLower.includes(pattern)) {
            return platform.value;
          }
        }
      }
    }
    
    // Check if it's a regular website (has http/https and a domain)
    if (urlLower.startsWith('http://') || urlLower.startsWith('https://')) {
      return 'website';
    }
    
    return 'other';
  };
  
  const handleAddSocialLink = () => {
    if (socialLinks.length < 5) {
      setSocialLinks([...socialLinks, { platform: 'other', url: '', label: '' }]);
    }
  };
  
  const handleUpdateSocialLink = (index, field, value) => {
    const updated = [...socialLinks];
    
    if (field === 'url') {
      // Auto-detect platform when URL is pasted
      const detectedPlatform = detectPlatform(value);
      updated[index] = { 
        ...updated[index], 
        url: value,
        platform: detectedPlatform
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    setSocialLinks(updated);
  };
  
  const handleRemoveSocialLink = (index) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };
  
  const getSocialIcon = (platform) => {
    const platformConfig = socialPlatforms.find(p => p.value === platform);
    return platformConfig ? platformConfig.icon : LinkIcon;
  };
  
  const getSocialColor = (platform) => {
    const platformConfig = socialPlatforms.find(p => p.value === platform);
    return platformConfig ? platformConfig.color : '#757575';
  };

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
      if (!activeProfile) return;

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
        
        // Check if this is an invited member who needs onboarding
        const urlParams = new URLSearchParams(window.location.search);
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
        
        console.log('Invitation check:', {
          fromInvite,
          hasRecentJoinFlag,
          hasCompletedOnboarding,
          networkId: data.network_id,
          profileId: data.id,
          userId: user.id,
          fullName: data.full_name
        });
        
        if ((fromInvite || hasRecentJoinFlag) && data.network_id && !hasCompletedOnboarding) {
          console.log('Invited member detected, showing onboarding wizard');
          
          // Clear the join flags since we're now handling the onboarding
          recentJoinFlags.forEach(flag => {
            sessionStorage.removeItem(flag);
            localStorage.removeItem(flag);
          });
          
          // Also clear any other potential invitation flags
          try {
            // Clear all items that might be invitation-related
            for (let i = sessionStorage.length - 1; i >= 0; i--) {
              const key = sessionStorage.key(i);
              if (key && (key.includes('recent_join') || key.includes('profile_created'))) {
                sessionStorage.removeItem(key);
              }
            }
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key && (key.includes('recent_join') || key.includes('profile_created'))) {
                localStorage.removeItem(key);
              }
            }
          } catch (err) {
            console.warn('Error clearing storage flags:', err);
          }
          
          // Fetch network details for the wizard
          try {
            const { data: networkData, error: networkError } = await supabase
              .from('networks')
              .select('*')
              .eq('id', data.network_id)
              .single();
              
            if (!networkError && networkData) {
              setNetworkDetails(networkData);
            }
          } catch (err) {
            console.error('Error fetching network details:', err);
          }
          
          setShowOnboardingWizard(true);
          setLoading(false);
          return;
        }
        
        // Set the form data
        setFullName(data.full_name || '');
        setContactEmail(data.contact_email || user.email || '');
        setBio(data.bio || '');
        setTagline(data.tagline || '');
        setPortfolioUrl(data.portfolio_url || '');
        setLinkedinUrl(data.linkedin_url || '');
        
        // Handle social links with migration from legacy linkedin_url
        let socialLinksData = data.social_links || [];
        
        // If no social links but has legacy linkedin_url, migrate it
        if (socialLinksData.length === 0 && data.linkedin_url) {
          socialLinksData = [{
            platform: 'linkedin',
            url: data.linkedin_url,
            label: ''
          }];
        }
        
        setSocialLinks(socialLinksData);
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
  }, [activeProfile?.id]);


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
        social_links: socialLinks,
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
      
      // Refresh the active profile in context to ensure all components see the updated data
      await refreshActiveProfile();
      
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
  
  const handleDeleteAccount = async () => {
    try {
      setDeleteAccountLoading(true);
      setError(null);
      
      // Call Supabase function to delete the user account
      const { error } = await supabase.rpc('delete_user_account', {
        user_id: user.id
      });
      
      if (error) throw error;
      
      // Sign out the user
      await supabase.auth.signOut();
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account. Please try again or contact support.');
    } finally {
      setDeleteAccountLoading(false);
      setDeleteAccountDialogOpen(false);
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
        <Spinner size={80} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          {t('editProfile.loading.profile')}
        </Typography>
      </Box>
    );
  }
  
  // Show onboarding wizard for invited members
  if (showOnboardingWizard && profile) {
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
            <Typography variant="h4" component="h1" fontWeight="500">
              Welcome! Complete Your Profile
            </Typography>
          </Box>
          
          <Box sx={{ p: 3 }}>
            <MemberOnboardingWizard 
              profile={profile}
              network={networkDetails}
            />
          </Box>
        </Paper>
      </Container>
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
            {isNewProfile ? t('editProfile.completeProfile') : t('editProfile.title')}
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
            label={t('editProfile.tabs.basicInfo')} 
            icon={<PersonIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={t('editProfile.tabs.posts')} 
            icon={<LanguageIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={t('editProfile.tabs.settings')} 
            icon={<SettingsIcon />} 
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
                        
                        {tagline && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            "{tagline}"
                          </Typography>
                        )}
                        
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
                    
                    {/* Social Links Section - Compact Design */}
                    <Box>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 2
                      }}>
                        <Typography variant="subtitle1" fontWeight="500">
                          Social Links ({socialLinks.length}/5)
                        </Typography>
                        
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={handleAddSocialLink}
                          disabled={socialLinks.length >= 5}
                          variant="outlined"
                        >
                          Add Link
                        </Button>
                      </Box>
                      
                      {socialLinks.length === 0 ? (
                        <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
                          Add social links - just paste URLs and we'll detect the platform!
                        </Alert>
                      ) : (
                        <Stack spacing={1.5}>
                          {socialLinks.map((link, index) => {
                            const Icon = getSocialIcon(link.platform);
                            const color = getSocialColor(link.platform);
                            
                            return (
                              <Paper 
                                key={index} 
                                variant="outlined" 
                                sx={{ 
                                  p: 1.5,
                                  borderRadius: 2,
                                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  {/* Platform Icon */}
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: alpha(color, 0.1),
                                    width: 36,
                                    height: 36,
                                    borderRadius: 1,
                                    flexShrink: 0
                                  }}>
                                    <Icon style={{ fontSize: 20, color: color }} />
                                  </Box>
                                  
                                  {/* URL Input */}
                                  <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Paste your social media URL..."
                                    value={link.url}
                                    onChange={(e) => handleUpdateSocialLink(index, 'url', e.target.value)}
                                    error={link.url && !link.url.startsWith('http')}
                                    helperText={
                                      link.url && !link.url.startsWith('http') 
                                        ? 'URL must start with http:// or https://' 
                                        : `${socialPlatforms.find(p => p.value === link.platform)?.label || 'Other'} detected`
                                    }
                                    sx={{ 
                                      '& .MuiFormHelperText-root': {
                                        fontSize: '0.75rem',
                                        mt: 0.5
                                      }
                                    }}
                                  />
                                  
                                  {/* Remove Button */}
                                  <IconButton
                                    onClick={() => handleRemoveSocialLink(index)}
                                    color="error"
                                    size="small"
                                    sx={{ flexShrink: 0 }}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Paper>
                            );
                          })}
                        </Stack>
                      )}
                    </Box>
                    
                    <Autocomplete
                      multiple
                      freeSolo
                      options={[]}
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
                {/* Previously Published Posts Section */}
                <Box sx={{ mb: 4 }}>
                  {/* Section Header with Create Button */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 3,
                      pb: 2,
                      borderBottom: '2px solid',
                      borderColor: 'primary.main'
                    }}
                  >
                    <Typography variant="h5" fontWeight="600" color="primary.main">
                      Previously Published Posts
                    </Typography>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setCreatePostModalOpen(true)}
                      startIcon={<AddIcon />}
                      size="medium"
                      sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)'
                        }
                      }}
                    >
                      Create Post
                    </Button>
                  </Box>
                  
                  {/* Posts Content */}
                  {postItems.length === 0 ? (
                    <Paper 
                      elevation={0}
                      variant="outlined"
                      sx={{ 
                        p: 6, 
                        textAlign: 'center',
                        borderRadius: 3,
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        borderColor: 'grey.300',
                        bgcolor: 'grey.50',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Box sx={{ mb: 2 }}>
                        <LanguageIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                      </Box>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No posts yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Share your work, thoughts, or achievements with your network
                      </Typography>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => setCreatePostModalOpen(true)}
                        startIcon={<AddIcon />}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 500
                        }}
                      >
                        Create Your First Post
                      </Button>
                    </Paper>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {postItems.length} {postItems.length === 1 ? 'post' : 'posts'} published
                      </Typography>
                      
                      <Grid container spacing={3}>
                        {postItems.map((post) => (
                          <Grid item xs={12} lg={6} key={post.id}>
                            <PostCard
                              post={post}
                              author={profile}
                              isOwner={true}
                              onPostUpdated={handlePostUpdated}
                              onPostDeleted={handlePostDeleted}
                              sx={{ 
                                height: '100%',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 8px 25px rgba(0,0,0,0.12)'
                                }
                              }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
            
            {/* Settings Tab */}
            {activeTab === 2 && (
              <Box>
                <Stack spacing={3}>
                  {/* Language Preference Section */}
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      {t('editProfile.language.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {t('editProfile.language.description')}
                    </Typography>
                    
                    <FormControl sx={{ minWidth: 300 }}>
                      <InputLabel id="language-select-label">
                        {t('editProfile.language.title')}
                      </InputLabel>
                      <Select
                        labelId="language-select-label"
                        value={language}
                        label={t('editProfile.language.title')}
                        onChange={(e) => changeLanguage(e.target.value)}
                        startAdornment={<LanguageIcon sx={{ mr: 1, color: 'action.active' }} />}
                      >
                        <MenuItem value="en">
                          🇬🇧 {t('editProfile.language.english')}
                        </MenuItem>
                        <MenuItem value="fr">
                          🇫🇷 {t('editProfile.language.french')}
                        </MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                      {t('editProfile.language.current', { 
                        language: language === 'fr' ? 'Français' : 'English' 
                      })}
                    </Typography>
                  </Paper>
                  
                  <NotificationSettings />
                  
                  <Divider sx={{ my: 4 }} />
                  
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom color="error">
                      {t('editProfile.settings.dangerZone')}
                    </Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 3, 
                        border: '1px solid',
                        borderColor: 'error.main',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="body1" gutterBottom>
                        {t('editProfile.settings.deleteAccount.warning')}
                      </Typography>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => setDeleteAccountDialogOpen(true)}
                        startIcon={<DeleteIcon />}
                        sx={{ mt: 2 }}
                      >
                        {t('editProfile.settings.deleteAccount.button')}
                      </Button>
                    </Paper>
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
                {t('editProfile.buttons.cancel')}
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
                startIcon={saving ? <Spinner size={40} color="inherit" /> : <SaveIcon />}
                sx={{ px: 4 }}
              >
                {saving ? t('editProfile.buttons.saving') : (isNewProfile ? t('editProfile.buttons.create') : t('editProfile.buttons.save'))}
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
      
      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={deleteAccountDialogOpen}
        onClose={() => setDeleteAccountDialogOpen(false)}
        aria-labelledby="delete-account-dialog-title"
        aria-describedby="delete-account-dialog-description"
      >
        <DialogTitle id="delete-account-dialog-title">
          {t('editProfile.settings.deleteAccount.title')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-account-dialog-description">
            {t('editProfile.settings.deleteAccount.description')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteAccountDialogOpen(false)}
            disabled={deleteAccountLoading}
          >
            {t('editProfile.buttons.cancel')}
          </Button>
          <Button 
            onClick={handleDeleteAccount} 
            color="error"
            variant="contained"
            disabled={deleteAccountLoading}
            startIcon={deleteAccountLoading ? <Spinner size={20} color="inherit" /> : <DeleteIcon />}
          >
            {deleteAccountLoading ? t('editProfile.settings.deleteAccount.deleting') : t('editProfile.settings.deleteAccount.button')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

// Wrapper component that provides NetworkProvider
const EditProfilePageWrapper = () => {
  const { userNetworkId, fetchingNetwork } = useApp();
  const { t } = useTranslation();

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
        <Spinner size={80} color="primary" />
        <Typography variant="body1" sx={{ mt: 2 }}>
          {t('editProfile.loading.profileText')}
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