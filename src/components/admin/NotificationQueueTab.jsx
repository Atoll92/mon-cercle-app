import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import Spinner from '../Spinner';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { supabase } from '../../supabaseclient';
import { processPendingNotifications } from '../../services/emailNotificationService';

const NotificationQueueTab = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Load notification queue
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_queue')
        .select(`
          id,
          notification_type,
          subject_line,
          content_preview,
          is_sent,
          created_at,
          sent_at,
          error_message,
          profiles!notification_queue_recipient_id_fkey (
            full_name,
            contact_email
          ),
          networks!notification_queue_network_id_fkey (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notification queue');
    } finally {
      setLoading(false);
    }
  };

  // Process pending notifications
  const handleProcessNotifications = async () => {
    try {
      setProcessing(true);
      setMessage('');
      setError('');

      const result = await processPendingNotifications();
      
      if (result.success) {
        setMessage(result.message);
        await loadNotifications(); // Reload to see updated status
      } else {
        setError(result.error || 'Failed to process notifications');
      }
    } catch (err) {
      console.error('Error processing notifications:', err);
      setError('Failed to process notifications');
    } finally {
      setProcessing(false);
    }
  };

  // Delete a notification
  const handleDeleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notification_queue')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      
      setMessage('Notification deleted successfully');
      await loadNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
    }
  };

  // View notification details
  const handleViewNotification = (notification) => {
    setSelectedNotification(notification);
    setDialogOpen(true);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusChip = (notification) => {
    if (notification.is_sent) {
      return <Chip label="Sent" color="success" size="small" />;
    } else if (notification.error_message) {
      return <Chip label="Failed" color="error" size="small" />;
    } else {
      return <Chip label="Pending" color="warning" size="small" />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <Spinner />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <EmailIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Email Notification Queue
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadNotifications}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={processing ? <Spinner size={16} /> : <SendIcon />}
            onClick={handleProcessNotifications}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Process Pending'}
          </Button>
        </Box>
      </Box>

      {/* Messages */}
      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Queue Statistics
          </Typography>
          <Box display="flex" gap={4}>
            <Box>
              <Typography variant="h4" color="primary.main">
                {notifications.filter(n => !n.is_sent && !n.error_message).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" color="success.main">
                {notifications.filter(n => n.is_sent).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sent
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" color="error.main">
                {notifications.filter(n => n.error_message).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Failed
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Recipient</TableCell>
              <TableCell>Network</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notifications.map((notification) => (
              <TableRow key={notification.id}>
                <TableCell>
                  {getStatusChip(notification)}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={notification.notification_type} 
                    variant="outlined" 
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {notification.profiles?.full_name || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notification.profiles?.contact_email}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {notification.networks?.name || 'Unknown'}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                    {notification.subject_line}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {formatDate(notification.created_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewNotification(notification)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteNotification(notification.id)}
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

      {notifications.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            No notifications in queue
          </Typography>
        </Box>
      )}

      {/* Notification Details Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Notification Details
        </DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Subject:
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedNotification.subject_line}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Content Preview:
              </Typography>
              <Typography variant="body2" gutterBottom>
                {selectedNotification.content_preview}
              </Typography>
              
              {selectedNotification.error_message && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Error Message:
                  </Typography>
                  <Alert severity="error">
                    {selectedNotification.error_message}
                  </Alert>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationQueueTab;