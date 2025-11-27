import { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  alpha,
  Chip,
  useTheme
} from '@mui/material';
import Spinner from './Spinner';
import WidgetHeader from './shared/WidgetHeader';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EditIcon from '@mui/icons-material/Edit';
import PublicIcon from '@mui/icons-material/Public';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getUserMoodboard, getUserMoodboardItems, getMoodboardWithViewCount } from '../api/moodboards';
import { useProfile } from '../context/profileContext';
import InfiniteMoodboardCarousel from './Moodboard/InfiniteMoodboardCarousel';
import { getProfileById } from '../api/profiles';

const MicroConclavWidget = ({ profileId: propProfileId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { activeProfile, userProfiles, isLoadingProfiles } = useProfile();
  const [moodboard, setMoodboard] = useState(null);
  const [moodboardItems, setMoodboardItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [viewCount, setViewCount] = useState(0);

  // For micro conclav, we need a profile ID, not a user ID
  // Use prop if provided, otherwise use active profile or first profile
  const profileId = propProfileId || activeProfile?.id || userProfiles?.[0]?.id;

  // Check if viewing own moodboard
  const isOwnMoodboard = !propProfileId || propProfileId === activeProfile?.id;

  // Get default background color based on theme
  const defaultBgColor = theme.palette.mode === 'dark'
    ? theme.palette.background.default
    : '#f5f5f5';

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

      // Fetch profile data if viewing someone else's moodboard
      if (!isOwnMoodboard) {
        const { data: profileData } = await getProfileById(profileId);
        setProfile(profileData);
      }

      const data = await getUserMoodboard(profileId);
      setMoodboard(data);

      // Fetch view count if viewing own moodboard
      if (isOwnMoodboard) {
        const moodboardWithCount = await getMoodboardWithViewCount(profileId);
        if (moodboardWithCount) {
          setViewCount(moodboardWithCount.view_count || 0);
        }
      }

      // Fetch moodboard items for the carousel
      const { items } = await getUserMoodboardItems(profileId, 0, 10);
      setMoodboardItems(items || []);
    } catch (error) {
      console.error('Error fetching moodboard:', error);
      setError('Failed to load micro conclav');
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

  const displayProfile = isOwnMoodboard ? (activeProfile || userProfiles?.[0]) : profile;
  const microConclavUrl = displayProfile?.moodboard_slug
    ? `/micro/${displayProfile.moodboard_slug}`
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
        title={
          isOwnMoodboard
            ? t('dashboard.widgets.myMicroConclav')
            : `${displayProfile?.full_name || 'User'}'s Micro Conclav`
        }
        viewAllLink={microConclavUrl}
        viewAllText={t('dashboard.buttons.view')}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Show view count only to owner */}
            {isOwnMoodboard && (
              <Chip
                icon={<VisibilityIcon />}
                label={`${viewCount} ${viewCount === 1 ? 'view' : 'views'}`}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            )}
            {isOwnMoodboard && (
              <IconButton
                size="small"
                onClick={() => navigate(`/moodboard/${moodboard?.id}`)}
                disabled={!moodboard}
              >
                <EditIcon />
              </IconButton>
            )}
          </Box>
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
            bgcolor: moodboard?.background_color || defaultBgColor
          }}>
            <Spinner size={60} />
          </Box>
        ) : moodboardItems.length > 0 ? (
          <InfiniteMoodboardCarousel
            items={moodboardItems}
            backgroundColor={moodboard?.background_color || (alpha(defaultBgColor, 0.8))}
            darkMode={theme.palette.mode === 'dark'}
          />
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
            bgcolor: moodboard?.background_color || defaultBgColor
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