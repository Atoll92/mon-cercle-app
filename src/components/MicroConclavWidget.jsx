import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  Spinner,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PublicIcon from '@mui/icons-material/Public';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import { getUserMoodboard, updateMoodboard } from '../api/moodboards';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';

const MicroConclavWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProfile, userProfiles, isLoadingProfiles } = useProfile();
  const [moodboard, setMoodboard] = useState(null);
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
        title: data.title || 'My Micro Conclav',
        description: data.description || 'Welcome to my personal space',
        background_color: data.background_color || '#f5f5f5'
      });
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
      title: moodboard.title || 'My Micro Conclav',
      description: moodboard.description || 'Welcome to my personal space',
      background_color: moodboard.background_color || '#f5f5f5'
    });
    setEditing(false);
    setError(null);
  };

  if (loading || isLoadingProfiles) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Spinner size={30} />
      </Box>
    );
  }

  const userProfile = activeProfile || userProfiles?.[0];
  const microConclavUrl = userProfile?.username 
    ? `/micro/${userProfile.username}`
    : `/micro-conclav/${profileId}`;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 0, flexGrow: 1 }}>
        {/* Header */}
        <Box 
          sx={{ 
            p: 1.5, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(25, 118, 210, 0.05)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon color="primary" sx={{ mr: 1.5 }} />
            <Typography variant="subtitle1" fontWeight="medium">
              My Micro Conclav
            </Typography>
            <Tooltip title="Always public">
              <PublicIcon sx={{ ml: 1, fontSize: 20, color: 'text.secondary' }} />
            </Tooltip>
          </Box>
          
          {!editing ? (
            <IconButton 
              size="small" 
              onClick={() => setEditing(true)}
              disabled={!moodboard}
            >
              <EditIcon />
            </IconButton>
          ) : (
            <Box>
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
          )}
        </Box>

        {/* Content */}
        <Box sx={{ p: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {editing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                  InputProps={{
                    sx: { cursor: 'pointer' }
                  }}
                />
              </Box>
            </Box>
          ) : (
            <Box>
              {moodboard && (
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    bgcolor: moodboard.background_color || '#f5f5f5',
                    borderRadius: 2,
                    mb: 2
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    {moodboard.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {moodboard.description}
                  </Typography>
                </Paper>
              )}

              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate(microConclavUrl)}
                  startIcon={<PublicIcon />}
                >
                  View My Page
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate(`/moodboard/${moodboard.id}`)}
                  disabled={!moodboard}
                >
                  Edit Content
                </Button>
              </Box>

              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ display: 'block', mt: 2, textAlign: 'center' }}
              >
                Your public profile at: {window.location.origin}{microConclavUrl}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MicroConclavWidget;