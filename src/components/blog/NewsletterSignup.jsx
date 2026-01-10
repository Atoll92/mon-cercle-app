import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  CircularProgress,
  alpha
} from '@mui/material';
import { Email as EmailIcon, Check as CheckIcon } from '@mui/icons-material';
import { subscribeToBlog } from '../../api/blog';

const NewsletterSignup = ({ networkId, themeColor }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email?.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await subscribeToBlog(networkId, email);

      setSuccess(true);
      setEmail('');
    } catch (err) {
      console.error('Error subscribing:', err);
      setError('Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: alpha(themeColor, 0.05),
          border: '1px solid',
          borderColor: alpha(themeColor, 0.2),
          borderRadius: 2
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            bgcolor: 'success.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2
          }}
        >
          <CheckIcon sx={{ fontSize: 30, color: 'white' }} />
        </Box>
        <Typography variant="h6" gutterBottom>
          You're subscribed!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Thank you for subscribing. You'll receive updates when new posts are published.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        textAlign: 'center',
        bgcolor: alpha(themeColor, 0.03),
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2
      }}
    >
      <Box
        sx={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          bgcolor: alpha(themeColor, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2
        }}
      >
        <EmailIcon sx={{ fontSize: 30, color: themeColor }} />
      </Box>

      <Typography variant="h5" gutterBottom fontWeight={600}>
        Subscribe to Newsletter
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
        Get notified when new posts are published. No spam, unsubscribe anytime.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 400, mx: 'auto' }}>
          {error}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          gap: 1,
          maxWidth: 400,
          mx: 'auto',
          flexDirection: { xs: 'column', sm: 'row' }
        }}
      >
        <TextField
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          size="small"
          fullWidth
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper'
            }
          }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: themeColor,
            '&:hover': {
              bgcolor: alpha(themeColor, 0.9)
            },
            whiteSpace: 'nowrap',
            px: 3
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Subscribe'}
        </Button>
      </Box>
    </Paper>
  );
};

export default NewsletterSignup;
