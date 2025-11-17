import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import { useProfile } from '../context/profileContext';
import { useFadeIn } from '../hooks/useAnimation';
import { formatJoinedTime } from '../utils/dateFormatting';
import { useTranslation } from '../hooks/useTranslation';
import PostCard from './PostCard';
import Spinner from './Spinner';
import InfiniteMoodboardCarousel from './Moodboard/InfiniteMoodboardCarousel';
import LinkifiedText from './LinkifiedText';
import { getUserMoodboardItems } from '../api/moodboards';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Divider,
  Grid,
  alpha,
  Paper,
  Stack,
  Tooltip,
  useTheme,
  Fade,
  Zoom
} from '@mui/material';
import {
  Close as CloseIcon,
  Mail as MailIcon,
  Language as LanguageIcon,
  LinkedIn as LinkedInIcon,
  Person as PersonIcon,
  EventNote as EventNoteIcon,
  Label as LabelIcon,
  Work as WorkIcon,
  Dashboard as DashboardIcon,
  OpenInNew as OpenInNewIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
} from '@mui/icons-material';

const MemberDetailsModal = ({
  open,
  onClose,
  member,
  posts: initialPosts = [], // Changed from portfolioItems to posts
  darkMode = false
}) => {
  const { t } = useTranslation();
  const muiTheme = useTheme(); // Get the MUI theme
  const { activeProfile } = useProfile(); // Get active profile to determine if current user

  // Compute isCurrentUser internally
  const isCurrentUser = activeProfile?.id === member?.id;

  // Helper function to ensure URL has proper protocol
  const ensureHttpProtocol = (url) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };
  
  // When using theme.palette.custom, check first if it exists
  // This is for compatibility with both your custom theme and the default theme
  const customLightText = muiTheme.palette.custom?.lightText || (darkMode ? '#ffffff' : '#000000');
  const customFadedText = muiTheme.palette.custom?.fadedText || (darkMode ? alpha('#ffffff', 0.7) : alpha('#000000', 0.7));
  const customBorder = muiTheme.palette.custom?.border || (darkMode ? alpha('#ffffff', 0.1) : alpha('#000000', 0.1));
  
  const [memberPosts, setMemberPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchedMemberId, setLastFetchedMemberId] = useState(null);

  // State for member's moodboards
  const [featuredMoodboard, setFeaturedMoodboard] = useState(null);
  const [moodboardItems, setMoodboardItems] = useState([]);
  const [loadingMoodboard, setLoadingMoodboard] = useState(false);
  const [moodboardError, setMoodboardError] = useState(null);
  const [lastFetchedMoodboardId, setLastFetchedMoodboardId] = useState(null);


  // Fetch posts only if not provided through props
  useEffect(() => {
    // Skip if modal is not open or no member
    if (!open || !member) {
      return;
    }

    // Initialize with provided items if available
    if (initialPosts && initialPosts.length > 0) {
      setMemberPosts(initialPosts);
      setLoading(false);
      setLastFetchedMemberId(member.id);
      return;
    }

    // Only fetch if we haven't fetched for this member yet
    if (lastFetchedMemberId === member.id) {
      return;
    }

    // Fetch posts when modal opens or member changes
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('profile_id', member.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching posts:', error);
          throw error;
        }

        setMemberPosts(data || []);
        setLastFetchedMemberId(member.id);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(t('components.memberDetails.failedLoadPosts'));
        setMemberPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [member?.id, open, initialPosts, lastFetchedMemberId, t]);

  // Fetch member's moodboard items using same API as MicroConclavWidget
  useEffect(() => {
    const fetchMemberMoodboard = async () => {
      if (!member || !open) return;

      // Only fetch if we haven't fetched for this member yet
      if (lastFetchedMoodboardId === member.id) {
        return;
      }

      try {
        setLoadingMoodboard(true);
        setMoodboardError(null);

        // Get the member's moodboard and items
        const { items, backgroundColor, moodboardId } = await getUserMoodboardItems(member.id, 0, 10);

        if (items && items.length > 0) {
          setMoodboardItems(items);
          // Create a mock moodboard object for compatibility
          setFeaturedMoodboard({
            id: moodboardId,
            background_color: backgroundColor,
            title: 'Micro Conclav'
          });
        } else {
          setMoodboardItems([]);
          setFeaturedMoodboard(null);
        }
        setLastFetchedMoodboardId(member.id);
      } catch (err) {
        console.error('Error fetching member moodboard:', err);
        setMoodboardError(t('components.memberDetails.failedLoadMoodboard'));
      } finally {
        setLoadingMoodboard(false);
      }
    };

    fetchMemberMoodboard();
  }, [member?.id, open, lastFetchedMoodboardId, t]);
  
  if (!member) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      TransitionComponent={Zoom}
      TransitionProps={{
        timeout: 300
      }}
      PaperProps={{
        sx: {
          bgcolor: darkMode ? '#121212' : 'background.paper',
          backgroundImage: darkMode ? 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))' : 'none',
          boxShadow: 24,
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 1.5,
        pl: 2.5,
        bgcolor: darkMode ? alpha('#000000', 0.3) : alpha('#f5f5f5', 0.5),
        color: customLightText,
        borderBottom: '1px solid',
        borderColor: customBorder
      }}>
        <Typography variant="h6" component="div">
          {t('components.memberDetails.title')}
        </Typography>
        <IconButton 
          edge="end" 
          onClick={onClose} 
          aria-label="close"
          sx={{ color: customLightText }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent 
        dividers
        sx={{ 
          p: 0, 
          bgcolor: darkMode ? '#121212' : 'background.paper',
          color: customLightText
        }}
      >
        {/* Moodboard Cover Image Section - Carousel Background */}
        <Box 
          sx={{ 
            position: 'relative',
            height: '200px',
            width: '100%',
            overflow: 'hidden',
            borderBottom: '1px solid',
            borderColor: customBorder
          }}
        >
          {/* If there's no moodboard or it's loading, show a placeholder */}
          {(loadingMoodboard || !featuredMoodboard || moodboardItems.length === 0) ? (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center',
                height: '100%',
                width: '100%',
                bgcolor: darkMode ? alpha('#333333', 0.5) : alpha('#f5f5f5', 0.8)
              }}
            >
              {loadingMoodboard ? (
                <Spinner size={64} />
              ) : (
                <>
                  <DashboardIcon 
                    sx={{ 
                      fontSize: 40, 
                      mb: 1, 
                      color: customFadedText
                    }} 
                  />
                  <Typography
                    variant="body2"
                    color={customFadedText}
                  >
                    {t('components.memberDetails.noPublicMoodboards')}
                  </Typography>
                </>
              )}
            </Box>
          ) : (
            <InfiniteMoodboardCarousel
              items={moodboardItems}
              backgroundColor={featuredMoodboard?.background_color || (darkMode ? alpha('#333333', 0.5) : alpha('#f5f5f5', 0.8))}
              darkMode={darkMode}
            />
          )}
        </Box>
        
        {/* Profile Info Section with Avatar partially overlapping moodboard */}
        <Box 
          sx={{ 
            position: 'relative',
            pl: 3,
            pr: 3,
            pt: 0,
            pb: 2,
            mt: '-60px' // Negative margin to overlap with moodboard
          }}
        >
          <Grid container spacing={3} alignItems="flex-end">
            <Grid item xs={12} sm="auto" sx={{ display: 'flex', justifyContent: 'center' }}>
              <Avatar
                src={member.profile_picture_url}
                sx={{ 
                  width: 120, 
                  height: 120,
                  border: `4px solid ${darkMode ? alpha('#121212', 0.95) : '#ffffff'}`,
                  boxShadow: darkMode ? '0 8px 16px rgba(0,0,0,0.5)' : '0 8px 16px rgba(0,0,0,0.1)'
                }}
              >
                {member.full_name ? member.full_name.charAt(0).toUpperCase() : <PersonIcon sx={{ fontSize: 60 }} />}
              </Avatar>
            </Grid>

            <Grid item xs={12} sm>
              <Box>
                <Typography
                  variant="h5"
                  component="h2"
                  gutterBottom
                  sx={{
                    backgroundColor: darkMode ? alpha('#000000', 0.7) : alpha('#ffffff', 0.9),
                    backdropFilter: 'blur(8px)',
                    padding: '8px 12px',
                    borderRadius: 1,
                    display: 'inline-block',
                    boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {member.full_name || t('components.memberDetails.unnamedUser')}
                  {isCurrentUser && t('components.memberDetails.you')}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip
                    label={member.role === 'admin' ? t('components.memberDetails.admin') : t('components.memberDetails.member')}
                    color={member.role === 'admin' ? 'primary' : 'default'}
                    size="small"
                    sx={{ 
                      bgcolor: darkMode ? 
                        (member.role === 'admin' ? alpha('#1976d2', 0.8) : alpha('#333333', 0.8)) : 
                        undefined
                    }}
                  />
                  
                  {member.created_at && (
                    <Chip
                      icon={<EventNoteIcon fontSize="small" />}
                      label={formatJoinedTime(member.created_at)}
                      size="small"
                      sx={{ 
                        bgcolor: darkMode ? alpha('#555555', 0.8) : undefined,
                        color: darkMode ? '#ffffff' : undefined
                      }}
                    />
                  )}
                </Box>
                
                {member.bio && (
                  <LinkifiedText
                    text={member.bio}
                    component="div"
                    sx={{ 
                      color: customFadedText,
                      maxWidth: '600px',
                      marginBottom: 2,
                      fontSize: '1rem',
                      lineHeight: 1.6
                    }}
                  />
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sm="auto">
              <Stack direction="column" spacing={1}>
                {!isCurrentUser && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<MailIcon />}
                    component={Link}
                    to={`/messages/${member.id}`}
                    fullWidth
                  >
                    {t('components.memberDetails.message')}
                  </Button>
                )}

                <Button
                  variant={darkMode ? "outlined" : "contained"}
                  color={darkMode ? "inherit" : "primary"}
                  component={Link}
                  to={`/profile/${member.id}`}
                  fullWidth
                  sx={{
                    color: darkMode ? '#ffffff' : undefined,
                    borderColor: darkMode ? alpha('#ffffff', 0.3) : undefined,
                    '&:hover': {
                      borderColor: darkMode ? '#ffffff' : undefined
                    }
                  }}
                >
                  {t('components.memberDetails.fullProfile')}
                </Button>
                
                {featuredMoodboard && (
                  <Button
                    variant="outlined"
                    startIcon={<DashboardIcon />}
                    component={Link}
                    to={`/micro-conclav/${member.id}`}
                    fullWidth
                    color={darkMode ? "secondary" : "secondary"}
                    sx={{
                      mt: 1
                    }}
                  >
                    {t('components.memberDetails.viewMoodboard')}
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Box>
        
        {/* Contact and Links */}
        {(member.contact_email || member.portfolio_url || member.linkedin_url) && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{
                display: 'inline-flex',
                mr: 1,
                bgcolor: darkMode ? alpha('#1976d2', 0.2) : alpha('#1976d2', 0.1),
                color: darkMode ? '#90caf9' : '#1976d2',
                p: 0.5,
                borderRadius: '50%'
              }}>
                <MailIcon fontSize="small" />
              </Box>
              {t('components.memberDetails.contactLinks')}
            </Typography>
            
            <Grid container spacing={2} sx={{ ml: 1 }}>
              {member.contact_email && (
                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 1.5, 
                      bgcolor: darkMode ? alpha('#000000', 0.3) : alpha('#f5f5f5', 0.8),
                      border: '1px solid',
                      borderColor: customBorder,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': {
                        bgcolor: darkMode ? alpha('#000000', 0.4) : alpha('#f5f5f5', 1)
                      }
                    }}
                  >
                    <MailIcon sx={{ mr: 1, color: darkMode ? '#90caf9' : '#1976d2' }} />
                    <Typography 
                      variant="body2" 
                      component="a" 
                      href={`mailto:${member.contact_email}`}
                      sx={{ 
                        textDecoration: 'none',
                        color: customLightText,
                        wordBreak: 'break-all'
                      }}
                    >
                      {member.contact_email}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              
              {member.portfolio_url && (
                <Grid item xs={12} sm={6} md={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      bgcolor: darkMode ? alpha('#000000', 0.3) : alpha('#f5f5f5', 0.8),
                      border: '1px solid',
                      borderColor: customBorder,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': {
                        bgcolor: darkMode ? alpha('#000000', 0.4) : alpha('#f5f5f5', 1)
                      }
                    }}
                  >
                    <LanguageIcon sx={{ mr: 1, color: darkMode ? '#90caf9' : '#1976d2' }} />
                    <Typography
                      variant="body2"
                      component="a"
                      href={ensureHttpProtocol(member.portfolio_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        textDecoration: 'none',
                        color: customLightText,
                        wordBreak: 'break-all'
                      }}
                    >
                      {t('components.memberDetails.website')}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              
              {member.linkedin_url && (
                <Grid item xs={12} sm={6} md={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      bgcolor: darkMode ? alpha('#000000', 0.3) : alpha('#f5f5f5', 0.8),
                      border: '1px solid',
                      borderColor: customBorder,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': {
                        bgcolor: darkMode ? alpha('#000000', 0.4) : alpha('#f5f5f5', 1)
                      }
                    }}
                  >
                    <LinkedInIcon sx={{ mr: 1, color: darkMode ? '#90caf9' : '#1976d2' }} />
                    <Typography
                      variant="body2"
                      component="a"
                      href={ensureHttpProtocol(member.linkedin_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        textDecoration: 'none',
                        color: customLightText,
                        wordBreak: 'break-all'
                      }}
                    >
                      {t('components.memberDetails.linkedinProfile')}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
        
        <Divider sx={{ mx: 3 }} />
        
        {/* Skills */}
        {member.skills && member.skills.length > 0 && (
          <Box sx={{ p: 3, pt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{
                display: 'inline-flex',
                mr: 1,
                bgcolor: darkMode ? alpha('#9c27b0', 0.2) : alpha('#9c27b0', 0.1),
                color: darkMode ? '#ce93d8' : '#9c27b0',
                p: 0.5,
                borderRadius: '50%'
              }}>
                <LabelIcon fontSize="small" />
              </Box>
              {t('components.memberDetails.skillsExpertise')}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: 1 }}>
              {member.skills.map((skill, index) => (
                <Chip 
                  key={`${skill}-${index}`} 
                  label={skill} 
                  sx={{ 
                    bgcolor: darkMode ? alpha('#9c27b0', 0.2) : alpha('#9c27b0', 0.1),
                    color: darkMode ? '#ce93d8' : '#9c27b0',
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: darkMode ? alpha('#9c27b0', 0.3) : alpha('#9c27b0', 0.2),
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
        
        {/* Posts preview */}
        <Divider sx={{ mx: 3 }} />
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Box component="span" sx={{
              display: 'inline-flex',
              mr: 1,
              bgcolor: darkMode ? alpha('#ff9800', 0.2) : alpha('#ff9800', 0.1),
              color: darkMode ? '#ffb74d' : '#ff9800',
              p: 0.5,
              borderRadius: '50%'
            }}>
              <WorkIcon fontSize="small" />
            </Box>
            {t('components.memberDetails.posts', { count: memberPosts.length })}
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <Spinner size={80} />
            </Box>
          ) : error ? (
            <Typography color="error" sx={{ p: 2 }}>
              {error}
            </Typography>
          ) : memberPosts.length > 0 ? (
            <>
              <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                alignContent: 'flex-start'
              }}>
                {memberPosts.slice(0, 6).map((post) => (
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
                      author={member}
                      isOwner={isCurrentUser}
                      darkMode={darkMode}
                      sx={{ height: '100%' }}
                    />
                  </Box>
                ))}
              </Box>

              {memberPosts.length > 6 && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button
                    component={Link}
                    to={`/profile/${member.id}`}
                    color={darkMode ? "inherit" : "primary"}
                    sx={{
                      color: darkMode ? '#90caf9' : undefined
                    }}
                  >
                    {t('components.memberDetails.viewAllPosts', { count: memberPosts.length })}
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Typography
              variant="body2"
              color={customFadedText}
              sx={{ p: 1, fontStyle: 'italic' }}
            >
              {t('components.memberDetails.noPostsYet')}
            </Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default MemberDetailsModal;