// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { useApp } from '../context/appContext';
import { NetworkProvider } from '../context/networkContext';
import { supabase } from '../supabaseclient';
import { getUserProfile } from '../api/networks';
import MoodboardGallery from '../components/moodboardGallery';
import EventParticipation from '../components/EventParticipation';
import UserBadges from '../components/UserBadges';
import EventDetailsDialog from '../components/EventDetailsDialog';
import PostsGrid from '../components/PostsGrid';
import PostCard from '../components/PostCard';
import Spinner from '../components/Spinner';
import {
  Button,
  Typography,
  Box,
  Container,
  Paper,
  Avatar,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Tabs,
  Tab,
  IconButton,
  Stack,
  alpha,
  Alert,
  Tooltip,
  
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Mail as MailIcon,
  LinkedIn as LinkedInIcon,
  Language as LanguageIcon,
  Event as EventIcon,
  Groups as GroupsIcon,
  PersonOutline as PersonOutlineIcon,
  LocationOn as LocationOnIcon,
  CalendarMonth as CalendarMonthIcon,
  MoreHoriz as MoreHorizIcon,
  Description as DescriptionIcon,
  Dashboard as DashboardIcon,
  Badge as Badge
} from '@mui/icons-material';
import { formatEventDate } from '../utils/dateFormatting';

function ProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState([]);

  
  // Tab indices
  const TAB_OVERVIEW = 0;
  const TAB_POSTS = 1;
  const TAB_EVENTS = 2;
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if viewing own profile (compare with activeProfile.id for multiple profiles support)
        if (userId === activeProfile?.id) {
          setIsOwnProfile(true);
        }
        
        // Fetch profile with network info
        const profileData = await getUserProfile(userId);
        if (!profileData) throw new Error('Profile not found');
        
        // Fetch network info separately if needed
        let networkData = null;
        if (profileData.network_id) {
          const { data: network } = await supabase
            .from('networks')
            .select('*')
            .eq('id', profileData.network_id)
            .single();
          networkData = network;
        }
        
        // Fetch posts for this profile
        const { data: postItems, error: postError } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('profile_id', userId);
          
        if (postError) throw postError;
        
        // Debug: Log portfolio items
        console.log('Portfolio items:', postItems);
        const itemsWithMedia = postItems?.filter(item => item.media_url);
        if (itemsWithMedia?.length > 0) {
          console.log('Portfolio items with media:', itemsWithMedia);
        }
        
        // Fetch event participations for this profile
        const { data: participations, error: participationsError } = await supabase
          .from('event_participations')
          .select(`
            status,
            events:event_id (*)
          `)
          .eq('profile_id', userId);
        
        if (participationsError) throw participationsError;
        
        // Get only upcoming events the user is attending
        const now = new Date();
        const attending = [];
        
        if (participations) {
          participations.forEach(participation => {
            if (
              participation.status === 'attending' && 
              participation.events && 
              new Date(participation.events.date) > now
            ) {
              attending.push({
                ...participation.events,
                participationStatus: participation.status
              });
            }
          });
          
          // Sort by date (closest first)
          attending.sort((a, b) => new Date(a.date) - new Date(b.date));
          setUpcomingEvents(attending);
        }
        
        setProfile({
          ...profileData,
          networks: networkData,
          posts: postItems || [] // Add posts to the profile object
        });
        setPosts(postItems || []);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile. The user may not exist or you may not have permission to view their profile.');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchProfile();
    }
  }, [userId, user, activeProfile]);
  
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };
  
  const closeEventDialog = () => {
    setShowEventDialog(false);
    setSelectedEvent(null);
  };

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  // Handle post updates and deletions
  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ));
    setProfile(prev => ({
      ...prev,
      posts: prev.posts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    }));
  };
  
  const handlePostDeleted = (deletedPostId) => {
    setPosts(prev => prev.filter(post => post.id !== deletedPostId));
    setProfile(prev => ({
      ...prev,
      posts: prev.posts.filter(post => post.id !== deletedPostId)
    }));
  };

  if (loading) {
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
        <Spinner size={120} color="primary" />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading profile...
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Oops! Something went wrong
          </Typography>
          <Typography variant="body1" paragraph>
            {error}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            The user may not exist or you may not have permission to view their profile.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }
  
  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Profile Not Found
          </Typography>
          <Typography variant="body1" paragraph>
            The user you're looking for doesn't exist or you don't have permission to view their profile.
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please check the URL or try searching for the user.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Card */}
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          mb: 3
        }}
      >
        {/* Blue header banner */}
        <Box 
          sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            position: 'relative',
            overflow: 'hidden',
            zIndex: 0,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'a\' x=\'0\' y=\'0\' width=\'100\' height=\'100\' patternUnits=\'userSpaceOnUse\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'1\' fill=\'rgba(255,255,255,0.1)\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100\' height=\'100\' fill=\'url(%23a)\'/%3E%3C/svg%3E") repeat',
              opacity: 0.5
            }
          }}
        >
          <IconButton 
            component={Link} 
            to="/dashboard"
            sx={{ 
              mr: 1,
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.15)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.25)'
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="500" sx={{ position: 'relative', zIndex: 1 }}>
            {isOwnProfile ? 'Your Profile' : `${profile.full_name || 'User'}'s Profile`}
          </Typography>
          
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            {isOwnProfile && (
              <Button
                component={Link}
                to="/profile/edit"
                variant="contained"
                startIcon={<EditIcon />}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)'
                  }
                }}
              >
                Edit Profile
              </Button>
            )}
            
            {!isOwnProfile && (
              <Button
                component={Link}
                to={`/messages/${profile.id}`}
                variant="contained"
                startIcon={<MailIcon />}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)'
                  }
                }}
              >
                Message
              </Button>
            )}
          </Box>
        </Box>
        
        {/* Tabs Navigation */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider'
          }}
        >
          <Tab 
            label="Overview" 
            icon={<PersonOutlineIcon />} 
            iconPosition="start"
            sx={{ fontWeight: activeTab === TAB_OVERVIEW ? 600 : 400 }}
          />
          <Tab 
            label={`Posts ${posts.length > 0 ? `(${posts.length})` : ''}`}
            icon={<LanguageIcon />} 
            iconPosition="start"
            sx={{ fontWeight: activeTab === TAB_POSTS ? 600 : 400 }}
          />
          {upcomingEvents.length > 0 && (
            <Tab 
              label="Events" 
              icon={<EventIcon />} 
              iconPosition="start"
            />
          )}
        </Tabs>
        
        {/* Profile Content */}
        <Box sx={{ p: 0 }}>

          {/* Overview Tab */}
          {activeTab === TAB_OVERVIEW && (
            <Grid container wrap="nowrap" sx={{ 
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              '@media (max-width: 900px)': {
                flexWrap: 'wrap'
              }
            }}>
              {/* Left Sidebar */}
              <Grid item sx={{ 
                width: { xs: '100%', sm: '300px' },
                minWidth: '300px',
                flexShrink: 0,
                borderRight: { sm: 1 }, 
                borderColor: 'divider' 
              }}>
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar
                    src={profile.profile_picture_url}
                    sx={{
                      width: 180,
                      height: 180,
                      border: '3px solid #e0e0e0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      mb: 3
                    }}
                  >
                    {profile.full_name ? (
                      <Typography variant="h2" color="primary">
                        {profile.full_name.charAt(0).toUpperCase()}
                      </Typography>
                    ) : (
                      <PersonOutlineIcon sx={{ fontSize: 80 }} />
                    )}
                  </Avatar>
                  
                  <Typography variant="h5" align="center" gutterBottom fontWeight="500">
                    {profile.full_name || 'Unnamed User'}
                  </Typography>
                  
                  {profile.tagline && (
                    <Typography 
                      variant="body2" 
                      align="center" 
                      color="text.secondary" 
                      sx={{ mb: 2, fontStyle: 'italic' }}
                    >
                      "{profile.tagline}"
                    </Typography>
                  )}
                  
                  <Stack direction="row" spacing={1} mb={2}>
                    {profile.role === 'admin' && (
                      <Chip 
                        label="Network Admin" 
                        color="primary" 
                        size="small"
                      />
                    )}
                    {profile.networks?.name && (
                      <Chip 
                        label={profile.networks.name}
                        icon={<GroupsIcon fontSize="small" />}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                  
                  {/* User Badges */}
                  <Box sx={{ mb: 2 }}>
                    <UserBadges 
                      userId={userId} 
                      displayMode="chips"
                      maxDisplay={3}
                      showTotal={true}
                    />
                  </Box>
                  
                  <Paper
                    elevation={0}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      width: '100%',
                      mb: 3
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Contact Information
                    </Typography>
                    
                    <Stack spacing={2} mt={1}>
                      {profile.contact_email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MailIcon fontSize="small" color="action" />
                          <Typography 
                            variant="body2" 
                            component="a" 
                            href={`mailto:${profile.contact_email}`}
                            sx={{ textDecoration: 'none', color: 'primary.main' }}
                          >
                            {profile.contact_email}
                          </Typography>
                        </Box>
                      )}
                      
                      {profile.portfolio_url && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LanguageIcon fontSize="small" color="action" />
                          <Tooltip title={profile.portfolio_url}>
                            <Typography 
                              variant="body2" 
                              component="a" 
                              href={profile.portfolio_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              sx={{ 
                                textDecoration: 'none', 
                                color: 'primary.main',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block'
                              }}
                            >
                              {profile.portfolio_url.replace(/^https?:\/\/(www\.)?/, '')}
                            </Typography>
                          </Tooltip>
                        </Box>
                      )}
                      
                      {profile.linkedin_url && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinkedInIcon fontSize="small" color="action" />
                          <Typography 
                            variant="body2" 
                            component="a" 
                            href={profile.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            sx={{ textDecoration: 'none', color: 'primary.main' }}
                          >
                            LinkedIn
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                  
                  {/* Upcoming Events Preview */}
                  {upcomingEvents.length > 0 && (
                    <Paper
                      elevation={0}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        width: '100%'
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 1.5
                      }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Upcoming Events ({upcomingEvents.length})
                        </Typography>
                        
                        {upcomingEvents.length > 2 && (
                          <Button 
                            size="small" 
                            endIcon={<MoreHorizIcon />} 
                            onClick={() => setActiveTab(TAB_EVENTS)}
                          >
                            See All
                          </Button>
                        )}
                      </Box>
                      
                      <Stack spacing={1.5}>
                        {upcomingEvents.slice(0, 2).map(event => (
                          <Card 
                            key={event.id} 
                            variant="outlined"
                            sx={{ 
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }
                            }}
                            onClick={() => handleEventClick(event)}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                              {event.cover_image_url ? (
                                <Box 
                                  sx={{ 
                                    width: 50, 
                                    height: 50, 
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    mr: 1.5
                                  }}
                                >
                                  <img 
                                    src={event.cover_image_url} 
                                    alt={event.title}
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'cover' 
                                    }} 
                                  />
                                </Box>
                              ) : (
                                <Box 
                                  sx={{ 
                                    width: 50, 
                                    height: 50, 
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'primary.light',
                                    color: 'white',
                                    mr: 1.5
                                  }}
                                >
                                  <CalendarMonthIcon />
                                </Box>
                              )}
                              
                              <Box sx={{ minWidth: 0 }}>
                                <Typography 
                                  variant="body2" 
                                  fontWeight="500" 
                                  noWrap
                                >
                                  {event.title}
                                </Typography>
                                
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary" 
                                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                >
                                  <CalendarMonthIcon fontSize="inherit" />
                                  {formatEventDate(event.date)}
                                </Typography>
                              </Box>
                            </Box>
                          </Card>
                        ))}
                      </Stack>
                    </Paper>
                  )}
                </Box>
              </Grid>
              
              {/* Right Main Content */}
              <Grid item xs={12} md={8}>
                <Box sx={{ p: 3 }}>
                  {/* About Section */}
                  <Box sx={{ mb: 4 }}>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1,
                        pb: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <DescriptionIcon fontSize="small" color="primary" />
                      About
                    </Typography>
                    
                    {profile.bio ? (
                      <Typography variant="body1" sx={{ mt: 2 }}>
                        {profile.bio}
                      </Typography>
                    ) : (
                      <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                        No bio provided.
                      </Alert>
                    )}
                  </Box>
                  
                  {/* Skills Section */}
                  <Box sx={{ mb: 4 }}>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1,
                        pb: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Badge fontSize="small" color="primary" />
                      Skills & Expertise
                    </Typography>
                    
                    {profile.skills && profile.skills.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                        {profile.skills.map((skill, index) => (
                          <Chip 
                            key={index} 
                            label={skill} 
                            sx={{ 
                              borderRadius: 1,
                              bgcolor: alpha('#3f51b5', 0.1)
                            }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                        No skills listed.
                      </Alert>
                    )}
                  </Box>



                  
                  {/* Moodboards Preview Section */}
                  <Box sx={{ mt: 4 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      pb: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      mb: 2
                    }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <DashboardIcon fontSize="small" color="primary" />
                        Moodboards
                      </Typography>
                    </Box>
                    
                    <MoodboardGallery
                      userId={userId}
                      isOwnProfile={isOwnProfile}
                      limit={2}
                    />
                  </Box>
                  
                  {/* Posts Preview Section */}
                  {posts.length > 0 && (
                    <Box>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        pb: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        mb: 3
                      }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <LanguageIcon fontSize="small" color="primary" />
                          Recent Posts
                        </Typography>
                        
                        <Button 
                          size="small" 
                          endIcon={<MoreHorizIcon />} 
                          onClick={() => setActiveTab(TAB_POSTS)}
                        >
                          See All ({posts.length})
                        </Button>
                      </Box>
                      
                      <Grid container spacing={2}>
                        {posts.slice(0, 2).map((post) => (
                          <Grid item xs={12} key={post.id}>
                            <PostCard
                              post={post}
                              author={profile}
                              isOwner={isOwnProfile}
                              onPostUpdated={handlePostUpdated}
                              onPostDeleted={handlePostDeleted}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
          
          {/* Posts Tab */}
          {activeTab === TAB_POSTS && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3
              }}>
                <Typography 
                  variant="h5" 
                  sx={{
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <LanguageIcon color="primary" />
                  {isOwnProfile ? 'Your Posts' : `${profile.full_name}'s Posts`}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  {posts.length} posts
                </Typography>
              </Box>
              
              {posts.length === 0 ? (
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
                    {isOwnProfile ? "You haven't created any posts yet." : "No posts to display."}
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  alignContent: 'flex-start'
                }}>
                  {posts.map((post) => (
                    <Box
                      key={post.id}
                      sx={{
                        width: { xs: '100%', sm: 'calc(50% - 8px)' },
                        maxWidth: { xs: '100%', sm: 'calc(50% - 8px)' },
                        flexShrink: 0
                      }}
                    >
                      <PostCard
                        post={post}
                        author={profile}
                        isOwner={isOwnProfile}
                        onPostUpdated={handlePostUpdated}
                        onPostDeleted={handlePostDeleted}
                        sx={{ height: '100%' }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
          
          {/* Events Tab */}
          {activeTab === TAB_EVENTS && upcomingEvents.length > 0 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Upcoming Events
              </Typography>
              
              <Grid container spacing={3}>
                {upcomingEvents.map(event => (
                  <Grid item xs={12} sm={6} md={4} key={event.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                        }
                      }}
                      onClick={() => handleEventClick(event)}
                    >
                      {event.cover_image_url ? (
                        <CardMedia
                          component="img"
                          height="160"
                          image={event.cover_image_url}
                          alt={event.title}
                        />
                      ) : (
                        <Box 
                          sx={{ 
                            height: 160, 
                            bgcolor: 'primary.light',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column'
                          }}
                        >
                          <EventIcon fontSize="large" />
                          <Typography variant="h6" mt={1}>
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Typography>
                        </Box>
                      )}
                      
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {event.title}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CalendarMonthIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatEventDate(event.date)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationOnIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {event.location}
                          </Typography>
                        </Box>
                        
                        {event.description && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              mt: 2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {event.description}
                          </Typography>
                        )}
                      </CardContent>
                      
                      <CardActions>
                        <Chip 
                          label="Attending" 
                          color="success" 
                          size="small"
                          variant="outlined"
                          icon={<EventIcon fontSize="small" />}
                        />
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Event Details Dialog */}
      <EventDetailsDialog
        open={showEventDialog}
        onClose={closeEventDialog}
        event={selectedEvent}
        user={user}
        showParticipants={true}
      />
    </Container>
  );
}

// Wrapper component that provides NetworkProvider
const ProfilePageWrapper = () => {
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
        <Spinner size={120} color="primary" />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading profile...
        </Typography>
      </Box>
    );
  }

  if (userNetworkId) {
    return (
      <NetworkProvider networkId={userNetworkId}>
        <ProfilePage />
      </NetworkProvider>
    );
  } else {
    // No network - render without NetworkProvider
    return <ProfilePage />;
  }
};

export default ProfilePageWrapper;