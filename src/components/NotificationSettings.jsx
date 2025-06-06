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
  CircularProgress,
  Stack
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Article as NewsIcon,
  Event as EventIcon,
  AlternateEmail as MentionIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';

const NotificationSettings = () => {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
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

  // Load user's current notification preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('email_notifications_enabled, notify_on_news, notify_on_events, notify_on_mentions, notify_on_direct_messages')
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
        }
      } catch (err) {
        console.error('Error loading notification preferences:', err);
        setError('Failed to load notification preferences');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

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
        <CircularProgress />
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

          {/* Specific notification types */}
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
        </Stack>

        {saving && (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress size={20} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;