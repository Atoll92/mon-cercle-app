/**
 * NotificationPreferences Component
 * UI for managing notification and digest preferences
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Select,
  MenuItem,
  TextField,
  Button,
  Divider,
  Alert,
  alpha,
  useTheme,
  Skeleton
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  updateDigestFrequency,
  updateDigestPreferredTime
} from '../api/notificationPreferences';

/**
 * NotificationPreferences Component
 */
const NotificationPreferences = () => {
  const theme = useTheme();
  // Using global supabase client
  const { activeProfile } = useAuth();

  const [preferences, setPreferences] = useState({
    email_notifications_enabled: true,
    notify_on_news: true,
    notify_on_events: true,
    notify_on_mentions: true,
    notify_on_direct_messages: true,
    notification_digest_frequency: 'instant',
    digest_preferred_time: '09:00:00'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeProfile?.id) {
      loadPreferences();
    }
  }, [activeProfile?.id]);

  const loadPreferences = async () => {
    if (!activeProfile?.id) return;

    setLoading(true);
    const { data, error } = await getNotificationPreferences(supabase, activeProfile.id);

    if (!error && data) {
      setPreferences({
        email_notifications_enabled: data.email_notifications_enabled ?? true,
        notify_on_news: data.notify_on_news ?? true,
        notify_on_events: data.notify_on_events ?? true,
        notify_on_mentions: data.notify_on_mentions ?? true,
        notify_on_direct_messages: data.notify_on_direct_messages ?? true,
        notification_digest_frequency: data.notification_digest_frequency || 'instant',
        digest_preferred_time: data.digest_preferred_time || '09:00:00'
      });
    }

    setLoading(false);
  };

  const handleToggle = (field) => {
    setPreferences(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleDigestFrequencyChange = (event) => {
    setPreferences(prev => ({
      ...prev,
      notification_digest_frequency: event.target.value
    }));
  };

  const handleTimeChange = (event) => {
    setPreferences(prev => ({
      ...prev,
      digest_preferred_time: event.target.value + ':00'
    }));
  };

  const handleSave = async () => {
    if (!activeProfile?.id) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    const { error: updateError } = await updateNotificationPreferences(
      supabase,
      activeProfile.id,
      preferences
    );

    if (updateError) {
      setError(updateError);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <NotificationsIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
          <Typography variant="h6">Notification Preferences</Typography>
        </Box>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Preferences saved successfully!
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error saving preferences: {error}
          </Alert>
        )}

        {/* Master Toggle */}
        <Box
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={preferences.email_notifications_enabled}
                onChange={() => handleToggle('email_notifications_enabled')}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Email Notifications
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Receive email notifications for network activity
                </Typography>
              </Box>
            }
          />
        </Box>

        {/* Notification Types */}
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Notification Types
        </Typography>
        <FormGroup sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.notify_on_news}
                onChange={() => handleToggle('notify_on_news')}
                disabled={!preferences.email_notifications_enabled}
              />
            }
            label="News & Announcements"
          />
          <FormControlLabel
            control={
              <Switch
                checked={preferences.notify_on_events}
                onChange={() => handleToggle('notify_on_events')}
                disabled={!preferences.email_notifications_enabled}
              />
            }
            label="Event Invitations & Updates"
          />
          <FormControlLabel
            control={
              <Switch
                checked={preferences.notify_on_mentions}
                onChange={() => handleToggle('notify_on_mentions')}
                disabled={!preferences.email_notifications_enabled}
              />
            }
            label="@Mentions in Chat"
          />
          <FormControlLabel
            control={
              <Switch
                checked={preferences.notify_on_direct_messages}
                onChange={() => handleToggle('notify_on_direct_messages')}
                disabled={!preferences.email_notifications_enabled}
              />
            }
            label="Direct Messages"
          />
        </FormGroup>

        <Divider sx={{ my: 3 }} />

        {/* Digest Settings */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <EmailIcon sx={{ color: theme.palette.secondary.main }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Email Digest Settings
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Group multiple notifications into a single digest email instead of sending them individually.
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
            Digest Frequency
          </Typography>
          <Select
            fullWidth
            value={preferences.notification_digest_frequency}
            onChange={handleDigestFrequencyChange}
            disabled={!preferences.email_notifications_enabled}
            sx={{ maxWidth: 300 }}
          >
            <MenuItem value="instant">Instant (Send immediately)</MenuItem>
            <MenuItem value="hourly">Hourly Digest</MenuItem>
            <MenuItem value="daily">Daily Digest</MenuItem>
            <MenuItem value="weekly">Weekly Digest</MenuItem>
          </Select>
        </Box>

        {/* Preferred Time (only for daily/weekly) */}
        {(preferences.notification_digest_frequency === 'daily' ||
          preferences.notification_digest_frequency === 'weekly') && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ScheduleIcon fontSize="small" color="action" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Preferred Time
              </Typography>
            </Box>
            <TextField
              type="time"
              value={preferences.digest_preferred_time?.substring(0, 5) || '09:00'}
              onChange={handleTimeChange}
              disabled={!preferences.email_notifications_enabled}
              sx={{ maxWidth: 200 }}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                step: 3600, // 1 hour
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {preferences.notification_digest_frequency === 'daily'
                ? 'Daily digest will be sent at this time'
                : 'Weekly digest will be sent on Monday at this time'}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || loading}
            sx={{ minWidth: 120 }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences;
