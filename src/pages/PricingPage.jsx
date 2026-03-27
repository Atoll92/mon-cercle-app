import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  useMediaQuery
} from '@mui/material';
import Spinner from '../components/Spinner';
import {
  Check as CheckIcon,
  Groups as GroupsIcon,
  Storage as StorageIcon,
  AdminPanelSettings as AdminIcon,
  Headset as SupportIcon,
  Bookmark as BookmarkIcon,
  EventNote as EventIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  Speed as SpeedIcon,
  Verified as VerifiedIcon,
  Forum as ForumIcon,
  Email as EmailIcon,
  Chat as ChatIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { useTheme, alpha, createTheme, ThemeProvider } from '@mui/material/styles';
import ThreeJSBackground from '../components/ThreeJSBackground';
import { createCheckoutSession } from '../services/stripeService';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { PRICE_IDS } from '../stripe/config';
import { useTranslation } from '../hooks/useTranslation';

const PricingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const lightTheme = createTheme({
    palette: {
      mode: 'light',
    },
  });

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/signup');
      return;
    }

    try {
      setLoading(true);

      if (!activeProfile?.network_id) {
        alert(t('pricing.errors.noNetwork'));
        setLoading(false);
        return;
      }

      await createCheckoutSession(PRICE_IDS.community, activeProfile.network_id);
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert(t('pricing.errors.paymentError', { error: error.message || 'Unknown error' }));
    } finally {
      setLoading(false);
    }
  };

  const featureIcons = [
    <GroupsIcon color="primary" />,
    <StorageIcon color="primary" />,
    <AdminIcon color="primary" />,
    <ForumIcon color="primary" />,
    <EmailIcon color="primary" />,
    <ChatIcon color="primary" />,
    <FolderIcon color="primary" />,
    <BookmarkIcon color="primary" />,
    <EventIcon color="primary" />,
    <VisibilityOffIcon color="primary" />,
    <SupportIcon color="primary" />,
  ];

  const featureKeys = [
    'members', 'storage', 'admins', 'socialWall', 'newsletter',
    'chats', 'fileSharing', 'wiki', 'events', 'privacy', 'support'
  ];

  const trustPoints = [
    { icon: <LockIcon />, titleKey: 'pricing.trust.privacyFirst.title', descKey: 'pricing.trust.privacyFirst.description' },
    { icon: <SpeedIcon />, titleKey: 'pricing.trust.cancelAnytime.title', descKey: 'pricing.trust.cancelAnytime.description' },
    { icon: <VerifiedIcon />, titleKey: 'pricing.trust.securePayments.title', descKey: 'pricing.trust.securePayments.description' },
  ];

  const faqItems = [
    { questionKey: 'pricing.faq.whatIsFree.question', answerKey: 'pricing.faq.whatIsFree.answer' },
    { questionKey: 'pricing.faq.whenUpgrade.question', answerKey: 'pricing.faq.whenUpgrade.answer' },
    { questionKey: 'pricing.faq.cancel.question', answerKey: 'pricing.faq.cancel.answer' },
    { questionKey: 'pricing.faq.privacy.question', answerKey: 'pricing.faq.privacy.answer' },
    { questionKey: 'pricing.faq.nonprofit.question', answerKey: 'pricing.faq.nonprofit.answer' },
  ];

  const renderFeatureList = (planKey) => (
    <List disablePadding>
      {featureKeys.map((key, index) => (
        <ListItem key={key} disableGutters sx={{ py: 0.75 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            {featureIcons[index]}
          </ListItemIcon>
          <ListItemText
            primary={t(`pricing.${planKey}.features.${key}`)}
            primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}
          />
          <CheckIcon color="success" fontSize="small" />
        </ListItem>
      ))}
    </List>
  );

  return (
    <ThemeProvider theme={lightTheme}>
      <ThreeJSBackground />

      <Container
        maxWidth="lg"
        sx={{
          py: 8,
          zIndex: 99,
          backdropFilter: 'blur(8px)',
          backgroundColor: alpha(lightTheme.palette.background.paper, 0.4),
          minHeight: '100vh'
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant={isMobile ? 'h4' : 'h3'}
            component="h1"
            gutterBottom
            fontWeight="bold"
            color="primary"
          >
            {t('pricing.header.title')}
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 500, mx: 'auto' }}
          >
            {t('pricing.header.subtitle')}
          </Typography>
        </Box>

        {/* Two-Card Pricing Layout */}
        <Grid container spacing={4} justifyContent="center" sx={{ maxWidth: 900, mx: 'auto' }}>
          {/* Free Plan Card */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={3}
              sx={{
                borderRadius: 4,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Price */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t('pricing.free.planName')}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline' }}>
                    <Typography
                      variant="h2"
                      component="span"
                      fontWeight="bold"
                      color="text.primary"
                    >
                      {t('pricing.free.price')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {t('pricing.free.billing')}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Features List */}
                <Box sx={{ flexGrow: 1 }}>
                  {renderFeatureList('free')}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* CTA Button */}
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={() => navigate('/signup')}
                  sx={{
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2
                  }}
                >
                  {t('pricing.free.ctaButton')}
                </Button>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ mt: 2 }}
                >
                  {t('pricing.free.ctaInfo')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Community Plan Card */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={8}
              sx={{
                borderRadius: 4,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible',
                position: 'relative',
                border: `2px solid ${lightTheme.palette.primary.main}`
              }}
            >
              {/* Popular Badge */}
              <Chip
                label={t('pricing.community.badge')}
                color="primary"
                size="small"
                sx={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontWeight: 600,
                  px: 2
                }}
              />

              <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Price */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t('pricing.community.planName')}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline' }}>
                    <Typography
                      variant="h2"
                      component="span"
                      fontWeight="bold"
                      color="primary"
                    >
                      {t('pricing.community.price')}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ ml: 1 }}>
                      {t('pricing.community.perMonth')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {t('pricing.community.billing')}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Features List */}
                <Box sx={{ flexGrow: 1 }}>
                  {renderFeatureList('community')}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* CTA Button */}
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={handleSubscribe}
                  disabled={loading}
                  sx={{
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2
                  }}
                >
                  {loading ? (
                    <Spinner size={48} color="inherit" />
                  ) : user ? (
                    t('pricing.community.subscribeButton')
                  ) : (
                    t('pricing.community.ctaButton')
                  )}
                </Button>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ mt: 2 }}
                >
                  {t('pricing.community.ctaInfo')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Trust Points */}
        <Grid container spacing={3} sx={{ mt: 6 }} justifyContent="center">
          {trustPoints.map((point, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 3,
                  height: '100%'
                }}
              >
                <Box
                  sx={{
                    color: 'primary.main',
                    mb: 2,
                    '& svg': { fontSize: 40 }
                  }}
                >
                  {point.icon}
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {t(point.titleKey)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t(point.descKey)}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Need More Section */}
        <Paper
          elevation={2}
          sx={{
            mt: 6,
            p: 4,
            borderRadius: 3,
            textAlign: 'center',
            bgcolor: alpha(lightTheme.palette.primary.main, 0.03)
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {t('pricing.needMore.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {t('pricing.needMore.description')} <br />
            {t('pricing.needMore.descriptionLine2')}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            href="mailto:contact@conclav.club"
          >
            {t('pricing.needMore.button')}
          </Button>
        </Paper>

        {/* FAQ Section */}
        <Box sx={{ mt: 8 }}>
          <Typography
            variant="h5"
            fontWeight="bold"
            color="primary"
            align="center"
            gutterBottom
            sx={{ mb: 4 }}
          >
            {t('pricing.faq.title')}
          </Typography>

          <Grid container spacing={3} justifyContent="center">
            {faqItems.map((item, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper elevation={1} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {t(item.questionKey)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(item.answerKey)}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Stripe Badge */}
        <Box sx={{ textAlign: 'center', mt: 8, mb: 4 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t('pricing.stripe.poweredBy')}
          </Typography>
          <img
            src="https://cdn.worldvectorlogo.com/logos/stripe-4.svg"
            alt="Stripe"
            style={{ height: 32 }}
          />
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default PricingPage;
