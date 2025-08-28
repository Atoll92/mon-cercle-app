import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  Stack,
  Alert,
  Link as MuiLink,
  Chip,
} from '@mui/material';
import {
  Event as EventIcon,
  CalendarMonth as CalendarMonthIcon,
  LocationOn as LocationOnIcon,
  Groups as GroupsIcon,
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon,
  ArrowForward,
} from '@mui/icons-material';
import EventParticipation from './EventParticipation';
import LinkifiedText from './LinkifiedText';
import { formatEventDate } from '../utils/dateFormatting';

const EventDetailsDialog = ({ 
  open, 
  onClose, 
  event, 
  user,
  onParticipationChange,
  showParticipants = true 
}) => {
  if (!event) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EventIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" component="div">
            {event.title}
          </Typography>
          {event.event_link && (
            <LinkIcon fontSize="small" sx={{ ml: 1 }} />
          )}
        </Box>
        <Button 
          onClick={onClose}
          sx={{ color: 'primary.contrastText' }}
        >
          Close
        </Button>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0 }}>
        {event.cover_image_url && (
          <Box sx={{ 
            width: '100%', 
            height: 300,
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
        
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  borderRadius: 2,
                  height: '100%'
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary" 
                  gutterBottom
                >
                  Event Details
                </Typography>
                
                <Stack spacing={2} mt={1}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <CalendarMonthIcon fontSize="small" color="primary" />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Date & Time
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatEventDate(event.date, true)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {event.category && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="body2" fontWeight="medium">
                        Category:
                      </Typography>
                      <Chip 
                        label={event.category.name}
                        size="small"
                        sx={{ 
                          bgcolor: event.category.color || '#666',
                          color: 'white',
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <LocationOnIcon fontSize="small" color="primary" />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Location
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {event.location}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {event.capacity && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <GroupsIcon fontSize="small" color="primary" />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          Capacity
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {event.capacity} attendees
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  {event.event_link && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <LinkIcon fontSize="small" color="primary" />
                      <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" fontWeight="medium">
                          Event Link
                        </Typography>
                        <MuiLink
                          href={event.event_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: '0.875rem',
                            wordBreak: 'break-word'
                          }}
                        >
                          {event.event_link}
                          <OpenInNewIcon fontSize="inherit" sx={{ ml: 0.5 }} />
                        </MuiLink>
                      </Box>
                    </Box>
                  )}
                </Stack>
                
                {user && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Your RSVP
                    </Typography>
                    <EventParticipation 
                      event={event}
                      showParticipants={showParticipants}
                      onStatusChange={onParticipationChange ? 
                        (status) => onParticipationChange(event.id, status) : 
                        undefined
                      }
                    />
                  </Box>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={8}>
              {event.description ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    About this event
                  </Typography>
                  <LinkifiedText 
                    text={event.description}
                    component="p"
                    sx={{ 
                      fontSize: '1rem',
                      lineHeight: 1.5,
                      marginBottom: 2
                    }}
                  />
                </>
              ) : (
                <Alert severity="info" variant="outlined">
                  No description provided for this event.
                </Alert>
              )}
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {event.event_link && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<LinkIcon />}
              href={event.event_link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit Event Link
            </Button>
          )}
          {event.network_id && event.id && (
            <Button
              component={Link}
              to={`/network/${event.network_id}/event/${event.id}`}
              variant="contained"
              color="primary"
              endIcon={<ArrowForward />}
            >
              View Event Page
            </Button>
          )}
        </Box>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventDetailsDialog;