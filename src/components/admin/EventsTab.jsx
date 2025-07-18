import React, { useState, useMemo, useEffect } from 'react';
import Spinner from '../Spinner';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  TableSortLabel,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  LocationOn as LocationOnIcon,
  People as PeopleIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import AddressSuggestions from '../AddressSuggestions';
import EventParticipationStatsCompact from '../EventParticipationStatsCompact';
import EventDetailsDialog from '../EventDetailsDialog';
import { createEvent, updateEvent, deleteEvent, exportEventParticipantsList } from '../../api/networks';
import { fetchNetworkCategories } from '../../api/categories';

const EventsTab = ({ events, setEvents, user, activeProfile, networkId, network, darkMode = false }) => {
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
    max_tickets: '',
    category_id: ''
  });
  const [locationSuggestion, setLocationSuggestion] = useState(null);
  const [eventImageFile, setEventImageFile] = useState(null);
  const [eventImagePreview, setEventImagePreview] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('desc');
  const [participationStats, setParticipationStats] = useState({});
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await fetchNetworkCategories(networkId, true); // Only active categories
      if (data && !error) {
        setCategories(data);
      }
    };
    loadCategories();
  }, [networkId]);

  const formatEventDateTime = (dateString) => {
    const date = new Date(dateString);
    const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    return `${date.toLocaleDateString(undefined, dateOptions)} ${date.toLocaleTimeString(undefined, timeOptions)}`;
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleParticipationStatsLoad = (eventId, attendingCount) => {
    setParticipationStats(prev => ({
      ...prev,
      [eventId]: attendingCount
    }));
  };

  const handleViewEvent = (event) => {
    setViewingEvent(event);
    setViewDialogOpen(true);
  };

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      let aValue, bValue;
      
      switch (orderBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'participation':
          // Sort by number of confirmed attendees
          aValue = participationStats[a.id] || 0;
          bValue = participationStats[b.id] || 0;
          break;
        default:
          return 0;
      }
      
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [events, order, orderBy, participationStats]);

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
        max_tickets: event.max_tickets || '',
        category_id: event.category_id || ''
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
        max_tickets: '',
        category_id: ''
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
        max_tickets: eventForm.max_tickets ? parseInt(eventForm.max_tickets) : null,
        category_id: eventForm.category_id || null
      };
      
      if (dialogMode === 'create') {
        const result = await createEvent(
          networkId, 
          activeProfile?.id || user.id, 
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
            created_by: activeProfile?.id || user.id
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

      <TableContainer component={Paper} sx={{ mt: 2, overflowX: 'auto' }}>
        <Table size="small" aria-label="events table" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ width: 60 }}>Image</TableCell>
              <TableCell sx={{ width: '25%', minWidth: 150 }}>
                <TableSortLabel
                  active={orderBy === 'title'}
                  direction={orderBy === 'title' ? order : 'asc'}
                  onClick={() => handleRequestSort('title')}
                >
                  Title
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: 140 }}>
                <TableSortLabel
                  active={orderBy === 'date'}
                  direction={orderBy === 'date' ? order : 'asc'}
                  onClick={() => handleRequestSort('date')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: '20%', minWidth: 120 }}>Location</TableCell>
              <TableCell sx={{ width: 120 }}>Category</TableCell>
              <TableCell align="center" sx={{ width: 140 }}>
                <TableSortLabel
                  active={orderBy === 'participation'}
                  direction={orderBy === 'participation' ? order : 'asc'}
                  onClick={() => handleRequestSort('participation')}
                >
                  Participation
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sx={{ width: 100 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedEvents.map((event) => (
              <TableRow
                key={event.id}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' 
                  },
                  height: 60 
                }}
              >
                <TableCell padding="checkbox">
                  {event.cover_image_url ? (
                    <Avatar
                      variant="rounded"
                      src={event.cover_image_url}
                      sx={{ width: 40, height: 40 }}
                    >
                      <ImageIcon />
                    </Avatar>
                  ) : (
                    <Avatar
                      variant="rounded"
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        bgcolor: darkMode ? 'grey.800' : 'grey.200' 
                      }}
                    >
                      <ImageIcon color="action" />
                    </Avatar>
                  )}
                </TableCell>
                <TableCell sx={{ maxWidth: 0, overflow: 'hidden' }}>
                  <Box>
                    <Typography variant="body2" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {event.title}
                    </Typography>
                    {event.description && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        noWrap 
                        sx={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          display: 'block'
                        }}
                      >
                        {event.description}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {formatEventDateTime(event.date)}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 0, overflow: 'hidden' }}>
                  <Box>
                    <Typography variant="body2" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {event.location}
                    </Typography>
                    {event.capacity && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        Capacity: {event.capacity}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  {event.category && (
                    <Chip 
                      label={event.category.name}
                      size="small"
                      sx={{ 
                        bgcolor: event.category.color || '#666',
                        color: 'white',
                        fontSize: '0.75rem'
                      }}
                    />
                  )}
                </TableCell>
                <TableCell align="center">
                  <EventParticipationStatsCompact 
                    eventId={event.id} 
                    onStatsLoad={handleParticipationStatsLoad}
                  />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    <Tooltip title="View event">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewEvent(event)}
                        sx={{ padding: 0.5 }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit event">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog('edit', event)}
                        sx={{ padding: 0.5 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete event">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(event.id)}
                        sx={{ padding: 0.5 }}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
              
              {/* Add Event Link field */}
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
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            {eventForm.currency === 'EUR' ? '€' : eventForm.currency === 'USD' ? '$' : '£'}
                          </InputAdornment>
                        ),
                      }
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

              <TextField
                margin="dense"
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              />

              <FormControl fullWidth margin="dense">
                <InputLabel>Category</InputLabel>
                <Select
                  value={eventForm.category_id}
                  onChange={(e) => setEventForm({ ...eventForm, category_id: e.target.value })}
                  label="Category"
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
            {updating ? <Spinner size={48} /> : 'Save Event'}
          </Button>
        </DialogActions>
      </Dialog>

      <EventDetailsDialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        event={viewingEvent}
        user={user}
        showParticipants={true}
      />
    </>
  );
};

export default EventsTab;