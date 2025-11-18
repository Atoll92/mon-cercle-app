import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Spinner from '../components/Spinner';
import {
  Box,
  Paper,
  Avatar,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  IconButton,
  Tooltip,
  Collapse,
  alpha,
  Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getUserProfile } from '../api/networks';
import { supabase } from '../supabaseclient';
import { useMoodboardCanvas } from '../hooks/useMoodboardCanvas';
import useWheelHandler from '../hooks/useWheelHandler';
import MoodboardCanvas from '../components/Moodboard/MoodboardCanvas';
import ZoomControls from '../components/Moodboard/ZoomControls';
import GridViewIcon from '@mui/icons-material/GridView';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MoodboardItemDisplay from '../components/Moodboard/MoodboardItemDisplay';
import MoodboardItemGrid from '../components/Moodboard/MoodboardItemGrid';
import { useProfile } from '../context/profileContext';
import { useTranslation } from '../hooks/useTranslation';
import { incrementMoodboardViewCount } from '../api/moodboards';

const MicroConclavPage = () => {
  const { t } = useTranslation();
  const { profileId, moodboardSlug } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { activeProfile } = useProfile();
  const [profile, setProfile] = useState(null);
  const [primaryMoodboardItems, setPrimaryMoodboardItems] = useState([]);
  const [moodboardBackgroundColor, setMoodboardBackgroundColor] = useState(null);
  const [primaryMoodboardId, setPrimaryMoodboardId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'moodboard'
  const [resolvedProfileId, setResolvedProfileId] = useState(null);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [hasIncrementedView, setHasIncrementedView] = useState(false);

  const containerRef = useRef(null);
  
  // Use the moodboard canvas hook for all canvas navigation
  const {
    scale,
    position,
    isDraggingCanvas,
    canvasRef,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleWheel,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset
  } = useMoodboardCanvas({
    items: primaryMoodboardItems // Pass items for boundary calculations
  });

  const fetchProfile = async () => {
    try {
      // If we have a moodboard slug, first resolve it to a profileId
      if (moodboardSlug && !profileId) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('moodboard_slug', moodboardSlug)
          .single();

        if (profileError) throw profileError;
        if (profileData) {
          setProfile(profileData);
          setResolvedProfileId(profileData.id);
          return;
        }
      }

      // Otherwise use the profileId directly
      const userProfile = await getUserProfile(profileId);
      setProfile(userProfile);
      setResolvedProfileId(profileId);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserMoodboard = async () => {
    try {
      const profileIdToUse = resolvedProfileId || profileId;
      if (!profileIdToUse) return null;

      // Fetch the user's single moodboard (micro conclav)
      const { data: moodboard, error: moodboardError } = await supabase
        .from('moodboards')
        .select('*')
        .eq('created_by', profileIdToUse)
        .single();

      if (moodboardError) throw moodboardError;

      if (moodboard) {
        setMoodboardBackgroundColor(moodboard.background_color);
        setPrimaryMoodboardId(moodboard.id);
        setViewCount(moodboard.view_count || 0);
        return moodboard.id;
      }
      return null;
    } catch (error) {
      console.error('Error fetching moodboard:', error);
      return null;
    }
  };

  const fetchPrimaryMoodboardItems = async () => {
    if (!primaryMoodboardId) return;
    
    try {
      const { data: items, error: itemsError } = await supabase
        .from('moodboard_items')
        .select('*')
        .eq('moodboard_id', primaryMoodboardId)
        .order('created_at', { ascending: false });
      
      if (itemsError) throw itemsError;
      
      setPrimaryMoodboardItems(items || []);
    } catch (error) {
      console.error('Error fetching primary moodboard items:', error);
    }
  };


  // Reset scroll to top when component mounts or route params change
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [profileId, moodboardSlug]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchProfile();
      setLoading(false);
    };

    init();
  }, [profileId, moodboardSlug]);

  // Fetch moodboard after we have resolved profileId
  useEffect(() => {
    if (resolvedProfileId) {
      fetchUserMoodboard();
    }
  }, [resolvedProfileId]);

  // Fetch primary moodboard items when primaryMoodboardId is set
  useEffect(() => {
    if (primaryMoodboardId) {
      fetchPrimaryMoodboardItems();
    }
  }, [primaryMoodboardId]);

  // Track view count when page is viewed (only if not the owner)
  useEffect(() => {
    if (primaryMoodboardId && profile && !hasIncrementedView) {
      // Don't track if viewing own moodboard (user is logged in and it's their profile)
      const isOwner = activeProfile && activeProfile.id === profile.id;
      if (!isOwner) {
        incrementMoodboardViewCount(primaryMoodboardId);
        setHasIncrementedView(true);
      }
    }
  }, [primaryMoodboardId, profile, activeProfile, hasIncrementedView]);

  const handleCanvasClick = () => {
    // Clear any selections or interactions when clicking on empty canvas
  };


  // Use the wheel handler hook for moodboard view
  useWheelHandler(canvasRef, viewMode === 'moodboard' ? handleWheel : null, [viewMode]);

  const handleViewModeChange = (_, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh"
      }}>
        <Spinner size={120} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
      }}>
        <Typography>{t('profileNotFound')}</Typography>
      </Box>
    );
  }


  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <Box 
        sx={{ 
          p: 1, 
          position: 'sticky',
          top: 0,
          zIndex: 1200,
          display: 'flex', 
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.6)})`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
            size="small"
          >
            {t('microConclav.backToDashboard')}
          </Button>

          <Typography
            variant="h6"
            sx={{
              ml: 1,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            {t('microConclav.title', { name: profile?.full_name })}
          </Typography>
        </Box>

        {/* View Mode Toggle, View Count, and Edit Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="view mode"
            size="small"
          >
            <ToggleButton value="grid" aria-label="grid view">
              <GridViewIcon sx={{ mr: 0.5 }} />
              {t('microConclav.grid')}
            </ToggleButton>
            <ToggleButton value="moodboard" aria-label="moodboard view">
              <DashboardIcon sx={{ mr: 0.5 }} />
              {t('microConclav.moodboard')}
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Show view count only to owner */}
          {activeProfile && profile && activeProfile.id === profile.id && (
            <Chip
              icon={<VisibilityIcon />}
              label={`${viewCount} ${viewCount === 1 ? 'view' : 'views'}`}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          )}

          {/* Show edit button if this is the user's own micro conclav */}
          {activeProfile && profile && activeProfile.id === profile.id && primaryMoodboardId && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/moodboard/${primaryMoodboardId}`)}
              size="small"
            >
              {t('microConclav.edit')}
            </Button>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Zoom controls - only show in moodboard view */}
          {viewMode === 'moodboard' && (
            <ZoomControls
              scale={scale}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomReset={handleZoomReset}
            />
          )}
        </Box>
      </Box>

      {/* Content Zone with User Info Card */}
      <Box
        ref={containerRef}
        sx={{
          flexGrow: 1,
          position: 'relative',
          overflow: viewMode === 'grid' ? 'auto' : 'hidden',
          bgcolor: viewMode === 'grid' ? (moodboardBackgroundColor || '#f5f5f5') : 'transparent',
        }}
      >
        {/* User Info Card - positioned absolutely within content zone */}
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            p: 2,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
            zIndex: 10,
            minWidth: 250,
            maxWidth: 300,
          }}
        >
          <Box display="flex" alignItems="flex-start" gap={2}>
            <Link
              to={`/profile/${profile.id}`}
              style={{ textDecoration: 'none' }}
            >
              <Avatar
                src={profile.profile_picture_url}
                alt={profile.full_name}
                sx={{
                  width: 60,
                  height: 60,
                  flexShrink: 0,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }
                }}
              />
            </Link>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Link
                to={`/profile/${profile.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: theme.palette.primary.main
                    }
                  }}
                >
                  {profile.full_name}
                </Typography>
              </Link>
              {profile.bio && (
                <>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: bioExpanded ? 'unset' : 2,
                      WebkitBoxOrient: 'vertical',
                      whiteSpace: bioExpanded ? 'normal' : undefined,
                    }}
                  >
                    {profile.bio}
                  </Typography>
                  {profile.bio.length > 100 && (
                    <Button
                      size="small"
                      onClick={() => setBioExpanded(!bioExpanded)}
                      endIcon={bioExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{ mt: 0.5, minWidth: 'auto', p: 0, textTransform: 'none' }}
                    >
                      {bioExpanded ? t('common.actions.showLess') : t('common.actions.showMore')}
                    </Button>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Paper>

        {viewMode === 'grid' ? (
          /* Grid View */
          <Box
            sx={{
              maxWidth: 1200,
              margin: '0 auto',
              padding: '20px',
              paddingTop: '20px'
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 3,
                pb: 4,
                pt: '50px', // Additional padding to prevent content overlap
              }}
            >
            {primaryMoodboardItems.map((item, index) => (
              <MoodboardItemGrid
                key={`${item.id}-${index}`}
                item={item}
              />
            ))}
            </Box>
          </Box>
        ) : (
          /* Moodboard View - Canvas Layout using new MoodboardCanvas component */
          <MoodboardCanvas
            backgroundColor={moodboardBackgroundColor || '#f5f5f5'}
            scale={scale}
            position={position}
            isDraggingCanvas={isDraggingCanvas}
            canvasRef={canvasRef}
            onCanvasClick={handleCanvasClick}
            onCanvasMouseDown={handleCanvasMouseDown}
            onCanvasMouseMove={handleCanvasMouseMove}
            onCanvasMouseUp={handleCanvasMouseUp}
            onCanvasMouseLeave={handleCanvasMouseUp}
            showGrid={!moodboardBackgroundColor}
            height="100%" // Fill available space
          >
            {/* Render items from primary moodboard only */}
            {primaryMoodboardItems.map((item, index) => {
              // Ensure items have valid positioning and z-index
              const adjustedItem = {
                ...item,
                x: item.x !== undefined ? item.x : 100 + (index * 20), // Default x if undefined
                y: item.y !== undefined ? item.y : 100 + (index * 20), // Default y if undefined
                width: item.width || 200, // Default width
                height: item.height || 200, // Default height
                zIndex: item.zIndex || (10 + index) // Ensure higher z-index
              };
              
              return (
                <MoodboardItemDisplay
                  key={`${item.id}-${index}`}
                  item={adjustedItem}
                  offsetX={0}
                  offsetY={0}
                  scale={scale}
                />
              );
            })}
          </MoodboardCanvas>
        )}

      </Box>
    </Box>
  );
};

export default MicroConclavPage;