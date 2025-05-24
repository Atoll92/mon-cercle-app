import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Grid,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  People as PeopleIcon,
  Link as LinkIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';
import { format } from 'date-fns';
import EventsMap from '../components/EventsMap';

function EventPage() {
  const { networkId, eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participation, setParticipation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchEventData();
    checkAdminStatus();
  }, [eventId, user]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from('network_events')
        .select('*')
        .eq('id', eventId)
        .eq('network_id', networkId)
        .single();

      if (eventError) throw eventError;
      
      if (!eventData) {
        setError('Event not found');
        return;
      }

      setEvent(eventData);

      // Fetch organizer details
      const { data: organizerData, error: organizerError } = await supabase
        .from('profiles')
        .select('id, full_name, profile_picture_url')
        .eq('id', eventData.created_by)
        .single();

      if (!organizerError && organizerData) {
        setOrganizer(organizerData);
      }

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('event_participations')
        .select(`
          *,
          profiles:profile_id (
            id,
            full_name,
            profile_picture_url
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (!participantsError && participantsData) {
        setParticipants(participantsData);
        
        // Check current user's participation
        if (user) {
          const userParticipation = participantsData.find(p => p.profile_id === user.id);
          setParticipation(userParticipation?.status || null);
        }
      }
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, network_id')
        .eq('id', user.id)
        .single();

      setIsAdmin(profile?.role === 'admin' && profile?.network_id === networkId);
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    // TODO: Navigate to edit page
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('network_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      navigate(`/network/${networkId}`, { replace: true });
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event');
    }
    handleMenuClose();
  };

  const handleParticipationChange = async (_, newStatus) => {
    if (!user || updatingStatus) return;

    setUpdatingStatus(true);
    try {
      if (newStatus === null || participation === newStatus) {
        // Remove participation if clicking the same status or null
        const { error } = await supabase
          .from('event_participations')
          .delete()
          .eq('event_id', eventId)
          .eq('profile_id', user.id);

        if (error) throw error;
        setParticipation(null);
      } else {
        // First, check if participation exists
        const { data: existing } = await supabase
          .from('event_participations')
          .select('id')
          .eq('event_id', eventId)
          .eq('profile_id', user.id)
          .single();

        if (existing) {
          // Update existing participation
          const { error } = await supabase
            .from('event_participations')
            .update({ 
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('event_id', eventId)
            .eq('profile_id', user.id);

          if (error) throw error;
        } else {
          // Insert new participation
          const { error } = await supabase
            .from('event_participations')
            .insert({
              event_id: eventId,
              profile_id: user.id,
              status: newStatus
            });

          if (error) throw error;
        }
        
        setParticipation(newStatus);
      }

      fetchEventData(); // Refresh participants
    } catch (err) {
      console.error('Error updating participation:', err);
      alert('Failed to update participation: ' + (err.message || 'Unknown error'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !event) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Event not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/network/${networkId}`)}
        >
          Back to Network
        </Button>
      </Container>
    );
  }

  const isOrganizer = user?.id === event.created_by;
  const canModerate = isAdmin || isOrganizer;
  const eventDate = new Date(event.date);
  const isPastEvent = eventDate < new Date();
  const attendingCount = participants.filter(p => p.status === 'attending').length;
  const maybeCount = participants.filter(p => p.status === 'maybe').length;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/network/${networkId}`)}
        >
          Back to Network
        </Button>
        
        {canModerate && (
          <>
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              {canModerate && (
                <MenuItem onClick={handleEdit}>
                  <EditIcon sx={{ mr: 1 }} fontSize="small" />
                  Edit
                </MenuItem>
              )}
              {canModerate && (
                <MenuItem onClick={handleDelete}>
                  <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
                  Delete
                </MenuItem>
              )}
            </Menu>
          </>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8} sx={{ width: '100%' }}>
          <Paper sx={{ p: 4 }}>
            {/* Cover Image */}
            {event.cover_image_url && (
              <Box sx={{ mb: 3, mx: -4, mt: -4 }}>
                <img
                  src={event.cover_image_url}
                  alt={event.title}
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'cover'
                  }}
                />
              </Box>
            )}

            {/* Title */}
            <Typography variant="h3" component="h1" gutterBottom>
              {event.title}
            </Typography>

            {/* Date and Time */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Chip
                icon={<CalendarIcon />}
                label={format(eventDate, 'EEEE, MMMM d, yyyy')}
                color={isPastEvent ? 'default' : 'primary'}
              />
              <Chip
                icon={<ScheduleIcon />}
                label={format(eventDate, 'h:mm a')}
              />
              {isPastEvent && (
                <Chip
                  label="Past Event"
                  color="default"
                  size="small"
                />
              )}
            </Box>

            {/* Location */}
            {event.location && (
              <Box sx={{ mb: 3 }}  sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <LocationIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body1">
                      {event.location}
                    </Typography>
                    {event.coordinates && (
                      <Button
                        size="small"
                        startIcon={<LocationIcon />}
                        href={`https://maps.google.com/?q=${event.coordinates.latitude},${event.coordinates.longitude}`}
                        target="_blank"
                        sx={{ mt: 0.5 }}
                      >
                        Open in Google Maps
                      </Button>
                    )}
                  </Box>
                </Box>
                
                {/* Map Preview */}
                {event.coordinates && event.coordinates.latitude && event.coordinates.longitude && (
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      height: 300, 
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2
                    }}
                  >
                    <EventsMap 
                      events={[event]} 
                      initialCoordinates={event.coordinates}
                      onEventSelect={() => {}}
                    />
                  </Paper>
                )}
              </Box>
            )}

            {/* Event Link */}
            {event.event_link && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, width: '100%' }}>
                <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Button
                  href={event.event_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Event Link
                </Button>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Description */}
            <Typography variant="h5" gutterBottom>
              About this Event
            </Typography>
            <Box 
              sx={{ 
                '& p': { mb: 2 },
                '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 3, mb: 1 },
                '& ul, & ol': { mb: 2 }
              }}
              dangerouslySetInnerHTML={{ __html: event.description }}
            />

            {/* Organizer */}
            {organizer && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  Organized by
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    src={organizer.profile_picture_url}
                    alt={organizer.full_name}
                    sx={{ width: 48, height: 48, mr: 2 }}
                  >
                    {organizer.full_name?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {organizer.full_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Event Organizer
                    </Typography>
                  </Box>
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}  sx={{ width: '100%' }} >
          {/* RSVP Card */}
          {user && !isPastEvent && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Will you attend?
                </Typography>
                <ToggleButtonGroup
                  value={participation}
                  exclusive
                  onChange={handleParticipationChange}
                  fullWidth
                  disabled={updatingStatus}
                >
                  <ToggleButton value="attending" color="success">
                    <CheckCircleIcon sx={{ mr: 1 }} />
                    Yes
                  </ToggleButton>
                  <ToggleButton value="maybe" color="warning">
                    <HelpIcon sx={{ mr: 1 }} />
                    Maybe
                  </ToggleButton>
                  <ToggleButton value="declined" color="error">
                    <CancelIcon sx={{ mr: 1 }} />
                    No
                  </ToggleButton>
                </ToggleButtonGroup>
              </CardContent>
            </Card>
          )}

          {/* Attendance Summary */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attendees
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography>
                    {attendingCount} Going
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <HelpIcon color="warning" sx={{ mr: 1 }} />
                  <Typography>
                    {maybeCount} Maybe
                  </Typography>
                </Box>
                {event.capacity && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography color="text.secondary">
                      Capacity: {event.capacity}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Participants List */}
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {participants
                  .filter(p => p.status === 'attending')
                  .map((participant) => (
                    <ListItem key={participant.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar
                          src={participant.profiles?.profile_picture_url}
                          alt={participant.profiles?.full_name}
                        >
                          {participant.profiles?.full_name?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={participant.profiles?.full_name}
                        secondary={
                          participant.profile_id === event.created_by ? 'Organizer' : 'Attending'
                        }
                      />
                    </ListItem>
                  ))}
              </List>
            </CardContent>
          </Card>

          {/* Location Map Card - in sidebar */}
          {event.coordinates && event.coordinates.latitude && event.coordinates.longitude && (
            <Card sx={{ mt: 3 }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2, pb: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    Location
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {event.location}
                  </Typography>
                </Box>
                <Box sx={{ height: 200, position: 'relative' }}>
                  <EventsMap 
                    events={[event]} 
                    initialCoordinates={event.coordinates}
                    onEventSelect={() => {}}
                  />
                </Box>
                <Box sx={{ p: 2, pt: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<LocationIcon />}
                    href={`https://maps.google.com/?q=${event.coordinates.latitude},${event.coordinates.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get Directions
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default EventPage;