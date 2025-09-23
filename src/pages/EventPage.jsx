import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import MemberDetailsModal from '../components/MembersDetailModal';
import Spinner from '../components/Spinner';
import CommentSection from '../components/CommentSection';
import UserContent from '../components/UserContent';
import CreateEventDialog from '../components/CreateEventDialog';
import { linkifyHtml } from '../utils/textFormatting';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
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
  ListItemButton,
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
import EventsMap from '../components/EventsMap';
import { formatEventDate } from '../utils/dateFormatting';

function EventPage() {
  const { networkId, eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [event, setEvent] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participation, setParticipation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [network, setNetwork] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Use refs to track last fetched IDs to prevent unnecessary re-fetches
  const lastFetchedEventId = useRef(null);
  const lastFetchedProfileId = useRef(null);
  const lastFetchedUserId = useRef(null);

  // Get stable IDs
  const profileId = activeProfile?.id || user?.id;
  const userId = user?.id;

  useEffect(() => {
    // Only fetch if eventId changed or we don't have data yet
    if (eventId && profileId && eventId !== lastFetchedEventId.current) {
      fetchEventData();
      fetchNetworkData();
      lastFetchedEventId.current = eventId;
    }
  }, [eventId, profileId, networkId]);

  useEffect(() => {
    // Only check admin status if profile or user actually changed
    if (profileId && userId && 
        (profileId !== lastFetchedProfileId.current || userId !== lastFetchedUserId.current)) {
      checkAdminStatus();
      lastFetchedProfileId.current = profileId;
      lastFetchedUserId.current = userId;
    }
  }, [profileId, userId, networkId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First check if user is admin
      let userIsAdmin = false;
      if (profileId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, network_id')
          .eq('id', profileId)
          .single();
        
        userIsAdmin = profile?.role === 'admin' && profile?.network_id === networkId;
      }

      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from('network_events')
        .select(`
          *,
          category:network_categories(
            id,
            name,
            color
          )
        `)
        .eq('id', eventId)
        .eq('network_id', networkId)
        .single();

      if (eventError) throw eventError;
      
      if (!eventData) {
        setError('Event not found');
        return;
      }

      // Check if user has permission to view non-approved events
      // Non-admins can only see approved events
      if (eventData.status !== 'approved' && !userIsAdmin) {
        // Check if the user is the creator
        if (eventData.created_by !== profileId) {
          setError('Event not found');
          return;
        }
      }

      setEvent(eventData);
      setIsAdmin(userIsAdmin);

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
        if (profileId) {
          const userParticipation = participantsData.find(p => p.profile_id === profileId);
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
    if (!userId || !profileId) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, network_id')
        .eq('id', profileId)
        .single();

      setIsAdmin(profile?.role === 'admin' && profile?.network_id === networkId);
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  };

  const fetchNetworkData = async () => {
    try {
      const { data: networkData, error } = await supabase
        .from('networks')
        .select('*')
        .eq('id', networkId)
        .single();

      if (!error && networkData) {
        setNetwork(networkData);
      }
    } catch (err) {
      console.error('Error fetching network:', err);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setShowMemberDetailsModal(true);
  };

  const handleEdit = () => {
    setShowEditDialog(true);
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
    if (!user || !profileId || updatingStatus) return;

    setUpdatingStatus(true);
    try {
      if (newStatus === null || participation === newStatus) {
        // Remove participation if clicking the same status or null
        const { error } = await supabase
          .from('event_participations')
          .delete()
          .eq('event_id', eventId)
          .eq('profile_id', profileId);

        if (error) throw error;
        setParticipation(null);
      } else {
        // First, check if participation exists
        const { data: existing } = await supabase
          .from('event_participations')
          .select('id')
          .eq('event_id', eventId)
          .eq('profile_id', profileId)
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
            .eq('profile_id', profileId);

          if (error) throw error;
        } else {
          // Insert new participation
          const { error } = await supabase
            .from('event_participations')
            .insert({
              event_id: eventId,
              profile_id: profileId,
              status: newStatus
            });

          if (error) throw error;
        }
        
        setParticipation(newStatus);
      }

      // Only refresh participants, not the entire event data
      const { data: participantsData } = await supabase
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

      if (participantsData) {
        setParticipants(participantsData);
      }
    } catch (err) {
      console.error('Error updating participation:', err);
      alert('Failed to update participation: ' + (err.message || 'Unknown error'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Memoize computed values to prevent unnecessary recalculations
  // Must be called before any returns to avoid hooks order issues
  const isOrganizer = useMemo(() => userId === event?.created_by, [userId, event?.created_by]);
  const canModerate = useMemo(() => isAdmin || isOrganizer, [isAdmin, isOrganizer]);
  const eventDate = useMemo(() => event?.date ? new Date(event.date) : null, [event?.date]);
  const eventEndDate = useMemo(() => event?.end_date ? new Date(event.end_date) : null, [event?.end_date]);
  const isPastEvent = useMemo(() => {
    const endDate = eventEndDate || eventDate;
    return endDate ? endDate < new Date() : false;
  }, [eventDate, eventEndDate]);
  const isMultiDay = useMemo(() => eventDate && eventEndDate && eventDate.toDateString() !== eventEndDate.toDateString(), [eventDate, eventEndDate]);
  const attendingCount = useMemo(() => participants.filter(p => p.status === 'attending').length, [participants]);
  const maybeCount = useMemo(() => participants.filter(p => p.status === 'maybe').length, [participants]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ 
        py: 4,
        display: 'flex', 
        justifyContent: 'center' 
      }}>
        <Spinner size={120} />
      </Container>
    );
  }

  if (error || !event) {
    return (
      <Container maxWidth="md" sx={{ 
        py: 4,
        mb: 4 
      }}>
        <Grid container spacing={3}>
          {/* Sidebar with Error and Navigation */}
          <Grid item xs={12} md={4} sx={{ width: '100%' }}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate(`/network/${networkId}`)}
                  sx={{ mb: 2 }}
                >
                  Back to Network
                </Button>
                <Alert severity="error">
                  {error || 'Event not found'}
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={8} sx={{ width: '100%' }}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h4" gutterBottom>
                Event Not Available
              </Typography>
              <Typography variant="body1" color="text.secondary">
                The event you're looking for is not available or may have been removed.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ 
      py: 4,
      mb: 4 
    }}>
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
            <UserContent 
              content={event.title}
              html={false}
              component="h1"
              sx={{
                fontSize: '3rem',
                fontWeight: 400,
                lineHeight: 1.167,
                letterSpacing: '0em',
                mb: 2
              }}
            />

            {/* Date and Time */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Chip
                icon={<CalendarIcon />}
                label={isMultiDay 
                  ? `${formatEventDate(event.date, true)} - ${formatEventDate(event.end_date, true)}`
                  : formatEventDate(event.date, true)
                }
                color={isPastEvent ? 'default' : 'primary'}
                sx={isMultiDay ? { maxWidth: '100%' } : {}}
              />
              {isMultiDay && (
                <Chip
                  icon={<ScheduleIcon />}
                  label={`${Math.ceil((eventEndDate - eventDate) / (1000 * 60 * 60 * 24))} days`}
                  size="small"
                  color="info"
                />
              )}
              {isPastEvent && (
                <Chip
                  label="Past Event"
                  color="default"
                  size="small"
                />
              )}
              {event.category && (
                <Chip 
                  label={event.category.name}
                  sx={{ 
                    bgcolor: event.category.color || '#666',
                    color: 'white'
                  }}
                />
              )}
            </Box>

            {/* Location */}
            {event.location && (
              <Box sx={{ mb: 3, width: '100%' }}>
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

            {/* Pricing - Only show if monetization is enabled */}
            {network?.features_config?.monetization && event.price > 0 && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Ticket Price
                </Typography>
                <Typography variant="h4" color="primary">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: event.currency || 'EUR'
                  }).format(event.price)}
                </Typography>
                {event.max_tickets && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {event.tickets_sold || 0} / {event.max_tickets} tickets sold
                  </Typography>
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
            <UserContent 
              content={event.description}
              html={false}
            />

            {/* Organizer */}
            {organizer && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  Organized by
                </Typography>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: 1,
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                  onClick={() => handleMemberClick(organizer)}
                >
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

            {/* Comments Section */}
            <Divider sx={{ my: 3 }} />
            <CommentSection
              itemType="event"
              itemId={eventId}
              onMemberClick={handleMemberClick}
              defaultExpanded={true}
            />
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
                    <ListItemButton 
                      key={participant.id} 
                      sx={{ 
                        px: 0,
                        borderRadius: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                      onClick={() => handleMemberClick(participant.profiles)}
                    >
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
                    </ListItemButton>
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

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailsModal
          open={showMemberDetailsModal}
          onClose={() => {
            setShowMemberDetailsModal(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
        />
      )}

      {/* Edit Event Dialog */}
      {event && (
        <CreateEventDialog
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          networkId={networkId}
          profileId={profileId}
          editingEvent={event}
          isAdmin={isAdmin}
          onEventUpdated={(updatedEvent) => {
            // Update the local event state with the updated data
            setEvent(updatedEvent);
            setShowEditDialog(false);
            // Refresh the event data to get any server-side updates
            fetchEventData();
          }}
        />
      )}
    </Container>
  );
}

export default EventPage;