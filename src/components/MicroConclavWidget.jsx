import { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton
} from '@mui/material';
import Spinner from './Spinner';
import WidgetHeader from './shared/WidgetHeader';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EditIcon from '@mui/icons-material/Edit';
import PublicIcon from '@mui/icons-material/Public';
import { getUserMoodboard, getUserMoodboardItems } from '../api/moodboards';
import { useProfile } from '../context/profileContext';
import MoodboardItemSimple from './Moodboard/MoodboardItemSimple';

const MicroConclavWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeProfile, userProfiles, isLoadingProfiles } = useProfile();
  const [moodboard, setMoodboard] = useState(null);
  const [moodboardItems, setMoodboardItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  const microConclavUrl = userProfile?.moodboard_slug
    ? `/micro/${userProfile.moodboard_slug}`
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
        viewAllText={t('dashboard.buttons.view')}
        action={
          <IconButton
            size="small"
            onClick={() => navigate(`/moodboard/${moodboard?.id}`)}
            disabled={!moodboard}
          >
            <EditIcon />
          </IconButton>
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
                      mediaOnly={true}
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
                      mediaOnly={true}
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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, opacity: 0.8, maxWidth: 320 }}>
                  {t('language') === 'fr' 
                    ? "Votre espace personnel pour vous exprimer sans limites. Partagez photos, vidéos, textes, audio et bien plus encore."
                    : "Your personal space to express yourself without limits. Share photos, videos, texts, audio and much more."
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, opacity: 0.7 }}>
                  {t('language') === 'fr' ? "Ajoutez du contenu pour le voir apparaître ici" : "Add content to see it previewed here"}
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