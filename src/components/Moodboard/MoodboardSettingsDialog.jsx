import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  Public as PublicIcon,
  Lock as PrivateIcon
} from '@mui/icons-material';

/**
 * Dialog component for creating or editing moodboard settings
 * Allows setting/updating name, description, privacy status, and background color
 */
const MoodboardSettingsDialog = ({
  open,
  onClose,
  moodboard,
  onSave,
  processing = false,
  mode = 'edit' // 'create' or 'edit'
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState('private');
  const [backgroundColor, setBackgroundColor] = useState('#f0f7ff');
  const [error, setError] = useState('');
  const [titleError, setTitleError] = useState('');

  // Reset form when dialog opens or moodboard changes
  useEffect(() => {
    if (mode === 'create' && open) {
      // Reset to defaults for create mode
      setTitle('');
      setDescription('');
      setPermissions('private');
      setBackgroundColor('#f0f7ff');
      setError('');
      setTitleError('');
    } else if (mode === 'edit' && moodboard) {
      // Load existing values for edit mode
      setTitle(moodboard.title || '');
      setDescription(moodboard.description || '');
      setPermissions(moodboard.permissions || 'private');
      setBackgroundColor(moodboard.background_color || '#f0f7ff');
      setError('');
      setTitleError('');
    }
  }, [moodboard, open, mode]);

  const validateForm = () => {
    if (!title.trim()) {
      setTitleError('Title is required');
      return false;
    }
    if (title.trim().length < 2) {
      setTitleError('Title must be at least 2 characters');
      return false;
    }
    if (title.trim().length > 100) {
      setTitleError('Title must be less than 100 characters');
      return false;
    }
    setTitleError('');
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setError('');
      
      const updates = {
        title: title.trim(),
        description: description.trim(),
        permissions: permissions,
        background_color: backgroundColor
      };

      await onSave(updates);
    } catch (err) {
      console.error('Error updating moodboard:', err);
      setError(err.message || 'Failed to update moodboard settings');
    }
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
    }
  };


  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>{mode === 'create' ? 'Create a Moodboard' : 'Moodboard Settings'}</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          margin="normal"
          required
          error={!!titleError}
          helperText={titleError}
          disabled={processing}
        />
        
        <TextField
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          rows={3}
          disabled={processing}
        />
        
        <FormControl fullWidth margin="normal" disabled={processing}>
          <InputLabel id="permissions-label">Visibility</InputLabel>
          <Select
            labelId="permissions-label"
            value={permissions}
            onChange={(e) => setPermissions(e.target.value)}
            label="Visibility"
          >
            <MenuItem value="private">
              <Stack direction="row" alignItems="center" spacing={1}>
                <PrivateIcon fontSize="small" />
                <Box>
                  <Typography variant="body2">Private</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Only you can view and edit
                  </Typography>
                </Box>
              </Stack>
            </MenuItem>
            <MenuItem value="public">
              <Stack direction="row" alignItems="center" spacing={1}>
                <PublicIcon fontSize="small" />
                <Box>
                  <Typography variant="body2">Public</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Visible to other network members
                  </Typography>
                </Box>
              </Stack>
            </MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Background Color
          </Typography>
          <TextField
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            fullWidth
            disabled={processing}
            sx={{ mb: 2 }}
            InputProps={{
              sx: { height: 50 }
            }}
          />
          
          <Box 
            sx={{ 
              height: 100, 
              bgcolor: backgroundColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography 
              variant="body2" 
              color={
                parseInt(backgroundColor.replace('#', ''), 16) > 0xffffff / 2 
                  ? 'rgba(0,0,0,0.8)' 
                  : 'rgba(255,255,255,0.8)'
              }
            >
              Background Preview
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={processing}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={processing || !title.trim()}
          startIcon={processing && <CircularProgress size={20} />}
        >
          {processing ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create' : 'Save Changes')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MoodboardSettingsDialog;