// src/components/EventParticipation.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import {
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Tooltip,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HelpOutline as MaybeIcon,
  People as PeopleIcon
} from '@mui/icons-material';

const STATUS_COLORS = {
  attending: 'success',
  maybe: 'warning',
  declined: 'error'
};

const STATUS_ICONS = {
  attending: <CheckCircleIcon />,
  maybe: <MaybeIcon />,
  declined: <CancelIcon />
};

const STATUS_LABELS = {
  attending: 'Attending',
  maybe: 'Maybe',
  declined: 'Not Attending'
};

function EventParticipation({ event, showParticipants = false, onStatusChange = null, size = "medium" }) {
  const { user } = useAuth();
  const [participationStatus, setParticipationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [showParticipantsDialog, setShowParticipantsDialog] = useState(false);
  const [participantCounts, setParticipantCounts] = useState({
    attending: 0,
    maybe: 0,
    declined: 0,
    total: 0
  });

  // Fetch current user's participation status and participants count
  useEffect(() => {
    const fetchParticipationData = async () => {
      setIsLoading(true);
      
      if (user) {
        // Get current user's participation status
        const { data: userParticipation, error: participationError } = await supabase
          .from('event_participations')
          .select('status')
          .eq('event_id', event.id)
          .eq('profile_id', user.id)
          .maybeSingle();
          
        if (!participationError && userParticipation) {
          setParticipationStatus(userParticipation.status);
        }
      }
      
      // Get all participations for this event to count them manually
      const { data: allParticipations, error: countError } = await supabase
        .from('event_participations')
        .select('status')
        .eq('event_id', event.id);
      
      if (!countError && allParticipations) {
        // Calculate counts manually
        const counts = {
          attending: 0,
          maybe: 0,
          declined: 0,
          total: allParticipations.length
        };
        
        allParticipations.forEach(p => {
          if (p.status in counts) {
            counts[p.status]++;
          }
        });
        
        setParticipantCounts(counts);
      }
      
      setIsLoading(false);
    };
    
    fetchParticipationData();
  }, [event.id, user]);

  // Update participation status
  const updateStatus = async (newStatus) => {
    if (!user) return;
    
    setIsUpdating(true);
    
    try {
      // If the new status is the same as current status, toggle it off (delete the record)
      if (newStatus === participationStatus) {
        const { error } = await supabase
          .from('event_participations')
          .delete()
          .eq('event_id', event.id)
          .eq('profile_id', user.id);
          
        if (!error) {
          setParticipationStatus(null);
          
          // Update counts
          setParticipantCounts({
            ...participantCounts,
            [newStatus]: Math.max(0, participantCounts[newStatus] - 1),
            total: Math.max(0, participantCounts.total - 1)
          });
          
          if (onStatusChange) onStatusChange(null);
        }
      } else {
        // If there was a previous status, decrement that count
        const previousStatus = participationStatus;
        
        // Insert or update the participation record
        const { error } = await supabase
          .from('event_participations')
          .upsert({
            event_id: event.id,
            profile_id: user.id,
            status: newStatus,
            updated_at: new Date().toISOString()
          });
          
        if (!error) {
          setParticipationStatus(newStatus);
          
          // Update counts
          const newCounts = { ...participantCounts };
          if (previousStatus) {
            newCounts[previousStatus] = Math.max(0, newCounts[previousStatus] - 1);
          } else {
            newCounts.total += 1;
          }
          newCounts[newStatus] = (newCounts[newStatus] || 0) + 1;
          setParticipantCounts(newCounts);
          
          if (onStatusChange) onStatusChange(newStatus);
        }
      }
    } catch (error) {
      console.error('Error updating participation status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Fetch participants when dialog opens
  const loadParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('event_participations')
        .select(`
          status,
          profiles:profile_id (
            id,
            full_name,
            profile_picture_url
          )
        `)
        .eq('event_id', event.id);
        
      if (!error && data) {
        setParticipants(data);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const handleOpenParticipantsDialog = async () => {
    await loadParticipants();
    setShowParticipantsDialog(true);
  };

  // Render participants list by status
  const renderParticipantsList = (status) => {
    const filteredParticipants = participants.filter(p => p.status === status);
    
    if (filteredParticipants.length === 0) {
      return (
        <ListItem>
          <ListItemText 
            secondary={`No users ${status === 'attending' ? 'attending' : 
              status === 'maybe' ? 'tentative' : 'declined'} yet`} 
          />
        </ListItem>
      );
    }
    
    return filteredParticipants.map(participant => (
      <ListItem key={participant.profiles.id}>
        <ListItemAvatar>
          <Avatar src={participant.profiles.profile_picture_url}>
            {participant.profiles.full_name ? participant.profiles.full_name.charAt(0).toUpperCase() : '?'}
          </Avatar>
        </ListItemAvatar>
        <ListItemText 
          primary={participant.profiles.full_name || 'Unnamed User'} 
        />
      </ListItem>
    ));
  };

  // Loading state
  if (isLoading) {
    return <CircularProgress size={24} />;
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* RSVP Buttons */}
        <ButtonGroup size={size} variant="outlined" disabled={isUpdating}>
          <Tooltip title="I'm attending">
            <Button 
              color={participationStatus === 'attending' ? 'success' : 'inherit'}
              variant={participationStatus === 'attending' ? 'contained' : 'outlined'}
              onClick={() => updateStatus('attending')}
              startIcon={<CheckCircleIcon />}
            >
              {size === "small" ? '' : 'Attending'}
            </Button>
          </Tooltip>
          
          <Tooltip title="I might attend">
            <Button 
              color={participationStatus === 'maybe' ? 'warning' : 'inherit'}
              variant={participationStatus === 'maybe' ? 'contained' : 'outlined'}
              onClick={() => updateStatus('maybe')}
              startIcon={<MaybeIcon />}
            >
              {size === "small" ? '' : 'Maybe'}
            </Button>
          </Tooltip>
          
          <Tooltip title="I can't attend">
            <Button 
              color={participationStatus === 'declined' ? 'error' : 'inherit'}
              variant={participationStatus === 'declined' ? 'contained' : 'outlined'}
              onClick={() => updateStatus('declined')}
              startIcon={<CancelIcon />}
            >
              {size === "small" ? '' : 'Decline'}
            </Button>
          </Tooltip>
        </ButtonGroup>
        
        {/* Participant stats and list button */}
        {showParticipants && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <Chip 
              size="small"
              icon={<CheckCircleIcon fontSize="small" />}
              label={`${participantCounts.attending} attending`}
              color="success"
              variant="outlined"
            />
            
            <Chip 
              size="small"
              icon={<MaybeIcon fontSize="small" />}
              label={`${participantCounts.maybe} maybe`}
              color="warning"
              variant="outlined"
            />
            
            <Chip 
              size="small"
              icon={<CancelIcon fontSize="small" />}
              label={`${participantCounts.declined} declined`}
              color="error"
              variant="outlined"
            />
            
            <Button 
              size="small"
              startIcon={<PeopleIcon />}
              onClick={handleOpenParticipantsDialog}
            >
              View All
            </Button>
          </div>
        )}
      </div>
      
      {/* Participants Dialog */}
      <Dialog 
        open={showParticipantsDialog} 
        onClose={() => setShowParticipantsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Event Participants
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" color="success.main" gutterBottom>
            Attending ({participants.filter(p => p.status === 'attending').length})
          </Typography>
          <List dense>
            {renderParticipantsList('attending')}
          </List>
          
          <Typography variant="h6" color="warning.main" gutterBottom>
            Maybe ({participants.filter(p => p.status === 'maybe').length})
          </Typography>
          <List dense>
            {renderParticipantsList('maybe')}
          </List>
          
          <Typography variant="h6" color="error.main" gutterBottom>
            Declined ({participants.filter(p => p.status === 'declined').length})
          </Typography>
          <List dense>
            {renderParticipantsList('declined')}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowParticipantsDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default EventParticipation;