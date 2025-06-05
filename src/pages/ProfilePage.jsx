// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import { getUserProfile } from '../api/networks';
import MoodboardGallery from '../components/moodboardGallery';
import EventParticipation from '../components/EventParticipation';
import MediaPlayer from '../components/MediaPlayer';
import UserBadges from '../components/UserBadges';
import EventDetailsDialog from '../components/EventDetailsDialog';
import {
  Button,
  Typography,
  Box,
  Divider,
  Container,
  Paper,
  Avatar,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  CircularProgress,
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
  Place as PlaceIcon,
  Groups as GroupsIcon,
  PersonOutline as PersonOutlineIcon,
  Launch as LaunchIcon,
  LocationOn as LocationOnIcon,
  CalendarMonth as CalendarMonthIcon,
  MoreHoriz as MoreHorizIcon,
  Description as DescriptionIcon,
  Dashboard as DashboardIcon,
  Badge as Badge,
  VideoLibrary as VideoIcon,
  AudioFile as AudioFileIcon
} from '@mui/icons-material';

function ProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Tab indices
  const TAB_OVERVIEW = 0;
  const TAB_MOODBOARDS = 1;
  const TAB_POSTS = 2;
  const TAB_EVENTS = 3;
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if viewing own profile
        if (userId === user?.id) {
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
  }, [userId, user]);
  
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
        <CircularProgress size={40} color="primary" />
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
            background: 'linear-gradient(120deg, #2196f3, #3f51b5)', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2
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
          <Typography variant="h4" component="h1" fontWeight="500">
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
          />
           <Tab 
    label="Moodboards" 
    icon={<PersonOutlineIcon />} 
    iconPosition="start"
  />
          <Tab 
            label="Posts" 
            icon={<LanguageIcon />} 
            iconPosition="start"
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

        {activeTab === TAB_MOODBOARDS && (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>
      {isOwnProfile ? 'Your Moodboards' : `${profile.full_name}'s Moodboards`}
    </Typography>
    
    <MoodboardGallery
      userId={userId}
      isOwnProfile={isOwnProfile}
      showFeatured={true}
    />
  </Box>
)}
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
                                  {new Date(event.date).toLocaleDateString()}
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
                      <Typography variant="body1" paragraph>
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

{activeTab === TAB_MOODBOARDS && (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>
      {isOwnProfile ? 'Your Moodboards' : `${profile.full_name}'s Moodboards`}
    </Typography>
    
    <MoodboardGallery
      userId={userId}
      isOwnProfile={isOwnProfile}
      showFeatured={true}
    />
  </Box>
)}

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
    
    <Button 
      size="small" 
      endIcon={<MoreHorizIcon />} 
      onClick={() => setActiveTab(TAB_MOODBOARDS)}
    >
      See All
    </Button>
  </Box>
  
  <MoodboardGallery
    userId={userId}
    isOwnProfile={isOwnProfile}
    limit={2}
  />
</Box>

                  
                  {/* Posts Preview Section */}
                  {profile.posts && profile.posts.length > 0 && (
                    <Box>
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
                          <LanguageIcon fontSize="small" color="primary" />
                          Recent Posts
                        </Typography>
                        
                        <Button 
                          size="small" 
                          endIcon={<MoreHorizIcon />} 
                          onClick={() => setActiveTab(TAB_POSTS)}
                        >
                          See All
                        </Button>
                      </Box>
                      
                      <Grid container spacing={2}>
                        {profile.posts.slice(0, 2).map(post => (
                          <Grid item xs={12} sm={6} key={post.id}>
                            <Card 
                              sx={{ 
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 2,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                                }
                              }}
                            >
                              {post.media_url && post.media_type ? (
                                <Box sx={{ height: 140, bgcolor: 'black', overflow: 'hidden', position: 'relative' }}>
                                  {post.media_type === 'IMAGE' ? (
                                    <CardMedia
                                      component="img"
                                      height="140"
                                      image={post.media_url}
                                      alt={post.title}
                                      sx={{ objectFit: 'cover' }}
                                    />
                                  ) : post.media_type === 'VIDEO' ? (
                                    <Box sx={{ 
                                      height: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      bgcolor: 'black'
                                    }}>
                                      <video
                                        src={post.media_url}
                                        style={{ 
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover'
                                        }}
                                      />
                                      <Box sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'rgba(0,0,0,0.5)'
                                      }}>
                                        <VideoIcon sx={{ fontSize: 48, color: 'white' }} />
                                      </Box>
                                    </Box>
                                  ) : (
                                    <Box sx={{ 
                                      height: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      bgcolor: 'grey.200'
                                    }}>
                                      <AudioFileIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                                    </Box>
                                  )}
                                </Box>
                              ) : post.image_url ? (
                                <CardMedia
                                  component="img"
                                  height="140"
                                  image={post.image_url}
                                  alt={post.title}
                                />
                              ) : (
                                <Box 
                                  sx={{ 
                                    height: 140, 
                                    bgcolor: 'grey.100',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <LanguageIcon fontSize="large" color="disabled" />
                                </Box>
                              )}
                              
                              <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" gutterBottom>
                                  {post.title}
                                </Typography>
                                
                                {post.description && (
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
                                    {post.description}
                                  </Typography>
                                )}
                              </CardContent>
                              
                              {post.url && (
                                <CardActions>
                                  <Button 
                                    size="small" 
                                    href={post.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    endIcon={<LaunchIcon />}
                                  >
                                    View Post
                                  </Button>
                                </CardActions>
                              )}
                            </Card>
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
              <Typography variant="h5" gutterBottom>
                User Posts
              </Typography>
              
              {profile.posts && profile.posts.length > 0 ? (
                <Grid container spacing={3}>
                  {profile.posts.map(post => (
                    <Grid item xs={12} sm={6} md={4} key={post.id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                          }
                        }}
                      >
                        {post.media_url && post.media_type ? (
                          post.media_type === 'IMAGE' ? (
                            <CardMedia
                              component="img"
                              height="180"
                              image={post.media_url}
                              alt={post.title}
                            />
                          ) : (
                            <Box sx={{ height: 180, bgcolor: 'black', p: 2 }}>
                              <MediaPlayer
                                src={post.media_url}
                                type={post.media_type === 'VIDEO' ? 'video' : 'audio'}
                                title={post.media_metadata?.fileName || post.title}
                                compact={true}
                                darkMode={post.media_type === 'VIDEO'}
                              />
                            </Box>
                          )
                        ) : post.image_url ? (
                          <CardMedia
                            component="img"
                            height="180"
                            image={post.image_url}
                            alt={post.title}
                          />
                        ) : (
                          <Box 
                            sx={{ 
                              height: 180, 
                              bgcolor: 'grey.100',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <LanguageIcon fontSize="large" color="disabled" />
                          </Box>
                        )}
                        
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {post.title}
                          </Typography>
                          
                          {post.description && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              paragraph
                            >
                              {post.description}
                            </Typography>
                          )}
                        </CardContent>
                        
                        {post.url && (
                          <CardActions>
                            <Button 
                              size="small" 
                              href={post.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              endIcon={<LaunchIcon />}
                            >
                              View Post
                            </Button>
                          </CardActions>
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
                  No posts have been shared yet.
                </Alert>
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
                            {new Date(event.date).toLocaleDateString()}
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

export default ProfilePage;