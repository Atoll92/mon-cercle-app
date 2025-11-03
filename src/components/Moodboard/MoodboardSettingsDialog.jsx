import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Stack,
  InputAdornment,
  Chip
} from '@mui/material';
import Spinner from '../Spinner';
import {
  Public as PublicIcon,
  Link as LinkIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { supabase } from '../../supabaseclient';
import { useProfile } from '../../context/profileContext';
import { updateProfile } from '../../api/profiles';

/**
 * Dialog component for creating or editing moodboard settings
 * Allows setting/updating name, description, background color, and moodboard slug
 * Note: All micro conclav pages are public by default
 */
const MoodboardSettingsDialog = ({
  open,
  onClose,
  moodboard,
  onSave,
  processing = false,
  mode = 'edit' // 'create' or 'edit'
}) => {
  const { activeProfile, refreshActiveProfile } = useProfile();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#f0f7ff');
  const [moodboardSlug, setMoodboardSlug] = useState('');
  const [error, setError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [slugError, setSlugError] = useState('');
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(false);

  // Reset form when dialog opens or moodboard changes
  useEffect(() => {
    if (mode === 'create' && open) {
      // Reset to defaults for create mode
      setTitle('');
      setDescription('');
      setBackgroundColor('#f0f7ff');
      setMoodboardSlug('');
      setError('');
      setTitleError('');
      setSlugError('');
      setSlugAvailable(false);
    } else if (mode === 'edit' && moodboard && open) {
      // Load existing values for edit mode
      setTitle(moodboard.title || '');
      setDescription(moodboard.description || '');
      setBackgroundColor(moodboard.background_color || '#f0f7ff');
      setMoodboardSlug(activeProfile?.moodboard_slug || '');
      setError('');
      setTitleError('');
      setSlugError('');
      setSlugAvailable(false);
    }
  }, [moodboard, activeProfile, open, mode]);

  // Validate slug format and check availability
  const validateSlug = (slug) => {
    if (!slug.trim()) {
      return 'URL slug is required';
    }
    if (slug.trim().length < 3) {
      return 'URL slug must be at least 3 characters';
    }
    if (slug.trim().length > 50) {
      return 'URL slug must be less than 50 characters';
    }
    // Only allow lowercase letters, numbers, hyphens, and underscores
    if (!/^[a-z0-9-_]+$/.test(slug)) {
      return 'URL slug can only contain lowercase letters, numbers, hyphens, and underscores';
    }
    return null;
  };

  // Check slug availability with debouncing
  useEffect(() => {
    const checkSlugAvailability = async () => {
      const validationError = validateSlug(moodboardSlug);
      if (validationError) {
        setSlugError(validationError);
        setSlugAvailable(false);
        return;
      }

      // If slug hasn't changed from original, skip checking
      if (moodboardSlug === activeProfile?.moodboard_slug) {
        setSlugError('');
        setSlugAvailable(true);
        return;
      }

      setSlugChecking(true);
      setSlugError('');

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('moodboard_slug', moodboardSlug)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setSlugError('This URL slug is already taken');
          setSlugAvailable(false);
        } else {
          setSlugError('');
          setSlugAvailable(true);
        }
      } catch (err) {
        console.error('Error checking slug availability:', err);
        setSlugError('Unable to check availability');
        setSlugAvailable(false);
      } finally {
        setSlugChecking(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (moodboardSlug && open) {
        checkSlugAvailability();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [moodboardSlug, activeProfile, open]);

  const validateForm = () => {
    let isValid = true;

    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else if (title.trim().length < 2) {
      setTitleError('Title must be at least 2 characters');
      isValid = false;
    } else if (title.trim().length > 100) {
      setTitleError('Title must be less than 100 characters');
      isValid = false;
    } else {
      setTitleError('');
    }

    const slugValidationError = validateSlug(moodboardSlug);
    if (slugValidationError) {
      setSlugError(slugValidationError);
      isValid = false;
    } else if (!slugAvailable && moodboardSlug !== activeProfile?.moodboard_slug) {
      setSlugError('This URL slug is already taken');
      isValid = false;
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setError('');

      const moodboardUpdates = {
        title: title.trim(),
        description: description.trim(),
        background_color: backgroundColor
      };

      // Save moodboard settings
      await onSave(moodboardUpdates);

      // If slug has changed, update the profile
      if (moodboardSlug !== activeProfile?.moodboard_slug) {
        const { data, error } = await updateProfile(activeProfile.id, {
          moodboard_slug: moodboardSlug.trim().toLowerCase()
        });

        if (error) {
          throw new Error(error);
        }

        // Refresh active profile to get updated data
        // This will update all components using the profile context,
        // including links with /micro/:moodboard_slug
        const { success, error: refreshError } = await refreshActiveProfile();

        if (!success) {
          console.error('Failed to refresh profile after slug update:', refreshError);
          // Don't throw - the update succeeded, just the refresh failed
        }
      }
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

        <TextField
          label="URL Slug"
          value={moodboardSlug}
          onChange={(e) => setMoodboardSlug(e.target.value.toLowerCase())}
          fullWidth
          margin="normal"
          required
          error={!!slugError}
          helperText={
            slugError ||
            `Your moodboard will be accessible at: conclav.club/micro/${moodboardSlug || 'your-slug'}`
          }
          disabled={processing}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LinkIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {slugChecking && <Spinner size={20} />}
                {!slugChecking && slugAvailable && moodboardSlug && (
                  <Chip
                    icon={<CheckIcon />}
                    label="Available"
                    color="success"
                    size="small"
                  />
                )}
              </InputAdornment>
            )
          }}
        />

        {/* Show info about public visibility for micro conclav */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PublicIcon fontSize="small" />
            <Typography variant="body2">
              Your Micro Conclav is always public
            </Typography>
          </Stack>
        </Alert>
        
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
          disabled={
            processing ||
            !title.trim() ||
            !moodboardSlug.trim() ||
            !!slugError ||
            (!slugAvailable && moodboardSlug !== activeProfile?.moodboard_slug)
          }
          startIcon={processing && <Spinner size={40} />}
        >
          {processing ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create' : 'Save Changes')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MoodboardSettingsDialog;