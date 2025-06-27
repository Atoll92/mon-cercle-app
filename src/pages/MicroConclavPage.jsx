import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Avatar, 
  Typography, 
  CircularProgress, 
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
import LinkPreview from '../components/LinkPreview';
import MoodboardItemDisplay from '../components/Moodboard/MoodboardItemDisplay';
import MoodboardItemGrid from '../components/Moodboard/MoodboardItemGrid';

const MicroConclavPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
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
      const userProfile = await getUserProfile(userId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserPersonalMoodboard = async () => {
    try {
      // First fetch the user's personal moodboard
      const { data: moodboards, error: moodboardError } = await supabase
        .from('moodboards')
        .select('*')
        .eq('created_by', userId)
        .eq('is_personal', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (moodboardError) throw moodboardError;
      
      if (moodboards && moodboards.length > 0) {
        const moodboard = moodboards[0];
        setMoodboardBackgroundColor(moodboard.background_color);
        setPrimaryMoodboardId(moodboard.id);
        return moodboard.id;
      }
      return null;
    } catch (error) {
      console.error('Error fetching personal moodboard:', error);
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
    
    try {
      setLoadingMore(pageNum > 0);
      const result = await getUserMoodboardItems(userId, pageNum * 20, 20);
      
      if (result.items.length < 20) {
        setHasMore(false);
      }
      
      if (pageNum === 0) {
        setMoodboardItems(result.items);
        // Don't override background color here anymore, let fetchUserPersonalMoodboard handle it
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
      await fetchUserPersonalMoodboard();
      await fetchMoodboardItems(0);
      setLoading(false);
    };
    
    init();
  }, [userId]);

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
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography>Profile not found</Typography>
      </Box>
    );
  }


  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Toolbar */}
      <Box 
        sx={{ 
          p: 1, 
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

        {/* View Mode Toggle */}
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
          position: 'absolute',
          top: '4rem',
          right: '1rem',
          p: 2,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          zIndex: 1000,
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
        }}
      >
        {viewMode === 'grid' ? (
          /* Grid View */
          <Box
            sx={{
              maxWidth: 1200,
              margin: '0 auto',
              padding: '80px 20px',
              minHeight: '100vh',
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
            height="calc(100vh - 55px)"
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
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MicroConclavPage;