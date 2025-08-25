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
  MenuItem,
  Paper,
  IconButton,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Card,
  CardContent,
  Fade,
  LinearProgress,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  LocationOn as LocationOnIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Event as EventIcon,
  People as PeopleIcon,
  Euro as EuroIcon,
  Category as CategoryIcon,
  AccessTime as AccessTimeIcon,
  Description as DescriptionIcon,
  Computer as ComputerIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import AddressSuggestions from './AddressSuggestions';
import { createEvent, updateEvent } from '../api/networks';
import { fetchNetworkCategories } from '../api/categories';
import { useTranslation } from '../hooks/useTranslation';

const CreateEventDialog = ({ open, onClose, networkId, profileId, onEventCreated, editingEvent = null, onEventUpdated, isAdmin = false }) => {
  const { t } = useTranslation();
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
    category_id: '',
    online: false
  });
  const [locationSuggestion, setLocationSuggestion] = useState(null);
  const [eventImageFile, setEventImageFile] = useState(null);
  const [eventImagePreview, setEventImagePreview] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = ['Basic Info', 'Details & Media', 'Settings'];

  const currencies = [
    { code: 'EUR', symbol: '€' },
    { code: 'USD', symbol: '$' },
    { code: 'GBP', symbol: '£' },
    { code: 'CHF', symbol: 'Fr' }
  ];

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

  // Reset form when dialog opens/closes or populate with editing data
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
        category_id: '',
        online: false
      });
      setLocationSuggestion(null);
      setEventImageFile(null);
      setEventImagePreview(null);
      setError(null);
    } else if (editingEvent) {
      // Format date for datetime-local input
      let formattedDate = '';
      if (editingEvent.date) {
        const date = new Date(editingEvent.date);
        // Format as YYYY-MM-DDTHH:mm for datetime-local input
        formattedDate = date.toISOString().slice(0, 16);
      }
      
      // Populate form with event data for editing
      setEventForm({
        title: editingEvent.title || '',
        date: formattedDate,
        location: editingEvent.location || '',
        description: editingEvent.description || '',
        capacity: editingEvent.capacity || '',
        coordinates: editingEvent.coordinates || null,
        event_link: editingEvent.event_link || '',
        price: editingEvent.price || 0,
        currency: editingEvent.currency || 'EUR',
        max_tickets: editingEvent.max_tickets || '',
        category_id: editingEvent.category_id || '',
        online: editingEvent.online || false
      });
      // Set location suggestion if we have coordinates
      if (editingEvent.location) {
        setLocationSuggestion({
          place_name: editingEvent.location,
          center: editingEvent.coordinates ? [
            editingEvent.coordinates.longitude,
            editingEvent.coordinates.latitude
          ] : null
        });
      }
      // Set existing image as preview
      if (editingEvent.cover_image_url) {
        setEventImagePreview(editingEvent.cover_image_url);
      }
    }
  }, [open, editingEvent]);

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
      processImageFile(file);
    }
  };

  const processImageFile = (file) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setError(null);
    setEventImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setEventImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processImageFile(files[0]);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    if (currentStep === 0) {
      // If online event, location is not required
      if (eventForm.online) {
        return eventForm.title && eventForm.date;
      }
      return eventForm.title && eventForm.date && eventForm.location;
    }
    return true;
  };

  const handleSubmit = async () => {
    console.log('🎯 [EVENT DIALOG] Starting event creation/update process');
    console.log('🎯 [EVENT DIALOG] networkId:', networkId);
    console.log('🎯 [EVENT DIALOG] profileId:', profileId);
    console.log('🎯 [EVENT DIALOG] isAdmin:', isAdmin);
    console.log('🎯 [EVENT DIALOG] editingEvent:', editingEvent ? 'Yes' : 'No');
    
    // Validate required fields FIRST, before setting updating
    if (!eventForm.title || !eventForm.date) {
      console.error('🎯 [EVENT DIALOG] Validation failed: Missing title or date');
      setError('Please fill in all required fields (Title, Date)');
      return;
    }
    
    // If not online event, location is required
    if (!eventForm.online && !eventForm.location) {
      console.error('🎯 [EVENT DIALOG] Validation failed: Missing location for in-person event');
      setError('Please provide a location for in-person events');
      return;
    }

    console.log('🎯 [EVENT DIALOG] Validation passed, proceeding with submission');
    setError(null);
    setUpdating(true);

    try {
      // Prepare event data
      const eventData = {
        title: eventForm.title,
        date: eventForm.date,
        location: eventForm.online ? 'Online' : eventForm.location,
        description: eventForm.description,
        capacity: eventForm.capacity ? parseInt(eventForm.capacity) : null,
        coordinates: eventForm.online ? null : eventForm.coordinates,
        event_link: eventForm.event_link || null,
        price: eventForm.price || 0,
        currency: eventForm.currency,
        max_tickets: eventForm.max_tickets ? parseInt(eventForm.max_tickets) : null,
        category_id: eventForm.category_id || null,
        online: eventForm.online
      };

      console.log('🎯 [EVENT DIALOG] Prepared event data:', eventData);
      console.log('🎯 [EVENT DIALOG] Has image file:', eventImageFile ? 'Yes' : 'No');

      let result;
      if (editingEvent) {
        console.log('🎯 [EVENT DIALOG] Calling updateEvent...');
        // Update existing event
        result = await updateEvent(editingEvent.id, eventData, eventImageFile);
        console.log('🎯 [EVENT DIALOG] updateEvent result:', result);
        if (!result.success) {
          throw new Error(result.message || 'Failed to update event');
        }
        // Success
        if (onEventUpdated) {
          onEventUpdated(result.event);
        }
      } else {
        console.log('🎯 [EVENT DIALOG] Calling createEvent...');
        // Create new event
        result = await createEvent(networkId, profileId, eventData, eventImageFile, isAdmin);
        console.log('🎯 [EVENT DIALOG] createEvent result:', result);
        if (!result.success) {
          throw new Error(result.message || 'Failed to create event');
        }
        // Success
        if (onEventCreated) {
          onEventCreated(result.event);
        }
      }
      console.log('🎯 [EVENT DIALOG] Event operation successful, closing dialog');
      onClose();
    } catch (err) {
      console.error('🎯 [EVENT DIALOG] Error during event operation:', err);
      console.error('🎯 [EVENT DIALOG] Error stack:', err.stack);
      setError(err.message || (editingEvent ? 'Failed to update event' : 'Failed to create event'));
    } finally {
      setUpdating(false);
      console.log('🎯 [EVENT DIALOG] Event operation completed');
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Basic Event Information</Typography>
                  </Box>
                  
                  <TextField
                    autoFocus
                    label="Event Title"
                    fullWidth
                    required
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    sx={{ mb: 3 }}
                    variant="outlined"
                    placeholder="Enter a descriptive title for your event"
                  />
                  
                  <TextField
                    label="Date and Time"
                    type="datetime-local"
                    fullWidth
                    required
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccessTimeIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={eventForm.online}
                        onChange={(e) => {
                          setEventForm({ ...eventForm, online: e.target.checked });
                          if (e.target.checked) {
                            // Clear location data when switching to online
                            setLocationSuggestion(null);
                            setEventForm(prev => ({
                              ...prev,
                              location: '',
                              coordinates: null
                            }));
                          }
                        }}
                        icon={<LocationOnIcon />}
                        checkedIcon={<ComputerIcon />}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1">
                          {eventForm.online ? 'Online Event' : 'In-Person Event'}
                        </Typography>
                        <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                          {eventForm.online ? '(no location required)' : '(location required)'}
                        </Typography>
                      </Box>
                    }
                    sx={{ mb: 3 }}
                  />
                  
                  {!eventForm.online && (
                    <AddressSuggestions
                      value={locationSuggestion}
                      onChange={handleLocationChange}
                      label="Location"
                      placeholder="Start typing an address..."
                      required
                      fullWidth
                    />
                  )}
                  
                  {eventForm.online && (
                    <Fade in={true}>
                      <Paper sx={{ 
                        mt: 2,
                        p: 2, 
                        backgroundColor: 'info.50',
                        border: '1px solid',
                        borderColor: 'info.200'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ComputerIcon sx={{ mr: 1, color: 'info.main' }} />
                          <Typography variant="body2" color="info.dark">
                            This is an online event. Consider adding a meeting link in the Event Link field.
                          </Typography>
                        </Box>
                      </Paper>
                    </Fade>
                  )}
                  
                  {eventForm.coordinates && !eventForm.online && (
                    <Fade in={true}>
                      <Paper sx={{ 
                        mt: 2,
                        p: 2, 
                        backgroundColor: 'success.50',
                        border: '1px solid',
                        borderColor: 'success.200'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationOnIcon sx={{ mr: 1, color: 'success.main' }} />
                          <Typography variant="body2" color="success.dark">
                            Location coordinates saved: {typeof eventForm.coordinates === 'object' ? 
                              `${eventForm.coordinates.latitude?.toFixed(6) || '?'}, ${eventForm.coordinates.longitude?.toFixed(6) || '?'}` : 
                              'Available'}
                          </Typography>
                        </Box>
                      </Paper>
                    </Fade>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: 'fit-content' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Event Details</Typography>
                  </Box>
                  
                  <TextField
                    label="Description"
                    multiline
                    rows={8}
                    fullWidth
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    placeholder="Describe your event in detail. What can attendees expect?"
                    sx={{ mb: 3 }}
                  />
                  
                  <TextField
                    label={eventForm.online ? "Event Link (recommended)" : "Event Link (optional)"}
                    fullWidth
                    placeholder={eventForm.online ? "https://zoom.us/j/123456789" : "https://example.com/your-event"}
                    value={eventForm.event_link}
                    onChange={(e) => setEventForm({ ...eventForm, event_link: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkIcon />
                        </InputAdornment>
                      ),
                    }}
                    helperText={eventForm.online 
                      ? "Add the meeting link (Zoom, Teams, etc.) for attendees to join"
                      : "Registration page, Zoom meeting, or external resource"
                    }
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ImageIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Event Cover Image</Typography>
                  </Box>
                  
                  <Paper
                    sx={{ 
                      width: '100%', 
                      height: 240, 
                      border: dragOver ? '2px solid' : '2px dashed',
                      borderColor: dragOver ? 'primary.main' : 'grey.300',
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      backgroundColor: dragOver ? 'primary.50' : 'grey.50',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'primary.50'
                      }
                    }}
                    onClick={() => document.getElementById('event-image-input').click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {eventImagePreview ? (
                      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                        <img 
                          src={eventImagePreview} 
                          alt="Event cover preview" 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover' 
                          }} 
                        />
                        <IconButton
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEventImageFile(null);
                            setEventImagePreview(null);
                          }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', p: 3 }}>
                        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" color="primary.main" gutterBottom>
                          Drop image here or click to upload
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Supports JPG, PNG, GIF up to 5MB
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                  
                  <input
                    accept="image/*"
                    id="event-image-input"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Capacity & Tickets</Typography>
                  </Box>
                  
                  <TextField
                    label="Event Capacity (optional)"
                    type="number"
                    fullWidth
                    value={eventForm.capacity}
                    onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                    sx={{ mb: 3 }}
                    placeholder="Maximum number of attendees"
                    helperText="Leave empty for unlimited capacity"
                  />
                  
                  <TextField
                    label="Max Tickets per Person (optional)"
                    type="number"
                    fullWidth
                    value={eventForm.max_tickets}
                    onChange={(e) => setEventForm({ ...eventForm, max_tickets: e.target.value })}
                    placeholder="e.g., 2"
                    helperText="Limit tickets per attendee"
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EuroIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Pricing</Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={8}>
                      <TextField
                        label="Price"
                        type="number"
                        fullWidth
                        value={eventForm.price}
                        onChange={(e) => setEventForm({ ...eventForm, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        inputProps={{ step: '0.01', min: '0' }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FormControl fullWidth>
                        <InputLabel>Currency</InputLabel>
                        <Select
                          value={eventForm.currency}
                          onChange={(e) => setEventForm({ ...eventForm, currency: e.target.value })}
                          label="Currency"
                        >
                          {currencies.map((currency) => (
                            <MenuItem key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.code}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  
                  {eventForm.price === 0 && (
                    <Chip 
                      label="Free Event" 
                      color="success" 
                      size="small" 
                      sx={{ mt: 1 }} 
                    />
                  )}
                </CardContent>
              </Card>
              
              {categories.length > 0 && (
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mt: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Category</Typography>
                    </Box>
                    
                    <FormControl fullWidth>
                      <InputLabel>Event Category (optional)</InputLabel>
                      <Select
                        value={eventForm.category_id}
                        onChange={(e) => setEventForm({ ...eventForm, category_id: e.target.value })}
                        label="Event Category (optional)"
                      >
                        <MenuItem value="">
                          <em>No Category</em>
                        </MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" component="div">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </Typography>
            {eventForm.online && (
              <Chip 
                icon={<ComputerIcon />} 
                label="Online" 
                size="small" 
                color="info" 
                variant="outlined"
              />
            )}
          </Box>
          <IconButton onClick={onClose} disabled={updating}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Stepper activeStep={currentStep} sx={{ mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>
      
      {updating && <LinearProgress />}
      
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {!isAdmin && !editingEvent && (
          <Alert 
            severity="info" 
            sx={{ my: 3 }}
            icon={<InfoIcon />}
          >
            {t('eventsTab.approvalNotice')}
          </Alert>
        )}
        
        <Fade in={true} key={currentStep}>
          <Box>
            {renderStepContent(currentStep)}
          </Box>
        </Fade>
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose} 
          disabled={updating}
          variant="outlined"
        >
          Cancel
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        {currentStep > 0 && (
          <Button 
            onClick={prevStep}
            disabled={updating}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Back
          </Button>
        )}
        
        {currentStep < steps.length - 1 ? (
          <Button 
            onClick={nextStep}
            disabled={!canProceedToNext() || updating}
            variant="contained"
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={updating || !canProceedToNext()}
            sx={{ minWidth: 140 }}
          >
            {updating ? (editingEvent ? 'Updating...' : 'Creating...') : (editingEvent ? 'Update Event' : 'Create Event')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateEventDialog;