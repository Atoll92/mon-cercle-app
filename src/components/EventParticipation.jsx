// src/components/EventParticipation.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { supabase } from '../supabaseclient';
import MemberDetailsModal from './MembersDetailModal';
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
  CircularProgress,
  ListItemButton
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
  const { activeProfile } = useProfile();
  const [participationStatus, setParticipationStatus] = useState(null);
  const [participationId, setParticipationId] = useState(null); // Store the participation record ID
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
  const [error, setError] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);

  // Fetch current user's participation status and participants count
  useEffect(() => {
    const fetchParticipationData = async () => {
      setIsLoading(true);
      setError(null);
      
      if (user && activeProfile) {
        // Get current user's participation status
        const { data: userParticipation, error: participationError } = await supabase
          .from('event_participations')
          .select('id, status')
          .eq('event_id', event.id)
          .eq('profile_id', activeProfile.id)
          .maybeSingle();
          
        if (participationError) {
          console.error('Error fetching user participation:', participationError);
          setError('Error fetching participation status');
        } else if (userParticipation) {
          setParticipationStatus(userParticipation.status);
          setParticipationId(userParticipation.id); // Save the ID for updates
        }
      }
      
      // Get all participations for this event to count them manually
      const { data: allParticipations, error: countError } = await supabase
        .from('event_participations')
        .select('status')
        .eq('event_id', event.id);
      
      if (countError) {
        console.error('Error fetching participation counts:', countError);
      } else if (allParticipations) {
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
    
    if (event?.id) {
      fetchParticipationData();
    }
  }, [event?.id, user, activeProfile]);

  // Update participation status
  const updateStatus = async (newStatus) => {
    if (!user || !event?.id) return;
    
    if (!activeProfile) {
      console.error('No active profile selected');
      setError('No active profile selected. Please refresh the page.');
      return;
    }
    
    setIsUpdating(true);
    setError(null);
    
    try {
      // If the new status is the same as current status, toggle it off (delete the record)
      if (newStatus === participationStatus) {
        // We need the ID to delete it correctly
        if (participationId) {
          const { error } = await supabase
            .from('event_participations')
            .delete()
            .eq('id', participationId);
            
          if (error) {
            throw error;
          }
          
          setParticipationStatus(null);
          setParticipationId(null);
          
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
        
        let result;
        
        if (participationId) {
          // Update existing record
          result = await supabase
            .from('event_participations')
            .update({ 
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', participationId);
        } else {
          // Insert new record
          result = await supabase
            .from('event_participations')
            .insert({
              event_id: event.id,
              profile_id: activeProfile.id,
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .select();
        }
        
        if (result.error) {
          throw result.error;
        }
        
        // If we did an insert and got back an ID, save it
        if (!participationId && result.data && result.data[0]?.id) {
          setParticipationId(result.data[0].id);
        }
        
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
    } catch (error) {
      console.error('Error updating participation status:', error);
      setError('Failed to update RSVP status');
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
        
      if (error) {
        console.error('Error loading participants:', error);
        return;
      }
      
      if (data) {
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

  const handleMemberClick = (participant) => {
    setSelectedMember(participant.profiles);
    setShowMemberDetailsModal(true);
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
      <ListItemButton 
        key={participant.profiles.id}
        onClick={() => handleMemberClick(participant)}
        sx={{ 
          borderRadius: 1,
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
      >
        <ListItemAvatar>
          <Avatar src={participant.profiles.profile_picture_url}>
            {participant.profiles.full_name ? participant.profiles.full_name.charAt(0).toUpperCase() : '?'}
          </Avatar>
        </ListItemAvatar>
        <ListItemText 
          primary={participant.profiles.full_name || 'Unnamed User'} 
        />
      </ListItemButton>
    ));
  };

  // Loading state
  if (isLoading) {
    return <CircularProgress size={24} />;
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Error message if any */}
        {error && (
          <Typography color="error" variant="caption" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}
        
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

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailsModal
          open={showMemberDetailsModal}
          onClose={() => {
            setShowMemberDetailsModal(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          isCurrentUser={activeProfile?.id === selectedMember.id}
        />
      )}
    </>
  );
}

export default EventParticipation;