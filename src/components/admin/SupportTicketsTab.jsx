import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Badge
} from '@mui/material';
import Spinner from '../Spinner';
import MemberDetailsModal from '../MembersDetailModal';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Send as SendIcon,
  CheckCircle as ResolvedIcon,
  HelpOutline as OpenIcon,
  Schedule as InProgressIcon,
  Warning as UrgentIcon
} from '@mui/icons-material';
import { 
  getNetworkTickets, 
  createTicket, 
  getTicketDetails, 
  sendTicketMessage,
  closeTicket 
} from '../../api/tickets';
import { formatDistanceToNow } from 'date-fns';

const SupportTicketsTab = ({ network, user, activeProfile, darkMode }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'technical',
    priority: 'medium'
  });
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [network.id]);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await getNetworkTickets(network.id);
    if (!error && data) {
      setTickets(data);
    }
    setLoading(false);
  };

  const handleCreateTicket = async () => {
    if (!newTicket.title || !newTicket.description) return;

    setSubmitting(true);
    const { data, error } = await createTicket({
      network_id: network.id,
      submitted_by: activeProfile.id,
      title: newTicket.title,
      description: newTicket.description,
      category: newTicket.category,
      priority: newTicket.priority
    });

    if (!error && data) {
      setTickets([data, ...tickets]);
      setCreateDialogOpen(false);
      setNewTicket({
        title: '',
        description: '',
        category: 'technical',
        priority: 'medium'
      });
    }
    setSubmitting(false);
  };

  const handleViewTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setViewDialogOpen(true);
    
    const { data, error } = await getTicketDetails(ticket.id);
    if (!error && data) {
      setTicketDetails(data);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setSubmitting(true);
    const { data, error } = await sendTicketMessage(selectedTicket.id, newMessage);
    
    if (!error && data) {
      setTicketDetails({
        ...ticketDetails,
        messages: [...ticketDetails.messages, data]
      });
      setNewMessage('');
    }
    setSubmitting(false);
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    setSubmitting(true);
    const { data, error } = await closeTicket(selectedTicket.id);
    
    if (!error && data) {
      // Update ticket in list
      setTickets(tickets.map(t => t.id === data.id ? data : t));
      // Update details if viewing
      if (ticketDetails) {
        setTicketDetails({ ...ticketDetails, ...data });
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Support Tickets</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Ticket
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Spinner />
        </Box>
      ) : tickets.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No support tickets yet. Click "New Ticket" to create one.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ticket</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{ticket.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      #{ticket.id.slice(0, 8)}
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

      {/* Create Ticket Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Support Ticket</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Title"
              fullWidth
              value={newTicket.title}
              onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              placeholder="Brief description of the issue"
            />
            
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              placeholder="Provide detailed information about your issue or request"
            />
            
            <TextField
              select
              label="Category"
              value={newTicket.category}
              onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
              fullWidth
            >
              <MenuItem value="technical">Technical Issue</MenuItem>
              <MenuItem value="billing">Billing</MenuItem>
              <MenuItem value="feature">Feature Request</MenuItem>
              <MenuItem value="bug">Bug Report</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            
            <TextField
              select
              label="Priority"
              value={newTicket.priority}
              onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
              fullWidth
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateTicket}
            variant="contained"
            disabled={!newTicket.title || !newTicket.description || submitting}
          >
            {submitting ? <Spinner size={40} /> : 'Create Ticket'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Ticket Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedTicket(null);
          setTicketDetails(null);
        }}
        maxWidth="md"
        fullWidth
      >
        {selectedTicket && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6">{selectedTicket.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ticket #{selectedTicket.id.slice(0, 8)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={selectedTicket.status.replace('_', ' ')}
                    size="small"
                    color={getStatusColor(selectedTicket.status)}
                    icon={getStatusIcon(selectedTicket.status)}
                  />
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
                <>
                  <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                    <Typography variant="body2">{ticketDetails.description}</Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Created {formatDistanceToNow(new Date(ticketDetails.created_at), { addSuffix: true })}
                      </Typography>
                      {ticketDetails.resolved_at && (
                        <Typography variant="caption" color="text.secondary">
                          • Resolved {formatDistanceToNow(new Date(ticketDetails.resolved_at), { addSuffix: true })}
                        </Typography>
                      )}
                    </Box>
                  </Paper>

                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Messages</Typography>
                  
                  <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {ticketDetails.messages.map((message, index) => (
                      <React.Fragment key={message.id}>
                        <ListItem alignItems="flex-start">
                          <ListItemAvatar>
                            <Avatar 
                              src={message.sender?.profile_picture_url}
                              onClick={() => {
                                if (message.sender) {
                                  setSelectedMember(message.sender);
                                  setShowMemberDetailsModal(true);
                                }
                              }}
                              sx={{ 
                                cursor: message.sender ? 'pointer' : 'default',
                                '&:hover': message.sender ? {
                                  opacity: 0.8
                                } : {}
                              }}
                            >
                              {message.sender?.full_name?.[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography 
                                  variant="subtitle2"
                                  onClick={() => {
                                    if (message.sender) {
                                      setSelectedMember(message.sender);
                                      setShowMemberDetailsModal(true);
                                    }
                                  }}
                                  sx={{ 
                                    cursor: message.sender ? 'pointer' : 'default',
                                    '&:hover': message.sender ? {
                                      color: 'primary.main',
                                      textDecoration: 'underline'
                                    } : {}
                                  }}
                                >
                                  {message.sender?.full_name || 'System'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
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

                  {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        multiline
                        maxRows={3}
                      />
                      <IconButton
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || submitting}
                      >
                        <SendIcon />
                      </IconButton>
                    </Box>
                  )}
                </>
              )}
            </DialogContent>
            <DialogActions>
              {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                <Button
                  onClick={handleCloseTicket}
                  color="success"
                  disabled={submitting}
                >
                  Mark as Resolved
                </Button>
              )}
              <Button onClick={() => {
                setViewDialogOpen(false);
                setSelectedTicket(null);
                setTicketDetails(null);
              }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
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
        />
      )}
    </Box>
  );
};

export default SupportTicketsTab;