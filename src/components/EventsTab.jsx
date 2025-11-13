import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Link } from 'react-router-dom';
import { AnimatedCard, StaggeredListItem, PageTransition } from './AnimatedComponents';
import EventDetailsDialog from './EventDetailsDialog';
import { fetchNetworkCategories } from '../api/categories';
import { formatEventDate, formatDate } from '../utils/dateFormatting';
import { supabase } from '../supabaseclient';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Divider,
  Chip,
  Alert,
  Card,
  CardContent,
  CardActions,
  Fade,
  Zoom,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  Dialog,
  List,
  ListItem,
  ListItemText,
  ListItemButton
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  ArrowForward as ArrowForwardIcon,
  Link as LinkIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import TimelineIcon from '@mui/icons-material/Timeline';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { addMonths, subMonths } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import fr from 'date-fns/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import EventParticipation from './EventParticipation';
import EventsMap from './EventsMap';
import CreateEventDialog from './CreateEventDialog';
import { Add as AddIcon } from '@mui/icons-material';

const locales = {
  'en': enUS,
  'fr': fr,
};

// Helper function to get locale-aware localizer
const getLocalizer = (language = 'en') => {
  return dateFnsLocalizer({
    format: (date, formatStr, options) => format(date, formatStr, { ...options, locale: locales[language] }),
    parse: (dateStr, formatStr, options) => parse(dateStr, formatStr, new Date(), { ...options, locale: locales[language] }),
    startOfWeek: (date, options) => startOfWeek(date, { ...options, locale: locales[language] }),
    getDay,
    locales,
  });
};

const EventsTab = ({
  events = [],
  user,
  isUserAdmin,
  onParticipationChange,
  network,
  activeProfile,
  setEvents
}) => {
  const { t, language } = useTranslation();
  const localizer = useMemo(() => getLocalizer(language), [language]);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [calendarPopoverAnchor, setCalendarPopoverAnchor] = useState(null);
  const [popoverEvents, setPopoverEvents] = useState([]);
  const [userParticipations, setUserParticipations] = useState([]);

  // Debug: Log props on mount and when they change
  React.useEffect(() => {
    console.log('=== EventsTab PROPS DEBUG ===');
    console.log('User:', user?.id);
    console.log('Events count:', events.length);
    console.log('UserParticipations count:', userParticipations.length);
    console.log('UserParticipations data:', userParticipations);
    
    // Map each event to its participation status for easier debugging
    const eventParticipationMap = events.map(event => {
      const participation = userParticipations.find(p => p.event_id === event.id);
      return {
        event_id: event.id,
        event_title: event.title,
        event_date: formatEventDate(event.date),
        participation_status: participation ? participation.status : 'none',
      };
    });
    console.log('Event participation mapping:', eventParticipationMap);
    console.log('=== END DEBUG ===');
  }, [events, userParticipations, user]);

  // Fetch user's event participations
  useEffect(() => {
    const fetchUserParticipations = async () => {
      if (!user || !events || events.length === 0) {
        console.log("EventsTab: Skipping participation fetch - missing data:", {
          user: !!user,
          events: !!events,
          eventsLength: events?.length || 0
        });
        return;
      }

      try {
        console.log("EventsTab: Fetching participations for user:", user.id);
        console.log("EventsTab: Events count:", events.length);

        // Get all participations for this user
        const { data: participations, error } = await supabase
          .from('event_participations')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        // Filter to only include participations for current events
        const eventIds = events.map(e => e.id);
        const relevantParticipations = (participations || []).filter(p =>
          eventIds.includes(p.event_id)
        );

        console.log("EventsTab: Found participations:", relevantParticipations.length);
        setUserParticipations(relevantParticipations);
      } catch (err) {
        console.error('EventsTab: Error fetching participations:', err);
      }
    };

    fetchUserParticipations();
  }, [user, events]);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      if (network?.id) {
        const { data, error } = await fetchNetworkCategories(network.id, true); // Only active categories
        if (data && !error) {
          setCategories(data);
        }
      }
    };
    loadCategories();
  }, [network?.id]);

  // Handle participation change locally
  const handleParticipationChange = (eventId, newStatus) => {
    // Update userParticipations state when status changes
    setUserParticipations(prevParticipations => {
      const existing = prevParticipations.find(p => p.event_id === eventId);

      if (existing) {
        // If null (removed), filter it out
        if (newStatus === null) {
          return prevParticipations.filter(p => p.event_id !== eventId);
        }

        // Otherwise update it
        return prevParticipations.map(p =>
          p.event_id === eventId
            ? { ...p, status: newStatus }
            : p
        );
      } else {
        // Add new participation
        if (newStatus !== null) {
          return [...prevParticipations, {
            event_id: eventId,
            user_id: user?.id,
            status: newStatus,
            created_at: new Date().toISOString()
          }];
        }
        return prevParticipations;
      }
    });

    // Call parent callback if provided (for backwards compatibility)
    if (onParticipationChange) {
      onParticipationChange(eventId, newStatus);
    }
  };

  const handleEventSelect = (event) => {
    if (event.resource) {
      setSelectedEvent(event.resource);
      setShowEventDialog(true);
    }
  };

  const closeEventDialog = () => {
    setShowEventDialog(false);
    setSelectedEvent(null);
  };

  // Calendar navigation functions
  const navigateToPreviousMonth = () => {
    setCalendarDate(prev => subMonths(prev, 1));
  };

  const navigateToNextMonth = () => {
    setCalendarDate(prev => addMonths(prev, 1));
  };

  // Helper function to categorize events
  const categorizeEvent = (event) => {
    const now = new Date();
    const startDate = new Date(event.date);
    const endDate = event.end_date ? new Date(event.end_date) : startDate;

    if (startDate > now) {
      return 'upcoming';
    } else if (endDate >= now) {
      return 'ongoing';
    } else {
      return 'past';
    }
  };

  // Filter events by selected category and status (only approved events for non-admins)
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filter by status - only show approved events to non-admin users
    if (!isUserAdmin) {
      filtered = filtered.filter(event => event.status === 'approved' || !event.status);
    }

    // Filter by category if selected
    if (selectedCategory) {
      filtered = filtered.filter(event => event.category_id === selectedCategory);
    }

    return filtered;
  }, [events, selectedCategory, isUserAdmin]);

  // Separate events by category
  const upcomingEvents = useMemo(() =>
    filteredEvents.filter(event => categorizeEvent(event) === 'upcoming'),
    [filteredEvents]
  );

  const ongoingEvents = useMemo(() =>
    filteredEvents.filter(event => categorizeEvent(event) === 'ongoing'),
    [filteredEvents]
  );

  const pastEvents = useMemo(() =>
    filteredEvents.filter(event => categorizeEvent(event) === 'past'),
    [filteredEvents]
  );

  return (
    <PageTransition>
      <Paper sx={{ p: 3, mt: 1.5 }} >
        {message && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>            
            {categories.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>{t('eventsTab.filterByCategory')}</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label={t('eventsTab.filterByCategory')}
                >
                  <MenuItem value="">
                    <em>{t('eventsTab.allCategories')}</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            bgcolor: category.color || '#666' 
                          }} 
                        />
                        {category.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Button for members to propose events */}
          {!isUserAdmin && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              startIcon={<AddIcon />}
              color="primary"
              variant="contained"
            >
              {t('eventsTab.proposeEvent')}
            </Button>
          )}
          
          {isUserAdmin && (
            <Button
              component={Link}
              to="/admin?tab=events"
              startIcon={<EventIcon />}
              color="primary"
              variant="contained"
            >
              {t('eventsTab.manageEvents')}
            </Button>
          )}
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />

      {/* Fixed layout with two equal width columns using a flex container instead of Grid */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 3,
        width: '100%'
      }}>
        {/* Left column: Map and upcoming events */}
        <Box sx={{ 
          flex: '1 1 0px', 
          display: 'flex', 
          flexDirection: 'column',
          minWidth: 0 // This ensures the flex item can shrink below its content size
        }}>
          {/* Events Map */}
          <Paper 
            elevation={0} 
            variant="outlined" 
            sx={{ 
              mb: 3, 
              borderRadius: 2, 
              overflow: 'hidden',
              flex: '0 0 auto'
            }}
          >
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOnIcon sx={{ mr: 1 }} color="primary" />
                {t('eventsTab.eventsMap')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('eventsTab.geographicView')}
              </Typography>
            </Box>
            <EventsMap 
              events={filteredEvents.filter(event => new Date(event.date) >= new Date())} 
              onEventSelect={(event) => {
                setSelectedEvent(event);
                setShowEventDialog(true);
              }}
            />
          </Paper>
          
          {/* Upcoming Events Section */}
          <Paper 
            elevation={0} 
            variant="outlined" 
            sx={{ 
              flex: '1 1 auto',
              borderRadius: 2,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ 
              p: 2, 
              bgcolor: 'background.paper', 
              borderBottom: '1px solid', 
              borderColor: 'divider',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <EventIcon sx={{ mr: 1 }} color="primary" />
                  {t('eventsTab.upcomingEvents')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('eventsTab.eventsHappeningSoon')}
                </Typography>
              </Box>
              
              <Chip label={t('eventsTab.eventsCount', { count: upcomingEvents.length })}
                size="small" color="primary" variant="outlined" />
            </Box>
            
            <Box sx={{ flex: '1 1 auto', overflowY: 'auto', maxHeight: '380px' }}>
              {upcomingEvents.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    {t('eventsTab.noUpcomingEvents')}
                  </Typography>
                  {isUserAdmin && (
                    <Button
                      variant="contained"
                      color="primary"
                      component={Link}
                      to="/admin?tab=events"
                      startIcon={<EventIcon />}
                      sx={{ mt: 2 }}
                    >
                      {t('eventsTab.createEvent')}
                    </Button>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
                  {upcomingEvents
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((event, index) => {
                      // Find user participation for this event
                      const participation = userParticipations.find(p => p.event_id === event.id);
                      const eventDate = new Date(event.date);
                      const isToday = new Date().toDateString() === eventDate.toDateString();
                      const isTomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() === eventDate.toDateString();
                      
                      
                      let dateLabel = eventDate.toLocaleDateString(language, { month: 'short', day: 'numeric' });
                      if (isToday) dateLabel = t('eventsTab.today');
                      if (isTomorrow) dateLabel = t('eventsTab.tomorrow');
                      
                      // Color to use for the date badge
                      const dateBadgeColor = participation ? 
                        (participation.status === 'attending' ? '#4caf50' : 
                         participation.status === 'maybe' ? '#ff9800' : '#f44336') : 
                        (isToday ? '#2196f3' : '#757575');
                        
                      // Also add CSS class for better rendering
                      const dateBadgeClass = participation ? 
                        (participation.status === 'attending' ? 'event-attending' : 
                         participation.status === 'maybe' ? 'event-maybe' : 
                         'event-declined') : 
                        (isToday ? 'event-today' : 'event-default');
                      
                      return (
                        <StaggeredListItem
                          key={event.id}
                          index={index}
                          className="parent-event-row"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventDialog(true);
                          }}
                          sx={{
                            display: 'flex',
                            borderBottom: index < upcomingEvents.length - 1 ? '1px solid' : 'none',
                            borderColor: 'divider',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            bgcolor: isToday ? 'rgba(33, 150, 243, 0.05)' : 'transparent',
                            overflow: 'hidden', // Prevent content from spilling out
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.02)',
                            }
                          }}
                        >
                          {/* Event details */}
                          <Box sx={{ 
                            display: 'flex', 
                            width: '100%',
                            position: 'relative',
                            overflow: 'hidden',
                            minHeight: '120px' // Ensure consistent height
                          }}>
                            {/* Event image with overlaid date badge - with animation on hover */}
                            <Box sx={{ 
                              width: { xs: '100px', sm: '150px', md: '200px' },
                              position: 'relative',
                              overflow: 'hidden',
                              transition: 'all 0.3s ease',
                              flexShrink: 0, // Prevent shrinking
                              '.parent-event-row:hover &': {
                                width: { xs: '100px', sm: '120px', md: '150px' }
                              }
                            }}>
                              {event.cover_image_url ? (
                                <>
                                  <img
                                    src={event.cover_image_url}
                                    alt={event.title}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      transition: 'transform 0.3s ease',
                                    }}
                                  />
                                  {/* Gradient overlay for text readability */}
                                  <Box sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0))',
                                    zIndex: 1
                                  }} />
                                </>
                              ) : (
                                <Box sx={{
                                  width: '100%',
                                  height: '100%',
                                  bgcolor: 'rgba(0, 0, 0, 0.03)',
                                }} />
                              )}
                              
                              {/* Date badge overlay */}
                              <Box sx={{
                                position: 'absolute',
                                top: 10,
                                left: 10,
                                zIndex: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'baseline'
                              }}>
                                <Box 
                                  className={`date-badge ${dateBadgeClass}`}
                                  sx={{
                                    width: '45px',
                                    height: '45px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: dateBadgeColor,
                                    color: 'white',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    // Force the background color to load properly on initial render
                                    position: 'relative',
                                    '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      inset: 0,
                                      borderRadius: 'inherit',
                                      backgroundColor: 'inherit !important',
                                      zIndex: -1
                                    }
                                  }}
                                >
                                  <Typography variant="caption" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                                    {eventDate.toLocaleString(language, { month: 'short' })}
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                                    {eventDate.getDate()}
                                  </Typography>
                                </Box>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: event.cover_image_url ? 'white' : 'text.secondary',
                                    textShadow: event.cover_image_url ? '0 1px 2px rgba(0,0,0,0.8)' : 'none',
                                    fontWeight: 'medium',
                                    mt: 0.5,
                                    bgcolor: event.cover_image_url ? 'rgba(0,0,0,0.4)' : 'transparent',
                                    px: 1,
                                    borderRadius: 1
                                  }}
                                >
                                  {isToday ? t('eventsTab.today') : isTomorrow ? t('eventsTab.tomorrow') : eventDate.toLocaleString(language, { weekday: 'short' })}
                                </Typography>
                              </Box>
                            </Box>
                            
                            {/* Event info */}
                            <Box sx={{ 
                              p: 2,
                              display: 'flex',
                              flexDirection: 'column',
                              flex: '1 1 auto',
                              zIndex: 2,
                              position: 'relative',
                              transition: 'all 0.3s ease',
                              overflow: 'hidden',
                              width: '100%'
                            }}>
                              <Typography variant="subtitle1" sx={{ 
                                fontWeight: 'medium', 
                                mb: 0.5, 
                                display: 'flex', 
                                alignItems: 'center'
                              }}>
                                {event.title}
                              </Typography>
                              
                              {/* Display category if exists */}
                              {event.category && (
                                <Chip 
                                  label={event.category.name}
                                  size="small"
                                  sx={{ 
                                    bgcolor: event.category.color || '#666',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    height: 20,
                                    mb: 0.5
                                  }}
                                />
                              )}
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <LocationOnIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {event.location}
                                </Typography>
                              </Box>
                              
                              {/* Show pricing if monetization is enabled and event has a price */}
                              {network?.features_config?.monetization && event.price > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                    {new Intl.NumberFormat('en-US', {
                                      style: 'currency',
                                      currency: event.currency || 'EUR'
                                    }).format(event.price)}
                                  </Typography>
                                  {event.max_tickets && (
                                    <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                      • {event.tickets_sold || 0}/{event.max_tickets} tickets
                                    </Typography>
                                  )}
                                </Box>
                              )}
                              
                              {/* Interactive buttons */}
                              <Box sx={{
                                display: 'flex',
                                mt: 'auto',
                                pt: 1,
                                justifyContent: 'flex-start',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 1
                              }}>
                                {/* RSVP buttons */}
                                {user && (
                                  <Box onClick={(e) => e.stopPropagation()}>
                                    <EventParticipation
                                      event={event}
                                      size="small"
                                      compact={true}
                                      onStatusChange={(status) => handleParticipationChange(event.id, status)}
                                    />
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </StaggeredListItem>
                      );
                    })}
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
        
        {/* Right column: Calendar - Ensuring equal width with flex */}
        <Box sx={{ 
          flex: '1 1 0px',
          minWidth: 0 // This ensures the flex item can shrink below its content size
        }}>
          <Paper 
            elevation={0} 
            variant="outlined" 
            sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ 
              p: 2, 
              bgcolor: 'background.paper', 
              borderBottom: '1px solid', 
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <TimelineIcon sx={{ mr: 1 }} color="primary" />
                  {t('eventsTab.calendarView')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('eventsTab.monthlyOverview')}
                </Typography>
              </Box>
              
              {/* Calendar navigation */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={navigateToPreviousMonth} size="small">
                  <ChevronLeftIcon />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 'medium', minWidth: '140px', textAlign: 'center' }}>
                  {formatDate(calendarDate, { month: 'long', year: 'numeric' })}
                </Typography>
                <IconButton onClick={navigateToNextMonth} size="small">
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            </Box>
            
            
<Box sx={{
  flex: '1 1 auto', 
  display: 'flex', 
  flexDirection: 'column',
  width: '100%',
  '& .rbc-calendar': {
    width: '100%',
    borderRadius: 0,
  },
  // Dark mode compatible header
  '& .rbc-header': {
    padding: '10px 8px',
    fontWeight: 600,
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
    borderBottom: '2px solid',
    borderRight: '1px solid',
    borderRightColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderBottomColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    color: 'text.secondary' // Using MUI's text secondary color which is theme aware
  },
  '& .rbc-month-view': {
    border: 'none',
    boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
    borderRadius: 0,
    backgroundColor: 'background.paper' // Using MUI's background paper color which adapts to dark mode
  },
  '& .rbc-day-bg': {
    transition: 'all 0.2s ease',
    borderRight: '1px solid',
    borderRightColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    '&:hover': {
      backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    }
  },
  '& .rbc-date-cell': {
    padding: '6px 8px',
    textAlign: 'right',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'text.primary', // Using MUI's text primary color which is theme aware
    borderRight: '1px solid',
    borderRightColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
  },
  // Fix for today's date in dark mode
  '& .rbc-today': {
    backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
  },
  // Fix for buttons in dark mode
  '& .rbc-btn-group button': {
    borderRadius: '4px',
    padding: '4px 12px',
    textTransform: 'capitalize',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    borderColor: 'divider', // Using MUI's divider color
    color: 'text.primary', // Using MUI's text primary color
    '&:hover': {
      backgroundColor: 'action.hover', // Using MUI's hover action color
    },
    '&.rbc-active': {
      backgroundColor: 'primary.main',
      color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#fff',
      borderColor: 'primary.main',
      boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
      '&:hover': {
        backgroundColor: 'primary.dark',
        borderColor: 'primary.dark'
      }
    }
  },
  '& .rbc-toolbar': {
    marginBottom: '16px',
    color: 'text.primary', // Using MUI's text primary color
    display:'none',
  },
  '& .rbc-toolbar-label': {
    fontWeight: 'bold',
    fontSize: '1.2rem',
    color: 'text.primary' // Using MUI's text primary color
  },
  // Fix for events in dark mode with better contrast
  '& .rbc-event': {
    borderRadius: '6px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    margin: '1px',
    padding: '2px 4px',
    border: 'none', // Remove border for cleaner look
    position: 'relative', // Add for pseudo-element
    '&:focus': {
      outline: 'none', // Remove outline on focus
      boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${theme.palette.primary.main}`
    },
    // Force background color to render on initial load
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      backgroundColor: 'inherit',
      zIndex: -1
    }
  },
  // Individual color styles - only for the custom Box component inside, not the rbc-event container
  '& .rbc-event.event-attending, & .rbc-event.event-maybe, & .rbc-event.event-declined, & .rbc-event.event-default, & .rbc-event.event-today': {
    backgroundColor: 'transparent !important',
    border: 'none !important'
  },
  '& .rbc-event.event-attending .MuiBox-root': {
    border: '2px solid #4caf50 !important'
  },
  '& .rbc-event.event-maybe .MuiBox-root': {
    border: '2px solid #ff9800 !important'
  },
  '& .rbc-event.event-declined .MuiBox-root': {
    border: '2px solid #f44336 !important'
  },
  '& .rbc-event.event-default .MuiBox-root': {
    border: '2px solid #757575 !important'
  },
  '& .rbc-event.event-today .MuiBox-root': {
    border: '2px solid #2196f3 !important'
  },
  
  // Color styles for date badges
  '& .date-badge.event-attending, & Box.date-badge.event-attending, & .event-attending.date-badge': {
    backgroundColor: '#4caf50 !important',
    '&::before': {
      backgroundColor: '#4caf50 !important'
    }
  },
  '& .date-badge.event-maybe, & Box.date-badge.event-maybe, & .event-maybe.date-badge': {
    backgroundColor: '#ff9800 !important',
    '&::before': {
      backgroundColor: '#ff9800 !important'
    }
  },
  '& .date-badge.event-declined, & Box.date-badge.event-declined, & .event-declined.date-badge': {
    backgroundColor: '#f44336 !important',
    '&::before': {
      backgroundColor: '#f44336 !important'
    }
  },
  '& .date-badge.event-default, & Box.date-badge.event-default, & .event-default.date-badge': {
    backgroundColor: '#757575 !important',
    '&::before': {
      backgroundColor: '#757575 !important'
    }
  },
  '& .date-badge.event-today, & Box.date-badge.event-today, & .event-today.date-badge': {
    backgroundColor: '#2196f3 !important',
    '&::before': {
      backgroundColor: '#2196f3 !important'
    }
  },
  '& .rbc-row-segment': {
    padding: '0 2px 1px 2px'
  },
  '& .rbc-row': {
    minHeight: '35px'
  },
  '& .rbc-month-row': {
    overflow: 'visible'
  },
  // Overlay for popovers in dark mode
  '& .rbc-overlay': {
    backgroundColor: 'background.paper', // Using MUI's background paper color
    border: '1px solid',
    borderColor: 'divider', // Using MUI's divider color
    boxShadow: 4, // Using MUI's elevation level
    borderRadius: 2,
    padding: 2,
    color: 'text.primary' // Using MUI's text primary color
  },
  // Fix for off-range days in dark mode
  '& .rbc-off-range-bg': {
    backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.04)',
    opacity: 0.5
  },
  // Fix for today's color in month view
  '& .rbc-month-view .rbc-now': {
    color: 'primary.main', // Use primary color for today's date text
    fontWeight: 700
  },
  // Fix month row separator
  '& .rbc-month-row + .rbc-month-row': {
    borderTop: '1px solid',
    borderTopColor: 'divider' // Using MUI's divider color
  },
  // Fix for time gutter in agenda view
  '& .rbc-time-view .rbc-time-gutter': {
    backgroundColor: 'background.paper', // Using MUI's background paper color
  },
  // Fix for time column in agenda view
  '& .rbc-time-view .rbc-time-content': {
    borderTop: '1px solid',
    borderTopColor: 'divider', // Using MUI's divider color
  },
  // Fix for time header in agenda view
  '& .rbc-time-header-content': {
    borderLeft: '1px solid',
    borderLeftColor: 'divider', // Using MUI's divider color
  },
  // Fix for time slots in agenda view
  '& .rbc-timeslot-group': {
    borderBottom: '1px solid',
    borderBottomColor: 'divider', // Using MUI's divider color
    minHeight: '40px'
  },
  // Fix for agenda view events
  '& .rbc-agenda-view table.rbc-agenda-table': {
    borderCollapse: 'separate',
    borderSpacing: 0,
    color: 'text.primary', // Using MUI's text primary color
    border: '1px solid',
    borderColor: 'divider', // Using MUI's divider color
    '& th': {
      borderBottom: '1px solid',
      borderBottomColor: 'divider', // Using MUI's divider color
      padding: '8px',
      backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
    },
    '& td': {
      padding: '8px',
      borderTop: '1px solid',
      borderTopColor: 'divider', // Using MUI's divider color
    }
  },
  // Fix for event gutter in agenda view
  '& .rbc-agenda-view .rbc-agenda-empty': {
    color: 'text.secondary', // Using MUI's text secondary color
    padding: '16px'
  },
  // Fix for event colors to be more visible in dark mode
  '& .rbc-day-slot .rbc-event': {
    borderWidth: 0
  }
}}>
  <Calendar
    localizer={localizer}
    events={filteredEvents.map(event => {
      // Find if user is participating in this event
      const participation = userParticipations.find(p => p.event_id === event.id);
      const eventDate = new Date(event.date);
      const isToday = new Date().toDateString() === eventDate.toDateString();
      
      // Enhanced color coding for better dark mode visibility
      let eventColor;
      let eventClass = 'event-default';
      
      console.log(`Creating calendar event for "${event.title}" (ID: ${event.id}):`);
      console.log('  - Event date:', eventDate.toLocaleDateString());
      console.log('  - Is today:', isToday);
      console.log('  - Participation found:', participation ? 'YES' : 'NO');
      
      if (participation) {
        console.log('  - Participation status:', participation.status);
        
        // More saturated colors for dark mode visibility
        if (participation.status === 'attending') {
          eventColor = '#4caf50'; // Green - unchanged
          eventClass = 'event-attending';
          console.log('  → Assigning attending class and color (GREEN)');
        }
        else if (participation.status === 'maybe') {
          eventColor = '#ff9800'; // Orange - unchanged
          eventClass = 'event-maybe';
          console.log('  → Assigning maybe class and color (ORANGE)');
        }
        else if (participation.status === 'declined') {
          eventColor = '#f44336'; // Red - unchanged
          eventClass = 'event-declined'; 
          console.log('  → Assigning declined class and color (RED)');
        }
      } else {
        eventColor = isToday ? '#2196f3' : '#757575'; // Blue for today, gray for other days
        eventClass = isToday ? 'event-today' : 'event-default';
        console.log(`  → No participation: Assigning ${isToday ? 'today' : 'default'} class and color (${isToday ? 'BLUE' : 'GRAY'})`);
      }
      
      const calendarEvent = {
        title: event.title,
        start: new Date(event.date),
        end: new Date(event.date),
        allDay: true,
        resource: event,
        color: eventColor,
        className: eventClass,
        coverImage: event.cover_image_url,
        hasLink: !!event.event_link
      };
      
      console.log('  - Created calendar event with className:', calendarEvent.className);
      console.log('  - Created calendar event with color:', calendarEvent.color);
      
      return calendarEvent;
    })}
    date={calendarDate}
    view="month"
    onNavigate={setCalendarDate}
    startAccessor="start"
    endAccessor="end"
    style={{ flex: '1 1 auto', minHeight: '500px', width: '100%' }}
    onSelectEvent={handleEventSelect}
    eventPropGetter={(event) => {
      // Initialize with default gray
      let borderColor = '#757575';
      let className = event.className || 'event-default';

      console.log(`Event prop getter for "${event.title}":`);
      console.log('  - className from event:', event.className);
      console.log('  - color prop from event:', event.color);

      // Try multiple sources to determine participation status
      let participationStatus = null;

      // Check direct resource reference first
      if (event.resource && event.resource.id) {
        const participation = userParticipations.find(p => p.event_id === event.resource.id);
        if (participation) {
          participationStatus = participation.status;
          console.log('  - Found participation from resource.id:', participationStatus);
        }
      }

      // Look for participation based on date (fallback for single-day events)
      if (!participationStatus && event.start) {
        const sameDay = (date1, date2) => {
          return date1.getFullYear() === date2.getFullYear() &&
                 date1.getMonth() === date2.getMonth() &&
                 date1.getDate() === date2.getDate();
        };

        // Find events on this date
        const eventsOnSameDay = filteredEvents.filter(e =>
          sameDay(new Date(e.date), event.start)
        );

        // If there's just one event on this day, it's likely the one we want
        if (eventsOnSameDay.length === 1) {
          const participation = userParticipations.find(p => p.event_id === eventsOnSameDay[0].id);
          if (participation) {
            participationStatus = participation.status;
            console.log('  - Found participation by date match:', participationStatus);
          }
        }
      }

      // EXPLICITLY determine color and className based on participation status
      if (participationStatus === 'attending') {
        borderColor = '#4caf50'; // Green
        className = 'event-attending';
        console.log('  → Explicitly setting GREEN border (attending)');
      } else if (participationStatus === 'maybe') {
        borderColor = '#ff9800'; // Orange
        className = 'event-maybe';
        console.log('  → Explicitly setting ORANGE border (maybe)');
      } else if (participationStatus === 'declined') {
        borderColor = '#f44336'; // Red
        className = 'event-declined';
        console.log('  → Explicitly setting RED border (declined)');
      }
      // If we have no participation status, fall back to className or today check
      else {
        // Check if this event is for today
        const isToday = event.start ?
          new Date().toDateString() === event.start.toDateString() : false;

        if (isToday) {
          borderColor = '#2196f3'; // Blue for today
          className = 'event-today';
          console.log('  → Explicitly setting BLUE border (today event)');
        }
        // As a last resort, use the className from the event
        else if (event.className) {
          if (event.className === 'event-attending') {
            borderColor = '#4caf50'; // Green
            console.log('  → Using class-based GREEN border (attending)');
          } else if (event.className === 'event-maybe') {
            borderColor = '#ff9800'; // Orange
            console.log('  → Using class-based ORANGE border (maybe)');
          } else if (event.className === 'event-declined') {
            borderColor = '#f44336'; // Red
            console.log('  → Using class-based RED border (declined)');
          } else if (event.className === 'event-today') {
            borderColor = '#2196f3'; // Blue
            console.log('  → Using class-based BLUE border (today)');
          } else {
            console.log('  → Using class-based DEFAULT GRAY border');
          }
        } else {
          console.log('  → Fallback DEFAULT GRAY border');
        }
      }

      const result = {
        className: className, // Use our determined className
        style: {
          backgroundColor: 'transparent', // No background color
          border: 'none', // Remove border from container (custom component handles it)
          borderRadius: '4px',
          boxShadow: 'none',
          color: 'inherit',
          position: 'relative'
        }
      };

      console.log('  - Final className:', result.className);
      console.log('  - Final border color:', result.style.borderColor);
      return result;
    }}
    dayPropGetter={(date) => ({
      style: {
        backgroundColor: new Date().toDateString() === date.toDateString() 
          ? 'rgba(33, 150, 243, 0.05)' 
          : 'transparent',
        // Using inherited text color for day cells
        color: 'inherit' 
      }
    })}
    formats={{
      dateFormat: 'd',
      dayFormat: 'eee d/M',
      monthHeaderFormat: 'MMMM yyyy',
      dayHeaderFormat: 'eeee d MMMM',
      dayRangeHeaderFormat: ({ start, end }) => `${format(start, 'MMMM d')} - ${format(end, 'MMMM d, yyyy')}`
    }}
    popup
    selectable
    views={['month']}
    onShowMore={(events, date) => {
      // Handle custom popup for multiple events
      const target = document.querySelector(`[data-date="${date.toISOString().split('T')[0]}"]`);
      if (target) {
        setCalendarPopoverAnchor(target);
        setPopoverEvents(events);
      }
    }}
    popupOffset={{ x: 0, y: 20 }}
    components={{
      event: ({ event }) => {
        const [showTooltip, setShowTooltip] = React.useState(false);

        // The border color is stored in event.color (from the calendar event object)
        // event.style is not passed to custom components by react-big-calendar
        const borderColor = event.color || '#9e9e9e';
        console.log(`Custom event component for "${event.title}":`, {
          borderColor,
          eventColor: event.color,
          className: event.className
        });

        return (
          <Box
            sx={{
              width: '48px',
              height: '48px',
              borderRadius: '6px',
              border: `2px solid ${borderColor}`,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            title={event.title} // Fallback native tooltip
          >
            {/* Event cover image */}
            {event.coverImage && (
              <Box
                component="img"
                src={event.coverImage}
                alt=""
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
              />
            )}

            {/* Custom tooltip */}
            {showTooltip && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  mb: 1,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(50, 50, 50, 0.98)' : 'rgba(0, 0, 0, 0.92)',
                  color: 'white',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  zIndex: 10000,
                  pointerEvents: 'none',
                  minWidth: 'max-content',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: (theme) => `4px solid ${theme.palette.mode === 'dark' ? 'rgba(50, 50, 50, 0.98)' : 'rgba(0, 0, 0, 0.92)'}`
                  }
                }}
              >
                {event.title}
              </Box>
            )}
          </Box>
        );
      },
      dateCellWrapper: ({ children, value }) => (
        <div data-date={value.toISOString().split('T')[0]}>
          {children}
        </div>
      ),
    }}
  />
</Box>
          </Paper>
        </Box>
      </Box>
      
      {/* Mobile card grid - only shows on xs/sm breakpoints */}
      <Box sx={{ mt: 4, display: { md: 'none' } }}>
        <Typography variant="h6" gutterBottom>
          {t('eventsTab.upcomingEvents')}
        </Typography>
        <Grid container spacing={2}>
          {upcomingEvents
            .map(event => {
              // Find user participation for this event
              const participation = userParticipations.find(p => p.event_id === event.id);
              const eventDate = new Date(event.date);
              const isToday = new Date().toDateString() === eventDate.toDateString();
              const isTomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() === eventDate.toDateString();
              
              // Color to use for the date badge - converting to CSS classes for better rendering
              const dateBadgeClass = participation ? 
                (participation.status === 'attending' ? 'event-attending' : 
                 participation.status === 'maybe' ? 'event-maybe' : 
                 'event-declined') : 
                (isToday ? 'event-today' : 'event-default');
              
              // Also keep the color for backward compatibility
              const dateBadgeColor = participation ? 
                (participation.status === 'attending' ? '#4caf50' : 
                 participation.status === 'maybe' ? '#ff9800' : '#f44336') : 
                (isToday ? '#2196f3' : '#757575');
              
              return (
                <Grid item xs={12} sm={6} key={event.id}>
                  <Card sx={{ 
                    position: 'relative',
                    borderTop: participation ? 
                      `4px solid ${
                        participation.status === 'attending' ? '#4caf50' : 
                        participation.status === 'maybe' ? '#ff9800' : '#f44336'
                      }` : 'none',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}>
                    {/* Add cover image */}
                    {event.cover_image_url && (
                      <Box sx={{ 
                        height: 160, 
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
                        {/* Date badge overlay */}
                        <Box sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          zIndex: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}>
                          <Box 
                            className={`date-badge ${dateBadgeClass}`}
                            sx={{
                              backgroundColor: dateBadgeColor,
                              borderRadius: 1,
                              padding: '4px 8px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              color: 'white',
                              // Force the background color to load properly on initial render
                              position: 'relative',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                inset: 0,
                                borderRadius: 'inherit',
                                backgroundColor: 'inherit !important',
                                zIndex: -1
                              }
                            }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              {eventDate.toLocaleString(language, { month: 'short' })}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                              {eventDate.getDate()}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                              {isToday ? t('eventsTab.today') : isTomorrow ? t('eventsTab.tomorrow') : eventDate.toLocaleString(language, { weekday: 'short' })}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}
                    <CardContent sx={{ flexGrow: 1, pb: 0 }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 'medium', 
                        mb: 1, 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 0.5
                      }}>
                        {event.title}
                        {event.event_link && (
                          <LinkIcon fontSize="small" color="primary" />
                        )}
                      </Typography>
                      
                      {/* Display category if exists */}
                      {event.category && (
                        <Chip 
                          label={event.category.name}
                          size="small"
                          sx={{ 
                            bgcolor: event.category.color || '#666',
                            color: 'white',
                            fontSize: '0.7rem',
                            height: 20,
                            mb: 1
                          }}
                        />
                      )}
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <LocationOnIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {event.location}
                        </Typography>
                      </Box>
                      {event.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {event.description.length > 80 
                            ? `${event.description.substring(0, 80)}...` 
                            : event.description}
                        </Typography>
                      )}
                      
                      {/* Feature indicators */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {event.coordinates && event.coordinates.latitude && (
                          <Chip 
                            icon={<LocationOnIcon fontSize="small" />}
                            label={t('eventsTab.hasLocation')}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        {event.event_link && (
                          <Chip 
                            icon={<LinkIcon fontSize="small" />}
                            label={t('eventsTab.eventLink')}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </CardContent>
                    <Box sx={{ px: 2, pb: 2 }}>
                      {/* RSVP Component */}
                      {user && (
                        <Box sx={{ mb: 1.5 }}>
                          <EventParticipation 
                            event={event} 
                            size="small"
                            onStatusChange={(status) => handleParticipationChange(event.id, status)}
                          />
                        </Box>
                      )}
                      
                      {/* Action buttons */}
                      <Grid container spacing={1}>
                        <Grid item xs={event.event_link ? 6 : 12}>
                          <Button 
                            fullWidth
                            variant="outlined"
                            color="primary"
                            size="small"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowEventDialog(true);
                            }}
                          >
                            {t('eventsTab.details')}
                          </Button>
                        </Grid>
                        
                        {event.event_link && (
                          <Grid item xs={6}>
                            <Button 
                              fullWidth
                              variant="contained"
                              color="primary"
                              size="small"
                              startIcon={<LinkIcon />}
                              href={event.event_link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {t('eventsTab.join')}
                            </Button>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
        </Grid>
      </Box>

      {/* Event Details Dialog */}
      <EventDetailsDialog
        open={showEventDialog}
        onClose={closeEventDialog}
        event={selectedEvent}
        user={user}
        onParticipationChange={handleParticipationChange}
        showParticipants={true}
      />
      
      {/* Create Event Dialog for members */}
      <CreateEventDialog
        open={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          setError(null);
        }}
        networkId={network?.id}
        profileId={activeProfile?.id || user?.id}
        isAdmin={isUserAdmin}
        onEventCreated={(newEvent) => {
          // Add the new event to the list if setEvents is provided
          if (setEvents) {
            setEvents(prevEvents => [...prevEvents, newEvent]);
          }
          setMessage(isUserAdmin ? t('eventsTab.eventCreatedSuccessfully') : t('eventsTab.eventProposalSubmitted'));
          setShowCreateDialog(false);
        }}
      />
      
      {/* Custom Modal for showing multiple events - centered on screen */}
      <Dialog
        open={Boolean(calendarPopoverAnchor)}
        onClose={() => {
          setCalendarPopoverAnchor(null);
          setPopoverEvents([]);
        }}
        PaperProps={{
          sx: {
            maxHeight: '80vh',
            width: '90%',
            maxWidth: 500,
            overflow: 'hidden',
            boxShadow: '0 12px 48px rgba(0,0,0,0.16)',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }
        }}
      >
        {/* Header with gradient background */}
        <Box sx={{ 
          p: 2.5, 
          pb: 2,
          background: (theme) => theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
            : 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.05) 100%)',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            {popoverEvents.length > 0 && formatDate(popoverEvents[0].start, { weekday: 'long', month: 'long', day: 'numeric' })}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon fontSize="small" color="primary" />
            <Typography variant="body2" color="text.secondary">
              {t('eventsTab.eventsCount', { count: popoverEvents.length })}
            </Typography>
          </Box>
        </Box>
        
        {/* Events list with custom scrollbar */}
        <Box sx={{ 
          maxHeight: 380,
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'action.hover',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'action.selected',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'action.disabled',
            }
          }
        }}>
          <List sx={{ pt: 0, pb: 0 }}>
            {popoverEvents.map((event, index) => {
              const participation = userParticipations.find(p => p.event_id === event.resource?.id);
              const eventTime = new Date(event.resource?.date || event.start);
              const hasImage = event.resource?.cover_image_url || event.coverImage;
              
              return (
                <ListItem
                  key={event.resource?.id || Math.random()}
                  disablePadding
                  sx={{
                    borderBottom: index < popoverEvents.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <ListItemButton
                    onClick={() => {
                      if (event.resource) {
                        setSelectedEvent(event.resource);
                        setShowEventDialog(true);
                        setCalendarPopoverAnchor(null);
                        setPopoverEvents([]);
                      }
                    }}
                    sx={{
                      py: 2,
                      px: 2.5,
                      display: 'flex',
                      gap: 2,
                      alignItems: 'flex-start',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        transform: 'translateX(4px)',
                      }
                    }}
                  >
                    {/* Event image */}
                    {hasImage && (
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          flexShrink: 0,
                          borderRadius: 1.5,
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          position: 'relative',
                          bgcolor: 'action.hover'
                        }}
                      >
                        <img
                          src={event.resource?.cover_image_url || event.coverImage}
                          alt={event.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        {/* Participation indicator overlay */}
                        {participation && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 4,
                              right: 4,
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              bgcolor: participation.status === 'attending' ? '#4caf50' : 
                                       participation.status === 'maybe' ? '#ff9800' : '#f44336',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                          >
                            <Typography variant="caption" sx={{ color: 'white', fontSize: '0.6rem', fontWeight: 'bold' }}>
                              {participation.status === 'attending' ? '✓' : 
                               participation.status === 'maybe' ? '?' : '✗'}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                    
                    {/* Event details */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {/* Title and time */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, pr: 1 }}>
                          {event.title}
                        </Typography>
                        <Chip
                          label={eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            bgcolor: 'action.selected',
                            color: 'text.primary'
                          }}
                        />
                      </Box>
                      
                      {/* Location */}
                      {event.resource?.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
                          <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {event.resource.location}
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Category and features */}
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {event.resource?.category && (
                          <Chip 
                            label={event.resource.category.name}
                            size="small"
                            sx={{ 
                              bgcolor: event.resource.category.color || '#666',
                              color: 'white',
                              fontSize: '0.65rem',
                              height: 18,
                              fontWeight: 500
                            }}
                          />
                        )}
                        {event.hasLink && (
                          <Chip
                            icon={<LinkIcon sx={{ fontSize: 14 }} />}
                            label={t('eventsTab.online')}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              borderColor: 'primary.main',
                              color: 'primary.main',
                              '& .MuiChip-icon': {
                                color: 'primary.main',
                                ml: 0.5
                              }
                            }}
                          />
                        )}
                        {/* Participation status for non-image events */}
                        {!hasImage && participation && (
                          <Chip
                            label={
                              participation.status === 'attending' ? t('eventsTab.attending') : 
                              participation.status === 'maybe' ? t('eventsTab.maybe') : 
                              t('eventsTab.notAttending')
                            }
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 500,
                              bgcolor: participation.status === 'attending' ? '#4caf50' : 
                                       participation.status === 'maybe' ? '#ff9800' : '#f44336',
                              color: 'white'
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    
                    {/* Arrow indicator */}
                    <ArrowForwardIcon 
                      sx={{ 
                        fontSize: 20, 
                        color: 'action.active',
                        opacity: 0.5,
                        transition: 'all 0.2s ease',
                        '.MuiListItemButton-root:hover &': {
                          opacity: 1,
                          transform: 'translateX(2px)'
                        }
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Dialog>

      {/* Ongoing Events Section */}
      {ongoingEvents.length > 0 && (
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            mt: 3,
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <TimelineIcon sx={{ mr: 1 }} color="primary" />
                {t('eventsTab.ongoingEvents')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('eventsTab.eventsInProgress')}
              </Typography>
            </Box>

            <Chip
              label={t('eventsTab.eventsCount', { count: ongoingEvents.length })}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>

          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
              {ongoingEvents
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((event) => {
                  const participation = userParticipations.find(p => p.event_id === event.id);
                  const eventDate = new Date(event.date);
                  const endDate = event.end_date ? new Date(event.end_date) : eventDate;

                  return (
                    <Card
                      key={event.id}
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: 'background.paper',
                        borderTop: '4px solid #ff9800',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                        }
                      }}
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEventDialog(true);
                      }}
                    >
                      {/* Cover image */}
                      {event.cover_image_url && (
                        <Box sx={{
                          height: 120,
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
                          {/* Overlay with "EN COURS" badge */}
                          <Box sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            bgcolor: '#ff9800',
                            color: 'white',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}>
                            {t('eventsTab.inProgress')}
                          </Box>
                        </Box>
                      )}

                      <CardContent sx={{ p: 2 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 'medium',
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {event.title}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <EventIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(event.date, { month: 'short', day: 'numeric' })}
                            {event.end_date && ` - ${formatDate(event.end_date, { month: 'short', day: 'numeric' })}`}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {event.location}
                          </Typography>
                        </Box>

                        {/* Participation indicator */}
                        {participation && (
                          <Chip
                            label={
                              participation.status === 'attending' ? t('eventsTab.attending') :
                              participation.status === 'maybe' ? t('eventsTab.maybe') :
                              t('eventsTab.notAttending')
                            }
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: participation.status === 'attending' ? 'rgba(76, 175, 80, 0.1)' :
                                       participation.status === 'maybe' ? 'rgba(255, 152, 0, 0.1)' :
                                       'rgba(244, 67, 54, 0.1)',
                              color: participation.status === 'attending' ? '#4caf50' :
                                     participation.status === 'maybe' ? '#ff9800' : '#f44336',
                              border: '1px solid',
                              borderColor: participation.status === 'attending' ? '#4caf50' :
                                          participation.status === 'maybe' ? '#ff9800' : '#f44336'
                            }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Upcoming Events Section (Full Grid) */}
      {upcomingEvents.length > 0 && (
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            mt: 3,
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <EventIcon sx={{ mr: 1 }} color="primary" />
                {t('eventsTab.upcomingEvents')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('eventsTab.eventsHappeningSoon')}
              </Typography>
            </Box>

            <Chip
              label={t('eventsTab.eventsCount', { count: upcomingEvents.length })}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>

          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
              {upcomingEvents
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((event) => {
                  const participation = userParticipations.find(p => p.event_id === event.id);
                  const eventDate = new Date(event.date);

                  return (
                    <Card
                      key={event.id}
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: 'background.paper',
                        borderTop: '4px solid #2196f3',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                        }
                      }}
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEventDialog(true);
                      }}
                    >
                      {/* Cover image */}
                      {event.cover_image_url && (
                        <Box sx={{
                          height: 120,
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
                          {/* Overlay with date */}
                          <Box sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            bgcolor: '#2196f3',
                            color: 'white',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            {formatDate(event.date, { month: 'short', day: 'numeric' })}
                          </Box>
                        </Box>
                      )}

                      <CardContent sx={{ p: 2 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 'medium',
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {event.title}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <EventIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(event.date, { month: 'short', day: 'numeric' })}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {event.location}
                          </Typography>
                        </Box>

                        {/* Participation indicator */}
                        {participation && (
                          <Chip
                            label={
                              participation.status === 'attending' ? t('eventsTab.attending') :
                              participation.status === 'maybe' ? t('eventsTab.maybe') :
                              t('eventsTab.notAttending')
                            }
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: participation.status === 'attending' ? 'rgba(76, 175, 80, 0.1)' :
                                       participation.status === 'maybe' ? 'rgba(255, 152, 0, 0.1)' :
                                       'rgba(244, 67, 54, 0.1)',
                              color: participation.status === 'attending' ? '#4caf50' :
                                     participation.status === 'maybe' ? '#ff9800' : '#f44336',
                              border: '1px solid',
                              borderColor: participation.status === 'attending' ? '#4caf50' :
                                          participation.status === 'maybe' ? '#ff9800' : '#f44336'
                            }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Past Events Navigation */}
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          mt: 3,
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <TimelineIcon sx={{ mr: 1 }} color="action" />
              {t('eventsTab.pastEvents')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('eventsTab.browseArchivedEvents')}
            </Typography>
          </Box>

          <Chip
            label={t('eventsTab.eventsCount', { count: pastEvents.length })}
            size="small"
            color="default"
            variant="outlined"
          />
        </Box>

        <Box sx={{ p: 2 }}>
          {pastEvents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                {t('eventsTab.noPastEvents')}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Past events grouped by month */}
              {(() => {
                const sortedPastEvents = pastEvents
                  .sort((a, b) => new Date(b.date) - new Date(a.date));

                // Group events by month
                const eventsByMonth = sortedPastEvents.reduce((groups, event) => {
                  const date = new Date(event.date);
                  const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
                  const monthLabel = date.toLocaleDateString(language, { month: 'long', year: 'numeric' });
                  
                  if (!groups[monthKey]) {
                    groups[monthKey] = {
                      label: monthLabel,
                      events: []
                    };
                  }
                  groups[monthKey].events.push(event);
                  return groups;
                }, {});
                
                return Object.values(eventsByMonth).map((monthGroup, groupIndex) => (
                  <Box key={groupIndex}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: 'text.secondary',
                        mb: 1,
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: 1
                      }}
                    >
                      {monthGroup.label}
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
                      {monthGroup.events.map((event) => {
                        const participation = userParticipations.find(p => p.event_id === event.id);
                        const eventDate = new Date(event.date);
                        
                        return (
                          <Card 
                            key={event.id}
                            sx={{ 
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              borderRadius: 2,
                              overflow: 'hidden',
                              bgcolor: 'background.paper',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                              }
                            }}
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowEventDialog(true);
                            }}
                          >
                            {/* Mini cover image */}
                            {event.cover_image_url && (
                              <Box sx={{ 
                                height: 120, 
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
                                {/* Overlay with date */}
                                <Box sx={{
                                  position: 'absolute',
                                  top: 8,
                                  left: 8,
                                  bgcolor: 'rgba(0,0,0,0.7)',
                                  color: 'white',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold'
                                }}>
                                  {formatDate(event.date, { month: 'short', day: 'numeric' })}
                                </Box>
                              </Box>
                            )}
                            
                            <CardContent sx={{ p: 2 }}>
                              <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                  fontWeight: 'medium',
                                  mb: 0.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {event.title}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary"
                                  sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {event.location}
                                </Typography>
                              </Box>
                              
                              {/* Participation indicator */}
                              {participation && (
                                <Chip
                                  label={
                                    participation.status === 'attending' ? t('eventsTab.attended') : 
                                    participation.status === 'maybe' ? t('eventsTab.maybeAttended') : 
                                    t('eventsTab.didNotAttend')
                                  }
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    bgcolor: participation.status === 'attending' ? 'rgba(76, 175, 80, 0.1)' : 
                                             participation.status === 'maybe' ? 'rgba(255, 152, 0, 0.1)' : 
                                             'rgba(244, 67, 54, 0.1)',
                                    color: participation.status === 'attending' ? '#4caf50' : 
                                           participation.status === 'maybe' ? '#ff9800' : '#f44336',
                                    border: '1px solid',
                                    borderColor: participation.status === 'attending' ? '#4caf50' : 
                                                participation.status === 'maybe' ? '#ff9800' : '#f44336'
                                  }}
                                />
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Box>
                  </Box>
                ));
              })()}
            </Box>
          )}
        </Box>
      </Paper>
      
      </Paper>
    </PageTransition>
  );
};

export default EventsTab;