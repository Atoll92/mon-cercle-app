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
  Chip,
  Fade,
  Grow,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Group as GroupIcon,
  Login as LoginIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CalendarMonth as CalendarIcon,
  People as PeopleIcon,
  ArrowForward as ArrowForwardIcon
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Spinner size={120} />
      </Box>
    );
  }

  if (error && !success) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          px: 2
        }}
      >
        <Fade in={true} timeout={600}>
          <Container maxWidth="sm">
            <Paper
              elevation={12}
              sx={{
                p: { xs: 3, sm: 5 },
                textAlign: 'center',
                borderRadius: 4,
                background: theme.palette.mode === 'dark'
                  ? 'rgba(30, 30, 30, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <ErrorIcon
                color="error"
                sx={{
                  fontSize: { xs: 60, sm: 80 },
                  mb: 2,
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 }
                  }
                }}
              />
              <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom fontWeight={600}>
                {error}
              </Typography>
              <Button
                variant="contained"
                component={Link}
                to="/"
                size="large"
                sx={{
                  mt: 3,
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                {t('joinNetwork.goToHome')}
              </Button>
            </Paper>
          </Container>
        </Fade>
      </Box>
    );
  }

  if (success) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          px: 2
        }}
      >
        <Fade in={true} timeout={600}>
          <Container maxWidth="sm">
            <Paper
              elevation={12}
              sx={{
                p: { xs: 3, sm: 5 },
                textAlign: 'center',
                borderRadius: 4,
                background: theme.palette.mode === 'dark'
                  ? 'rgba(30, 30, 30, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Grow in={true} timeout={800}>
                <CheckCircleIcon
                  color="success"
                  sx={{
                    fontSize: { xs: 60, sm: 80 },
                    mb: 2,
                    animation: 'bounce 1s ease-in-out',
                    '@keyframes bounce': {
                      '0%, 100%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.1)' }
                    }
                  }}
                />
              </Grow>
              <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom fontWeight={600}>
                {error ? t('joinNetwork.alreadyMember') : t('joinNetwork.successfullyJoined')}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  mb: 3,
                  fontSize: { xs: '0.95rem', sm: '1.1rem' }
                }}
              >
                {error ? t('joinNetwork.alreadyPartOf', { networkName: network?.name }) : t('joinNetwork.welcomeTo', { networkName: network?.name })}
              </Typography>
              <Button
                variant="contained"
                component={Link}
                to="/network?from_invite=true"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                {t('joinNetwork.goToNetwork')}
              </Button>
            </Paper>
          </Container>
        </Fade>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: { xs: 3, sm: 4 },
        px: 2
      }}
    >
      <Fade in={true} timeout={600}>
        <Container maxWidth="sm">
          {/* Invitation Header with Logo */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              mb: 3,
              px: 2
            }}
          >
            <Box>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={isMobile ? "32" : "40"}
                height={isMobile ? "32" : "40"}
                viewBox="-125 -125 250 250"
                style={{
                  filter: 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.3))'
                }}
              >
                <defs>
                  <linearGradient id="invite-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="100%" stopColor="#e0e0e0" stopOpacity="0.9" />
                  </linearGradient>
                </defs>

                {/* Central big disk */}
                <circle cx="0" cy="0" r="35" fill="url(#invite-gradient)" />

                {/* Medium disks */}
                <g fill="url(#invite-gradient)">
                  <circle cx="70.00" cy="0.00" r="25" opacity="0.9" />
                  <circle cx="43.64" cy="54.72" r="25" opacity="0.9" />
                  <circle cx="-15.57" cy="68.24" r="25" opacity="0.9" />
                  <circle cx="-63.06" cy="30.37" r="25" opacity="0.9" />
                  <circle cx="-63.06" cy="-30.37" r="25" opacity="0.9" />
                  <circle cx="-15.57" cy="-68.24" r="25" opacity="0.9" />
                  <circle cx="43.64" cy="-54.72" r="25" opacity="0.9" />
                </g>

                {/* Small disks */}
                <g fill="#ffffff">
                  <circle cx="85.59" cy="41.21" r="12" opacity="0.7" />
                  <circle cx="21.13" cy="92.61" r="12" opacity="0.7" />
                  <circle cx="-59.23" cy="74.27" r="12" opacity="0.7" />
                  <circle cx="-95.00" cy="0" r="12" opacity="0.7" />
                  <circle cx="-59.23" cy="-74.27" r="12" opacity="0.7" />
                  <circle cx="21.13" cy="-92.61" r="12" opacity="0.7" />
                  <circle cx="85.59" cy="-41.21" r="12" opacity="0.7" />
                </g>
              </svg>
            </Box>
            <Typography
              variant={isMobile ? 'body1' : 'h6'}
              sx={{
                color: 'white',
                fontWeight: 500,
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              {t('joinNetwork.invitationHeader')}
            </Typography>
          </Box>

          <Paper
            elevation={12}
            sx={{
              overflow: 'hidden',
              borderRadius: 4,
              background: theme.palette.mode === 'dark'
                ? 'rgba(30, 30, 30, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Network Background Image */}
            {network?.background_image_url && (
              <Box
                sx={{
                  height: { xs: 180, sm: 220, md: 260 },
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
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5))',
                    zIndex: 1
                  }}
                />
                <Grow in={true} timeout={800}>
                  <Avatar
                    sx={{
                      width: { xs: 80, sm: 100 },
                      height: { xs: 80, sm: 100 },
                      zIndex: 2,
                      bgcolor: 'primary.main',
                      border: '4px solid white',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                    }}
                  >
                    {network?.logo_url ? (
                      <img src={network.logo_url} alt={network.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <GroupIcon sx={{ fontSize: { xs: 40, sm: 50 } }} />
                    )}
                  </Avatar>
                </Grow>
              </Box>
            )}

            {/* Network Info */}
            <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
              {/* Show avatar here if no background image */}
              {!network?.background_image_url && (
                <Grow in={true} timeout={800}>
                  <Avatar
                    sx={{
                      width: { xs: 80, sm: 100 },
                      height: { xs: 80, sm: 100 },
                      mx: 'auto',
                      mb: 2,
                      bgcolor: 'primary.main',
                      border: '4px solid',
                      borderColor: 'primary.light',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                  >
                    {network?.logo_url ? (
                      <img src={network.logo_url} alt={network.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <GroupIcon sx={{ fontSize: { xs: 40, sm: 50 } }} />
                    )}
                  </Avatar>
                </Grow>
              )}

              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                gutterBottom
                sx={{
                  mt: network?.background_image_url ? 2 : 0,
                  fontWeight: 700,
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {network?.name}
              </Typography>

              {network?.description && (
                <Box sx={{ my: 3, textAlign: 'left' }}>
                  <UserContent
                    content={network.description}
                    maxLines={isMobile ? 4 : 5}
                    sx={{
                      fontSize: { xs: '0.95rem', sm: '1rem' },
                      color: 'text.secondary'
                    }}
                  />
                </Box>
              )}

              <Stack
                direction={isMobile ? 'column' : 'row'}
                spacing={2}
                justifyContent="center"
                alignItems="center"
                sx={{ mt: 3, mb: 3 }}
              >
                <Chip
                  icon={<PeopleIcon />}
                  label={t('joinNetwork.membersCount', { count: network?.member_count || 0 })}
                  size={isMobile ? 'medium' : 'small'}
                  sx={{
                    fontWeight: 600,
                    px: 1,
                    minWidth: isMobile ? '200px' : 'auto'
                  }}
                />
                <Chip
                  icon={<CalendarIcon />}
                  label={t('joinNetwork.createdOn', { date: new Date(network?.created_at).toLocaleDateString() })}
                  size={isMobile ? 'medium' : 'small'}
                  sx={{
                    fontWeight: 600,
                    px: 1,
                    minWidth: isMobile ? '200px' : 'auto'
                  }}
                />
              </Stack>
            </Box>

            <Box sx={{ px: { xs: 3, sm: 4 }, pb: { xs: 3, sm: 4 } }}>
              <Divider sx={{ mb: 3 }} />

              {/* Invitation Details */}
              {invitation?.name && (
                <Box sx={{ mb: 3, textAlign: 'left' }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight={600}>
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
              <Stack spacing={2} sx={{ mb: 3 }}>
                {invitation?.max_uses && (
                  <Alert
                    severity="info"
                    icon={false}
                    sx={{ borderRadius: 2, fontWeight: 500 }}
                  >
                    {t('joinNetwork.uses', { used: invitation.uses_count, max: invitation.max_uses })}
                  </Alert>
                )}
                {invitation?.expires_at && (
                  <Alert
                    severity={new Date(invitation.expires_at) < new Date() ? "error" : "info"}
                    icon={false}
                    sx={{ borderRadius: 2, fontWeight: 500 }}
                  >
                    {new Date(invitation.expires_at) < new Date()
                      ? t('joinNetwork.invitationExpired')
                      : t('joinNetwork.expires', { date: new Date(invitation.expires_at).toLocaleDateString() })
                    }
                  </Alert>
                )}
              </Stack>

              {/* Action Buttons */}
              <Stack spacing={2}>
                {user ? (
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleJoin}
                    disabled={joining || userProfile?.network_id}
                    startIcon={joining ? <Spinner size={20} /> : <CheckCircleIcon />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)'
                      }
                    }}
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
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)'
                        }
                      }}
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
                      startIcon={<LoginIcon />}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2
                        }
                      }}
                    >
                      {t('joinNetwork.alreadyHaveAccount')}
                    </Button>
                  </>
                )}

                <Button
                  variant="text"
                  fullWidth
                  component={Link}
                  to="/"
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    color: 'text.secondary'
                  }}
                >
                  {t('joinNetwork.cancel')}
                </Button>
              </Stack>

              {userProfile?.network_id && userProfile.network_id !== network?.id && (
                <Alert
                  severity="warning"
                  sx={{
                    mt: 3,
                    borderRadius: 2,
                    fontWeight: 500
                  }}
                >
                  {t('joinNetwork.switchNetworkWarning')}
                </Alert>
              )}
            </Box>
          </Paper>
        </Container>
      </Fade>
    </Box>
  );
}

export default JoinNetworkPage;