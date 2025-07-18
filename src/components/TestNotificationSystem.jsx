import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Divider,
  Stack
} from '@mui/material';
import Spinner from './Spinner';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { queueNewsNotifications, processPendingNotifications } from '../services/emailNotificationService';

const TestNotificationSystem = () => {
  const { activeProfile } = useProfile();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const testDatabaseColumns = async () => {
    try {
      setTesting(true);
      setResult(null);

      // Test if the new columns exist by trying to select them
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email_notifications_enabled, notify_on_news, notify_on_events, notify_on_mentions, notify_on_direct_messages')
        .eq('id', activeProfile.id)
        .single();

      if (error) {
        throw error;
      }

      setResult({
        success: true,
        message: 'Database columns exist!',
        data: data
      });

    } catch (error) {
      console.error('Test error:', error);
      setResult({
        success: false,
        message: `Database test failed: ${error.message}`,
        error: error
      });
    } finally {
      setTesting(false);
    }
  };

  const testNotificationQueue = async () => {
    try {
      setTesting(true);
      setResult(null);

      console.log('🔍 [QUEUE DEBUG] Testing notification queue visibility...');

      // Test different ways to query the notification_queue
      const tests = [];

      // Test 1: All notifications
      const { data: allData, error: allError } = await supabase
        .from('notification_queue')
        .select('*');
      
      tests.push({
        name: 'All notifications',
        data: allData,
        error: allError,
        count: allData?.length || 0
      });

      // Test 2: Only user's notifications (RLS might be filtering)
      const { data: userOnlyData, error: userOnlyError } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('recipient_id', activeProfile.id);
      
      tests.push({
        name: 'User notifications only',
        data: userOnlyData,
        error: userOnlyError,
        count: userOnlyData?.length || 0
      });

      // Test 3: Pending notifications
      const { data: pendingData, error: pendingError } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('is_sent', false);
      
      tests.push({
        name: 'Pending notifications',
        data: pendingData,
        error: pendingError,
        count: pendingData?.length || 0
      });

      // Test 4: With detailed select (like in processPendingNotifications)
      const { data: detailedData, error: detailedError } = await supabase
        .from('notification_queue')
        .select(`
          id,
          recipient_id,
          network_id,
          notification_type,
          subject_line,
          content_preview,
          related_item_id,
          is_sent,
          created_at,
          profiles!notification_queue_recipient_id_fkey (
            contact_email,
            full_name
          ),
          networks!notification_queue_network_id_fkey (
            name
          )
        `)
        .eq('is_sent', false);
      
      tests.push({
        name: 'Detailed query (like process function)',
        data: detailedData,
        error: detailedError,
        count: detailedData?.length || 0
      });

      console.log('🔍 [QUEUE DEBUG] Queue test results:', tests);

      const hasErrors = tests.some(test => test.error);
      const totalNotifications = Math.max(...tests.map(test => test.count));

      setResult({
        success: !hasErrors,
        message: hasErrors ? 'Some queue queries failed!' : `Queue accessible! Max found: ${totalNotifications}`,
        data: tests
      });

    } catch (error) {
      console.error('🔍 [QUEUE DEBUG] Test error:', error);
      setResult({
        success: false,
        message: `Notification queue test failed: ${error.message}`,
        error: error
      });
    } finally {
      setTesting(false);
    }
  };

  const testUserProfile = async () => {
    try {
      setTesting(true);
      setResult(null);

      // Get user's full profile including network
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeProfile.id)
        .single();

      if (error) {
        throw error;
      }

      setResult({
        success: true,
        message: 'User profile retrieved successfully!',
        data: data
      });

    } catch (error) {
      console.error('Test error:', error);
      setResult({
        success: false,
        message: `User profile test failed: ${error.message}`,
        error: error
      });
    } finally {
      setTesting(false);
    }
  };

  const testCreateFakeNotification = async () => {
    try {
      setTesting(true);
      setResult(null);

      // Get user's network first
      const { data: profile } = await supabase
        .from('profiles')
        .select('network_id')
        .eq('id', activeProfile.id)
        .single();

      if (!profile?.network_id) {
        throw new Error('User not in a network');
      }

      // Create a fake notification with a valid UUID
      const fakeNewsId = crypto.randomUUID(); // Generate a valid UUID
      const fakeResult = await queueNewsNotifications(
        profile.network_id,
        fakeNewsId,
        activeProfile.id,
        'Test News Post',
        'This is a test news post to check if notifications are working.'
      );

      setResult({
        success: fakeResult.success,
        message: fakeResult.success ? 'Fake notification queued successfully!' : fakeResult.error,
        data: fakeResult
      });

    } catch (error) {
      console.error('Test error:', error);
      setResult({
        success: false,
        message: `Fake notification test failed: ${error.message}`,
        error: error
      });
    } finally {
      setTesting(false);
    }
  };

  const testProcessNotifications = async () => {
    try {
      setTesting(true);
      setResult(null);

      const processResult = await processPendingNotifications();

      setResult({
        success: processResult.success,
        message: processResult.success ? 'Notifications processed!' : processResult.error,
        data: processResult
      });

    } catch (error) {
      console.error('Test error:', error);
      setResult({
        success: false,
        message: `Process notifications test failed: ${error.message}`,
        error: error
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card sx={{ m: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🧪 Test Notification System (Dev Mode)
        </Typography>
        
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Check browser console for detailed debug logs
          </Typography>

          <Divider />

          <Typography variant="subtitle2">Database Tests</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={testDatabaseColumns}
              disabled={testing}
              startIcon={testing ? <Spinner size={16} /> : null}
            >
              Test Columns
            </Button>
            
            <Button
              variant="outlined"
              size="small"
              onClick={testNotificationQueue}
              disabled={testing}
              startIcon={testing ? <Spinner size={16} /> : null}
            >
              Test Queue Table
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={testUserProfile}
              disabled={testing}
              startIcon={testing ? <Spinner size={16} /> : null}
            >
              Test User Profile
            </Button>
          </Box>

          <Divider />

          <Typography variant="subtitle2">Notification Flow Tests</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="small"
              onClick={testCreateFakeNotification}
              disabled={testing}
              startIcon={testing ? <Spinner size={16} /> : null}
            >
              Queue Fake Notification
            </Button>
            
            <Button
              variant="contained"
              size="small"
              color="secondary"
              onClick={testProcessNotifications}
              disabled={testing}
              startIcon={testing ? <Spinner size={16} /> : null}
            >
              Process Pending
            </Button>
          </Box>

          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            ⚠️ If notifications are queued but not visible, there may be a Row Level Security (RLS) policy issue
          </Typography>

          {result && (
            <Alert 
              severity={result.success ? 'success' : 'error'}
              sx={{ mt: 2 }}
            >
              <Typography variant="body2">
                {result.message}
              </Typography>
              {result.data && (
                <Typography variant="caption" component="pre" sx={{ mt: 1, display: 'block', fontSize: '0.75rem', maxHeight: 200, overflow: 'auto' }}>
                  {JSON.stringify(result.data, null, 2)}
                </Typography>
              )}
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TestNotificationSystem;