// src/pages/PasswordResetPage.jsx
import { useState } from 'react';
import { supabase } from '../supabaseclient';
import { Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material';

function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Use configured base URL for redirect
      const { config } = await import('../config/environment');
      const redirectUrl = `${config.app.baseUrl}/update-password`;
        
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setMessage('Password reset instructions sent! Please check your email.');
    } catch (error) {
      setError(error.message || 'Failed to send password reset email.');
      console.error("Password reset error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Reset Password
        </Typography>
        <Typography variant="body1">
          Enter your email address to receive password reset instructions.
        </Typography>
        <Box component="form" onSubmit={handlePasswordReset} width="100%" mt={2}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Instructions'}
          </Button>
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        {message && <Alert severity="success">{message}</Alert>}
        <Typography variant="body2" mt={2}>
          Remember your password? <Link to="/login">Log In</Link>
        </Typography>
      </Box>
    </Container>
  );
}

export default PasswordResetPage;
