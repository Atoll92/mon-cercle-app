import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Chip,
  Alert,
  InputAdornment,
  Link
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  LocationOn as LocationOnIcon,
  People as PeopleIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import AddressSuggestions from '../AddressSuggestions';
import EventParticipationStats from '../EventParticipationStats';
import { createEvent, updateEvent, deleteEvent, exportEventParticipantsList } from '../../api/networks';

const EventsTab = ({ events, setEvents, user, networkId, network, darkMode = false }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    capacity: '',
    coordinates: null,
    event_link: '', // Add the event_link field
    price: 0,
    currency: 'EUR',
    max_tickets: ''
  });
  const [locationSuggestion, setLocationSuggestion] = useState(null);
  const [eventImageFile, setEventImageFile] = useState(null);
  const [eventImagePreview, setEventImagePreview] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const formatEventDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleOpenDialog = (mode, event = null) => {
    setDialogMode(mode);
    setSelectedEvent(event);
    setEventImageFile(null);
    setError(null);
    
    if (mode === 'edit' && event) {
      setEventForm({
        title: event.title,
        date: event.date.split('T')[0],
        location: event.location,
        description: event.description || '',
        capacity: event.capacity || '',
        coordinates: event.coordinates,
        event_link: event.event_link || '', // Set the event_link value
        price: event.price || 0,
        currency: event.currency || 'EUR',
        max_tickets: event.max_tickets || ''
      });
      
      if (event.location) {
        setLocationSuggestion({ place_name: event.location });
      } else {
        setLocationSuggestion(null);
      }
      
      if (event.cover_image_url) {
        setEventImagePreview(event.cover_image_url);
      } else {
        setEventImagePreview(null);
      }
    } else {
      setEventForm({
        title: '',
        date: '',
        location: '',
        description: '',
        capacity: '',
        coordinates: null,
        event_link: '', // Reset the event_link field
        price: 0,
        currency: 'EUR',
        max_tickets: ''
      });
      setLocationSuggestion(null);
      setEventImagePreview(null);
    }
    
    setOpenDialog(true);
  };

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
    } else {
      setEventForm(prev => ({
        ...prev,
        location: '',
        coordinates: null
      }));
    }
  };

  const handleEventImageChange = (event) => {
    if (!event.target.files || event.target.files.length === 0) {
      setEventImageFile(null);
      setEventImagePreview(null);
      return;
    }
    
    const file = event.target.files[0];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, GIF).');
      return;
    }
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file must be less than 5MB.');
      return;
    }
    
    setEventImageFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setEventImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!eventForm.title || !eventForm.date || !eventForm.location) {
      setError('Please fill in all required fields (Title, Date, Location)');
      return;
    }
  
    setUpdating(true);
    setError(null);
    
    try {
      // Prepare event data with proper type conversions
      const eventData = {
        ...eventForm,
        capacity: eventForm.capacity ? parseInt(eventForm.capacity) : null,
        price: eventForm.price || 0,
        max_tickets: eventForm.max_tickets ? parseInt(eventForm.max_tickets) : null
      };
      
      if (dialogMode === 'create') {
        const result = await createEvent(
          networkId, 
          user.id, 
          eventData, 
          eventImageFile
        );
        
        if (result.success) {
          setEvents([...events, result.event]);
          setMessage(result.message);
        } else {
          setError(result.message);
        }
      } else {
        const result = await updateEvent(
          selectedEvent.id,
          {
            ...eventData,
            network_id: networkId,
            created_by: user.id
          },
          eventImageFile
        );
        
        if (result.success) {
          setEvents(events.map(e => e.id === selectedEvent.id ? result.event : e));
          setMessage(result.message);
        } else {
          setError(result.message);
        }
      }
      
      setOpenDialog(false);
    } catch (err) {
      setError(`Failed to ${dialogMode} event: ${err.message}`);
    } finally {
      setUpdating(false);
      setEventImageFile(null);
      setEventImagePreview(null);
      setLocationSuggestion(null);
    }
  };

  const handleDelete = async (eventId) => {
    try {
      const result = await deleteEvent(eventId);
      
      if (result.success) {
        setEvents(events.filter(e => e.id !== eventId));
        setMessage(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(`Failed to delete event: ${err.message}`);
    }
  };

  const handleExportParticipants = async (eventId) => {
    try {
      const result = await exportEventParticipantsList(eventId);
      
      if (result.success) {
        // Create downloadable link
        const blob = new Blob([result.csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `participants-${result.eventTitle.replace(/\s+/g, '-')}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setMessage('Participants list exported successfully!');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(`Failed to export participants: ${err.message}`);
    }
  };

  return (
    <>
      {message && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {error && !openDialog && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Network Events</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          New Event
        </Button>
      </Box>

      <Grid container spacing={3}>
        {events.map(event => (
          <Grid item xs={12} md={6} lg={4} key={event.id}>
            <Card>
              {event.cover_image_url && (
                <Box sx={{ 
                  height: 140, 
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <img
                    src={event.cover_image_url}
                    alt={event.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
              )}
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" component="div">
                    {event.title}
                  </Typography>
                  <Box>
                    <IconButton onClick={() => handleOpenDialog('edit', event)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(event.id)}>
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {formatEventDate(event.date)}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <LocationOnIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {event.location}
                  </Typography>
                </Box>
                
                {/* Display event link if it exists */}
                {event.event_link && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <LinkIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />
                    <Link
                      href={event.event_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="body2"
                      sx={{ 
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {event.event_link}
                    </Link>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {event.coordinates && (
                    <Chip 
                      size="small" 
                      variant="outlined"
                      icon={<LocationOnIcon fontSize="small" />}
                      label="Has coordinates" 
                      sx={{ fontSize: '0.7rem' }}
                    />
                  )}
                  
                  {/* Display event link indicator if it exists */}
                  {event.event_link && (
                    <Chip
                      size="small"
                      variant="outlined"
                      icon={<LinkIcon fontSize="small" />}
                      label="Has event link"
                      color="primary"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
                
                {event.description && (
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    {event.description}
                  </Typography>
                )}
                {event.capacity && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Capacity: {event.capacity}
                  </Typography>
                )}
                
                {/* Show pricing if monetization is enabled and event has a price */}
                {network?.features_config?.monetization && event.price > 0 && (
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'primary.main', fontWeight: 'bold' }}>
                    Price: {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: event.currency || 'EUR'
                    }).format(event.price)}
                    {event.max_tickets && (
                      <span style={{ color: 'text.secondary', fontWeight: 'normal' }}>
                        {' '}• {event.tickets_sold || 0}/{event.max_tickets} sold
                      </span>
                    )}
                  </Typography>
                )}
                
                <EventParticipationStats eventId={event.id} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => {
        setOpenDialog(false);
        setError(null);
      }} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create New Event' : 'Edit Event'}
        </DialogTitle>
        <DialogContent>
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
                label="Date"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
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
              
              {/* Add Event Link field */}
              <TextField
                margin="dense"
                label="Event Link (optional)"
                fullWidth
                placeholder="https://example.com/your-event"
                value={eventForm.event_link}
                onChange={(e) => setEventForm({ ...eventForm, event_link: e.target.value })}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon />
                    </InputAdornment>
                  ),
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
              
              {/* Pricing fields - Only show if monetization is enabled */}
              {network?.features_config?.monetization && (
                <>
                  <TextField
                    margin="dense"
                    label="Ticket Price"
                    type="number"
                    fullWidth
                    value={eventForm.price}
                    onChange={(e) => setEventForm({ ...eventForm, price: parseFloat(e.target.value) || 0 })}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {eventForm.currency === 'EUR' ? '€' : eventForm.currency === 'USD' ? '$' : '£'}
                        </InputAdornment>
                      ),
                    }}
                    helperText="Set to 0 for free events"
                  />
                  
                  <TextField
                    margin="dense"
                    label="Max Tickets (optional)"
                    type="number"
                    fullWidth
                    value={eventForm.max_tickets}
                    onChange={(e) => setEventForm({ ...eventForm, max_tickets: e.target.value })}
                    sx={{ mb: 2 }}
                    helperText="Leave empty for unlimited tickets"
                  />
                </>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
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
                backgroundColor: '#f8f8f8'
              }}>
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
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <ImageIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No cover image selected
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <input
                accept="image/*"
                id="event-cover-upload"
                type="file"
                onChange={handleEventImageChange}
                style={{ display: 'none' }}
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <label htmlFor="event-cover-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<ImageIcon />}
                    size="small"
                  >
                    {eventImagePreview ? 'Change Image' : 'Add Cover Image'}
                  </Button>
                </label>
                
                {eventImagePreview && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => {
                      setEventImageFile(null);
                      setEventImagePreview(null);
                    }}
                  >
                    Remove Image
                  </Button>
                )}
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Recommended size: 1200x600 pixels. Max: 5MB.
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          {error && openDialog && (
            <Alert severity="error" sx={{ flex: 1, mr: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Button onClick={() => {
            setOpenDialog(false);
            setError(null);
          }}>Cancel</Button>
          {dialogMode === 'edit' && (
            <Button 
              onClick={() => handleExportParticipants(selectedEvent.id)}
              variant="outlined"
              color="secondary"
              startIcon={<PeopleIcon />}
            >
              Export Participants
            </Button>
          )}
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={updating}
          >
            {updating ? <CircularProgress size={24} /> : 'Save Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EventsTab;