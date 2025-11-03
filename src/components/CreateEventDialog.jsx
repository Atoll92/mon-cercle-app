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
import { fetchNetworkCategories, createCategory, generateSlug } from '../api/categories';
import { useTranslation } from '../hooks/useTranslation';
import { supabase } from '../supabaseclient';

const CreateEventDialog = ({ open, onClose, networkId, profileId, onEventCreated, editingEvent = null, onEventUpdated, isAdmin = false }) => {
  const { t } = useTranslation();
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    end_date: '',
    location: '',
    description: '',
    capacity: '',
    coordinates: null,
    event_link: '',
    price: 0,
    currency: 'EUR',
    max_tickets: '',
    category_id: '',
    online: false,
    all_day: false
  });
  const [locationSuggestion, setLocationSuggestion] = useState(null);
  const [eventImageFile, setEventImageFile] = useState(null);
  const [eventImagePreview, setEventImagePreview] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#6366f1'
  });
  const [categoryCreating, setCategoryCreating] = useState(false);
  const [categoryError, setCategoryError] = useState(null);
  const [allowMemberPublishing, setAllowMemberPublishing] = useState(false);

  const steps = [t('events.steps.basicInfo'), t('events.steps.detailsMedia'), t('events.steps.settings')];

  const currencies = [
    { code: 'EUR', symbol: '€' },
    { code: 'USD', symbol: '$' },
    { code: 'GBP', symbol: '£' },
    { code: 'CHF', symbol: 'Fr' }
  ];

  // Load categories and network settings on mount
  useEffect(() => {
    if (networkId) {
      loadCategories();
      loadNetworkSettings();
    }
  }, [networkId]);

  const loadNetworkSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('networks')
        .select('features_config')
        .eq('id', networkId)
        .single();

      if (data && !error) {
        setAllowMemberPublishing(data.features_config?.allow_member_event_publishing || false);
      }
    } catch (err) {
      console.error('Error loading network settings:', err);
    }
  };

  // Reset form when dialog opens/closes or populate with editing data
  useEffect(() => {
    if (!open) {
      setEventForm({
        title: '',
        date: '',
        end_date: '',
        location: '',
        description: '',
        capacity: '',
        coordinates: null,
        event_link: '',
        price: 0,
        currency: 'EUR',
        max_tickets: '',
        category_id: '',
        online: false,
        all_day: false
      });
      setLocationSuggestion(null);
      setEventImageFile(null);
      setEventImagePreview(null);
      setError(null);
      setCurrentStep(0);
    } else if (editingEvent) {
      // Format date for datetime-local input
      let formattedDate = '';
      let formattedEndDate = '';
      if (editingEvent.date) {
        const date = new Date(editingEvent.date);
        // Format as YYYY-MM-DDTHH:mm for datetime-local input
        formattedDate = date.toISOString().slice(0, 16);
      }
      if (editingEvent.end_date) {
        const endDate = new Date(editingEvent.end_date);
        formattedEndDate = endDate.toISOString().slice(0, 16);
      }
      
      // Populate form with event data for editing
      // Check if event is all-day (time is 00:00)
      const isAllDay = editingEvent.date && new Date(editingEvent.date).toTimeString().startsWith('00:00:00');
      
      setEventForm({
        title: editingEvent.title || '',
        date: formattedDate,
        end_date: formattedEndDate,
        location: editingEvent.location || '',
        description: editingEvent.description || '',
        capacity: editingEvent.capacity || '',
        coordinates: editingEvent.coordinates || null,
        event_link: editingEvent.event_link || '',
        price: editingEvent.price || 0,
        currency: editingEvent.currency || 'EUR',
        max_tickets: editingEvent.max_tickets || '',
        category_id: editingEvent.category_id || '',
        online: editingEvent.online || false,
        all_day: isAllDay
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
      setError(t('events.errors.imageSizeTooLarge'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError(t('events.errors.invalidImageType'));
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
      setError(t('events.errors.requiredFields'));
      return;
    }

    // If not online event, location is required
    if (!eventForm.online && !eventForm.location) {
      console.error('🎯 [EVENT DIALOG] Validation failed: Missing location for in-person event');
      setError(t('events.errors.locationRequired'));
      return;
    }

    // Validate that end date is after start date if provided
    if (eventForm.end_date && eventForm.date) {
      const startDate = new Date(eventForm.date);
      const endDate = new Date(eventForm.end_date);
      if (endDate <= startDate) {
        console.error('🎯 [EVENT DIALOG] Validation failed: End date must be after start date');
        setError(t('events.errors.endDateInvalid'));
        return;
      }
    }

    console.log('🎯 [EVENT DIALOG] Validation passed, proceeding with submission');
    setError(null);
    setUpdating(true);

    try {
      // Prepare event data
      // For all-day events, append T00:00 to make it a valid datetime
      let eventDate = eventForm.date;
      let eventEndDate = eventForm.end_date || null;
      
      if (eventForm.all_day) {
        // Convert date-only inputs to datetime with 00:00 time
        if (eventDate && !eventDate.includes('T')) {
          eventDate = eventDate + 'T00:00';
        }
        if (eventEndDate && !eventEndDate.includes('T')) {
          eventEndDate = eventEndDate + 'T00:00';
        }
      }
      
      const eventData = {
        title: eventForm.title,
        date: eventDate,
        end_date: eventEndDate,
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
          throw new Error(result.message || t('events.errors.updateFailed'));
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
          throw new Error(result.message || t('events.errors.createFailed'));
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
      setError(err.message || t('events.errors.saveFailed'));
    } finally {
      setUpdating(false);
      console.log('🎯 [EVENT DIALOG] Event operation completed');
    }
  };

  const handleCreateCategory = async () => {
    setCategoryError(null);
    setCategoryCreating(true);

    try {
      if (!newCategory.name.trim()) {
        setCategoryError(t('events.errors.categoryNameRequired'));
        return;
      }

      const categoryData = {
        network_id: networkId,
        name: newCategory.name.trim(),
        slug: newCategory.slug.trim() || generateSlug(newCategory.name.trim()),
        description: newCategory.description.trim(),
        color: newCategory.color,
        type: 'event', // Event-specific category
        is_active: true
      };

      const { data, error } = await createCategory(categoryData);
      if (error) throw error;

      // Refresh categories list
      await loadCategories();
      
      // Set the new category as selected
      setEventForm(prev => ({ ...prev, category_id: data.id }));
      
      // Close dialog and reset form
      setCategoryDialogOpen(false);
      setNewCategory({
        name: '',
        slug: '',
        description: '',
        color: '#6366f1'
      });
    } catch (err) {
      setCategoryError(err.message || t('events.errors.createCategoryFailed'));
    } finally {
      setCategoryCreating(false);
    }
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setNewCategory(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-generate slug from name
      if (name === 'name') {
        updated.slug = generateSlug(value);
      }
      
      return updated;
    });
  };

  const loadCategories = async () => {
    const { data, error } = await fetchNetworkCategories(networkId, true, 'event');
    if (data && !error) {
      setCategories(data);
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
                    <Typography variant="h6">{t('events.basicInfo.title')}</Typography>
                  </Box>

                  <TextField
                    autoFocus
                    label={t('events.basicInfo.eventTitle')}
                    fullWidth
                    required
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    sx={{ mb: 3 }}
                    variant="outlined"
                    placeholder={t('events.basicInfo.titlePlaceholder')}
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={eventForm.all_day}
                        onChange={(e) => {
                          const isAllDay = e.target.checked;
                          setEventForm({ 
                            ...eventForm, 
                            all_day: isAllDay,
                            // If switching to all-day, set time to 00:00 if date exists
                            date: eventForm.date && isAllDay ? eventForm.date.split('T')[0] : eventForm.date,
                            end_date: eventForm.end_date && isAllDay ? eventForm.end_date.split('T')[0] : eventForm.end_date
                          });
                        }}
                      />
                    }
                    label={t('events.basicInfo.allDay')}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    label={eventForm.all_day ? t('events.basicInfo.startDate') : t('events.basicInfo.startDateTime')}
                    type={eventForm.all_day ? "date" : "datetime-local"}
                    fullWidth
                    required
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTimeIcon />
                          </InputAdornment>
                        ),
                      }
                    }}
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    sx={{ mb: 3 }}
                    helperText={eventForm.all_day ? t('events.basicInfo.dateHelper') : t('events.basicInfo.dateTimeHelper')}
                  />

                  <TextField
                    label={eventForm.all_day ? t('events.basicInfo.endDate') : t('events.basicInfo.endDateTime')}
                    type={eventForm.all_day ? "date" : "datetime-local"}
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTimeIcon />
                          </InputAdornment>
                        ),
                      }
                    }}
                    value={eventForm.end_date}
                    onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                    sx={{ mb: 3 }}
                    helperText={t('events.basicInfo.endDateHelper')}
                  />
                  
                  {eventForm.end_date && eventForm.date && (() => {
                    const startDate = new Date(eventForm.date);
                    const endDate = new Date(eventForm.end_date);
                    const isValid = endDate > startDate;
                    const duration = isValid ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) : 0;
                    
                    return (
                      <Fade in={true}>
                        <Paper sx={{ 
                          mt: 2,
                          mb: 3,
                          p: 2, 
                          backgroundColor: isValid ? 'success.50' : 'error.50',
                          border: '1px solid',
                          borderColor: isValid ? 'success.200' : 'error.200'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EventIcon sx={{ mr: 1, color: isValid ? 'success.main' : 'error.main' }} />
                            <Typography variant="body2" color={isValid ? 'success.dark' : 'error.dark'}>
                              {isValid
                                ? t('events.basicInfo.multiDay', { count: duration })
                                : t('events.basicInfo.endDateError')
                              }
                            </Typography>
                          </Box>
                        </Paper>
                      </Fade>
                    );
                  })()}
                  
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
                          {eventForm.online ? t('events.basicInfo.onlineEvent') : t('events.basicInfo.inPersonEvent')}
                        </Typography>
                        <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                          {eventForm.online ? t('events.basicInfo.noLocationRequired') : t('events.basicInfo.locationRequired')}
                        </Typography>
                      </Box>
                    }
                    sx={{ mb: 3 }}
                  />

                  {!eventForm.online && (
                    <AddressSuggestions
                      value={locationSuggestion}
                      onChange={handleLocationChange}
                      label={t('events.basicInfo.location')}
                      placeholder={t('events.basicInfo.locationPlaceholder')}
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
                            {t('events.basicInfo.onlineEventInfo')}
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
                    <Typography variant="h6">{t('events.details.title')}</Typography>
                  </Box>

                  <TextField
                    label={t('events.details.description')}
                    multiline
                    rows={8}
                    fullWidth
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    placeholder={t('events.details.descriptionPlaceholder')}
                    sx={{ mb: 3 }}
                  />

                  <TextField
                    label={eventForm.online ? t('events.details.eventLinkRecommended') : t('events.details.eventLinkOptional')}
                    fullWidth
                    placeholder={eventForm.online ? "https://zoom.us/j/123456789" : "https://example.com/your-event"}
                    value={eventForm.event_link}
                    onChange={(e) => setEventForm({ ...eventForm, event_link: e.target.value })}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LinkIcon />
                          </InputAdornment>
                        ),
                      }
                    }}
                    helperText={eventForm.online
                      ? t('events.details.eventLinkHelperOnline')
                      : t('events.details.eventLinkHelperOffline')
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
                    <Typography variant="h6">{t('events.details.coverImage')}</Typography>
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
                          {t('events.details.dropImage')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('events.details.imageFormats')}
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
                    <Typography variant="h6">{t('events.settings.capacityTickets')}</Typography>
                  </Box>

                  <TextField
                    label={t('events.settings.capacity')}
                    type="number"
                    fullWidth
                    value={eventForm.capacity}
                    onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                    sx={{ mb: 3 }}
                    placeholder={t('events.settings.capacityPlaceholder')}
                    helperText={t('events.settings.capacityHelper')}
                  />

                  <TextField
                    label={t('events.settings.maxTickets')}
                    type="number"
                    fullWidth
                    value={eventForm.max_tickets}
                    onChange={(e) => setEventForm({ ...eventForm, max_tickets: e.target.value })}
                    placeholder={t('events.settings.maxTicketsPlaceholder')}
                    helperText={t('events.settings.maxTicketsHelper')}
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EuroIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">{t('events.settings.pricing')}</Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={8}>
                      <TextField
                        label={t('events.settings.price')}
                        type="number"
                        fullWidth
                        value={eventForm.price}
                        onChange={(e) => setEventForm({ ...eventForm, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FormControl fullWidth>
                        <InputLabel>{t('events.settings.currency')}</InputLabel>
                        <Select
                          value={eventForm.currency}
                          onChange={(e) => setEventForm({ ...eventForm, currency: e.target.value })}
                          label={t('events.settings.currency')}
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
                      label={t('events.settings.freeEvent')}
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
                      <Typography variant="h6">{t('events.settings.category')}</Typography>
                    </Box>

                    <FormControl fullWidth>
                      <InputLabel>{t('events.settings.categoryLabel')}</InputLabel>
                      <Select
                        value={eventForm.category_id}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') {
                            setCategoryDialogOpen(true);
                          } else {
                            setEventForm({ ...eventForm, category_id: e.target.value });
                          }
                        }}
                        label={t('events.settings.categoryLabel')}
                      >
                        <MenuItem value="">
                          <em>{t('events.settings.noCategory')}</em>
                        </MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                        {isAdmin && <Divider />}
                        {isAdmin && (
                          <MenuItem value="ADD_NEW" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                            {t('events.settings.addNewCategory')}
                          </MenuItem>
                        )}
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
      slotProps={{
        paper: {
          sx: { 
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" component="div">
              {editingEvent ? t('events.dialog.editEvent') : t('events.dialog.createEvent')}
            </Typography>
            {eventForm.online && (
              <Chip
                icon={<ComputerIcon />}
                label={t('events.dialog.online')}
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
        
        {!isAdmin && !editingEvent && !allowMemberPublishing && (
          <Alert
            severity="info"
            sx={{ my: 3 }}
            icon={<InfoIcon />}
          >
            {t('eventsTab.approvalNotice')}
          </Alert>
        )}

        {!isAdmin && !editingEvent && allowMemberPublishing && (
          <Alert
            severity="success"
            sx={{ my: 3 }}
            icon={<InfoIcon />}
          >
            {t('eventsTab.directPublishNotice')}
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
          {t('events.dialog.cancel')}
        </Button>

        <Box sx={{ flex: 1 }} />

        {currentStep > 0 && (
          <Button
            onClick={prevStep}
            disabled={updating}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            {t('events.dialog.back')}
          </Button>
        )}

        {currentStep < steps.length - 1 ? (
          <Button
            onClick={nextStep}
            disabled={!canProceedToNext() || updating}
            variant="contained"
          >
            {t('events.dialog.next')}
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={updating || !canProceedToNext()}
            sx={{ minWidth: 140 }}
          >
            {updating ? (editingEvent ? t('events.dialog.updating') : t('events.dialog.creating')) : (editingEvent ? t('events.dialog.updateEvent') : t('events.dialog.createEvent'))}
          </Button>
        )}
      </DialogActions>
      
      {/* Category Creation Dialog */}
      <Dialog 
        open={categoryDialogOpen} 
        onClose={() => !categoryCreating && setCategoryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">{t('events.category.createNew')}</Typography>
            <IconButton
              onClick={() => setCategoryDialogOpen(false)}
              disabled={categoryCreating}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {categoryError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setCategoryError(null)}
            >
              {categoryError}
            </Alert>
          )}

          <TextField
            autoFocus
            label={t('events.category.name')}
            fullWidth
            required
            name="name"
            value={newCategory.name}
            onChange={handleCategoryInputChange}
            margin="normal"
            disabled={categoryCreating}
          />

          <TextField
            label={t('events.category.slug')}
            fullWidth
            name="slug"
            value={newCategory.slug}
            onChange={handleCategoryInputChange}
            margin="normal"
            helperText={t('events.category.slugHelper')}
            disabled={categoryCreating}
          />

          <TextField
            label={t('events.category.description')}
            fullWidth
            name="description"
            value={newCategory.description}
            onChange={handleCategoryInputChange}
            margin="normal"
            multiline
            rows={2}
            disabled={categoryCreating}
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              {t('events.category.color')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#22c55e', '#06b6d4', '#3b82f6'].map((color) => (
                <Box
                  key={color}
                  onClick={() => !categoryCreating && setNewCategory(prev => ({ ...prev, color }))}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: color,
                    borderRadius: 1,
                    cursor: categoryCreating ? 'default' : 'pointer',
                    border: newCategory.color === color ? '3px solid' : '1px solid',
                    borderColor: newCategory.color === color ? 'primary.main' : 'divider',
                    '&:hover': !categoryCreating && {
                      transform: 'scale(1.1)'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button
            onClick={() => setCategoryDialogOpen(false)}
            disabled={categoryCreating}
          >
            {t('events.category.cancel')}
          </Button>
          <Button
            onClick={handleCreateCategory}
            variant="contained"
            disabled={categoryCreating || !newCategory.name.trim()}
          >
            {categoryCreating ? t('events.category.creating') : t('events.category.createButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default CreateEventDialog;