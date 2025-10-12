import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useTranslation } from '../hooks/useTranslation';
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
import UserContent from '../components/UserContent';

function JoinNetworkPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
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
          setError(t('joinNetwork.errors.invalidInvitation'));
          return;
        }

        setInvitation(invitationData);

        // Fetch network details
        const networkData = await fetchNetworkDetails(invitationData.network_id);
        if (!networkData) {
          setError(t('joinNetwork.errors.networkNotFound'));
          return;
        }

        setNetwork(networkData);

        // If user is logged in, check if they're already a member
        if (user) {
          const profile = await getUserProfile(user.id);

          if (profile) {
            setUserProfile(profile);
            if (profile.network_id === invitationData.network_id) {
              setError(t('joinNetwork.errors.alreadyMember'));
              setSuccess(true);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError(t('joinNetwork.errors.loadFailed'));
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
      setError(err.message || t('joinNetwork.errors.joinFailed'));
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Spinner size={120} />
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
            {t('joinNetwork.goToHome')}
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
            {error ? t('joinNetwork.alreadyMember') : t('joinNetwork.successfullyJoined')}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {error ? t('joinNetwork.alreadyPartOf', { networkName: network?.name }) : t('joinNetwork.welcomeTo', { networkName: network?.name })}
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/network?from_invite=true"
          >
            {t('joinNetwork.goToNetwork')}
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 0, overflow: 'hidden' }}>
        {/* Network Background Image */}
        {network?.background_image_url && (
          <Box
            sx={{
              height: 200,
              backgroundImage: `url(${network.background_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Optional overlay for better text readability */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))',
                zIndex: 1
              }}
            />
            <Avatar
              sx={{
                width: 80,
                height: 80,
                zIndex: 2,
                bgcolor: 'primary.main',
                border: '3px solid white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              {network?.logo_url ? (
                <img src={network.logo_url} alt={network.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <GroupIcon sx={{ fontSize: 40 }} />
              )}
            </Avatar>
          </Box>
        )}
        
        {/* Network Info */}
        <Box sx={{ p: 4, mb: 0 }}>
          {/* Show avatar here if no background image */}
          {!network?.background_image_url && (
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
          )}
          
          <Typography variant="h4" gutterBottom sx={{ mt: network?.background_image_url ? 2 : 0 }}>
            {t('joinNetwork.joinNetwork', { networkName: network?.name })}
          </Typography>
          
          {network?.description && (
              <UserContent
                content={network.description}
              />
          )}

          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2,mb: 4 }}>
            <Chip
              icon={<PeopleIcon />}
              label={t('joinNetwork.membersCount', { count: network?.member_count || 0 })}
              size="small"
            />
            <Chip
              icon={<CalendarIcon />}
              label={t('joinNetwork.createdOn', { date: new Date(network?.created_at).toLocaleDateString() })}
              size="small"
            />
          </Stack>
        </Box>

        <Box sx={{ px: 4, pb: 4 }}>
          <Divider sx={{ mb: 3 }} />

          {/* Invitation Details */}
          {invitation?.name && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t('joinNetwork.invitation')}: <strong>{invitation.name}</strong>
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
                {t('joinNetwork.uses', { used: invitation.uses_count, max: invitation.max_uses })}
              </Alert>
            )}
            {invitation?.expires_at && (
              <Alert
                severity={new Date(invitation.expires_at) < new Date() ? "error" : "info"}
                icon={false}
              >
                {new Date(invitation.expires_at) < new Date()
                  ? t('joinNetwork.invitationExpired')
                  : t('joinNetwork.expires', { date: new Date(invitation.expires_at).toLocaleDateString() })
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
                startIcon={joining ? <Spinner size={40} /> : <CheckCircleIcon />}
              >
                {joining ? t('joinNetwork.joining') : userProfile?.network_id ? t('joinNetwork.switchNetwork') : t('joinNetwork.joinNetworkButton')}
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
                  {t('joinNetwork.signUpToJoin')}
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
                  {t('joinNetwork.alreadyHaveAccount')}
                </Button>
              </>
            )}

            <Button
              variant="outlined"
              fullWidth
              component={Link}
              to="/"
            >
              {t('joinNetwork.cancel')}
            </Button>
          </Box>

          {userProfile?.network_id && userProfile.network_id !== network?.id && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {t('joinNetwork.switchNetworkWarning')}
            </Alert>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default JoinNetworkPage;