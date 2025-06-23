// NewLandingPage.jsx - Conceptual Outline for a simple and convincing landing page
// Incorporates negative advertising by highlighting issues with mainstream social media.

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Stack,
  useTheme, // Potentially for responsive design or theme-specific styles
  // Add other Material-UI imports as needed based on your existing files (e.g., Card, Paper, etc.)
} from '@mui/material';
import {
  Shield,         // For Privacy/Security
  Euro,           // For EU-based
  Block,          // For Ads/Tracking/AI Free
  CheckCircle,    // For positive features / Benefits
  ArrowForward,   // For Call to Action
  Warning,        // For warnings/problems related to big tech
  DataUsage,      // For data handling issues
  Campaign,       // For advertising/tracking
} from '@mui/icons-material';

const NewLandingPage = () => {
  const theme = useTheme(); // Use theme for consistent styling

  return (
    <Box sx={{ flexGrow: 1 }}>

      {/* 1. Hero Section: Direct, Negative Advertising Headline */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          textAlign: 'center',
          backgroundColor: theme.palette.primary.main, // Or a gradient/image
          color: theme.palette.primary.contrastText,
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Tired of Being the Product? <br /> Reclaim Your Social Life.
          </Typography>
          <Typography
            variant="h6"
            sx={{ mb: 4, opacity: 0.9 }}
          >
            Escape the data-hungry giants. Discover a truly private, ad-free, and human-centric social network.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              color="secondary" // Use a contrasting color for the main CTA
              endIcon={<ArrowForward />}
              // onClick={() => navigate('/signup')} // Placeholder for navigation
            >
              Join the Private Network
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                color: 'white',
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.7)',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
              // onClick={() => navigate('/features')} // Placeholder for navigation
            >
              See Our Promise
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* 2. Problem Section: The "Villain" - Criticisms of Big Social Media */}
      <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: theme.palette.background.paper }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" gutterBottom sx={{ mb: 6 }}>
            The Cost of "Free": What Big Tech Takes From You
          </Typography>
          <Grid container spacing={{ xs: 4, md: 6 }} justifyContent="center">
            {/* Problem 1: Data Breaches & Privacy Violations (Meta's history) */}
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <DataUsage color="error" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Your Data, Their Gold Mine
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  From Cambridge Analytica to billions in GDPR fines, major platforms profit by exploiting your personal data, selling it, and tracking your every move without true consent.
                </Typography>
              </Box>
            </Grid>

            {/* Problem 2: Ads, Tracking, & AI Manipulation */}
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Campaign color="warning" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Endless Ads & Algorithmic Traps
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Your feed isn't for you; it's designed to keep you scrolling, fed by relentless ads and AI that learns your weaknesses. Is this truly social connection, or just a sophisticated selling machine?
                </Typography>
              </Box>
            </Grid>

            {/* Problem 3: Misinformation & Lack of Control */}
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Warning color="info" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Trust & Truth Eroded
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Navigating misinformation and arbitrary content moderation is frustrating. When your privacy is compromised, can you truly trust the information you see or the interactions you have?
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 3. Solution Section: Your Network's Unique Value Proposition */}
      <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: theme.palette.background.default }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" gutterBottom sx={{ mb: 6 }}>
            A Social Network Built Differently. Built For You.
          </Typography>
          <Grid container spacing={{ xs: 4, md: 6 }} justifyContent="center">
            {/* Solution 1: Privacy (No Ads, No Tracking, No AI) */}
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Shield color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  True Privacy. No Exceptions.
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Enjoy social media without the hidden costs. We are completely ads-free, tracking-free, and AI-free. Your data stays yours.
                </Typography>
              </Box>
            </Grid>

            {/* Solution 2: EU-Based & GDPR Compliant */}
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Euro color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  European by Design & Law
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Hosted and operated entirely within the EU, we adhere to the world's strictest privacy laws (GDPR), ensuring your digital rights are always protected.
                </Typography>
              </Box>
            </Grid>

            {/* Solution 3: Simplicity & Genuine Connection */}
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <CheckCircle color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Simply Social. Truly Connect.
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  A clean, intuitive interface focused purely on authentic interactions. No distractions, no algorithms, just real people and genuine connections.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 4. Call to Action Section */}
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          textAlign: 'center',
          backgroundColor: theme.palette.secondary.main, // Or another prominent color
          color: theme.palette.secondary.contrastText,
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
            Ready to Experience Social Media as It Should Be?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join the movement towards a safer, simpler, and more human online experience.
          </Typography>
          <Button
            variant="contained"
            size="large"
            color="primary" // Use a contrasting color
            endIcon={<ArrowForward />}
            // onClick={() => navigate('/signup')} // Placeholder for navigation
            sx={{
              py: 1.5,
              px: 4,
              fontSize: '1.2rem',
              fontWeight: 600,
              boxShadow: `0 8px 25px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)'}`,
              '&:hover': {
                boxShadow: `0 12px 30px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)'}`,
              }
            }}
          >
            Create Your Account Today
          </Button>
        </Container>
      </Box>

      {/* 5. Footer: Standard links */}
      <Box sx={{ py: 4, borderTop: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} [Your App Name]. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={3}>
              <Button variant="text" size="small" color="inherit" /*onClick={() => navigate('/privacy') }*/>
                Privacy Policy
              </Button>
              <Button variant="text" size="small" color="inherit" /*onClick={() => navigate('/terms') }*/>
                Terms of Service
              </Button>
              <Button variant="text" size="small" color="inherit" /*onClick={() => navigate('/contact') }*/>
                Contact Us
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default NewLandingPage;