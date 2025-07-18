import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authcontext';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Alert,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import Spinner from '../Spinner';
import {
  Visibility as ViewIcon,
  Send as SendIcon,
  Assignment as AssignIcon,
  CheckCircle as ResolvedIcon,
  HelpOutline as OpenIcon,
  Schedule as InProgressIcon,
  Warning as UrgentIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { 
  getAllTickets, 
  getTicketDetails, 
  updateTicket, 
  sendTicketMessage,
  getTicketStatistics 
} from '../../api/tickets';
import { formatDistanceToNow, format } from 'date-fns';

const TicketsManagement = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: ''
  });

  useEffect(() => {
    fetchTickets();
    fetchStatistics();
  }, [filters]);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await getAllTickets(filters);
    if (!error && data) {
      setTickets(data);
    }
    setLoading(false);
  };

  const fetchStatistics = async () => {
    const { data, error } = await getTicketStatistics();
    if (!error && data) {
      setStatistics(data);
    }
  };

  const handleViewTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setViewDialogOpen(true);
    
    const { data, error } = await getTicketDetails(ticket.id);
    if (!error && data) {
      setTicketDetails(data);
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    setSubmitting(true);
    const updates = { status: newStatus };
    if (newStatus === 'resolved' || newStatus === 'closed') {
      updates.resolved_at = new Date().toISOString();
    }
    
    const { data, error } = await updateTicket(ticketId, updates);
    if (!error && data) {
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, ...updates } : t));
      if (ticketDetails && ticketDetails.id === ticketId) {
        setTicketDetails({ ...ticketDetails, ...updates });
      }
      // Also update selectedTicket to reflect the status change in the dropdown
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, ...updates });
      }
    }
    setSubmitting(false);
  };

  const handleAssignTicket = async (ticketId) => {
    setSubmitting(true);
    const { data, error } = await updateTicket(ticketId, {
      assigned_to: user.id,
      status: 'in_progress'
    });
    
    if (!error && data) {
      setTickets(tickets.map(t => t.id === ticketId ? data : t));
      fetchStatistics();
    }
    setSubmitting(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setSubmitting(true);
    const { data, error } = await sendTicketMessage(
      selectedTicket.id, 
      newMessage,
      isInternalNote
    );
    
    if (!error && data) {
      setTicketDetails({
        ...ticketDetails,
        messages: [...ticketDetails.messages, data]
      });
      setNewMessage('');
      
      // Update status to waiting_response if sending to customer
      if (!isInternalNote && ticketDetails.status === 'in_progress') {
        handleUpdateStatus(selectedTicket.id, 'waiting_response');
      }
    }
    setSubmitting(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <OpenIcon fontSize="small" />;
      case 'in_progress':
        return <InProgressIcon fontSize="small" />;
      case 'resolved':
      case 'closed':
        return <ResolvedIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'waiting_response':
        return 'default';
      case 'resolved':
      case 'closed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'default';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 1 && ticket.status === 'closed') return false;
    if (activeTab === 2 && ticket.status !== 'closed') return false;
    return true;
  });

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Support Tickets Management
      </Typography>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Tickets
                    </Typography>
                    <Typography variant="h4">
                      {statistics.total_tickets}
                    </Typography>
                  </Box>
                  <TrendingIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Open Tickets
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {statistics.open_tickets}
                    </Typography>
                  </Box>
                  <OpenIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      In Progress
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {statistics.in_progress_tickets}
                    </Typography>
                  </Box>
                  <InProgressIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Urgent
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {statistics.urgent_tickets}
                    </Typography>
                  </Box>
                  <UrgentIcon sx={{ fontSize: 40, color: 'error.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters and Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="All Tickets" />
          <Tab 
            label={
              <Badge badgeContent={tickets.filter(t => t.status !== 'closed').length} color="primary">
                Active
              </Badge>
            } 
          />
          <Tab label="Closed" />
        </Tabs>
        
        <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
          <TextField
            select
            size="small"
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="waiting_response">Waiting Response</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </TextField>
          
          <TextField
            select
            size="small"
            label="Priority"
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
          </TextField>
          
          <TextField
            select
            size="small"
            label="Category"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="technical">Technical</MenuItem>
            <MenuItem value="billing">Billing</MenuItem>
            <MenuItem value="feature">Feature Request</MenuItem>
            <MenuItem value="bug">Bug Report</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
          
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchTickets();
              fetchStatistics();
            }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Tickets Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Spinner />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ticket</TableCell>
                <TableCell>Network</TableCell>
                <TableCell>Submitted By</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{ticket.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      #{ticket.id.slice(0, 8)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {ticket.network?.logo_url && (
                        <Avatar 
                          src={ticket.network.logo_url} 
                          sx={{ width: 24, height: 24 }}
                        />
                      )}
                      <Typography variant="body2">
                        {ticket.network?.name || 'Unknown'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {ticket.submitted_by_profile?.full_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {ticket.submitted_by_profile?.contact_email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.category}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.priority}
                      size="small"
                      color={getPriorityColor(ticket.priority)}
                      icon={ticket.priority === 'urgent' ? <UrgentIcon /> : null}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.status.replace('_', ' ')}
                      size="small"
                      color={getStatusColor(ticket.status)}
                      icon={getStatusIcon(ticket.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {ticket.assigned_to_profile ? (
                      <Chip
                        avatar={
                          <Avatar 
                            src={ticket.assigned_to_profile.profile_picture_url}
                            sx={{ width: 20, height: 20 }}
                          />
                        }
                        label={ticket.assigned_to_profile.full_name}
                        size="small"
                      />
                    ) : (
                      <Button
                        size="small"
                        startIcon={<AssignIcon />}
                        onClick={() => handleAssignTicket(ticket.id)}
                        disabled={submitting}
                      >
                        Assign to me
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewTicket(ticket)}
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* View Ticket Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedTicket(null);
          setTicketDetails(null);
          setIsInternalNote(false);
        }}
        maxWidth="lg"
        fullWidth
      >
        {selectedTicket && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6">{selectedTicket.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    From: {selectedTicket.network?.name} • 
                    Submitted by: {selectedTicket.submitted_by_profile?.full_name} • 
                    #{selectedTicket.id.slice(0, 8)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    select
                    size="small"
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value="open">Open</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="waiting_response">Waiting Response</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </TextField>
                  <Chip
                    label={selectedTicket.priority}
                    size="small"
                    color={getPriorityColor(selectedTicket.priority)}
                  />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              {!ticketDetails ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Spinner />
                </Box>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" gutterBottom>Description</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{ticketDetails.description}</Typography>
                      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Created {format(new Date(ticketDetails.created_at), 'PPpp')}
                        </Typography>
                        {ticketDetails.resolved_at && (
                          <Typography variant="caption" color="text.secondary">
                            • Resolved {format(new Date(ticketDetails.resolved_at), 'PPpp')}
                          </Typography>
                        )}
                      </Box>
                    </Paper>

                    <Typography variant="subtitle2" sx={{ mb: 2 }}>Conversation</Typography>
                    
                    <List sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
                      {ticketDetails.messages.map((message, index) => (
                        <React.Fragment key={message.id}>
                          <ListItem 
                            alignItems="flex-start"
                            sx={{
                              bgcolor: message.is_internal ? 'warning.light' : 'transparent',
                              opacity: message.is_internal ? 0.7 : 1
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar src={message.sender?.profile_picture_url}>
                                {message.sender?.full_name?.[0]}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="subtitle2">
                                    {message.sender?.full_name || 'System'}
                                    {message.is_internal && (
                                      <Chip label="Internal Note" size="small" sx={{ ml: 1 }} />
                                    )}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {format(new Date(message.created_at), 'PPp')}
                                  </Typography>
                                </Box>
                              }
                              secondary={message.message}
                            />
                          </ListItem>
                          {index < ticketDetails.messages.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                      ))}
                    </List>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                      <TextField
                        fullWidth
                        placeholder={isInternalNote ? "Add internal note..." : "Type your reply..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        multiline
                        rows={3}
                        sx={{
                          bgcolor: isInternalNote ? 'warning.light' : 'background.paper',
                          '& .MuiOutlinedInput-root': {
                            opacity: isInternalNote ? 0.8 : 1
                          }
                        }}
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isInternalNote}
                              onChange={(e) => setIsInternalNote(e.target.checked)}
                              size="small"
                            />
                          }
                          label="Internal"
                          sx={{ m: 0 }}
                        />
                        <Button
                          variant="contained"
                          endIcon={<SendIcon />}
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || submitting}
                        >
                          Send
                        </Button>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Ticket Information</Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="Category"
                            secondary={ticketDetails.category}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Priority"
                            secondary={
                              <Chip
                                label={ticketDetails.priority}
                                size="small"
                                color={getPriorityColor(ticketDetails.priority)}
                              />
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Assigned To"
                            secondary={ticketDetails.assigned_to_profile?.full_name || 'Unassigned'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Network"
                            secondary={ticketDetails.network?.name}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Contact Email"
                            secondary={ticketDetails.submitted_by_profile?.contact_email}
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setViewDialogOpen(false);
                setSelectedTicket(null);
                setTicketDetails(null);
                setIsInternalNote(false);
              }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TicketsManagement;