// src/pages/LandingPage.jsx
import React from 'react';
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

// Import Icons (example icons, choose ones that fit best)
import PeopleIcon from '@mui/icons-material/People'; // For closed networks
import AccountBoxIcon from '@mui/icons-material/AccountBox'; // For portfolios
import LockIcon from '@mui/icons-material/Lock'; // For privacy/security
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; // For admin controls

// --- Component Definition ---
function LandingPage() {

  // --- Data for Features Section ---
  const features = [
    {
      title: 'Closed Networks',
      description: 'Create private, invite-only networks for your union, organization, or group members.',
      icon: <PeopleIcon fontSize="large" color="primary" />,
    },
    {
      title: 'Member Portfolios',
      description: 'Allow members to showcase their work, skills, and professional profiles easily.',
      icon: <AccountBoxIcon fontSize="large" color="primary" />,
    },
    {
      title: 'Secure & Private',
      description: 'Control access and keep your network\'s data secure within your defined group.',
      icon: <LockIcon fontSize="large" color="primary" />,
    },
     {
      title: 'Admin Controls',
      description: 'Manage members, roles, and network settings with simple administrative tools.',
      icon: <AdminPanelSettingsIcon fontSize="large" color="primary" />,
    },
  ];

  // --- JSX Structure ---
  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* --- Navigation AppBar --- */}
      <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Toolbar sx={{ flexWrap: 'wrap' }}>
          <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
             {/* You can add a logo here instead of text */}
             Mon Cercle App
          </Typography>
          <nav>
            {/* Example Nav Link - Add more as needed */}
            <Link
              variant="button"
              color="text.primary"
              href="#features" // Link to features section ID
              sx={{ my: 1, mx: 1.5 }}
            >
              Features
            </Link>
             <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                sx={{ my: 1, mx: 1.5 }}
             >
                Login
            </Button>
          </nav>
          <Button
            component={RouterLink}
            to="/signup"
            variant="contained"
            sx={{ my: 1, mx: 1.5 }}
          >
            Sign Up
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
          Your Private Network Hub
        </Typography>
        <Typography variant="h5" align="center" color="text.secondary" component="p" sx={{ mb: 4 }}>
          Easily create and manage closed networks for your members to connect, share portfolios, and display contact information securely.
        </Typography>
        <Stack
          sx={{ pt: 2 }}
          direction={{ xs: 'column', sm: 'row' }} // Stack vertically on small screens
          spacing={2}
          justifyContent="center"
        >
          <Button component={RouterLink} to="/signup" variant="contained" size="large">
            Get Started
          </Button>
          {/* Optionally add a secondary action */}
          {/* <Button variant="outlined" size="large">Learn More</Button> */}
        </Stack>
      </Container>

      {/* --- Features Section --- */}
      <Container id="features" sx={{ py: 8 }} maxWidth="lg">
        <Typography component="h2" variant="h4" align="center" color="text.primary" gutterBottom>
            Why Choose Mon Cercle?
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

      {/* --- Add more sections as needed (e.g., How it Works, Testimonials) --- */}


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
            Mon Cercle App
          </Link>{' '}
          {new Date().getFullYear()}
          {'.'}
        </Typography>
        {/* Optional: Add links to Privacy Policy, Terms of Service */}
         <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 1 }}>
            <Link component={RouterLink} to="/privacy" variant="body2" color="text.secondary">Privacy Policy</Link>
            <Link component={RouterLink} to="/terms" variant="body2" color="text.secondary">Terms of Service</Link>
         </Stack>
      </Container>
      {/* --- End Footer --- */}
    </Box>
  );
}

export default LandingPage;