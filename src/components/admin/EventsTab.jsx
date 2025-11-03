import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation.jsx';
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
  Chip,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  LocationOn as LocationOnIcon,
  People as PeopleIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Visibility as VisibilityIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import AddressSuggestions from '../AddressSuggestions';
import EventParticipationStatsCompact from '../EventParticipationStatsCompact';
import EventDetailsDialog from '../EventDetailsDialog';
import CreateEventDialog from '../CreateEventDialog';
import { deleteEvent, exportEventParticipantsList, approveEvent, rejectEvent } from '../../api/networks';
import { fetchNetworkCategories } from '../../api/categories';
import { formatEventDate } from '../../utils/dateFormatting';
import { supabase } from '../../supabaseclient';

const EventsTab = ({ events, setEvents, user, activeProfile, networkId, network, darkMode = false }) => {
  const { t } = useTranslation();
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingEventId, setRejectingEventId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [allowMemberPublishing, setAllowMemberPublishing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Load categories and network settings on mount
  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await fetchNetworkCategories(networkId, true); // Only active categories
      if (data && !error) {
        setCategories(data);
      }
    };

    const loadNetworkSettings = async () => {
      const { data, error } = await supabase
        .from('networks')
        .select('features_config')
        .eq('id', networkId)
        .single();

      if (data && !error) {
        setAllowMemberPublishing(data.features_config?.allow_member_event_publishing || false);
      }
    };

    loadCategories();
    loadNetworkSettings();
  }, [networkId]);

  const handleToggleMemberPublishing = async (event) => {
    const newValue = event.target.checked;
    setSavingSettings(true);

    try {
      // Fetch current features_config
      const { data: currentData, error: fetchError } = await supabase
        .from('networks')
        .select('features_config')
        .eq('id', networkId)
        .single();

      if (fetchError) throw fetchError;

      // Update features_config with new value
      const updatedConfig = {
        ...(currentData.features_config || {}),
        allow_member_event_publishing: newValue
      };

      const { error: updateError } = await supabase
        .from('networks')
        .update({ features_config: updatedConfig })
        .eq('id', networkId);

      if (updateError) throw updateError;

      setAllowMemberPublishing(newValue);
      setMessage(
        newValue
          ? t('admin.events.settings.memberPublishingEnabled')
          : t('admin.events.settings.memberPublishingDisabled')
      );
    } catch (err) {
      setError(`Failed to update setting: ${err.message}`);
      // Revert the toggle
      setAllowMemberPublishing(!newValue);
    } finally {
      setSavingSettings(false);
    }
  };

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

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...events];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status === statusFilter);
    }
    
    return filtered.sort((a, b) => {
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
  }, [events, order, orderBy, participationStats, statusFilter]);

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

  const handleApproveEvent = async (eventId) => {
    try {
      const result = await approveEvent(eventId, activeProfile.id, networkId);
      
      if (result.success) {
        // Update the event in the local state
        setEvents(events.map(e => 
          e.id === eventId 
            ? { ...e, status: 'approved', approved_by: activeProfile.id, approved_at: new Date().toISOString() }
            : e
        ));
        setMessage(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(`Failed to approve event: ${err.message}`);
    }
  };

  const handleRejectEvent = async () => {
    try {
      const result = await rejectEvent(rejectingEventId, activeProfile.id, rejectionReason);
      
      if (result.success) {
        // Update the event in the local state
        setEvents(events.map(e => 
          e.id === rejectingEventId 
            ? { ...e, status: 'rejected', approved_by: activeProfile.id, approved_at: new Date().toISOString(), rejection_reason: rejectionReason }
            : e
        ));
        setMessage('Event rejected');
        setRejectDialogOpen(false);
        setRejectingEventId(null);
        setRejectionReason('');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(`Failed to reject event: ${err.message}`);
    }
  };

  const openRejectDialog = (eventId) => {
    setRejectingEventId(eventId);
    setRejectDialogOpen(true);
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5">Network Events</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status Filter"
              startAdornment={<FilterListIcon sx={{ mr: 1, fontSize: 20 }} />}
            >
              <MenuItem value="all">All Events</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="pending">Pending Review</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('create')}
          >
            New Event
          </Button>
        </Box>
      </Box>

      {/* Event Publishing Settings */}
      <Card
        sx={{
          mb: 3,
          background: darkMode
            ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(21, 101, 192, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(21, 101, 192, 0.02) 100%)',
          border: darkMode ? '1px solid rgba(25, 118, 210, 0.3)' : '1px solid rgba(25, 118, 210, 0.2)',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('admin.events.settings.title')}
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={allowMemberPublishing}
                  onChange={handleToggleMemberPublishing}
                  disabled={savingSettings}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {t('admin.events.settings.allowMemberPublishing')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {allowMemberPublishing
                      ? t('admin.events.settings.descriptionEnabled')
                      : t('admin.events.settings.descriptionDisabled')
                    }
                  </Typography>
                </Box>
              }
              sx={{ m: 0, alignItems: 'flex-start' }}
            />
          </Box>
        </CardContent>
      </Card>

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
              <TableCell sx={{ width: 100 }}>Status</TableCell>
              <TableCell align="center" sx={{ width: 140 }}>
                <TableSortLabel
                  active={orderBy === 'participation'}
                  direction={orderBy === 'participation' ? order : 'asc'}
                  onClick={() => handleRequestSort('participation')}
                >
                  Participation
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sx={{ width: 150 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedEvents.map((event) => (
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
                <TableCell>
                  <Chip 
                    label={event.status || 'approved'}
                    size="small"
                    color={
                      event.status === 'pending' ? 'warning' : 
                      event.status === 'rejected' ? 'error' : 
                      'success'
                    }
                    variant={event.status === 'pending' ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell align="center">
                  <EventParticipationStatsCompact 
                    eventId={event.id} 
                    onStatsLoad={handleParticipationStatsLoad}
                  />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    {event.status === 'pending' && (
                      <>
                        <Tooltip title="Approve event">
                          <IconButton 
                            size="small" 
                            onClick={() => handleApproveEvent(event.id)}
                            sx={{ padding: 0.5 }}
                            color="success"
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject event">
                          <IconButton 
                            size="small" 
                            onClick={() => openRejectDialog(event.id)}
                            sx={{ padding: 0.5 }}
                            color="error"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
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
        isAdmin={true}
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

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Event Proposal</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason (optional)"
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejecting this event proposal..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRejectDialogOpen(false);
            setRejectingEventId(null);
            setRejectionReason('');
          }}>
            Cancel
          </Button>
          <Button onClick={handleRejectEvent} color="error" variant="contained">
            Reject Event
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EventsTab;