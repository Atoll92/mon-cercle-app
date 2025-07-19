import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Typography,
  Box,
  Button,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  LocationOn as LocationOnIcon,
  Link as LinkIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import AddressSuggestions from './AddressSuggestions';
import { createEvent } from '../api/networks';
import { fetchNetworkCategories } from '../api/categories';

const CreateEventDialog = ({ open, onClose, networkId, profileId, onEventCreated }) => {
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    capacity: '',
    coordinates: null,
    event_link: '',
    price: 0,
    currency: 'EUR',
    max_tickets: '',
    category_id: ''
  });
  const [locationSuggestion, setLocationSuggestion] = useState(null);
  const [eventImageFile, setEventImageFile] = useState(null);
  const [eventImagePreview, setEventImagePreview] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  // Load categories on mount
  useEffect(() => {
    if (networkId) {
      const loadCategories = async () => {
        const { data, error } = await fetchNetworkCategories(networkId, true);
        if (data && !error) {
          setCategories(data);
        }
      };
      loadCategories();
    }
  }, [networkId]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setEventForm({
        title: '',
        date: '',
        location: '',
        description: '',
        capacity: '',
        coordinates: null,
        event_link: '',
        price: 0,
        currency: 'EUR',
        max_tickets: '',
        category_id: ''
      });
      setLocationSuggestion(null);
      setEventImageFile(null);
      setEventImagePreview(null);
      setError(null);
    }
  }, [open]);

  const handleLocationChange = (suggestion) => {
    setLocationSuggestion(suggestion);
    
    if (suggestion) {
      setEventForm(prev => ({
        ...prev,
        location: suggestion.place_name,
        coordinates: suggestion.center ? {
          latitude: suggestion.center[1],
          longitude: suggestion.center[0]
        } : null
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setEventImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEventImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields FIRST, before setting updating
    if (!eventForm.title || !eventForm.date || !eventForm.location) {
      setError('Please fill in all required fields (Title, Date, Location)');
      return;
    }

    setError(null);
    setUpdating(true);

    try {

      // Prepare event data
      const eventData = {
        title: eventForm.title,
        date: eventForm.date,
        location: eventForm.location,
        description: eventForm.description,
        capacity: eventForm.capacity ? parseInt(eventForm.capacity) : null,
        coordinates: eventForm.coordinates,
        event_link: eventForm.event_link || null,
        price: eventForm.price || 0,
        currency: eventForm.currency,
        max_tickets: eventForm.max_tickets ? parseInt(eventForm.max_tickets) : null,
        category_id: eventForm.category_id || null
      };

      const result = await createEvent(networkId, profileId, eventData, eventImageFile);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create event');
      }

      // Success
      if (onEventCreated) {
        onEventCreated(result.event);
      }
      onClose();
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.message || 'Failed to create event');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Event</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              autoFocus
              margin="dense"
              label="Event Title"
              fullWidth
              required
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Date and Time"
              type="datetime-local"
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
              value={eventForm.date}
              onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <AddressSuggestions
              value={locationSuggestion}
              onChange={handleLocationChange}
              label="Location"
              placeholder="Start typing an address..."
              required
              fullWidth
            />
            
            {eventForm.coordinates && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2, 
                mt: 1,
                p: 1, 
                borderRadius: 1, 
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }}>
                <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Coordinates: {typeof eventForm.coordinates === 'object' ? 
                    `${eventForm.coordinates.latitude?.toFixed(6) || '?'}, ${eventForm.coordinates.longitude?.toFixed(6) || '?'}` : 
                    'Available'}
                </Typography>
              </Box>
            )}
            
            <TextField
              margin="dense"
              label="Event Link (optional)"
              fullWidth
              placeholder="https://example.com/your-event"
              value={eventForm.event_link}
              onChange={(e) => setEventForm({ ...eventForm, event_link: e.target.value })}
              sx={{ mb: 2 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon />
                    </InputAdornment>
                  ),
                }
              }}
              helperText="Add a link to the event registration page, Zoom meeting, or any external event resource."
            />
            
            <TextField
              margin="dense"
              label="Capacity (optional)"
              type="number"
              fullWidth
              value={eventForm.capacity}
              onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
              sx={{ mb: 2 }}
            />

            {categories.length > 0 && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Category (optional)</InputLabel>
                <Select
                  value={eventForm.category_id}
                  onChange={(e) => setEventForm({ ...eventForm, category_id: e.target.value })}
                  label="Category (optional)"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              margin="dense"
              label="Description"
              multiline
              rows={6}
              fullWidth
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="subtitle1" gutterBottom>
              Event Cover Image
            </Typography>
            
            <Box sx={{ 
              width: '100%', 
              height: 200, 
              border: '1px dashed #ccc',
              borderRadius: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 2,
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#f8f8f8',
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('event-image-input').click()}
            >
              {eventImagePreview ? (
                <img 
                  src={eventImagePreview} 
                  alt="Event cover preview" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }} 
                />
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <ImageIcon sx={{ fontSize: 48, color: '#ccc' }} />
                  <Typography variant="body2" color="text.secondary">
                    Click to upload image
                  </Typography>
                </Box>
              )}
            </Box>
            
            <input
              accept="image/*"
              id="event-image-input"
              type="file"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
            
            {eventImageFile && (
              <Button
                onClick={() => {
                  setEventImageFile(null);
                  setEventImagePreview(null);
                }}
                size="small"
                color="error"
              >
                Remove Image
              </Button>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={updating}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={updating}
        >
          {updating ? 'Creating...' : 'Create Event'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateEventDialog;