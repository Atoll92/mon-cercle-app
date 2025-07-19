import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';
import { 
  Box, 
  Paper, 
  Avatar, 
  Typography, 
  ToggleButton, 
  ToggleButtonGroup, 
  Button,
  alpha
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getUserProfile } from '../api/networks';
import { getUserMoodboardItems } from '../api/moodboards';
import { supabase } from '../supabaseclient';
import { useMoodboardCanvas } from '../hooks/useMoodboardCanvas';
import useWheelHandler from '../hooks/useWheelHandler';
import MoodboardCanvas from '../components/Moodboard/MoodboardCanvas';
import ZoomControls from '../components/Moodboard/ZoomControls';
import GridViewIcon from '@mui/icons-material/GridView';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import LinkPreview from '../components/LinkPreview';
import MoodboardItemDisplay from '../components/Moodboard/MoodboardItemDisplay';
import MoodboardItemGrid from '../components/Moodboard/MoodboardItemGrid';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import NetworkHeader from '../components/NetworkHeader';

const MicroConclavPage = () => {
  const { profileId, username } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [profile, setProfile] = useState(null);
  const [moodboardItems, setMoodboardItems] = useState([]);
  const [primaryMoodboardItems, setPrimaryMoodboardItems] = useState([]);
  const [moodboardBackgroundColor, setMoodboardBackgroundColor] = useState(null);
  const [primaryMoodboardId, setPrimaryMoodboardId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'moodboard'
  const [resolvedProfileId, setResolvedProfileId] = useState(null);
  
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
      // If we have a username, first resolve it to a profileId
      if (username && !profileId) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
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

  const fetchMoodboardItems = async (pageNum = 0) => {
    if (!hasMore && pageNum > 0) return;
    
    const profileIdToUse = resolvedProfileId || profileId;
    if (!profileIdToUse) {
      console.log('No profile ID available for fetching moodboard items');
      return;
    }
    
    try {
      setLoadingMore(pageNum > 0);
      const result = await getUserMoodboardItems(profileIdToUse, pageNum * 20, 20);
      
      if (result.items.length < 20) {
        setHasMore(false);
      }
      
      if (pageNum === 0) {
        setMoodboardItems(result.items);
        // Don't override background color here anymore, let fetchUserMoodboard handle it
      } else {
        setMoodboardItems(prev => [...prev, ...result.items]);
      }
    } catch (error) {
      console.error('Error fetching moodboard items:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchProfile();
      setLoading(false);
    };
    
    init();
  }, [profileId, username]);

  // Fetch moodboard and items after we have resolved profileId
  useEffect(() => {
    if (resolvedProfileId) {
      const fetchData = async () => {
        await fetchUserMoodboard();
        await fetchMoodboardItems(0);
      };
      fetchData();
    }
  }, [resolvedProfileId]);

  // Fetch primary moodboard items when primaryMoodboardId is set
  useEffect(() => {
    if (primaryMoodboardId) {
      fetchPrimaryMoodboardItems();
    }
  }, [primaryMoodboardId]);

  const handleScroll = useCallback(() => {
    if (viewMode !== 'grid') return; // Only handle scroll in grid mode
    
    if (containerRef.current) {
      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      // Load more items when near bottom
      if (scrollTop + clientHeight >= scrollHeight - 100 && !loadingMore && hasMore) {
        setPage(prev => prev + 1);
      }
    }
  }, [loadingMore, hasMore, viewMode]);

  const handleCanvasClick = () => {
    // Clear any selections or interactions when clicking on empty canvas
  };

  useEffect(() => {
    if (page > 0) {
      fetchMoodboardItems(page);
    }
  }, [page]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

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
        height: "100vh",
        paddingTop: '80px' // Account for fixed header
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
        <Typography>Profile not found</Typography>
      </Box>
    );
  }


  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* NetworkHeader */}
      <NetworkHeader />
      {/* Toolbar - positioned directly below NetworkHeader */}
      <Box 
        sx={{ 
          p: 1, 
          position: 'fixed',
          top: '80px', // Position directly below NetworkHeader
          left: 0,
          right: 0,
          zIndex: 1000,
          display: 'flex', 
          justifyContent: 'space-between',
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          borderBottom: '1px solid',
          borderColor: 'divider',
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
            Back to Dashboard
          </Button>
          
          <Typography 
            variant="h6" 
            sx={{ 
              ml: 1,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            {profile?.full_name}'s Micro Conclav
          </Typography>
        </Box>

        {/* View Mode Toggle and Edit Button */}
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
              Grid
            </ToggleButton>
            <ToggleButton value="moodboard" aria-label="moodboard view">
              <DashboardIcon sx={{ mr: 0.5 }} />
              Moodboard
            </ToggleButton>
          </ToggleButtonGroup>
          
          {/* Show edit button if this is the user's own micro conclav */}
          {activeProfile && profile && activeProfile.id === profile.id && primaryMoodboardId && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/moodboard/${primaryMoodboardId}`)}
              size="small"
            >
              Edit
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

      {/* User Info Card - top right */}
      <Paper
        elevation={4}
        sx={{
          position: 'fixed',
          top: 'calc(80px + 56px + 1rem)', // Account for NetworkHeader + fixed toolbar + margin
          right: '1rem',
          p: 2,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          zIndex: 1001,
          minWidth: 250,
          maxWidth: 300,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            src={profile.profile_picture_url}
            alt={profile.full_name}
            sx={{ width: 60, height: 60 }}
          />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {profile.full_name}
            </Typography>
            {profile.bio && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {profile.bio}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Content Zone */}
      <Box
        ref={containerRef}
        sx={{
          flexGrow: 1,
          position: 'relative',
          overflow: viewMode === 'grid' ? 'auto' : 'hidden',
          bgcolor: viewMode === 'grid' ? (moodboardBackgroundColor || '#f5f5f5') : 'transparent',
          minHeight: '100vh',
        }}
      >
        {viewMode === 'grid' ? (
          /* Grid View */
          <Box
            sx={{
              maxWidth: 1200,
              margin: '0 auto',
              padding: '20px',
              paddingTop: '80px', // Space for user info card
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 3,
                pb: 4,
              }}
            >
            {moodboardItems.map((item, index) => (
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
            height="calc(100vh - 136px)" // Account for NetworkHeader (80px) + toolbar (56px)
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

        {loadingMore && viewMode === 'grid' && (
          <Box display="flex" justifyContent="center" py={4}>
            <Spinner size={48} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MicroConclavPage;