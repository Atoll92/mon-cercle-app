import React, { useState, useMemo, useEffect } from 'react';
import Spinner from '../Spinner';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  TableSortLabel,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  LocationOn as LocationOnIcon,
  People as PeopleIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import AddressSuggestions from '../AddressSuggestions';
import EventParticipationStatsCompact from '../EventParticipationStatsCompact';
import EventDetailsDialog from '../EventDetailsDialog';
import CreateEventDialog from '../CreateEventDialog';
import { deleteEvent, exportEventParticipantsList } from '../../api/networks';
import { fetchNetworkCategories } from '../../api/categories';
import { formatEventDate } from '../../utils/dateFormatting';

const EventsTab = ({ events, setEvents, user, activeProfile, networkId, network, darkMode = false }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('desc');
  const [participationStats, setParticipationStats] = useState({});
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await fetchNetworkCategories(networkId, true); // Only active categories
      if (data && !error) {
        setCategories(data);
      }
    };
    loadCategories();
  }, [networkId]);

  const formatEventDateTime = (dateString) => {
    const date = new Date(dateString);
    const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    return `${date.toLocaleDateString(undefined, dateOptions)} ${date.toLocaleTimeString(undefined, timeOptions)}`;
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleParticipationStatsLoad = (eventId, attendingCount) => {
    setParticipationStats(prev => ({
      ...prev,
      [eventId]: attendingCount
    }));
  };

  const handleViewEvent = (event) => {
    setViewingEvent(event);
    setViewDialogOpen(true);
  };

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      let aValue, bValue;
      
      switch (orderBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'participation':
          // Sort by number of confirmed attendees
          aValue = participationStats[a.id] || 0;
          bValue = participationStats[b.id] || 0;
          break;
        default:
          return 0;
      }
      
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [events, order, orderBy, participationStats]);

  const handleOpenDialog = (mode, event = null) => {
    setDialogMode(mode);
    setSelectedEvent(event);
    setOpenDialog(true);
  };


  const handleDelete = async (eventId) => {
    try {
      const result = await deleteEvent(eventId);
      
      if (result.success) {
        setEvents(events.filter(e => e.id !== eventId));
        setMessage(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(`Failed to delete event: ${err.message}`);
    }
  };

  const handleExportParticipants = async (eventId) => {
    try {
      const result = await exportEventParticipantsList(eventId);
      
      if (result.success) {
        // Create downloadable link
        const blob = new Blob([result.csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `participants-${result.eventTitle.replace(/\s+/g, '-')}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setMessage('Participants list exported successfully!');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(`Failed to export participants: ${err.message}`);
    }
  };

  return (
    <>
      {message && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {error && !openDialog && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Network Events</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          New Event
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mt: 2, overflowX: 'auto' }}>
        <Table size="small" aria-label="events table" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ width: 60 }}>Image</TableCell>
              <TableCell sx={{ width: '25%', minWidth: 150 }}>
                <TableSortLabel
                  active={orderBy === 'title'}
                  direction={orderBy === 'title' ? order : 'asc'}
                  onClick={() => handleRequestSort('title')}
                >
                  Title
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: 140 }}>
                <TableSortLabel
                  active={orderBy === 'date'}
                  direction={orderBy === 'date' ? order : 'asc'}
                  onClick={() => handleRequestSort('date')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: '20%', minWidth: 120 }}>Location</TableCell>
              <TableCell sx={{ width: 120 }}>Category</TableCell>
              <TableCell align="center" sx={{ width: 140 }}>
                <TableSortLabel
                  active={orderBy === 'participation'}
                  direction={orderBy === 'participation' ? order : 'asc'}
                  onClick={() => handleRequestSort('participation')}
                >
                  Participation
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sx={{ width: 100 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedEvents.map((event) => (
              <TableRow
                key={event.id}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' 
                  },
                  height: 60 
                }}
              >
                <TableCell padding="checkbox">
                  {event.cover_image_url ? (
                    <Avatar
                      variant="rounded"
                      src={event.cover_image_url}
                      sx={{ width: 40, height: 40 }}
                    >
                      <ImageIcon />
                    </Avatar>
                  ) : (
                    <Avatar
                      variant="rounded"
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        bgcolor: darkMode ? 'grey.800' : 'grey.200' 
                      }}
                    >
                      <ImageIcon color="action" />
                    </Avatar>
                  )}
                </TableCell>
                <TableCell sx={{ maxWidth: 0, overflow: 'hidden' }}>
                  <Box>
                    <Typography variant="body2" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {event.title}
                    </Typography>
                    {event.description && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        noWrap 
                        sx={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          display: 'block'
                        }}
                      >
                        {event.description}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {formatEventDateTime(event.date)}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 0, overflow: 'hidden' }}>
                  <Box>
                    <Typography variant="body2" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {event.location}
                    </Typography>
                    {event.capacity && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        Capacity: {event.capacity}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  {event.category && (
                    <Chip 
                      label={event.category.name}
                      size="small"
                      sx={{ 
                        bgcolor: event.category.color || '#666',
                        color: 'white',
                        fontSize: '0.75rem'
                      }}
                    />
                  )}
                </TableCell>
                <TableCell align="center">
                  <EventParticipationStatsCompact 
                    eventId={event.id} 
                    onStatsLoad={handleParticipationStatsLoad}
                  />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    <Tooltip title="View event">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewEvent(event)}
                        sx={{ padding: 0.5 }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit event">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog('edit', event)}
                        sx={{ padding: 0.5 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete event">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(event.id)}
                        sx={{ padding: 0.5 }}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateEventDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setError(null);
        }}
        networkId={networkId}
        profileId={activeProfile?.id || user.id}
        editingEvent={dialogMode === 'edit' ? selectedEvent : null}
        onEventCreated={(newEvent) => {
          setEvents([...events, newEvent]);
          setMessage('Event created successfully!');
          setOpenDialog(false);
        }}
        onEventUpdated={(updatedEvent) => {
          setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e));
          setMessage('Event updated successfully!');
          setOpenDialog(false);
        }}
      />

      <EventDetailsDialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        event={viewingEvent}
        user={user}
        showParticipants={true}
      />
    </>
  );
};

export default EventsTab;