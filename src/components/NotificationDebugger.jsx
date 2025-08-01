import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, Box, Alert, Chip, LinearProgress, TextField } from '@mui/material';
import { supabase } from '../supabaseclient';
// Removed: import { processPendingNotifications, getAutomaticProcessorStatus } from '../services/emailNotificationService';
// Notification processing now handled server-side via cron job

const NotificationDebugger = () => {
  const [queue, setQueue] = useState([]);
  const [processorStatus, setProcessorStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [edgeFunctionTest, setEdgeFunctionTest] = useState(null);
  const [testEmail, setTestEmail] = useState('');

  // Fetch notification queue
  const fetchQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .select(`
          *,
          profiles!notification_queue_recipient_id_fkey (
            full_name,
            contact_email
          ),
          networks!notification_queue_network_id_fkey (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setQueue(data || []);
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  };

  // Test edge function directly
  const testEdgeFunction = async () => {
    if (!testEmail) {
      alert('Please enter a test email');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('network-invite', {
        body: {
          toEmail: testEmail,
          networkName: 'Test Network',
          inviterName: 'Notification Debugger',
          type: 'news',
          subject: 'Test Notification from Debugger',
          content: 'This is a test email to verify the edge function is working correctly.',
          relatedItemId: crypto.randomUUID()
        }
      });

      setEdgeFunctionTest({
        success: !error,
        data: data,
        error: error?.message,
        timestamp: new Date().toISOString()
      });

      console.log('Edge function test result:', { data, error });
    } catch (err) {
      setEdgeFunctionTest({
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  // Process queue manually
  const processQueue = async () => {
    setLoading(true);
    try {
      // Call the edge function directly
      const { data, error } = await supabase.functions.invoke('process-notifications', {
        body: { trigger: 'debug' }
      });
      
      if (error) throw error;
      
      console.log('Process result:', data);
      alert(`Processed: ${data?.sent || 0} sent, ${data?.failed || 0} failed`);
      fetchQueue();
    } catch (error) {
      console.error('Error processing:', error);
      alert('Error processing queue: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Processor status no longer relevant - handled by server-side cron
    setProcessorStatus({ 
      isRunning: true, 
      processingInterval: '60 seconds',
      info: 'Notifications processed server-side via cron job'
    });
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>Notification System Debugger</Typography>
      
      {/* Processor Status */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Automatic Processor Status</Typography>
          {processorStatus && (
            <Box sx={{ mt: 1 }}>
              <Chip 
                label={processorStatus.isRunning ? 'Running' : 'Stopped'}
                color={processorStatus.isRunning ? 'success' : 'error'}
                size="small"
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Processing interval: {processorStatus.processingInterval}
              </Typography>
              {processorStatus.nextProcessing && (
                <Typography variant="body2">
                  Next processing: {new Date(processorStatus.nextProcessing).toLocaleString()}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Edge Function Test */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Edge Function Test</Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <TextField
              label="Test Email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              size="small"
              fullWidth
            />
            <Button 
              variant="contained" 
              onClick={testEdgeFunction}
              disabled={loading}
            >
              Test
            </Button>
          </Box>
          {edgeFunctionTest && (
            <Alert 
              severity={edgeFunctionTest.success ? 'success' : 'error'}
              sx={{ mt: 2 }}
            >
              {edgeFunctionTest.success ? 
                'Email sent successfully!' : 
                `Error: ${edgeFunctionTest.error}`
              }
              <Typography variant="caption" display="block">
                {edgeFunctionTest.timestamp}
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Queue Status */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Notification Queue</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={fetchQueue} size="small">Refresh</Button>
              <Button 
                onClick={processQueue} 
                variant="contained" 
                size="small"
                disabled={loading}
              >
                Process Now
              </Button>
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip label={`Total: ${queue.length}`} size="small" />
            <Chip 
              label={`Pending: ${queue.filter(n => !n.is_sent && !n.error_message).length}`} 
              color="warning" 
              size="small" 
            />
            <Chip 
              label={`Sent: ${queue.filter(n => n.is_sent).length}`} 
              color="success" 
              size="small" 
            />
            <Chip 
              label={`Failed: ${queue.filter(n => n.error_message).length}`} 
              color="error" 
              size="small" 
            />
          </Box>

          {/* Queue Table */}
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((notif) => (
                  <tr key={notif.id}>
                    <td>
                      <Chip 
                        label={notif.notification_type} 
                        size="small" 
                        variant="outlined"
                      />
                    </td>
                    <td>{notif.profiles?.contact_email || 'N/A'}</td>
                    <td>{notif.subject_line?.substring(0, 50)}...</td>
                    <td>
                      {notif.is_sent ? (
                        <Chip label="Sent" color="success" size="small" />
                      ) : notif.error_message ? (
                        <Chip label="Failed" color="error" size="small" />
                      ) : (
                        <Chip label="Pending" color="warning" size="small" />
                      )}
                    </td>
                    <td>{new Date(notif.created_at).toLocaleString()}</td>
                    <td>{notif.error_message?.substring(0, 50)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationDebugger;