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
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Email as EmailIcon,
  Download as ExportIcon,
  PersonAdd as AddIcon,
  Check as VerifiedIcon,
  AccessTime as PendingIcon
} from '@mui/icons-material';
import {
  fetchBlogSubscribers,
  deleteBlogSubscriber
} from '../../../api/blog';

const BlogSubscribersTab = ({ network, activeProfile }) => {
  const theme = useTheme();
  const themeColor = network?.theme_color || theme.palette.primary.main;

  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);

  // Load subscribers
  const loadSubscribers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBlogSubscribers(network.id);
      setSubscribers(data);
    } catch (err) {
      console.error('Error loading subscribers:', err);
      setError('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (network?.id) {
      loadSubscribers();
    }
  }, [network?.id]);

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteBlogSubscriber(subscriberToDelete.id);
      setDeleteDialogOpen(false);
      setSubscriberToDelete(null);
      loadSubscribers();
    } catch (err) {
      console.error('Error deleting subscriber:', err);
      setError('Failed to delete subscriber');
    }
  };

  // Handle add subscriber manually
  const handleAddSubscriber = async () => {
    if (!newEmail.trim()) return;

    try {
      setAdding(true);
      // Use the subscribe API
      const { subscribeToBlog } = await import('../../../api/blog');
      await subscribeToBlog(network.id, newEmail.trim());
      setAddDialogOpen(false);
      setNewEmail('');
      loadSubscribers();
    } catch (err) {
      console.error('Error adding subscriber:', err);
      setError('Failed to add subscriber');
    } finally {
      setAdding(false);
    }
  };

  // Export subscribers as CSV
  const handleExport = () => {
    const csv = [
      ['Email', 'Status', 'Subscribed Date'],
      ...subscribers.map(s => [
        s.email,
        s.is_verified ? 'Verified' : 'Pending',
        new Date(s.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${network.subdomain || network.name}-subscribers.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Newsletter Subscribers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subscribers.length} {subscribers.length === 1 ? 'subscriber' : 'subscribers'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExport}
            disabled={subscribers.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              bgcolor: themeColor,
              '&:hover': { bgcolor: alpha(themeColor, 0.9) }
            }}
          >
            Add Subscriber
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Subscribers Table */}
      {subscribers.length > 0 ? (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Subscribed</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subscribers.map((subscriber) => (
                <TableRow key={subscriber.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2">{subscriber.email}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={subscriber.is_verified ? <VerifiedIcon sx={{ fontSize: 14 }} /> : <PendingIcon sx={{ fontSize: 14 }} />}
                      label={subscriber.is_verified ? 'Verified' : 'Pending'}
                      size="small"
                      sx={{
                        height: 24,
                        bgcolor: subscriber.is_verified
                          ? alpha(theme.palette.success.main, 0.1)
                          : alpha(theme.palette.warning.main, 0.1),
                        color: subscriber.is_verified ? 'success.main' : 'warning.main'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(subscriber.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Remove subscriber">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setSubscriberToDelete(subscriber);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No subscribers yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enable the newsletter signup on your blog to start collecting subscribers
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              bgcolor: themeColor,
              '&:hover': { bgcolor: alpha(themeColor, 0.9) }
            }}
          >
            Add Subscriber Manually
          </Button>
        </Box>
      )}

      {/* Add Subscriber Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add Subscriber</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Manually add an email address to your subscriber list.
          </Typography>
          <TextField
            label="Email Address"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddSubscriber}
            disabled={adding || !newEmail.trim()}
            sx={{
              bgcolor: themeColor,
              '&:hover': { bgcolor: alpha(themeColor, 0.9) }
            }}
          >
            {adding ? <CircularProgress size={20} /> : 'Add Subscriber'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Remove Subscriber?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove <strong>{subscriberToDelete?.email}</strong> from your subscriber list?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BlogSubscribersTab;
