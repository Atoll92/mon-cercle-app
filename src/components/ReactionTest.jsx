/**
 * ReactionTest Component
 * Simple component to test if reactions are working
 */

import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import ReactionBar from './ReactionBar';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';

const ReactionTest = () => {
  const { activeProfile } = useAuth();
  const [testPost, setTestPost] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestPost();
  }, [activeProfile]);

  const loadTestPost = async () => {
    if (!activeProfile?.network_id) {
      setError('No active profile or network');
      setLoading(false);
      return;
    }

    try {
      // Get the first post in the network
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('network_id', activeProfile.network_id)
        .limit(1)
        .single();

      if (error) throw error;

      if (!data) {
        setError('No posts found in this network');
      } else {
        setTestPost(data);
        console.log('Test post loaded:', data);
      }
    } catch (err) {
      console.error('Error loading test post:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkReactionsTable = async () => {
    try {
      const { data, error, count } = await supabase
        .from('reactions')
        .select('*', { count: 'exact' });

      console.log('Reactions table check:', { data, error, count });
      alert(`Reactions in DB: ${count}\n${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      console.error('Error checking reactions:', err);
      alert('Error: ' + err.message);
    }
  };

  if (loading) {
    return <Typography>Loading test post...</Typography>;
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">Error: {error}</Typography>
          <Button onClick={loadTestPost} sx={{ mt: 2 }}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!testPost) {
    return <Typography>No test post available</Typography>;
  }

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Reaction System Test
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Testing reactions on: {testPost.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Post ID: {testPost.id}
          </Typography>
        </Box>

        <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, mb: 2 }}>
          <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
            Try adding reactions below:
          </Typography>
          <ReactionBar
            contentType="post"
            contentId={testPost.id}
            initialCount={testPost.reaction_count || 0}
            size="large"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={checkReactionsTable}
          >
            Check Reactions in DB
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={loadTestPost}
          >
            Reload Post
          </Button>
        </Box>

        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            Profile ID: {activeProfile?.id}<br />
            Network ID: {activeProfile?.network_id}<br />
            Post reaction_count: {testPost.reaction_count || 0}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReactionTest;
