// File: src/components/EventParticipationStats.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Chip,
  Avatar
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  HelpOutline as MaybeIcon,
  Cancel as CancelIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';

const EventParticipationStats = ({ eventId }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    attending: 0,
    maybe: 0,
    declined: 0,
    total: 0
  });

  useEffect(() => {
    const fetchParticipants = async () => {
      setLoading(true);
      try {
        // Fetch event participations with user profiles
        const { data, error } = await supabase
          .from('event_participations')
          .select(`
            status,
            profiles:profile_id (
              id,
              full_name,
              profile_picture_url,
              contact_email
            )
          `)
          .eq('event_id', eventId);
          
        if (error) throw error;
        
        // Calculate stats
        const newStats = {
          attending: 0,
          maybe: 0,
          declined: 0,
          total: data ? data.length : 0
        };
        
        if (data) {
          data.forEach(participant => {
            if (participant.status) {
              newStats[participant.status]++;
            }
          });
          
          setParticipants(data);
          setStats(newStats);
        }
      } catch (error) {
        console.error('Error fetching participants:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (eventId) {
      fetchParticipants();
    }
  }, [eventId]);

  if (loading) {
    return <CircularProgress size={20} />;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Participation Stats:
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip 
          icon={<CheckCircleIcon fontSize="small" />}
          label={`${stats.attending} attending`}
          color="success"
          size="small"
          variant="outlined"
        />
        <Chip 
          icon={<MaybeIcon fontSize="small" />}
          label={`${stats.maybe} maybe`}
          color="warning"
          size="small"
          variant="outlined"
        />
        <Chip 
          icon={<CancelIcon fontSize="small" />}
          label={`${stats.declined} declined`}
          color="error"
          size="small"
          variant="outlined"
        />
        <Chip 
          icon={<PeopleIcon fontSize="small" />}
          label={`${stats.total} responses`}
          size="small"
        />
      </Box>
      
      {stats.total > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Participants:
          </Typography>
          <Box sx={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: 1, p: 1 }}>
            {participants.map(participant => (
              <Box 
                key={participant.profiles.id} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1,
                  pb: 1,
                  borderBottom: '1px solid #f0f0f0',
                  '&:last-child': {
                    mb: 0,
                    pb: 0,
                    borderBottom: 'none'
                  }
                }}
              >
                <Avatar 
                  src={participant.profiles.profile_picture_url} 
                  sx={{ width: 30, height: 30, mr: 1 }}
                >
                  {participant.profiles.full_name ? participant.profiles.full_name.charAt(0).toUpperCase() : '?'}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {participant.profiles.full_name || 'Unnamed User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {participant.profiles.contact_email}
                  </Typography>
                </Box>
                <Chip 
                  size="small"
                  label={participant.status}
                  color={
                    participant.status === 'attending' ? 'success' :
                    participant.status === 'maybe' ? 'warning' : 'error'
                  }
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default EventParticipationStats;