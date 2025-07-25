import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  IconButton
} from '@mui/material';
import Spinner from './Spinner';
import WidgetHeader from './shared/WidgetHeader';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PublicIcon from '@mui/icons-material/Public';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import { getUserMoodboard, updateMoodboard, getUserMoodboardItems } from '../api/moodboards';
import { useProfile } from '../context/profileContext';
import MoodboardItemSimple from './Moodboard/MoodboardItemSimple';

const MicroConclavWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeProfile, userProfiles, isLoadingProfiles } = useProfile();
  const [moodboard, setMoodboard] = useState(null);
  const [moodboardItems, setMoodboardItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    background_color: ''
  });

  // For micro conclav, we need a profile ID, not a user ID
  // If no active profile, use the first profile
  const profileId = activeProfile?.id || userProfiles?.[0]?.id;

  useEffect(() => {
    if (profileId && !isLoadingProfiles) {
      fetchMoodboard();
    } else if (!isLoadingProfiles && userProfiles?.length === 0) {
      setError('No profile found. Please create a network first.');
    }
  }, [profileId, userProfiles, isLoadingProfiles]);


  const fetchMoodboard = async () => {
    try {
      setLoading(true);
      const data = await getUserMoodboard(profileId);
      setMoodboard(data);
      setEditForm({
        title: data.title || t('dashboard.widgets.myMicroConclav'),
        description: data.description || 'Welcome to my personal space',
        background_color: data.background_color || '#f5f5f5'
      });

      // Fetch moodboard items for the carousel
      const { items } = await getUserMoodboardItems(profileId, 0, 10);
      setMoodboardItems(items || []);
    } catch (error) {
      console.error('Error fetching moodboard:', error);
      setError('Failed to load your micro conclav');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const updated = await updateMoodboard(moodboard.id, editForm);
      setMoodboard(updated);
      setEditing(false);
    } catch (error) {
      console.error('Error updating moodboard:', error);
      setError('Failed to update micro conclav settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      title: moodboard.title || t('dashboard.widgets.myMicroConclav'),
      description: moodboard.description || 'Welcome to my personal space',
      background_color: moodboard.background_color || '#f5f5f5'
    });
    setEditing(false);
    setError(null);
  };

  if (loading || isLoadingProfiles) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        p: 3, 
        minHeight: 400
      }}>
        <Spinner size={60} />
      </Box>
    );
  }

  const userProfile = activeProfile || userProfiles?.[0];
  const microConclavUrl = userProfile?.username 
    ? `/micro/${userProfile.username}`
    : `/micro-conclav/${profileId}`;

  return (
    <Box sx={{ 
      height: 400,
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      bgcolor: 'background.paper',
      borderRadius: 2,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <WidgetHeader
        icon={<DashboardIcon color="primary" />}
        title={t('dashboard.widgets.myMicroConclav')}
        viewAllLink={microConclavUrl}
        viewAllText="View Page"
        action={
          !editing ? (
            <IconButton 
              size="small" 
              onClick={() => setEditing(true)}
              disabled={!moodboard}
            >
              <EditIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton 
                size="small" 
                onClick={handleSave}
                disabled={saving}
                color="primary"
              >
                <SaveIcon />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={handleCancel}
                disabled={saving}
              >
                <CancelIcon />
              </IconButton>
            </Box>
          )
        }
      />

      {/* Full-Screen Content Area */}
      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        {loading || isLoadingProfiles ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            bgcolor: moodboard?.background_color || '#f5f5f5'
          }}>
            <Spinner size={60} />
          </Box>
        ) : editing ? (
          /* Edit Mode - Full Height */
          <Box sx={{ 
            p: 2, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center',
            bgcolor: 'background.paper'
          }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400, mx: 'auto' }}>
              <TextField
                label="Title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                fullWidth
                size="small"
              />
              <TextField
                label="Description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
                size="small"
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ColorLensIcon color="action" />
                <TextField
                  label="Background Color"
                  value={editForm.background_color}
                  onChange={(e) => setEditForm({ ...editForm, background_color: e.target.value })}
                  fullWidth
                  size="small"
                  type="color"
                  slotProps={{
                    input: {
                      sx: { cursor: 'pointer' }
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>
        ) : moodboardItems.length > 0 ? (
          /* Infinite Sliding Carousel with CSS Animation */
          <Box 
            sx={{ 
              position: 'relative',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              bgcolor: moodboard?.background_color || '#f5f5f5',
              '@keyframes infiniteSlide': {
                '0%': { transform: 'translateX(0)' },
                '100%': { transform: 'translateX(-50%)' }
              }
            }}
          >
            {/* Infinite sliding container */}
            <Box
              sx={{
                display: 'flex',
                width: 'max-content',
                height: '100%',
                animation: `infiniteSlide ${moodboardItems.length * 8}s linear infinite`,
                '&:hover': {
                  animationPlayState: 'paused'
                }
              }}
            >
              {/* First set of items */}
              {moodboardItems.map((item) => (
                <Box
                  key={`first-${item.id}`}
                  sx={{
                    height: '100%',
                    flexShrink: 0,
                    display: 'flex'
                  }}
                >
                  <Box 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      alignItems: 'stretch',
                      '& .MuiPaper-root': {
                        borderRadius: '0 !important',
                        boxShadow: 'none !important',
                        margin: '0 !important',
                        height: '100% !important',
                        display: 'flex !important',
                        alignItems: 'stretch !important',
                        '&:hover': {
                          transform: 'none !important',
                          boxShadow: 'none !important'
                        }
                      },
                      '& img, & video': {
                        height: '100% !important',
                        width: 'auto !important',
                        objectFit: 'contain !important',
                        maxWidth: 'none !important'
                      }
                    }}
                  >
                    <MoodboardItemSimple 
                      item={item}
                      style={{
                        height: '100%',
                        borderRadius: 0,
                        boxShadow: 'none',
                        border: 'none',
                        margin: 0,
                        padding: 0,
                        display: 'flex',
                        alignItems: 'stretch',
                        '&:hover': {
                          transform: 'none',
                          boxShadow: 'none'
                        }
                      }}
                    />
                  </Box>
                </Box>
              ))}
              {/* Identical duplicate set for seamless infinite loop */}
              {moodboardItems.map((item) => (
                <Box
                  key={`second-${item.id}`}
                  sx={{
                    height: '100%',
                    flexShrink: 0,
                    display: 'flex'
                  }}
                >
                  <Box 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      alignItems: 'stretch',
                      '& .MuiPaper-root': {
                        borderRadius: '0 !important',
                        boxShadow: 'none !important',
                        margin: '0 !important',
                        height: '100% !important',
                        display: 'flex !important',
                        alignItems: 'stretch !important',
                        '&:hover': {
                          transform: 'none !important',
                          boxShadow: 'none !important'
                        }
                      },
                      '& img, & video': {
                        height: '100% !important',
                        width: 'auto !important',
                        objectFit: 'contain !important',
                        maxWidth: 'none !important'
                      }
                    }}
                  >
                    <MoodboardItemSimple 
                      item={item}
                      style={{
                        height: '100%',
                        borderRadius: 0,
                        boxShadow: 'none',
                        border: 'none',
                        margin: 0,
                        padding: 0,
                        display: 'flex',
                        alignItems: 'stretch',
                        '&:hover': {
                          transform: 'none',
                          boxShadow: 'none'
                        }
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          /* Empty State - Full Height */
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            p: 3,
            textAlign: 'center',
            bgcolor: moodboard?.background_color || '#f5f5f5'
          }}>
            {moodboard && (
              <>
                <Typography variant="h6" gutterBottom>
                  {moodboard.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {moodboard.description}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, opacity: 0.7 }}>
                  Add content to see it previewed here
                </Typography>
              </>
            )}
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={() => navigate(microConclavUrl)}
                startIcon={<PublicIcon />}
              >
                View My Page
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(`/moodboard/${moodboard?.id}`)}
                disabled={!moodboard}
              >
                Add Content
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MicroConclavWidget;