import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  Chip,
  useTheme,
  alpha,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Fade,
  Slide,
  Grow,
  Avatar,
  AvatarGroup,
  useMediaQuery,
  Menu,
  MenuItem,
  IconButton,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Security,
  Speed,
  Euro,
  Check,
  ArrowForward,
  Shield,
  LocationOn,
  Timer,
  Block,
  AdminPanelSettings,
  People,
  Event,
  Description,
  Forum,
  FolderShared,
  Poll,
  Mood,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  Palette as PaletteIcon,
  Image as ImageIcon,
  Language as LanguageIcon,
  MonetizationOn,
  Store,
  ShoppingCart,
  Star,
  CloudDone,
  Groups,
  Verified,
  TrendingUp,
  AutoAwesome,
  Bolt,
  Favorite
} from '@mui/icons-material';

const AlternativeLandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [language, setLanguage] = useState('en');
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll progress indicator
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Translations (keeping the same translations object from EnhancedLandingPage)
  const translations = {
    en: {
      signIn: 'Sign In',
      getStarted: 'Get Started',
      heroTitle: ['Build Your', 'Private Digital Space'],
      heroSubtitle: 'Create a secure sanctuary for your team. Zero tracking, total control, endless possibilities.',
      heroCatchline: 'Where privacy meets productivity',
      startFreeTrial: 'Start 14-Day Free Trial',
      viewPricing: 'View Pricing',
      joinOrgs: 'Trusted by 500+ organizations worldwide',
      gdprCompliant: 'GDPR Compliant',
      gdprDesc: 'EU data protection standards',
      dataStaysEurope: 'Data Sovereignty',
      hostedFrance: 'Hosted in France 🇫🇷',
      setupMinutes: 'Quick Setup',
      noTechSkills: '2 minutes to launch',
      zeroTracking: 'Zero Tracking',
      noAdsAnalytics: 'No ads, no analytics',
      builtForOrgs: 'Everything Your Team Needs',
      fourPillars: 'Simple, powerful tools for modern teams',
      simplyPowerful: 'Simple',
      simplyPowerfulDesc: 'Intuitive design that anyone can use',
      privateCircle: 'Private',
      privateCircleDesc: 'Your data stays yours, always',
      completeControl: 'Flexible',
      completeControlDesc: 'Customize everything to fit your needs',
      visualCollab: 'Creative',
      visualCollabDesc: 'Tools that inspire collaboration',
      everythingNeed: 'Core Features',
      coreFeatures: 'Everything you need, nothing you don\'t',
      secureChat: 'Team Chat',
      realTimeMsg: 'Real-time messaging',
      fileSharing: 'File Storage',
      upTo5TB: 'Up to 5TB secure storage',
      events: 'Events',
      calendarRSVP: 'Calendar & RSVPs',
      wiki: 'Wiki',
      knowledgeBase: 'Knowledge base',
      polls: 'Polls',
      decisionsVoting: 'Quick decisions',
      moodboards: 'Moodboards',
      visualCollabShort: 'Visual collaboration',
      monetization: 'Monetization',
      sellWorkshops: 'Sell content & events',
      whyChooseConclav: 'Why Teams Choose Conclav',
      testimonial1Text: 'Conclav transformed how we collaborate. Finally, true privacy without sacrificing features.',
      testimonial1Author: 'Sarah Chen',
      testimonial1Org: 'Tech Startup CEO',
      testimonial2Text: 'The best investment we\'ve made. Secure, simple, and our team loves it.',
      testimonial2Author: 'Marc Dubois',
      testimonial2Org: 'NGO Director',
      readyControl: 'Ready to Get Started?',
      joinThousands: 'Join thousands who value privacy and productivity',
      noCreditCard: 'No credit card required',
      setupUnder2: 'Setup in 2 minutes',
      cancelAnytime: 'Cancel anytime',
      createNetwork: 'Create Your Network',
      copyright: '© 2024 Conclav. Privacy-first collaboration.',
      privacyPolicy: 'Privacy',
      termsService: 'Terms',
      documentation: 'Docs',
      perMonth: '/mo',
      community: 'Community',
      forSmallCommunities: 'For small teams',
      nonProfit: 'Non-Profit',
      forEducational: 'For NGOs & education',
      professional: 'Professional',
      forGrowingOrgs: 'For growing teams',
      members: 'members',
      storage: 'storage',
      adminAccounts: 'admins',
      emailSupport: 'Email support',
      allCoreFeatures: 'All features',
      dayFreeTrial: '14-day trial',
      whiteLabel: 'White label',
      prioritySupport: 'Priority support',
      specialNGORate: 'Special rates',
      whiteLabelIncluded: 'White label',
      mostPopular: 'Most popular',
      startFreeTrial2: 'Start Free Trial',
      transparentPricing: 'Simple, Transparent Pricing',
      noHiddenFees: 'No hidden fees. No data selling. Ever.'
    },
    fr: {
      signIn: 'Connexion',
      getStarted: 'Commencer',
      heroTitle: ['Créez Votre', 'Espace Numérique Privé'],
      heroSubtitle: 'Créez un sanctuaire sécurisé pour votre équipe. Zéro tracking, contrôle total, possibilités infinies.',
      heroCatchline: 'Où la confidentialité rencontre la productivité',
      startFreeTrial: 'Essai Gratuit 14 Jours',
      viewPricing: 'Voir les Tarifs',
      joinOrgs: 'Fait confiance par 500+ organisations',
      gdprCompliant: 'Conforme RGPD',
      gdprDesc: 'Standards européens',
      dataStaysEurope: 'Souveraineté',
      hostedFrance: 'Hébergé en France 🇫🇷',
      setupMinutes: 'Installation Rapide',
      noTechSkills: '2 minutes pour lancer',
      zeroTracking: 'Zéro Tracking',
      noAdsAnalytics: 'Ni pubs, ni analyses',
      builtForOrgs: 'Tout ce Dont Votre Équipe a Besoin',
      fourPillars: 'Outils simples et puissants pour équipes modernes',
      simplyPowerful: 'Simple',
      simplyPowerfulDesc: 'Design intuitif utilisable par tous',
      privateCircle: 'Privé',
      privateCircleDesc: 'Vos données restent vôtres, toujours',
      completeControl: 'Flexible',
      completeControlDesc: 'Personnalisez tout selon vos besoins',
      visualCollab: 'Créatif',
      visualCollabDesc: 'Outils qui inspirent la collaboration',
      everythingNeed: 'Fonctionnalités',
      coreFeatures: 'Tout ce qu\'il faut, rien de superflu',
      secureChat: 'Chat d\'Équipe',
      realTimeMsg: 'Messages temps réel',
      fileSharing: 'Stockage',
      upTo5TB: 'Jusqu\'à 5To sécurisé',
      events: 'Événements',
      calendarRSVP: 'Calendrier & RSVP',
      wiki: 'Wiki',
      knowledgeBase: 'Base de connaissances',
      polls: 'Sondages',
      decisionsVoting: 'Décisions rapides',
      moodboards: 'Moodboards',
      visualCollabShort: 'Collaboration visuelle',
      monetization: 'Monétisation',
      sellWorkshops: 'Vendre contenu & événements',
      whyChooseConclav: 'Pourquoi les Équipes Choisissent Conclav',
      testimonial1Text: 'Conclav a transformé notre collaboration. Enfin, une vraie confidentialité sans sacrifier les fonctionnalités.',
      testimonial1Author: 'Sarah Chen',
      testimonial1Org: 'CEO Startup Tech',
      testimonial2Text: 'Le meilleur investissement que nous ayons fait. Sécurisé, simple, et notre équipe adore.',
      testimonial2Author: 'Marc Dubois',
      testimonial2Org: 'Directeur ONG',
      readyControl: 'Prêt à Commencer ?',
      joinThousands: 'Rejoignez des milliers qui valorisent confidentialité et productivité',
      noCreditCard: 'Sans carte bancaire',
      setupUnder2: 'Installation en 2 minutes',
      cancelAnytime: 'Annulez à tout moment',
      createNetwork: 'Créer Votre Réseau',
      copyright: '© 2024 Conclav. Collaboration axée sur la confidentialité.',
      privacyPolicy: 'Confidentialité',
      termsService: 'Conditions',
      documentation: 'Docs',
      perMonth: '/mois',
      community: 'Communauté',
      forSmallCommunities: 'Pour petites équipes',
      nonProfit: 'Association',
      forEducational: 'Pour ONG & éducation',
      professional: 'Professionnel',
      forGrowingOrgs: 'Pour équipes en croissance',
      members: 'membres',
      storage: 'stockage',
      adminAccounts: 'admins',
      emailSupport: 'Support email',
      allCoreFeatures: 'Toutes fonctions',
      dayFreeTrial: 'Essai 14 jours',
      whiteLabel: 'Marque blanche',
      prioritySupport: 'Support prioritaire',
      specialNGORate: 'Tarifs spéciaux',
      whiteLabelIncluded: 'Marque blanche',
      mostPopular: 'Plus populaire',
      startFreeTrial2: 'Essai Gratuit',
      transparentPricing: 'Tarification Simple et Transparente',
      noHiddenFees: 'Aucuns frais cachés. Aucune vente de données. Jamais.'
    }
  };

  const t = translations[language];

  const stats = [
    { number: '500+', label: 'Active Teams', icon: <Groups /> },
    { number: '99.9%', label: 'Uptime', icon: <CloudDone /> },
    { number: '100%', label: 'GDPR Compliant', icon: <Verified /> },
    { number: '< 2min', label: 'Setup Time', icon: <Bolt /> }
  ];

  const features = [
    {
      id: 0,
      icon: <LockIcon />,
      title: t.privateCircle,
      description: t.privateCircleDesc,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 1,
      icon: <Bolt />,
      title: t.simplyPowerful,
      description: t.simplyPowerfulDesc,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      id: 2,
      icon: <AutoAwesome />,
      title: t.visualCollab,
      description: t.visualCollabDesc,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      id: 3,
      icon: <AdminPanelSettings />,
      title: t.completeControl,
      description: t.completeControlDesc,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    }
  ];

  const platformFeatures = [
    { icon: <Forum />, name: t.secureChat },
    { icon: <FolderShared />, name: t.fileSharing },
    { icon: <Event />, name: t.events },
    { icon: <Description />, name: t.wiki },
    { icon: <Poll />, name: t.polls },
    { icon: <Mood />, name: t.moodboards }
  ];

  const pricingPlans = [
    {
      name: t.community,
      price: 17,
      features: [`100 ${t.members}`, `10GB ${t.storage}`, t.allCoreFeatures],
      color: theme.palette.primary.main
    },
    {
      name: t.nonProfit,
      price: 49,
      features: [`500 ${t.members}`, `50GB ${t.storage}`, t.whiteLabel],
      color: theme.palette.secondary.main,
      badge: 'NGO'
    },
    {
      name: t.professional,
      price: 87,
      features: [`500 ${t.members}`, `100GB ${t.storage}`, t.prioritySupport],
      color: theme.palette.success.main,
      popular: true
    }
  ];

  const handleLanguageClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    handleLanguageClose();
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(to bottom, ${alpha(theme.palette.primary.main, 0.03)}, ${theme.palette.background.default})`,
      position: 'relative'
    }}>
      {/* Progress Bar */}
      <LinearProgress 
        variant="determinate" 
        value={scrollProgress} 
        sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1301,
          height: 3,
          backgroundColor: 'transparent',
          '& .MuiLinearProgress-bar': {
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
          }
        }} 
      />

      {/* Navigation */}
      <Box 
        sx={{ 
          position: 'sticky',
          top: 0,
          bgcolor: alpha(theme.palette.background.default, 0.95),
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          zIndex: 1300
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700
                }}
              >
                C
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Conclav
              </Typography>
            </Stack>
            
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton onClick={handleLanguageClick} size="small">
                <LanguageIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleLanguageClose}
              >
                <MenuItem onClick={() => handleLanguageSelect('en')}>🇬🇧 English</MenuItem>
                <MenuItem onClick={() => handleLanguageSelect('fr')}>🇫🇷 Français</MenuItem>
              </Menu>
              
              {!isMobile && (
                <Button component={RouterLink} to="/login" variant="text">
                  {t.signIn}
                </Button>
              )}
              <Button 
                component={RouterLink} 
                to="/signup" 
                variant="contained"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                  }
                }}
              >
                {t.getStarted}
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 }, pb: 6 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Fade in timeout={800}>
              <Box>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    fontWeight: 900,
                    mb: 2,
                    lineHeight: 1.2
                  }}
                >
                  {t.heroTitle[0]}<br />
                  <Box
                    component="span"
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {t.heroTitle[1]}
                  </Box>
                </Typography>
                
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 3,
                    color: theme.palette.text.secondary,
                    fontWeight: 400
                  }}
                >
                  {t.heroSubtitle}
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
                  <Button
                    component={RouterLink}
                    to="/signup"
                    variant="contained"
                    size="large"
                    sx={{
                      py: 1.5,
                      px: 4,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                        transform: 'translateY(-2px)',
                        boxShadow: 4
                      },
                      transition: 'all 0.3s ease'
                    }}
                    endIcon={<ArrowForward />}
                  >
                    {t.startFreeTrial}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
                    sx={{ py: 1.5, px: 4 }}
                  >
                    {t.viewPricing}
                  </Button>
                </Stack>

                {/* Trust Badges */}
                <Stack direction="row" spacing={3} sx={{ mt: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Shield sx={{ color: 'primary.main' }} />
                    <Typography variant="body2">{t.gdprCompliant}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn sx={{ color: 'primary.main' }} />
                    <Typography variant="body2">{t.hostedFrance}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Block sx={{ color: 'primary.main' }} />
                    <Typography variant="body2">{t.zeroTracking}</Typography>
                  </Box>
                </Stack>
              </Box>
            </Fade>
          </Grid>

          <Grid item xs={12} md={6}>
            <Slide direction="left" in timeout={1000}>
              <Box sx={{ position: 'relative' }}>
                {/* Feature Cards Animation */}
                <Box sx={{ position: 'relative', height: { xs: 400, md: 500 } }}>
                  {features.map((feature, index) => (
                    <Grow 
                      key={feature.id} 
                      in={activeFeature === index}
                      timeout={600}
                    >
                      <Card
                        elevation={0}
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '100%',
                          maxWidth: { xs: 350, md: 500, lg: 600 },
                          p: { xs: 4, md: 5, lg: 6 },
                          textAlign: 'center',
                          background: feature.gradient,
                          color: 'white',
                          display: activeFeature === index ? 'block' : 'none',
                          borderRadius: 4,
                          boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.2)}`
                        }}
                      >
                        {React.cloneElement(feature.icon, { sx: { fontSize: { xs: 60, md: 80, lg: 100 }, mb: 3 } })}
                        <Typography variant="h3" gutterBottom fontWeight="700" sx={{ fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' } }}>
                          {feature.title}
                        </Typography>
                        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' }, opacity: 0.95 }}>
                          {feature.description}
                        </Typography>
                      </Card>
                    </Grow>
                  ))}
                </Box>

                {/* Feature Indicators */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                  {features.map((_, index) => (
                    <Box
                      key={index}
                      onClick={() => setActiveFeature(index)}
                      sx={{
                        width: 40,
                        height: 4,
                        borderRadius: 2,
                        bgcolor: activeFeature === index ? 'primary.main' : 'grey.300',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Slide>
          </Grid>
        </Grid>
      </Container>

      {/* Stats Section */}
      <Box sx={{ py: 6, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Fade in timeout={1000 + index * 200}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ color: 'primary.main', mb: 1 }}>
                      {React.cloneElement(stat.icon, { sx: { fontSize: 40 } })}
                    </Box>
                    <Typography variant="h3" fontWeight="700">
                      {stat.number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Grid */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" gutterBottom fontWeight="700">
            {t.everythingNeed}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {t.coreFeatures}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {platformFeatures.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Slide direction="up" in timeout={800 + index * 100}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    textAlign: 'center',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.1)}`,
                      borderColor: theme.palette.primary.main
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3
                    }}
                  >
                    {React.cloneElement(feature.icon, { 
                      sx: { fontSize: 40, color: 'primary.main' } 
                    })}
                  </Box>
                  <Typography variant="h6" fontWeight="600">
                    {feature.name}
                  </Typography>
                </Paper>
              </Slide>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Testimonials */}
      <Box sx={{ py: 10, bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
        <Container maxWidth="md">
          <Typography variant="h3" textAlign="center" fontWeight="700" mb={6}>
            {t.whyChooseConclav}
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card
                elevation={0}
                sx={{
                  p: 4,
                  height: '100%',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: 3
                }}
              >
                <Stack direction="row" spacing={0.5} mb={2}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} sx={{ color: theme.palette.warning.main }} />
                  ))}
                </Stack>
                <Typography variant="body1" paragraph fontStyle="italic">
                  "{t.testimonial1Text}"
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>S</Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="600">
                      {t.testimonial1Author}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.testimonial1Org}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card
                elevation={0}
                sx={{
                  p: 4,
                  height: '100%',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: 3
                }}
              >
                <Stack direction="row" spacing={0.5} mb={2}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} sx={{ color: theme.palette.warning.main }} />
                  ))}
                </Stack>
                <Typography variant="body1" paragraph fontStyle="italic">
                  "{t.testimonial2Text}"
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>M</Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="600">
                      {t.testimonial2Author}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.testimonial2Org}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Pricing */}
      <Box id="pricing" sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h3" gutterBottom fontWeight="700">
              {t.transparentPricing}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {t.noHiddenFees}
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {pricingPlans.map((plan, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Grow in timeout={1000 + index * 200}>
                  <Card
                    elevation={0}
                    sx={{
                      p: 4,
                      height: '100%',
                      position: 'relative',
                      textAlign: 'center',
                      border: plan.popular 
                        ? `2px solid ${plan.color}`
                        : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 20px 40px ${alpha(plan.color, 0.15)}`
                      }
                    }}
                  >
                    {plan.popular && (
                      <Chip
                        label={t.mostPopular}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 20,
                          right: 20,
                          bgcolor: plan.color,
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    )}
                    
                    {plan.badge && (
                      <Chip
                        label={plan.badge}
                        size="small"
                        variant="outlined"
                        sx={{
                          position: 'absolute',
                          top: 20,
                          left: 20,
                          borderColor: plan.color,
                          color: plan.color
                        }}
                      />
                    )}
                    
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: alpha(plan.color, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3
                      }}
                    >
                      <Typography variant="h4" fontWeight="700" color={plan.color}>
                        €{plan.price}
                      </Typography>
                    </Box>
                    
                    <Typography variant="h5" gutterBottom fontWeight="600">
                      {plan.name}
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary">
                      {t.perMonth}
                    </Typography>
                    
                    <Divider sx={{ my: 3 }} />
                    
                    <Stack spacing={2} sx={{ mb: 4 }}>
                      {plan.features.map((feature, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <Check sx={{ fontSize: 20, color: plan.color }} />
                          <Typography variant="body2">{feature}</Typography>
                        </Box>
                      ))}
                    </Stack>
                    
                    <Button
                      fullWidth
                      variant={plan.popular ? 'contained' : 'outlined'}
                      size="large"
                      onClick={() => navigate('/signup')}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        ...(plan.popular && {
                          background: `linear-gradient(135deg, ${plan.color}, ${theme.palette.secondary.main})`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                          }
                        })
                      }}
                    >
                      {t.startFreeTrial2}
                    </Button>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 12,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" gutterBottom fontWeight="700">
            {t.readyControl}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 6 }}>
            {t.joinThousands}
          </Typography>
          
          <Stack spacing={2} sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
            {[t.noCreditCard, t.dayFreeTrial, t.setupUnder2, t.cancelAnytime].map((item, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <CheckCircleIcon color="primary" />
                <Typography variant="body1">{item}</Typography>
              </Box>
            ))}
          </Stack>
          
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/signup')}
            endIcon={<ArrowForward />}
            sx={{
              py: 2,
              px: 6,
              fontSize: '1.1rem',
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              boxShadow: `0 10px 30px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                transform: 'translateY(-2px)',
                boxShadow: `0 15px 35px ${alpha(theme.palette.primary.main, 0.4)}`
              },
              transition: 'all 0.3s ease'
            }}
          >
            {t.createNetwork}
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 6, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 14
                }}
              >
                C
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t.copyright}
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={3}>
              <Button variant="text" size="small" onClick={() => navigate('/privacy')}>
                {t.privacyPolicy}
              </Button>
              <Button variant="text" size="small" onClick={() => navigate('/terms')}>
                {t.termsService}
              </Button>
              <Button variant="text" size="small" onClick={() => navigate('/documentation')}>
                {t.documentation}
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default AlternativeLandingPage;