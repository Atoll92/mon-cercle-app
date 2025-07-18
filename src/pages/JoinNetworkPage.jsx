import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import Spinner from '../components/Spinner';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Container,
  Avatar,
  Stack,
  Divider,
  Chip
} from '@mui/material';
import {
  Group as GroupIcon,
  Login as LoginIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CalendarMonth as CalendarIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { getInvitationByCode, joinNetworkViaInvitation } from '../api/invitations';
import { fetchNetworkDetails, getUserProfile } from '../api/networks';

function JoinNetworkPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [network, setNetwork] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  // Extract email from query params if present
  const searchParams = new URLSearchParams(location.search);
  const inviteeEmail = searchParams.get('email');

  useEffect(() => {
    const fetchInvitationData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch invitation details
        const invitationData = await getInvitationByCode(code);
        if (!invitationData) {
          setError('Invalid or expired invitation link');
          return;
        }

        setInvitation(invitationData);

        // Fetch network details
        const networkData = await fetchNetworkDetails(invitationData.network_id);
        if (!networkData) {
          setError('Network not found');
          return;
        }

        setNetwork(networkData);

        // If user is logged in, check if they're already a member
        if (user) {
          const profile = await getUserProfile(user.id);

          if (profile) {
            setUserProfile(profile);
            if (profile.network_id === invitationData.network_id) {
              setError('You are already a member of this network');
              setSuccess(true);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError('Failed to load invitation details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitationData();
  }, [code, user]);

  const handleJoin = async () => {
    if (!user) {
      // Redirect to signup with return URL and email if present
      const signupUrl = inviteeEmail 
        ? `/signup?redirect=/join/${code}&email=${encodeURIComponent(inviteeEmail)}`
        : `/signup?redirect=/join/${code}`;
      navigate(signupUrl);
      return;
    }

    try {
      setJoining(true);
      setError(null);

      await joinNetworkViaInvitation(code, inviteeEmail);
      setSuccess(true);

      // Redirect to network page after 2 seconds with from_invite flag
      setTimeout(() => {
        navigate('/network?from_invite=true');
      }, 2000);
    } catch (err) {
      console.error('Error joining network:', err);
      setError(err.message || 'Failed to join network');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Spinner />
        </Box>
      </Container>
    );
  }

  if (error && !success) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            {error}
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/"
            sx={{ mt: 3 }}
          >
            Go to Home
          </Button>
        </Paper>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            {error ? 'Already a Member!' : 'Successfully Joined!'}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {error ? `You're already part of ${network?.name}` : `Welcome to ${network?.name}!`}
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/network?from_invite=true"
          >
            Go to Network
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        {/* Network Info */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2,
              bgcolor: 'primary.main'
            }}
          >
            {network?.logo_url ? (
              <img src={network.logo_url} alt={network.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <GroupIcon sx={{ fontSize: 40 }} />
            )}
          </Avatar>
          
          <Typography variant="h4" gutterBottom>
            Join {network?.name}
          </Typography>
          
          {network?.description && (
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {network.description}
            </Typography>
          )}

          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
            <Chip
              icon={<PeopleIcon />}
              label={`${network?.member_count || 0} members`}
              size="small"
            />
            <Chip
              icon={<CalendarIcon />}
              label={`Created ${new Date(network?.created_at).toLocaleDateString()}`}
              size="small"
            />
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Invitation Details */}
        {invitation?.name && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Invitation: <strong>{invitation.name}</strong>
            </Typography>
            {invitation?.description && (
              <Typography variant="body2" color="text.secondary">
                {invitation.description}
              </Typography>
            )}
          </Box>
        )}

        {/* Usage/Expiration Info */}
        <Stack spacing={1} sx={{ mb: 3 }}>
          {invitation?.max_uses && (
            <Alert severity="info" icon={false}>
              Uses: {invitation.uses_count} / {invitation.max_uses}
            </Alert>
          )}
          {invitation?.expires_at && (
            <Alert 
              severity={new Date(invitation.expires_at) < new Date() ? "error" : "info"} 
              icon={false}
            >
              {new Date(invitation.expires_at) < new Date() 
                ? "This invitation has expired"
                : `Expires: ${new Date(invitation.expires_at).toLocaleDateString()}`
              }
            </Alert>
          )}
        </Stack>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
          {user ? (
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleJoin}
              disabled={joining || userProfile?.network_id}
              startIcon={joining ? <Spinner size={20} /> : <CheckCircleIcon />}
            >
              {joining ? 'Joining...' : userProfile?.network_id ? 'Switch Network' : 'Join Network'}
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleJoin}
                startIcon={<LoginIcon />}
              >
                Sign Up to Join
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                component={Link}
                to={inviteeEmail 
                  ? `/login?redirect=/join/${code}&email=${encodeURIComponent(inviteeEmail)}`
                  : `/login?redirect=/join/${code}`}
              >
                Already have an account? Sign In
              </Button>
            </>
          )}
          
          <Button
            variant="outlined"
            fullWidth
            component={Link}
            to="/"
          >
            Cancel
          </Button>
        </Box>

        {userProfile?.network_id && userProfile.network_id !== network?.id && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Note: Joining this network will switch you from your current network.
          </Alert>
        )}
      </Paper>
    </Container>
  );
}

export default JoinNetworkPage;