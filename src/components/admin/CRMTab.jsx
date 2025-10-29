// CRM Tab for managing email notifications
import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
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
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Button,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Avatar,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Autocomplete,
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  BarChart as StatsIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { format, parseISO, startOfWeek, startOfMonth } from 'date-fns';
import { fetchNotificationHistory, fetchNotificationStats, exportNotificationHistory } from '../../api/notificationHistory';
import { queueCustomEmail } from '../../api/customEmail';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../supabaseclient';

function CRMTab({ networkId, members = [], darkMode, activeProfile }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRecipient, setFilterRecipient] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [sendToAll, setSendToAll] = useState(true);
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Notification types with display names and colors
  const notificationTypes = {
    news: { label: 'News', color: 'primary' },
    event: { label: 'Event', color: 'secondary' },
    mention: { label: 'Mention', color: 'info' },
    direct_message: { label: 'Direct Message', color: 'warning' },
    post: { label: 'Post', color: 'success' },
    event_proposal: { label: 'Event Proposal', color: 'secondary' },
    event_status: { label: 'Event Status', color: 'secondary' },
    event_reminder: { label: 'Event Reminder', color: 'secondary' },
    comment: { label: 'Comment', color: 'info' },
    comment_reply: { label: 'Comment Reply', color: 'info' },
    custom: { label: 'Custom Email', color: 'default' }
  };

  // Fetch notifications
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 [CRM] Fetching notifications...');

      // Build filters
      const filters = {
        page,
        limit: rowsPerPage,
        notificationType: filterType || null,
        recipientId: filterRecipient || null,
        sentStatus: filterStatus || null
      };

      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        switch (dateFilter) {
          case 'today':
            filters.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            break;
          case 'week':
            filters.startDate = startOfWeek(now).toISOString();
            break;
          case 'month':
            filters.startDate = startOfMonth(now).toISOString();
            break;
        }
      }

      // Fetch notifications
      const result = await fetchNotificationHistory(networkId, filters);
      
      if (result.error) {
        throw new Error(result.error);
      }

      console.log(`🔄 [CRM] Fetched ${result.notifications.length} notifications, total: ${result.totalCount}`);
      setNotifications(result.notifications);
      setTotalCount(result.totalCount);

      // Fetch stats (only on initial load or refresh)
      if (page === 0 && !filterType && !filterStatus && !filterRecipient && dateFilter === 'all') {
        const statsResult = await fetchNotificationStats(networkId);
        if (statsResult.success) {
          setStats(statsResult.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching CRM data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [networkId, page, rowsPerPage, filterType, filterStatus, filterRecipient, dateFilter]);

  // Set up real-time subscription for notification updates
  useEffect(() => {
    if (!networkId) return;

    console.log('🔄 [CRM] Setting up real-time subscription for notifications...');
    
    const subscription = supabase
      .channel(`notification-updates-${networkId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_queue',
          filter: `network_id=eq.${networkId}`
        },
        (payload) => {
          console.log('🔄 [CRM] Real-time update received:', payload.eventType);
          
          // Refresh data when notifications are added or updated
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Only refresh if we're on the first page to avoid confusion
            if (page === 0) {
              fetchData();
            } else {
              // Show a message that new notifications are available
              setSuccessMessage('New notifications available. Click refresh to view.');
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 [CRM] Cleaning up real-time subscription...');
      subscription.unsubscribe();
    };
  }, [networkId, page]); // Include page to properly handle subscription

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Export to CSV
  const handleExport = async () => {
    try {
      setExporting(true);
      
      const filters = {
        notificationType: filterType || null,
        recipientId: filterRecipient || null,
        sentStatus: filterStatus || null
      };

      if (dateFilter !== 'all') {
        const now = new Date();
        switch (dateFilter) {
          case 'today':
            filters.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            break;
          case 'week':
            filters.startDate = startOfWeek(now).toISOString();
            break;
          case 'month':
            filters.startDate = startOfMonth(now).toISOString();
            break;
        }
      }

      const csvData = await exportNotificationHistory(networkId, filters);
      
      // Create download link
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `notifications_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export notifications');
    } finally {
      setExporting(false);
    }
  };

  // Handle sending custom email
  const handleSendCustomEmail = async () => {
    try {
      setSending(true);
      setError(null);

      if (!activeProfile?.id) {
        setError('Profile not loaded. Please try again.');
        return;
      }

      if (!composeSubject.trim() || !composeContent.trim()) {
        setError('Please provide both subject and content for the email');
        return;
      }

      const recipientIds = sendToAll ? [] : selectedRecipients.map(r => r.id);
      
      const result = await queueCustomEmail(
        networkId,
        composeSubject,
        composeContent,
        recipientIds,
        activeProfile.id
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Show success message
      setSuccessMessage(`Successfully queued ${result.count} emails${result.invalidCount ? ` (${result.invalidCount} members have no email or notifications disabled)` : ''}`);
      
      // Reset form and close dialog
      setComposeDialogOpen(false);
      setComposeSubject('');
      setComposeContent('');
      setSelectedRecipients([]);
      setSendToAll(true);
      
      // Refresh the notifications list immediately
      setTimeout(() => {
        console.log('🔄 [CRM] Refreshing after sending custom email...');
        fetchData();
      }, 500); // Small delay to ensure the queue is updated
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error sending custom email:', err);
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // Get status chip
  const getStatusChip = (notification) => {
    if (notification.is_sent) {
      return <Chip label={t('common.status.sent')} color="success" size="small" icon={<SendIcon />} />;
    } else if (notification.error_message) {
      return <Chip label={t('common.status.failed')} color="error" size="small" icon={<ErrorIcon />} />;
    } else {
      return <Chip label={t('common.status.pending')} color="warning" size="small" icon={<ScheduleIcon />} />;
    }
  };

  // Filtered notifications based on search
  const filteredNotifications = notifications.filter(n => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      n.subject_line?.toLowerCase().includes(searchLower) ||
      n.recipient?.full_name?.toLowerCase().includes(searchLower) ||
      n.recipient?.contact_email?.toLowerCase().includes(searchLower) ||
      n.content_preview?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Box>
      {/* Header with Stats */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3, color: theme.palette.text.primary }}>
        Email Notification CRM
      </Typography>
      
      {/* Info about notification processing */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Emails are queued and processed every few minutes by the system. 
          New emails will appear here immediately with "Pending" status and will be marked as "Sent" once processed.
          Click the Refresh button to see the latest status.
        </Typography>
        {notifications.length === 0 && !loading && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Important:</strong> If you're not seeing any notifications, please run the migration 
            "20250906100000_add_network_admin_notification_access.sql" in your Supabase SQL editor to enable admin access.
          </Typography>
        )}
      </Alert>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Emails
                </Typography>
                <Typography variant="h4">
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Sent
                </Typography>
                <Typography variant="h4" sx={{ color: theme.palette.success.main }}>
                  {stats.sent}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending
                </Typography>
                <Typography variant="h4" sx={{ color: theme.palette.warning.main }}>
                  {stats.pending}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Failed
                </Typography>
                <Typography variant="h4" sx={{ color: theme.palette.error.main }}>
                  {stats.failed}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: theme.palette.background.paper }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              select
              label="Type"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(0);
              }}
              size="small"
            >
              <MenuItem value="">All Types</MenuItem>
              {Object.entries(notificationTypes).map(([key, config]) => (
                <MenuItem key={key} value={key}>{config.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              select
              label="Status"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(0);
              }}
              size="small"
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="sent">{t('common.status.sent')}</MenuItem>
              <MenuItem value="pending">{t('common.status.pending')}</MenuItem>
              <MenuItem value="failed">{t('common.status.failed')}</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              select
              label="Date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(0);
              }}
              size="small"
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                size="small"
                startIcon={refreshing || loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                onClick={async () => {
                  setRefreshing(true);
                  await fetchData();
                  setRefreshing(false);
                }} 
                disabled={loading || refreshing}
              >
                Refresh
              </Button>
              <Tooltip title="Export to CSV">
                <IconButton onClick={handleExport} disabled={exporting || loading}>
                  {exporting ? <CircularProgress size={20} /> : <DownloadIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Success Alert */}
      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {/* Notifications Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date & Time</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Recipient</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredNotifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary">
                    No notifications found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredNotifications.map((notification) => (
                <TableRow key={notification.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {format(parseISO(notification.created_at), 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {format(parseISO(notification.created_at), 'HH:mm')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={notificationTypes[notification.notification_type]?.label || notification.notification_type}
                      color={notificationTypes[notification.notification_type]?.color || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        src={notification.recipient?.profile_picture_url} 
                        sx={{ width: 32, height: 32 }}
                      >
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2">
                          {notification.recipient?.full_name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {notification.recipient?.contact_email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ 
                      maxWidth: 300,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {notification.subject_line}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {getStatusChip(notification)}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={t('common.actions.viewDetails')}>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedNotification(notification)}
                      >
                        <EmailIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </TableContainer>

      {/* Notification Details Dialog */}
      <Dialog
        open={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Email Details
            <IconButton onClick={() => setSelectedNotification(null)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedNotification && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">Date & Time</Typography>
                <Typography>
                  {format(parseISO(selectedNotification.created_at), 'MMMM dd, yyyy HH:mm')}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="textSecondary">Type</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={notificationTypes[selectedNotification.notification_type]?.label || selectedNotification.notification_type}
                    color={notificationTypes[selectedNotification.notification_type]?.color || 'default'}
                    size="small"
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {getStatusChip(selectedNotification)}
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">Recipient</Typography>
                <Typography>
                  {selectedNotification.recipient?.full_name} ({selectedNotification.recipient?.contact_email})
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">Subject</Typography>
                <Typography>{selectedNotification.subject_line}</Typography>
              </Box>

              {selectedNotification.content_preview && (
                <Box>
                  <Typography variant="caption" color="textSecondary">Preview</Typography>
                  <Typography>{selectedNotification.content_preview}</Typography>
                </Box>
              )}

              {selectedNotification.sent_at && (
                <Box>
                  <Typography variant="caption" color="textSecondary">Sent At</Typography>
                  <Typography>
                    {format(parseISO(selectedNotification.sent_at), 'MMMM dd, yyyy HH:mm')}
                  </Typography>
                </Box>
              )}

              {selectedNotification.error_message && (
                <Box>
                  <Typography variant="caption" color="textSecondary">Error</Typography>
                  <Typography color="error">{selectedNotification.error_message}</Typography>
                </Box>
              )}

              {selectedNotification.metadata && (
                <Box>
                  <Typography variant="caption" color="textSecondary">Additional Info</Typography>
                  <Typography variant="body2" component="pre" sx={{ 
                    p: 1, 
                    bgcolor: theme.palette.grey[100],
                    borderRadius: 1,
                    overflow: 'auto',
                    fontSize: '0.875rem'
                  }}>
                    {JSON.stringify(JSON.parse(selectedNotification.metadata), null, 2)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedNotification(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Compose Email Dialog */}
      <Dialog
        open={composeDialogOpen}
        onClose={() => !sending && setComposeDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Compose Email
            <IconButton 
              onClick={() => setComposeDialogOpen(false)} 
              size="small"
              disabled={sending}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            <TextField
              label="Subject"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              fullWidth
              required
              disabled={sending}
            />
            
            <TextField
              label="Message"
              value={composeContent}
              onChange={(e) => setComposeContent(e.target.value)}
              multiline
              rows={8}
              fullWidth
              required
              disabled={sending}
            />
            
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sendToAll}
                    onChange={(e) => {
                      setSendToAll(e.target.checked);
                      if (e.target.checked) {
                        setSelectedRecipients([]);
                      }
                    }}
                    disabled={sending}
                  />
                }
                label="Send to all members"
              />
              
              {!sendToAll && (
                <Box sx={{ mt: 2 }}>
                  <Autocomplete
                    multiple
                    options={members}
                    getOptionLabel={(option) => `${option.full_name || 'Unnamed'} (${option.contact_email || 'No email'})`}
                    value={selectedRecipients}
                    onChange={(event, newValue) => {
                      setSelectedRecipients(newValue);
                    }}
                    disabled={sending}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select recipients"
                        placeholder="Choose members..."
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                        <Avatar 
                          src={option.profile_picture_url} 
                          sx={{ width: 24, height: 24, mr: 1 }}
                        >
                          {option.full_name?.[0] || '?'}
                        </Avatar>
                        {option.full_name || 'Unnamed'} ({option.contact_email || 'No email'})
                      </Box>
                    )}
                  />
                </Box>
              )}
            </Box>
            
            <Typography variant="body2" color="textSecondary">
              Recipients: {sendToAll ? `All members (${members.length})` : `${selectedRecipients.length} selected`}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComposeDialogOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendCustomEmail} 
            variant="contained" 
            disabled={sending || !composeSubject.trim() || !composeContent.trim()}
            startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {sending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Compose */}
      <Fab
        color="primary"
        aria-label="compose email"
        onClick={() => setComposeDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: theme.spacing(4),
          right: theme.spacing(4),
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}

export default CRMTab;