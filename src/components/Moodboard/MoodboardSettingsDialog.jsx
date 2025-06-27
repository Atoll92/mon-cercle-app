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
  Grid,
  FormHelperText
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';

/**
 * Dialog component for editing moodboard settings
 * Allows updating name, description, privacy status, and background color
 */
const MoodboardSettingsDialog = ({
  open,
  onClose,
  moodboard,
  onSave,
  processing = false
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPersonal, setIsPersonal] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#f0f7ff');
  const [error, setError] = useState('');
  const [titleError, setTitleError] = useState('');

  // Reset form when dialog opens or moodboard changes
  useEffect(() => {
    if (moodboard) {
      setTitle(moodboard.title || '');
      setDescription(moodboard.description || '');
      setIsPersonal(moodboard.is_personal !== false); // Default to true if undefined
      setBackgroundColor(moodboard.background_color || '#f0f7ff');
      setError('');
      setTitleError('');
    }
  }, [moodboard, open]);

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
        is_personal: isPersonal,
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
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <SettingsIcon color="primary" />
        <Typography variant="h6">Moodboard Settings</Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Title Field */}
          <Grid item xs={12}>
            <TextField
              label="Moodboard Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              error={!!titleError}
              helperText={titleError}
              placeholder="Enter a title for your moodboard"
              disabled={processing}
            />
          </Grid>

          {/* Description Field */}
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Describe your moodboard (optional)"
              disabled={processing}
              helperText={`${description.length}/500 characters`}
              inputProps={{ maxLength: 500 }}
            />
          </Grid>

          {/* Privacy Setting */}
          <Grid item xs={12}>
            <FormControl fullWidth disabled={processing}>
              <InputLabel>Privacy</InputLabel>
              <Select
                value={isPersonal}
                onChange={(e) => setIsPersonal(e.target.value)}
                label="Privacy"
              >
                <MenuItem value={true}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PrivateIcon fontSize="small" />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">Private</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Only you can see this moodboard
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
                <MenuItem value={false}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PublicIcon fontSize="small" />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">Public</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Visible to other network members
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              </Select>
              <FormHelperText>
                Choose who can view your moodboard
              </FormHelperText>
            </FormControl>
          </Grid>

          {/* Background Color */}
          <Grid item xs={12}>
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
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={processing}
          startIcon={<CloseIcon />}
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={processing || !title.trim()}
          startIcon={processing ? <CircularProgress size={16} /> : <SaveIcon />}
        >
          {processing ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MoodboardSettingsDialog;