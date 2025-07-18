import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Divider,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import Spinner from './Spinner';
import {
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  Science as TestTubeIcon
} from '@mui/icons-material';
import NotificationSystemTester from './NotificationSystemTester';
import { supabase } from '../supabaseclient';
import { useProfile } from '../context/profileContext';
import { 
  queueNewsNotifications, 
  queueEventNotifications,
  processPendingNotifications, 
  getNotificationStats,
  clearNotificationQueue,
  getAutomaticProcessorStatus,
  startAutomaticNotificationProcessing,
  stopAutomaticNotificationProcessing,
  forceNotificationProcessing
} from '../services/emailNotificationService';

const NotificationSystemManager = () => {
  const { activeProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [triggeredNotifications, setTriggeredNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [processorStatus, setProcessorStatus] = useState(null);
  const [viewMode, setViewMode] = useState('received'); // 'received' or 'triggered'
  const [showTester, setShowTester] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadTriggeredNotifications();
    loadStats();
    loadProcessorStatus();
  }, [activeProfile]);

  const loadProcessorStatus = () => {
    const status = getAutomaticProcessorStatus();
    setProcessorStatus(status);
  };

  const loadNotifications = async () => {
    if (!activeProfile?.id) {
      console.log('📭 No active profile, skipping notification load');
      return;
    }
    
    try {
      setLoading(true);
      console.log('📥 Loading notifications for profile:', activeProfile.id);
      
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
          recipient_id,
          networks!notification_queue_network_id_fkey (
            name
          )
        `)
        .eq('recipient_id', activeProfile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      console.log('📊 Notification query result:', { data, error, count: data?.length || 0 });

      if (error) {
        console.error('📭 Database error loading notifications:', error);
        throw error;
      }
      
      setNotifications(data || []);
      console.log(`📬 Loaded ${data?.length || 0} received notifications for display`);
      
      // Clear any previous error messages when loading succeeds
      if (result?.success === false) {
        setResult(null);
      }
    } catch (error) {
      console.error('📭 Error loading notifications:', error);
      setResult({
        success: false,
        message: `Failed to load notifications: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTriggeredNotifications = async () => {
    if (!activeProfile?.id) {
      console.log('📭 No active profile, skipping triggered notifications load');
      return;
    }
    
    try {
      console.log('📤 Loading notifications triggered by profile:', activeProfile.id);
      
      // Get notifications where this user triggered the notification by looking at related items
      // We need to find news posts, events, etc. created by this user and see notifications for them
      const { data: newsData } = await supabase
        .from('network_news')
        .select('id')
        .eq('created_by', activeProfile.id);
      
      const { data: eventsData } = await supabase
        .from('network_events')
        .select('id')
        .eq('created_by', activeProfile.id);
      
      const newsIds = newsData?.map(item => item.id) || [];
      const eventIds = eventsData?.map(item => item.id) || [];
      const relatedIds = [...newsIds, ...eventIds];
      
      if (relatedIds.length === 0) {
        setTriggeredNotifications([]);
        return;
      }
      
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
          recipient_id,
          related_item_id,
          networks!notification_queue_network_id_fkey (
            name
          ),
          profiles!notification_queue_recipient_id_fkey (
            full_name
          )
        `)
        .in('related_item_id', relatedIds)
        .order('created_at', { ascending: false })
        .limit(50);

      console.log('📤 Triggered notifications query result:', { data, error, count: data?.length || 0 });

      if (error) {
        console.error('📤 Database error loading triggered notifications:', error);
        return;
      }
      
      setTriggeredNotifications(data || []);
      console.log(`📤 Loaded ${data?.length || 0} triggered notifications for display`);
      
    } catch (error) {
      console.error('📤 Error loading triggered notifications:', error);
    }
  };

  const loadStats = async () => {
    if (!activeProfile?.id) return;
    
    try {
      const result = await getNotificationStats(activeProfile.id);
      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleProcessNotifications = async () => {
    try {
      setProcessing(true);
      setResult(null);
      
      const processResult = await processPendingNotifications();
      
      setResult({
        success: processResult.success,
        message: processResult.message || (processResult.success ? 'Notifications processed successfully!' : 'Failed to process notifications')
      });
      
      // Refresh data
      await loadNotifications();
      await loadTriggeredNotifications();
      await loadStats();
    } catch (error) {
      console.error('Error processing notifications:', error);
      setResult({
        success: false,
        message: `Failed to process notifications: ${error.message}`
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setProcessing(true);
      setResult(null);

      const { data: profile } = await supabase
        .from('profiles')
        .select('network_id')
        .eq('id', activeProfile.id)
        .single();

      if (!profile?.network_id) {
        throw new Error('Profile not in a network');
      }

      const fakeNewsId = crypto.randomUUID();
      const testResult = await queueNewsNotifications(
        profile.network_id,
        fakeNewsId,
        activeProfile.id,
        'Test News Notification',
        'This is a test news notification to verify the notification system is working correctly.'
      );

      setResult({
        success: testResult.success,
        message: testResult.success 
          ? `Test news notification queued successfully! ${testResult.count || 0} recipients will be notified.`
          : testResult.error
      });
      
      // Refresh data
      await loadNotifications();
      await loadTriggeredNotifications();
      await loadStats();
    } catch (error) {
      console.error('Error creating test notification:', error);
      setResult({
        success: false,
        message: `Failed to create test notification: ${error.message}`
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleTestDMNotification = async () => {
    try {
      setProcessing(true);
      setResult(null);

      // Create a test DM notification by directly inserting to queue
      // This bypasses the self-notification check for testing purposes
      const fakeMessageId = crypto.randomUUID();
      
      console.log('💬 [TEST] Creating test DM notification for profile:', activeProfile.id);
      
      // Get network info for the notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('network_id, full_name')
        .eq('id', activeProfile.id)
        .single();

      if (!profile?.network_id) {
        throw new Error('Profile not in a network');
      }

      // Insert test notification directly
      const testNotification = {
        recipient_id: activeProfile.id,
        network_id: profile.network_id,
        notification_type: 'direct_message',
        subject_line: `Test DM from ${profile.full_name || 'Test User'}`,
        content_preview: 'This is a test direct message notification to verify the DM notification system is working correctly.',
        related_item_id: fakeMessageId,
        is_sent: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('notification_queue')
        .insert([testNotification])
        .select();

      if (error) throw error;

      console.log('💬 [TEST] Test DM notification created:', data);

      setResult({
        success: true,
        message: 'Test DM notification queued successfully!'
      });
      
      // Refresh data
      await loadNotifications();
      await loadTriggeredNotifications();
      await loadStats();
    } catch (error) {
      console.error('Error creating test DM notification:', error);
      setResult({
        success: false,
        message: `Failed to create test DM notification: ${error.message}`
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleTestEventNotification = async () => {
    try {
      setProcessing(true);
      setResult(null);

      const { data: profile } = await supabase
        .from('profiles')
        .select('network_id')
        .eq('id', activeProfile.id)
        .single();

      if (!profile?.network_id) {
        throw new Error('Profile not in a network');
      }

      const fakeEventId = crypto.randomUUID();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const testResult = await queueEventNotifications(
        profile.network_id,
        fakeEventId,
        activeProfile.id,
        'Test Event Notification',
        'This is a test event notification to verify the event notification system is working correctly.',
        futureDate.toISOString(),
        'Test Location - Conference Room A'
      );

      setResult({
        success: testResult.success,
        message: testResult.success 
          ? `Test event notification queued successfully! ${testResult.count || 0} recipients will be notified.`
          : testResult.error
      });
      
      // Refresh data
      await loadNotifications();
      await loadTriggeredNotifications();
      await loadStats();
    } catch (error) {
      console.error('Error creating test event notification:', error);
      setResult({
        success: false,
        message: `Failed to create test event notification: ${error.message}`
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notification_queue')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      
      await loadNotifications();
      await loadStats();
    } catch (error) {
      console.error('Error deleting notification:', error);
      setResult({
        success: false,
        message: `Failed to delete notification: ${error.message}`
      });
    }
  };

  const handleClearQueue = async () => {
    try {
      setProcessing(true);
      setResult(null);

      const clearResult = await clearNotificationQueue(activeProfile.id);

      setResult({
        success: clearResult.success,
        message: clearResult.success 
          ? 'Notification queue cleared successfully!'
          : clearResult.error
      });
      
      // Refresh data
      await loadNotifications();
      await loadTriggeredNotifications();
      await loadStats();
    } catch (error) {
      console.error('Error clearing notification queue:', error);
      setResult({
        success: false,
        message: `Failed to clear queue: ${error.message}`
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleAutomaticProcessor = async () => {
    try {
      setProcessing(true);
      setResult(null);

      let newStatus;
      if (processorStatus?.isRunning) {
        newStatus = stopAutomaticNotificationProcessing();
        setResult({
          success: true,
          message: 'Automatic notification processing stopped'
        });
      } else {
        newStatus = startAutomaticNotificationProcessing();
        setResult({
          success: true,
          message: 'Automatic notification processing started'
        });
      }
      
      setProcessorStatus(newStatus);
    } catch (error) {
      console.error('Error toggling automatic processor:', error);
      setResult({
        success: false,
        message: `Failed to toggle processor: ${error.message}`
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleForceProcessing = async () => {
    try {
      setProcessing(true);
      setResult(null);

      const forceResult = await forceNotificationProcessing();
      
      setResult({
        success: forceResult.success,
        message: forceResult.message || 'Forced processing completed'
      });
      
      // Refresh data
      await loadNotifications();
      await loadTriggeredNotifications();
      await loadStats();
      loadProcessorStatus();
    } catch (error) {
      console.error('Error forcing notification processing:', error);
      setResult({
        success: false,
        message: `Failed to force processing: ${error.message}`
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusChip = (notification) => {
    if (notification.error_message) {
      return <Chip icon={<ErrorIcon />} label="Failed" color="error" size="small" />;
    }
    if (notification.is_sent) {
      return <Chip icon={<CheckCircleIcon />} label="Sent" color="success" size="small" />;
    }
    return <Chip icon={<ScheduleIcon />} label="Pending" color="warning" size="small" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <NotificationsIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Notification System Manager
            </Typography>
          </Box>
          
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={loadNotifications}
              startIcon={<RefreshIcon />}
              disabled={loading}
            >
              Refresh
            </Button>
            
            <Button
              variant="contained"
              size="small"
              onClick={handleTestNotification}
              startIcon={<SendIcon />}
              disabled={processing}
            >
              Test News
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={handleTestDMNotification}
              startIcon={<SendIcon />}
              disabled={processing}
            >
              Test DM
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={handleTestEventNotification}
              startIcon={<SendIcon />}
              disabled={processing}
            >
              Test Event
            </Button>
            
            <Button
              variant="contained"
              color="secondary"
              size="small"
              onClick={handleProcessNotifications}
              startIcon={processing ? <Spinner size={32} color="inherit" /> : <SettingsIcon />}
              disabled={processing}
            >
              Process Queue
            </Button>

            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleClearQueue}
              startIcon={<DeleteIcon />}
              disabled={processing}
            >
              Clear Queue
            </Button>

            <Button
              variant="outlined"
              color="info"
              size="small"
              onClick={() => setShowTester(!showTester)}
              startIcon={<TestTubeIcon />}
            >
              {showTester ? 'Hide' : 'Show'} E2E Tester
            </Button>
          </Box>
        </Box>

        {/* Automatic Processor Status */}
        {processorStatus && (
          <Box mb={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Automatic Processor Status
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Chip 
                label={processorStatus.isRunning ? 'Running' : 'Stopped'} 
                color={processorStatus.isRunning ? 'success' : 'error'}
                icon={processorStatus.isRunning ? <CheckCircleIcon /> : <ErrorIcon />}
              />
              <Chip 
                label={`Interval: ${processorStatus.processingInterval}`} 
                variant="outlined" 
              />
              {processorStatus.nextProcessing && (
                <Chip 
                  label={`Next: ${new Date(processorStatus.nextProcessing).toLocaleTimeString()}`} 
                  variant="outlined" 
                />
              )}
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant={processorStatus.isRunning ? "outlined" : "contained"}
                color={processorStatus.isRunning ? "error" : "success"}
                size="small"
                onClick={handleToggleAutomaticProcessor}
                disabled={processing}
              >
                {processorStatus.isRunning ? 'Stop Auto Processing' : 'Start Auto Processing'}
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleForceProcessing}
                disabled={processing}
                startIcon={<SendIcon />}
              >
                Force Process Now
              </Button>
            </Stack>
          </Box>
        )}

        {/* Stats Overview */}
        {stats && (
          <Box mb={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Notification Statistics
            </Typography>
            <Stack direction="row" spacing={2}>
              <Chip 
                label={`Total: ${stats.total}`} 
                variant="outlined" 
              />
              <Chip 
                label={`Sent: ${stats.sent}`} 
                color="success" 
                variant="outlined" 
              />
              <Chip 
                label={`Pending: ${stats.pending}`} 
                color="warning" 
                variant="outlined" 
              />
            </Stack>
          </Box>
        )}

        {result && (
          <Alert 
            severity={result.success ? 'success' : 'error'}
            sx={{ mb: 2 }}
            onClose={() => setResult(null)}
          >
            {result.message}
          </Alert>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* View Mode Toggle */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle2" color="text.secondary">
            {viewMode === 'received' ? 'Notifications You Received' : 'Notifications You Triggered'}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant={viewMode === 'received' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('received')}
            >
              Received ({notifications.length})
            </Button>
            <Button
              size="small"
              variant={viewMode === 'triggered' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('triggered')}
            >
              You Triggered ({triggeredNotifications.length})
            </Button>
          </Stack>
        </Box>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>{viewMode === 'received' ? 'Network' : 'Recipient'}</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Sent</TableCell>
                <TableCell width={50}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Spinner size={40} />
                  </TableCell>
                </TableRow>
              ) : (viewMode === 'received' ? notifications : triggeredNotifications).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      {viewMode === 'received' 
                        ? 'No notifications received. Try creating a test notification.' 
                        : 'No notifications triggered yet. Create some news posts or events to see notifications you generate for others.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (viewMode === 'received' ? notifications : triggeredNotifications).map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      {getStatusChip(notification)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={notification.notification_type} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {notification.subject_line}
                      </Typography>
                      {notification.error_message && (
                        <Typography variant="caption" color="error">
                          Error: {notification.error_message}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {viewMode === 'received' 
                          ? (notification.networks?.name || 'Unknown')
                          : (notification.profiles?.full_name || 'Unknown User')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {formatDate(notification.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {notification.sent_at ? formatDate(notification.sent_at) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Delete notification">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteNotification(notification.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          💡 Tip: "Received" shows notifications sent to you. "You Triggered" shows notifications your posts/events generated for other network members. 
          Automatic processing runs every minute. Use test buttons to verify functionality.
        </Typography>

        {/* End-to-End Tester */}
        {showTester && (
          <Box sx={{ mt: 3 }}>
            <NotificationSystemTester />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSystemManager;