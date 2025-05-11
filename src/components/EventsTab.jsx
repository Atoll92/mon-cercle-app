import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  ArrowForward as ArrowForwardIcon,
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import TimelineIcon from '@mui/icons-material/Timeline';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import EventParticipation from './EventParticipation';
import EventsMap from './EventsMap';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const EventsTab = ({ 
  events = [], 
  user,
  isUserAdmin,
  userParticipations = [],
  onParticipationChange
}) => {
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');

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

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Events
        </Typography>
        
        {isUserAdmin && (
          <Button
            component={Link}
            to="/admin"
            startIcon={<EventIcon />}
            color="primary"
            variant="contained"
          >
            Manage Events
          </Button>
        )}
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
            <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOnIcon sx={{ mr: 1 }} color="primary" />
                Events Map
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Geographic view of upcoming events
              </Typography>
            </Box>
            <EventsMap 
              events={events} 
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
              bgcolor: 'background.default', 
              borderBottom: '1px solid', 
              borderColor: 'divider',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <EventIcon sx={{ mr: 1 }} color="primary" />
                  Upcoming Events
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Events happening soon
                </Typography>
              </Box>
              
              <Chip label={`${events.filter(event => new Date(event.date) > new Date()).length} events`} 
                size="small" color="primary" variant="outlined" />
            </Box>
            
            <Box sx={{ flex: '1 1 auto', overflowY: 'auto', maxHeight: '380px' }}>
              {events.filter(event => new Date(event.date) > new Date()).length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No upcoming events scheduled
                  </Typography>
                  {isUserAdmin && (
                    <Button
                      variant="contained"
                      color="primary"
                      component={Link}
                      to="/admin"
                      startIcon={<EventIcon />}
                      sx={{ mt: 2 }}
                    >
                      Create Event
                    </Button>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
                  {events
                    .filter(event => new Date(event.date) > new Date())
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((event, index) => {
                      // Find user participation for this event
                      const participation = userParticipations.find(p => p.event_id === event.id);
                      const eventDate = new Date(event.date);
                      const isToday = new Date().toDateString() === eventDate.toDateString();
                      const isTomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() === eventDate.toDateString();
                      
                      let dateLabel = eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                      if (isToday) dateLabel = 'Today';
                      if (isTomorrow) dateLabel = 'Tomorrow';
                      
                      // Color to use for the date badge
                      const dateBadgeColor = participation ? 
                        (participation.status === 'attending' ? '#4caf50' : 
                         participation.status === 'maybe' ? '#ff9800' : '#f44336') : 
                        (isToday ? '#2196f3' : '#757575');
                      
                      return (
                        <Box 
                          key={event.id}
                          className="parent-event-row" 
                          sx={{ 
                            display: 'flex',
                            borderBottom: index < events.filter(e => new Date(e.date) > new Date()).length - 1 ? '1px solid' : 'none',
                            borderColor: 'divider',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            bgcolor: isToday ? 'rgba(33, 150, 243, 0.05)' : 'transparent',
                            overflow: 'hidden', // Prevent content from spilling out
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.02)',
                            }
                          }}
                        >
                          {/* Event details */}
                          <Box sx={{ 
                            display: 'flex', 
                            flex: '1 1 auto',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            {/* Event image with overlaid date badge - with animation on hover */}
                            <Box sx={{ 
                              width: '50%', // 50% of the column width as requested
                              position: 'relative',
                              overflow: 'hidden',
                              transition: 'all 0.3s ease',
                              flexShrink: 0, // Prevent shrinking by default
                              '.parent-event-row:hover &': {
                                width: '30%', // Shrink to 30% on hover
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
                                <Box sx={{
                                  width: '45px',
                                  height: '45px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: dateBadgeColor,
                                  color: 'white',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                }}>
                                  <Typography variant="caption" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                                    {eventDate.toLocaleString('default', { month: 'short' })}
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
                                  {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : eventDate.toLocaleString('default', { weekday: 'short' })}
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
                              width: '50%', // Start at 50%
                              '.parent-event-row:hover &': {
                                width: '70%', // Expand to 70% on hover
                              },
                              overflow: 'hidden'
                            }}>
                              <Typography variant="subtitle1" sx={{ 
                                fontWeight: 'medium', 
                                mb: 0.5, 
                                display: 'flex', 
                                alignItems: 'center'
                              }}>
                                {event.title}
                                {/* Add link icon if event has a link */}
                                {event.event_link && (
                                  <LinkIcon 
                                    fontSize="small" 
                                    sx={{ 
                                      ml: 0.5, 
                                      color: 'primary.main'
                                    }}
                                  />
                                )}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <LocationOnIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {event.location}
                                </Typography>
                              </Box>
                              
                              {/* Interactive buttons */}
                              <Box sx={{ 
                                display: 'flex', 
                                mt: 'auto', 
                                pt: 1,
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 1
                              }}>
                                {/* RSVP buttons */}
                                {user && (
                                  <EventParticipation 
                                    event={event} 
                                    size="small"
                                    compact={true}
                                    onStatusChange={(status) => onParticipationChange(event.id, status)}
                                  />
                                )}
                                
                                <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                                  {/* Event link button if available
                                  {event.event_link && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                      startIcon={<LinkIcon fontSize="small" />}
                                      href={event.event_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Join
                                    </Button>
                                  )} */}
                                  
                                  <Button 
                                    size="small" 
                                    variant={event.event_link ? "text" : "outlined"}
                                    color="primary"
                                    endIcon={<ArrowForwardIcon fontSize="small" />}
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setShowEventDialog(true);
                                    }}
                                  >
                                    Details
                                  </Button>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
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
              bgcolor: 'background.default', 
              borderBottom: '1px solid', 
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <TimelineIcon sx={{ mr: 1 }} color="primary" />
                  Calendar View
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monthly overview of all events
                </Typography>
              </Box>
              
              {/* Calendar view toggles */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant={calendarView === 'month' ? 'contained' : 'outlined'} 
                  size="small"
                  color="primary"
                  onClick={() => setCalendarView('month')}
                >
                  Month
                </Button>
                <Button 
                  variant={calendarView === 'week' ? 'contained' : 'outlined'} 
                  size="small"
                  color="primary"
                  onClick={() => setCalendarView('week')}
                >
                  Week
                </Button>
                <Button 
                  variant={calendarView === 'day' ? 'contained' : 'outlined'}
                  size="small" 
                  color="primary"
                  onClick={() => setCalendarView('day')}
                >
                  Day
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ 
              p: 2, 
              flex: '1 1 auto', 
              display: 'flex', 
              flexDirection: 'column',
              width: '100%', // Explicitly set width for the container
              '& .rbc-calendar': {
                width: '100%' // Make sure the calendar takes full width
              },
              '& .rbc-header': {
                padding: '8px',
                fontWeight: 'bold',
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderBottom: '1px solid',
                borderColor: 'divider'
              },
              '& .rbc-month-view': {
                border: 'none',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                borderRadius: 1
              },
              '& .rbc-day-bg': {
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                }
              },
              '& .rbc-date-cell': {
                padding: '4px 8px',
                textAlign: 'center',
                fontSize: '0.85rem'
              },
              '& .rbc-today': {
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
              },
              '& .rbc-btn-group button': {
                borderRadius: '4px',
                padding: '4px 12px',
                textTransform: 'capitalize',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              },
              '& .rbc-toolbar': {
                marginBottom: '16px'
              },
              '& .rbc-toolbar-label': {
                fontWeight: 'bold',
                fontSize: '1.2rem'
              },
              '& .rbc-event': {
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                margin: '1px',
                padding: '2px 4px'
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
              '& .rbc-overlay': {
                backgroundColor: 'white',
                border: '1px solid #ddd',
                boxShadow: '0 5px 15px rgba(0,0,0,0.15)',
                borderRadius: 2,
                padding: 2
              },
              '& .rbc-off-range-bg': {
                backgroundColor: 'rgba(0, 0, 0, 0.03)'
              }
            }}>
              <Calendar
                localizer={localizer}
                events={events.map(event => {
                  // Find if user is participating in this event
                  const participation = userParticipations.find(p => p.event_id === event.id);
                  let eventColor = '#2196f3'; // Default blue
                  
                  // Color coding based on participation status
                  if (participation) {
                    if (participation.status === 'attending') eventColor = '#4caf50'; // Green
                    else if (participation.status === 'maybe') eventColor = '#ff9800'; // Orange
                    else if (participation.status === 'declined') eventColor = '#f44336'; // Red
                  }
                  
                  return {
                    title: event.title,
                    start: new Date(event.date),
                    end: new Date(event.date),
                    allDay: true,
                    resource: event,
                    color: eventColor,
                    coverImage: event.cover_image_url,
                    hasLink: !!event.event_link
                  };
                })}
                date={calendarDate}
                view={calendarView}
                onView={setCalendarView}
                onNavigate={setCalendarDate}
                startAccessor="start"
                endAccessor="end"
                style={{ 
                  flex: '1 1 auto', 
                  minHeight: '500px',
                  width: '100%' // Explicitly set width for the calendar
                }}
                onSelectEvent={handleEventSelect}
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor: event.color,
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    color: 'white'
                  }
                })}
                dayPropGetter={(date) => ({
                  style: {
                    backgroundColor: new Date().toDateString() === date.toDateString() 
                      ? 'rgba(33, 150, 243, 0.05)' 
                      : 'transparent'
                  }
                })}
                formats={{
                  dateFormat: 'd',
                  dayFormat: 'eee d/M',
                  monthHeaderFormat: 'MMMM yyyy',
                  dayHeaderFormat: 'eeee d MMMM',
                  dayRangeHeaderFormat: ({ start, end }) => `${format(start, 'MMMM d')} - ${format(end, 'MMMM d, yyyy')}`
                }}
                components={{
                  event: ({ event }) => (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%',
                        width: '100%',
                        overflow: 'hidden',
                        padding: '2px 4px'
                      }}
                    >
                      {event.coverImage && (
                        <Box
                          sx={{
                            width: '28px',
                            height: '28px',
                            marginRight: '4px',
                            flexShrink: 0,
                            borderRadius: '4px',
                            overflow: 'hidden',
                            border: '2px solid rgba(255,255,255,0.7)'
                          }}
                        >
                          <img
                            src={event.coverImage}
                            alt=""
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </Box>
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: 'medium',
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {event.title}
                        {event.hasLink && (
                          <LinkIcon fontSize="inherit" sx={{ ml: 0.5 }} />
                        )}
                      </Typography>
                    </Box>
                  ),
                }}
                popup
                selectable
                views={['month', 'week', 'day']}
              />
            </Box>
          </Paper>
        </Box>
      </Box>
      
      {/* Mobile card grid - only shows on xs/sm breakpoints */}
      <Box sx={{ mt: 4, display: { md: 'none' } }}>
        <Typography variant="h6" gutterBottom>
          Upcoming Events
        </Typography>
        <Grid container spacing={2}>
          {events
            .filter(event => new Date(event.date) > new Date())
            .map(event => {
              // Find user participation for this event
              const participation = userParticipations.find(p => p.event_id === event.id);
              const eventDate = new Date(event.date);
              const isToday = new Date().toDateString() === eventDate.toDateString();
              const isTomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() === eventDate.toDateString();
              
              // Color to use for the date badge
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
                          <Box sx={{
                            backgroundColor: dateBadgeColor,
                            borderRadius: 1,
                            padding: '4px 8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            color: 'white'
                          }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              {eventDate.toLocaleString('default', { month: 'short' })}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                              {eventDate.getDate()}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                              {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : eventDate.toLocaleString('default', { weekday: 'short' })}
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
                            label="Has location"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        {event.event_link && (
                          <Chip 
                            icon={<LinkIcon fontSize="small" />}
                            label="Event Link"
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
                            onStatusChange={(status) => onParticipationChange(event.id, status)}
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
                            Details
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
                              Join
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
      <Dialog
        open={showEventDialog}
        onClose={closeEventDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedEvent && (
          <>
            <DialogTitle>
              {selectedEvent.title}
              {selectedEvent.event_link && (
                <LinkIcon color="primary" fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
              )}
            </DialogTitle>
            <DialogContent dividers>
              {selectedEvent.cover_image_url && (
                <Box sx={{ 
                  width: '100%', 
                  height: 300, 
                  mb: 3,
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                  <img 
                    src={selectedEvent.cover_image_url} 
                    alt={selectedEvent.title}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }} 
                  />
                </Box>
              )}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Date:</strong> {new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Location:</strong> {selectedEvent.location}
                </Typography>
                {selectedEvent.capacity && (
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Capacity:</strong> {selectedEvent.capacity}
                  </Typography>
                )}
                
                {/* Add Event Link */}
                {selectedEvent.event_link && (
                  <Typography variant="subtitle1" gutterBottom sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    wordBreak: 'break-word'
                  }}>
                    <strong>Event Link:</strong>&nbsp;
                    <Link
                      href={selectedEvent.event_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: 'primary.main',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {selectedEvent.event_link}
                      <OpenInNewIcon fontSize="small" sx={{ ml: 0.5 }} />
                    </Link>
                  </Typography>
                )}
              </Box>
              
              {selectedEvent.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {selectedEvent.description}
                  </Typography>
                </Box>
              )}
              
              {user && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Your RSVP
                  </Typography>
                  <EventParticipation 
                    event={selectedEvent}
                    showParticipants={true}
                    onStatusChange={(status) => onParticipationChange(selectedEvent.id, status)}
                  />
                </Box>
              )}
            </DialogContent>
            
            <DialogActions>
              {selectedEvent.event_link && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<LinkIcon />}
                  href={selectedEvent.event_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ mr: 'auto' }}
                >
                  Visit Event Link
                </Button>
              )}
              <Button onClick={closeEventDialog}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
};

export default EventsTab;