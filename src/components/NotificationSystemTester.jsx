import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Stack,
  Divider,
  Chip
} from '@mui/material';
import Spinner from './Spinner';
import {
  Science as TestIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useProfile } from '../context/profileContext';
import { 
  queueNewsNotifications, 
  queueEventNotifications,
  queueMentionNotification,
  queueDirectMessageNotification
} from '../services/emailNotificationService';
// Removed processPendingNotifications - now handled server-side
import { supabase } from '../supabaseclient';

const NotificationSystemTester = () => {
  const { activeProfile } = useProfile();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState({});
  const [processing, setProcessing] = useState(false);

  const runTest = async (testType, testFunction, testName) => {
    setResults(prev => ({ ...prev, [testType]: { status: 'running', message: 'Testing...' } }));
    
    try {
      const result = await testFunction();
      setResults(prev => ({ 
        ...prev, 
        [testType]: { 
          status: result.success ? 'success' : 'error', 
          message: result.message || (result.success ? 'Test passed' : 'Test failed'),
          details: result
        } 
      }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [testType]: { 
          status: 'error', 
          message: `Test failed: ${error.message}`,
          error
        } 
      }));
    }
  };

  const testNewsNotifications = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('network_id')
      .eq('id', activeProfile.id)
      .single();

    if (!profile?.network_id) {
      throw new Error('Profile not in a network');
    }

    const fakeNewsId = crypto.randomUUID();
    return await queueNewsNotifications(
      profile.network_id,
      fakeNewsId,
      activeProfile.id,
      'Test News Notification - System Test',
      'This is a comprehensive test of the news notification system. The email should display the full post content with proper formatting, author information, and call-to-action buttons.'
    );
  };

  const testEventNotifications = async () => {
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
    futureDate.setDate(futureDate.getDate() + 14); // 2 weeks from now

    return await queueEventNotifications(
      profile.network_id,
      fakeEventId,
      activeProfile.id,
      'Test Event Notification - System Test',
      'This is a comprehensive test of the event notification system. The email should display event details including date, time, location, and RSVP options.',
      futureDate.toISOString(),
      'Test Conference Center, Room 101, 123 Main Street'
    );
  };

  const testMentionNotifications = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('network_id')
      .eq('id', activeProfile.id)
      .single();

    if (!profile?.network_id) {
      throw new Error('Profile not in a network');
    }

    const fakeMessageId = crypto.randomUUID();
    
    return await queueMentionNotification(
      activeProfile.id, // mention self for testing
      profile.network_id,
      'System Tester',
      `Hey @${activeProfile.full_name || 'User'}, this is a test mention notification! The email should show the message context and highlight the mention properly.`,
      fakeMessageId
    );
  };

  const testDirectMessageNotifications = async () => {
    const fakeMessageId = crypto.randomUUID();
    const { data: profile } = await supabase
      .from('profiles')
      .select('network_id, full_name')
      .eq('id', activeProfile.id)
      .single();

    if (!profile?.network_id) {
      throw new Error('Profile not in a network');
    }

    // Create test notification directly in queue (bypasses self-notification check)
    const testNotification = {
      recipient_id: activeProfile.id,
      network_id: profile.network_id,
      notification_type: 'direct_message',
      subject_line: `Test Direct Message from ${profile.full_name || 'Test User'}`,
      content_preview: 'This is a comprehensive test of the direct message notification system. The email should display the message content with proper formatting and direct links to the conversation.',
      related_item_id: fakeMessageId,
      is_sent: false,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('notification_queue')
      .insert([testNotification]);

    if (error) throw error;

    return { success: true, message: 'Direct message notification queued successfully', count: 1 };
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults({});
    
    try {
      // Run all notification type tests
      await runTest('news', testNewsNotifications, 'News Notifications');
      await runTest('event', testEventNotifications, 'Event Notifications');
      await runTest('mention', testMentionNotifications, 'Mention Notifications');
      await runTest('direct_message', testDirectMessageNotifications, 'Direct Message Notifications');
      
      // Wait a moment for all tests to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setTesting(false);
    }
  };

  const processTestNotifications = async () => {
    setProcessing(true);
    
    try {
      // Call the edge function directly
      const { data, error } = await supabase.functions.invoke('process-notifications', {
        body: { trigger: 'test' }
      });
      
      if (error) throw error;
      
      setResults(prev => ({ 
        ...prev, 
        processing: { 
          status: data?.success ? 'success' : 'error', 
          message: data?.success ? `Processed ${data?.processed || 0} notifications: ${data?.sent || 0} sent, ${data?.failed || 0} failed` : (data?.error || 'Processing failed'),
          details: data
        } 
      }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        processing: { 
          status: 'error', 
          message: `Processing failed: ${error.message}`,
          error
        } 
      }));
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckIcon color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'running': return <Spinner size={40} />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'running': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <TestIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Notification System End-to-End Tester
            </Typography>
          </Box>
          
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<TestIcon />}
              onClick={runAllTests}
              disabled={testing}
            >
              {testing ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={processing ? <Spinner size={32} /> : <SendIcon />}
              onClick={processTestNotifications}
              disabled={processing}
            >
              Process Test Emails
            </Button>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" mb={3}>
          This tester creates sample notifications of each type and verifies the complete email delivery pipeline.
          Run the tests first, then process the emails to send them via the Edge Function.
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={2}>
          {[
            { key: 'news', label: 'News Notifications', description: 'Tests news post notifications with author info and content preview' },
            { key: 'event', label: 'Event Notifications', description: 'Tests event notifications with date, location, and RSVP details' },
            { key: 'mention', label: 'Mention Notifications', description: 'Tests mention notifications with message context and highlighting' },
            { key: 'direct_message', label: 'Direct Message Notifications', description: 'Tests DM notifications with sender info and message content' }
          ].map(({ key, label, description }) => {
            const result = results[key];
            return (
              <Box key={key} p={2} border={1} borderColor="divider" borderRadius={1}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {label}
                  </Typography>
                  {result && (
                    <Chip
                      icon={getStatusIcon(result.status)}
                      label={result.status}
                      color={getStatusColor(result.status)}
                      size="small"
                    />
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {description}
                </Typography>
                
                {result && (
                  <Alert 
                    severity={result.status === 'success' ? 'success' : result.status === 'error' ? 'error' : 'info'}
                    sx={{ mt: 1 }}
                  >
                    {result.message}
                    {result.details?.count && (
                      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                        Recipients: {result.details.count}
                      </Typography>
                    )}
                  </Alert>
                )}
              </Box>
            );
          })}

          {/* Processing Results */}
          {results.processing && (
            <>
              <Divider />
              <Box p={2} border={1} borderColor="divider" borderRadius={1}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Email Processing
                  </Typography>
                  <Chip
                    icon={getStatusIcon(results.processing.status)}
                    label={results.processing.status}
                    color={getStatusColor(results.processing.status)}
                    size="small"
                  />
                </Box>
                
                <Alert 
                  severity={results.processing.status === 'success' ? 'success' : 'error'}
                  sx={{ mt: 1 }}
                >
                  {results.processing.message}
                  {results.processing.details && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      Sent: {results.processing.details.sent || 0}, Failed: {results.processing.details.failed || 0}
                    </Typography>
                  )}
                </Alert>
              </Box>
            </>
          )}
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
          💡 Test emails will be sent to your profile's contact email address. Check all notification types have proper content formatting and working action buttons.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default NotificationSystemTester;