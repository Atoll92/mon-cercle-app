// src/pages/PaymentSuccessPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Container, Typography, Paper, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { supabase } from '../supabaseclient';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        navigate('/dashboard');
        return;
      }

      try {
        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify payment was successful
        const { data: network } = await supabase
          .from('networks')
          .select('subscription_status')
          .eq('stripe_subscription_id', sessionId)
          .single();

        if (network?.subscription_status === 'active') {
          setTimeout(() => {
            navigate('/network-admin');
          }, 3000);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
      } finally {
        setVerifying(false);
      }
    };

    verifySession();
  }, [searchParams, navigate]);

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        {verifying ? (
          <CircularProgress />
        ) : (
          <>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Payment Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your subscription has been activated. You'll be redirected to your dashboard in a moment.
            </Typography>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default PaymentSuccessPage;