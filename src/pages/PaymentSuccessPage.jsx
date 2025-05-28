import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Container, Typography, Paper, CircularProgress, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [networkId, setNetworkId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setVerifying(true);
        
        // First get the user's network ID
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('network_id')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          throw profileError;
        }
        
        if (!profile.network_id) {
          throw new Error('No network associated with your account');
        }
        
        setNetworkId(profile.network_id);
        
        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if the network subscription is active
        const { data: network, error: networkError } = await supabase
          .from('networks')
          .select('subscription_status, subscription_plan')
          .eq('id', profile.network_id)
          .single();
          
        if (networkError) {
          throw networkError;
        }
        
        if (network.subscription_status === 'active') {
          // Success! Redirect to network admin after a brief delay
          setTimeout(() => {
            navigate('/admin');
          }, 3000);
        } else {
          // Something might be wrong, but let's not alarm the user yet
          // Sometimes webhook processing can take a bit longer
          setTimeout(() => {
            navigate('/admin');
          }, 5000);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setError(error.message);
      } finally {
        setVerifying(false);
      }
    };
    
    verifyPayment();
  }, [user, navigate, searchParams]);

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        {verifying ? (
          <>
            <CircularProgress size={60} sx={{ mb: 3, color: 'success.main' }} />
            <Typography variant="h5" gutterBottom>
              Verifying your payment...
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Please wait while we confirm your payment and set up your subscription.
            </Typography>
          </>
        ) : error ? (
          <>
            <Typography variant="h5" color="error" gutterBottom>
              There was an issue verifying your payment
            </Typography>
            <Typography variant="body1" paragraph>
              {error}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Don't worry, if your payment was successful, your subscription will be activated shortly.
              Our system may need a few more minutes to process your payment.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/admin')}
            >
              Go to Admin Panel
            </Button>
          </>
        ) : (
          <>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Payment Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your subscription has been activated. You'll be redirected to your dashboard in a moment.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/admin')}
            >
              Go to Admin Panel
            </Button>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default PaymentSuccessPage;