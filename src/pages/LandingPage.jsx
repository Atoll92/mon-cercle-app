// src/pages/LandingPage.jsx
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom'; // Use alias to avoid naming conflict
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link'; // MUI Link component
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import LanguageIcon from '@mui/icons-material/Language';

// Import Icons (example icons, choose ones that fit best)
import PeopleIcon from '@mui/icons-material/People'; // For closed networks
import AccountBoxIcon from '@mui/icons-material/AccountBox'; // For portfolios
import LockIcon from '@mui/icons-material/Lock'; // For privacy/security
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; // For admin controls

// --- Component Definition ---
function LandingPage() {
  // Language state
  const [language, setLanguage] = useState('en');

  // --- Text content for different languages ---
  const content = {
    en: {
      appName: 'Mon Cercle App',
      navFeatures: 'Features',
      navLogin: 'Login',
      navSignUp: 'Sign Up',
      heroTitle: 'Your Private Network Hub',
      heroSubtitle: 'Easily create and manage closed networks for your members to connect, share portfolios, and display contact information securely.',
      getStarted: 'Get Started',
      featuresTitle: 'Why Choose Mon Cercle?',
      features: [
        {
          title: 'Closed Networks',
          description: 'Create private, invite-only networks for your union, organization, or group members.'
        },
        {
          title: 'Member Portfolios',
          description: 'Allow members to showcase their work, skills, and professional profiles easily.'
        },
        {
          title: 'Secure & Private',
          description: 'Control access and keep your network\'s data secure within your defined group.'
        },
        {
          title: 'Admin Controls',
          description: 'Manage members, roles, and network settings with simple administrative tools.'
        }
      ],
      privacy: 'Privacy Policy',
      terms: 'Terms of Service'
    },
    fr: {
      appName: 'Mon Cercle',
      navFeatures: 'Fonctionnalités',
      navLogin: 'Connexion',
      navSignUp: 'S\'inscrire',
      heroTitle: 'Votre Plateforme de Réseau Privé',
      heroSubtitle: 'Créez et gérez facilement des réseaux fermés pour permettre à vos membres de se connecter, partager leurs portfolios et afficher leurs coordonnées en toute sécurité.',
      getStarted: 'Commencer',
      featuresTitle: 'Pourquoi Choisir Mon Cercle?',
      features: [
        {
          title: 'Réseaux Fermés',
          description: 'Créez des réseaux privés, sur invitation, pour votre association, organisation professionnelle ou tout autre groupe.'
        },
        {
          title: 'Portfolios des Membres',
          description: 'Permettez aux membres de présenter facilement leur travail, compétences et profils professionnels, sans contenus tiers, sans pub, sans tracking.'
        },
        {
          title: 'Sécurisé et Privé',
          description: 'Contrôlez l\'accès et maintenez les données de votre réseau en sécurité au sein de votre groupe défini.'
        },
        {
          title: 'Contrôles Administratifs',
          description: 'Gérez les membres, les rôles et les paramètres du réseau avec des outils administratifs simples.'
        }
      ],
      privacy: 'Politique de Confidentialité',
      terms: 'Conditions d\'Utilisation'
    }
  };

  // Get current language content
  const t = content[language];

  // Features with icons
  const features = t.features.map((feature, index) => ({
    ...feature,
    icon: [
      <PeopleIcon fontSize="large" color="primary" />,
      <AccountBoxIcon fontSize="large" color="primary" />,
      <LockIcon fontSize="large" color="primary" />,
      <AdminPanelSettingsIcon fontSize="large" color="primary" />
    ][index]
  }));

  // Handle language change
  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  // --- JSX Structure ---
  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* --- Navigation AppBar --- */}
      <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Toolbar sx={{ flexWrap: 'wrap' }}>
          <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
             {/* You can add a logo here instead of text */}
             {t.appName}
          </Typography>
          <nav style={{ display: 'flex', alignItems: 'center' }}>
            {/* Language selector */}
            <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
              <Select
                value={language}
                onChange={handleLanguageChange}
                displayEmpty
                size="small"
                startAdornment={<LanguageIcon fontSize="small" sx={{ mr: 1 }} />}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="fr">Français</MenuItem>
              </Select>
            </FormControl>
            
            {/* Navigation links */}
            <Link
              variant="button"
              color="text.primary"
              href="#features" // Link to features section ID
              sx={{ my: 1, mx: 1.5 }}
            >
              {t.navFeatures}
            </Link>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              sx={{ my: 1, mx: 1.5 }}
            >
              {t.navLogin}
            </Button>
          </nav>
          <Button
            component={RouterLink}
            to="/signup"
            variant="contained"
            sx={{ my: 1, mx: 1.5 }}
          >
            {t.navSignUp}
          </Button>
        </Toolbar>
      </AppBar>

      {/* --- Hero Section --- */}
      <Container disableGutters maxWidth="md" component="main" sx={{ pt: 8, pb: 6 }}>
        <Typography
          component="h1"
          variant="h2"
          align="center"
          color="text.primary"
          gutterBottom
        >
          {t.heroTitle}
        </Typography>
        <Typography variant="h5" align="center" color="text.secondary" component="p" sx={{ mb: 4 }}>
          {t.heroSubtitle}
        </Typography>
        <Stack
          sx={{ pt: 2 }}
          direction={{ xs: 'column', sm: 'row' }} // Stack vertically on small screens
          spacing={2}
          justifyContent="center"
        >
          <Button component={RouterLink} to="/signup" variant="contained" size="large">
            {t.getStarted}
          </Button>
        </Stack>
      </Container>

      {/* --- Features Section --- */}
      <Container id="features" sx={{ py: 8 }} maxWidth="lg">
        <Typography component="h2" variant="h4" align="center" color="text.primary" gutterBottom>
            {t.featuresTitle}
        </Typography>
        <Grid container spacing={4} sx={{ mt: 4 }} justifyContent="center">
          {features.map((feature) => (
            <Grid item key={feature.title} xs={12} sm={6} md={3}> {/* Adjust grid sizing as needed */}
              <Box textAlign="center">
                {feature.icon}
                <Typography variant="h6" component="h3" gutterBottom sx={{mt: 2}}>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {feature.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
      {/* --- End Features Section --- */}

      {/* --- Footer --- */}
      <Container
        maxWidth="md"
        component="footer"
        sx={{
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          mt: 8,
          py: [3, 6], // Padding top/bottom responsive
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          {'© '}
          <Link color="inherit" href="#"> {/* Optional: Link to your main site */}
            {t.appName}
          </Link>{' '}
          {new Date().getFullYear()}
          {'.'}
        </Typography>
        {/* Optional: Add links to Privacy Policy, Terms of Service */}
         <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 1 }}>
            <Link component={RouterLink} to="/privacy" variant="body2" color="text.secondary">{t.privacy}</Link>
            <Link component={RouterLink} to="/terms" variant="body2" color="text.secondary">{t.terms}</Link>
         </Stack>
      </Container>
      {/* --- End Footer --- */}
    </Box>
  );
}

export default LandingPage;