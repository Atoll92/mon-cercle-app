// src/pages/PasswordUpdatePage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseclient';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material';

function PasswordUpdatePage() {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // When redirected from the email link, Supabase auto-authenticates the user with the token
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!session || error) {
        setError('You must follow the password reset link from your email.');
      }
    };

    checkSession();
  }, []);

  const handleUpdatePassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setError(error.message || 'Failed to update password.');
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
          Update Password
        </Typography>
        <Typography variant="body1">
          Enter your new password below.
        </Typography>
        <Box component="form" onSubmit={handleUpdatePassword} width="100%" mt={2}>
          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        {message && <Alert severity="success">{message}</Alert>}
      </Box>
    </Container>
  );
}

export default PasswordUpdatePage;