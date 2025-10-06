import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Divider,
  Alert,
  Stack,
  Checkbox,
  FormGroup,
  Chip
} from '@mui/material';
import Spinner from './Spinner';
import {
  Notifications as NotificationsIcon,
  Article as NewsIcon,
  Event as EventIcon,
  AlternateEmail as MentionIcon,
  Message as MessageIcon,
  Home as ImmobilierIcon,
  Build as AteliersIcon,
  School as CoursIcon,
  Category as MaterielIcon,
  SwapHoriz as EchangeIcon,
  Email as EmailIcon,
  Mic as CastingIcon,
  Campaign as AnnoncesIcon,
  VolunteerActivism as DonsIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { getCategoryPreferences, updateSympaCategories } from '../api/sympaSync';

const NotificationSettings = () => {
  const { user } = useAuth();
  const { activeProfile } = useProfile();

  // Check if this is the specific network that should show annonces
  const showAnnoncesSection = activeProfile?.network_id === 'b4e51e21-de8f-4f5b-b35d-f98f6df27508';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [preferences, setPreferences] = useState({
    email_notifications_enabled: true,
    notify_on_news: true,
    notify_on_events: true,
    notify_on_mentions: true,
    notify_on_direct_messages: true
  });

  // Demo state for annonces categories (not connected to database)
  const [annonceCategories, setAnnonceCategories] = useState({
    immobilier: true,
    ateliers: true,
    cours: true,
    materiel: true,
    echange: true,
    casting: true,
    annonces: true,
    dons: true
  });

  // Load user's current notification preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user || !activeProfile) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('email_notifications_enabled, notify_on_news, notify_on_events, notify_on_mentions, notify_on_direct_messages, annonces_categories')
          .eq('id', activeProfile.id)
          .single();

        if (error) throw error;

        if (data) {
          setPreferences({
            email_notifications_enabled: data.email_notifications_enabled ?? true,
            notify_on_news: data.notify_on_news ?? true,
            notify_on_events: data.notify_on_events ?? true,
            notify_on_mentions: data.notify_on_mentions ?? true,
            notify_on_direct_messages: data.notify_on_direct_messages ?? true
          });

          // Load annonces category preferences if this is the RezoProSpec network
          if (showAnnoncesSection && data.annonces_categories) {
            const categories = data.annonces_categories;
            const newState = {};
            Object.keys(annonceCategories).forEach(key => {
              newState[key] = categories.includes(key);
            });
            setAnnonceCategories(newState);
          }
        }
      } catch (err) {
        console.error('Error loading notification preferences:', err);
        setError('Failed to load notification preferences');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user, activeProfile]);

  const handlePreferenceChange = async (field, value) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage('');

      // If turning off master toggle, turn off all specific notifications
      let updates = { [field]: value };
      if (field === 'email_notifications_enabled' && !value) {
        updates = {
          email_notifications_enabled: false,
          notify_on_news: false,
          notify_on_events: false,
          notify_on_mentions: false,
          notify_on_direct_messages: false
        };
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', activeProfile.id);

      if (error) throw error;

      setPreferences(prev => ({ ...prev, ...updates }));
      setSuccessMessage('Notification preferences updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      setError('Failed to update notification preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <Spinner />
      </Box>
    );
  }

  const notificationTypes = [
    {
      key: 'notify_on_news',
      label: 'Network News',
      description: 'Get notified when new posts are shared in your network',
      icon: <NewsIcon />
    },
    {
      key: 'notify_on_events',
      label: 'Events',
      description: 'Get notified about new events and event updates',
      icon: <EventIcon />
    },
    {
      key: 'notify_on_mentions',
      label: 'Mentions',
      description: 'Get notified when someone mentions you in posts or comments',
      icon: <MentionIcon />
    },
    {
      key: 'notify_on_direct_messages',
      label: 'Direct Messages',
      description: 'Get notified about new direct messages',
      icon: <MessageIcon />
    }
  ];

  const annonceCategoryOptions = [
    {
      key: 'immobilier',
      label: 'Logement',
      description: 'Locations, ventes, colocations',
      icon: <ImmobilierIcon />,
      color: '#2196f3'
    },
    {
      key: 'ateliers',
      label: 'Ateliers',
      description: 'Ateliers et formations',
      icon: <AteliersIcon />,
      color: '#9c27b0'
    },
    {
      key: 'cours',
      label: 'Cours',
      description: 'Cours particuliers et collectifs',
      icon: <CoursIcon />,
      color: '#ff9800'
    },
    {
      key: 'materiel',
      label: 'Matériel',
      description: 'Vente et location de matériel',
      icon: <MaterielIcon />,
      color: '#4caf50'
    },
    {
      key: 'echange',
      label: 'Échange',
      description: 'Trocs et échanges de services',
      icon: <EchangeIcon />,
      color: '#e91e63'
    },
    {
      key: 'casting',
      label: 'Casting',
      description: 'Castings et auditions',
      icon: <CastingIcon />,
      color: '#f44336'
    },
    {
      key: 'annonces',
      label: 'Annonces',
      description: 'Annonces diverses',
      icon: <AnnoncesIcon />,
      color: '#00bcd4'
    },
    {
      key: 'dons',
      label: 'Dons',
      description: 'Dons et collectes',
      icon: <DonsIcon />,
      color: '#8bc34a'
    }
  ];

  const handleAnnonceCategoryToggle = async (category) => {
    const newCategories = {
      ...annonceCategories,
      [category]: !annonceCategories[category]
    };
    setAnnonceCategories(newCategories);

    // Save to database
    try {
      const selectedCategories = Object.keys(newCategories).filter(key => newCategories[key]);
      await updateSympaCategories(activeProfile.id, selectedCategories);
      console.log('Category preferences updated:', selectedCategories);
    } catch (err) {
      console.error('Error updating category preferences:', err);
      // Revert on error
      setAnnonceCategories(annonceCategories);
      setError('Failed to update category preferences');
    }
  };

  const handleToggleAllAnnonces = async () => {
    const allSelected = Object.values(annonceCategories).every(v => v);
    const newState = {};
    Object.keys(annonceCategories).forEach(key => {
      newState[key] = !allSelected;
    });
    setAnnonceCategories(newState);

    // Save to database
    try {
      const selectedCategories = Object.keys(newState).filter(key => newState[key]);
      await updateSympaCategories(activeProfile.id, selectedCategories);
      console.log('All categories toggled:', selectedCategories);
    } catch (err) {
      console.error('Error updating category preferences:', err);
      // Revert on error
      setAnnonceCategories(annonceCategories);
      setError('Failed to update category preferences');
    }
  };

  const selectedAnnoncesCount = Object.values(annonceCategories).filter(v => v).length;
  const allAnnoncesSelected = selectedAnnoncesCount === annonceCategoryOptions.length;

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <NotificationsIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Email Notifications
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Master toggle */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.email_notifications_enabled}
                  onChange={(e) => handlePreferenceChange('email_notifications_enabled', e.target.checked)}
                  disabled={saving}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Enable Email Notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Master switch for all email notifications
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Divider />

          {/* Specific notification types - only show if NOT the annonces network */}
          {!showAnnoncesSection && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Notification Types
              </Typography>
              <Stack spacing={2}>
                {notificationTypes.map((type) => (
                  <FormControlLabel
                    key={type.key}
                    control={
                      <Switch
                        checked={preferences[type.key] && preferences.email_notifications_enabled}
                        onChange={(e) => handlePreferenceChange(type.key, e.target.checked)}
                        disabled={saving || !preferences.email_notifications_enabled}
                      />
                    }
                    label={
                      <Box display="flex" alignItems="flex-start" gap={2} sx={{ opacity: preferences.email_notifications_enabled ? 1 : 0.5 }}>
                        <Box color="primary.main" mt={0.5}>
                          {type.icon}
                        </Box>
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            {type.label}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {type.description}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    sx={{
                      alignItems: 'flex-start',
                      ml: 0,
                      '& .MuiFormControlLabel-label': {
                        flex: 1,
                        mt: 1
                      }
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Annonces Categories Section - only show for specific network */}
          {showAnnoncesSection && (
            <Box>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <EmailIcon color="primary" />
              <Box flex={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Catégories d'Annonces
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choisissez les types d'annonces pour lesquelles vous souhaitez recevoir des notifications par email
                </Typography>
              </Box>
              <Chip
                label={allAnnoncesSelected ? 'Toutes' : `${selectedAnnoncesCount}/${annonceCategoryOptions.length}`}
                color={allAnnoncesSelected ? 'primary' : 'default'}
                size="small"
              />
            </Box>

            {/* Toggle All Button */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allAnnoncesSelected}
                    indeterminate={selectedAnnoncesCount > 0 && selectedAnnoncesCount < annonceCategoryOptions.length}
                    onChange={handleToggleAllAnnonces}
                    disabled={saving || !preferences.email_notifications_enabled}
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={500}>
                    Toutes les catégories
                  </Typography>
                }
                sx={{ opacity: preferences.email_notifications_enabled ? 1 : 0.5 }}
              />
            </Box>

            {/* Category Checkboxes */}
            <FormGroup>
              <Stack spacing={1.5} sx={{ pl: 1 }}>
                {annonceCategoryOptions.map((category) => (
                  <FormControlLabel
                    key={category.key}
                    control={
                      <Checkbox
                        checked={annonceCategories[category.key] && preferences.email_notifications_enabled}
                        onChange={() => handleAnnonceCategoryToggle(category.key)}
                        disabled={saving || !preferences.email_notifications_enabled}
                        sx={{
                          color: category.color,
                          '&.Mui-checked': {
                            color: category.color
                          }
                        }}
                      />
                    }
                    label={
                      <Box
                        display="flex"
                        alignItems="flex-start"
                        gap={1.5}
                        sx={{ opacity: preferences.email_notifications_enabled ? 1 : 0.5 }}
                      >
                        <Box
                          sx={{
                            color: category.color,
                            mt: 0.25,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {category.icon}
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ color: category.color }}
                          >
                            {category.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {category.description}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    sx={{
                      alignItems: 'flex-start',
                      ml: 0,
                      mb: 0.5,
                      '& .MuiFormControlLabel-label': {
                        flex: 1
                      }
                    }}
                  />
                ))}
              </Stack>
            </FormGroup>
          </Box>
          )}
        </Stack>

        {saving && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Spinner size={40} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;