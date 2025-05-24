import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';

const TestNotificationSystem = () => {
  const { user } = useAuth();
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
        .eq('id', user.id)
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

      // Test if the notification_queue table exists
      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .limit(1);

      if (error) {
        throw error;
      }

      setResult({
        success: true,
        message: 'Notification queue table exists!',
        data: data
      });

    } catch (error) {
      console.error('Test error:', error);
      setResult({
        success: false,
        message: `Notification queue test failed: ${error.message}`,
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
          🧪 Test Notification System
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="outlined"
            onClick={testDatabaseColumns}
            disabled={testing}
            startIcon={testing ? <CircularProgress size={16} /> : null}
          >
            Test Database Columns
          </Button>
          
          <Button
            variant="outlined"
            onClick={testNotificationQueue}
            disabled={testing}
            startIcon={testing ? <CircularProgress size={16} /> : null}
          >
            Test Notification Queue
          </Button>
        </Box>

        {result && (
          <Alert 
            severity={result.success ? 'success' : 'error'}
            sx={{ mt: 2 }}
          >
            <Typography variant="body2">
              {result.message}
            </Typography>
            {result.data && (
              <Typography variant="caption" component="pre" sx={{ mt: 1, display: 'block', fontSize: '0.75rem' }}>
                {JSON.stringify(result.data, null, 2)}
              </Typography>
            )}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default TestNotificationSystem;