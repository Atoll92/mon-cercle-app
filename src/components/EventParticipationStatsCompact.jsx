import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Tooltip } from '@mui/material';
import { CheckCircle as CheckCircleIcon, HelpOutline as MaybeIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { supabase } from '../supabaseclient';

const EventParticipationStatsCompact = ({ eventId, onStatsLoad }) => {
  const [stats, setStats] = useState({
    attending: 0,
    maybe: 0,
    declined: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('event_participations')
          .select('status')
          .eq('event_id', eventId);
          
        if (error) throw error;
        
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
          setStats(newStats);
          // Call the callback with attendance count if provided
          if (onStatsLoad) {
            onStatsLoad(eventId, newStats.attending);
          }
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (eventId) {
      fetchStats();
    }
  }, [eventId]);

  if (loading) {
    return <CircularProgress size={16} />;
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Tooltip title="Attending">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckCircleIcon fontSize="small" color="success" />
          <Typography variant="body2">{stats.attending}</Typography>
        </Box>
      </Tooltip>
      <Tooltip title="Maybe">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <MaybeIcon fontSize="small" color="warning" />
          <Typography variant="body2">{stats.maybe}</Typography>
        </Box>
      </Tooltip>
      <Tooltip title="Declined">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CancelIcon fontSize="small" color="error" />
          <Typography variant="body2">{stats.declined}</Typography>
        </Box>
      </Tooltip>
    </Box>
  );
};

export default EventParticipationStatsCompact;