// NewLandingPage.jsx - Conceptual Outline for a simple and convincing landing page
// Retargeted for Network Creators of Private Micro Social Networks.

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Stack,
  useTheme,
} from '@mui/material';
import {
  Shield,         // For Privacy/Security
  Euro,           // For EU-based
  Block,          // For Ads/Tracking/AI Free
  CheckCircle,    // For positive features / Benefits
  ArrowForward,   // For Call to Action
  Warning,        // For warnings/problems related to big tech (as a contrast)
  Groups,         // For Community/Network Building
  Handshake,      // For Trust/Authenticity
  AdminPanelSettings, // For Control/Management
} from '@mui/icons-material';

const NewLandingPage = () => {
  const theme = useTheme();

  return (
    <Box sx={{ flexGrow: 1 }}>

      {/* 1. Hero Section: Direct, Creator-Focused Headline */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          textAlign: 'center',
          backgroundColor: theme.palette.primary.main,
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
            Empower Your Community. <br /> Create Your Own Private Network.
          </Typography>
          <Typography
            variant="h6"
            sx={{ mb: 4, opacity: 0.9 }}
          >
            Tired of mainstream platforms dictating your community's rules and monetizing its data? Build a dedicated, private space, fully under your control.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              color="secondary"
              endIcon={<ArrowForward />}
              // onClick={() => navigate('/create-network')} // Placeholder for navigation
            >
              Start Building Your Network
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
              // onClick={() => navigate('/how-it-works-for-creators')} // Placeholder for navigation
            >
              How It Works for Creators
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* 2. Problem Section: The "Challenges" for Community Builders on Mainstream Platforms */}
      <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: theme.palette.background.paper }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" gutterBottom sx={{ mb: 6 }}>
            The Limitations of Generic Social Platforms for Your Community
          </Typography>
          <Grid container spacing={{ xs: 4, md: 6 }} justifyContent="center">
            {/* Problem 1: Lack of Control & Data Exploitation */}
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <DataUsage color="error" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Loss of Control & Data Ownership
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Your community's data is a valuable asset. On mainstream platforms, it's harvested, analyzed, and monetized by others, leaving you with no control or direct insight.
                </Typography>
              </Box>
            </Grid>

            {/* Problem 2: Distractions, Algorithms & Eroding Engagement */}
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Campaign color="warning" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Algorithmic Interference & Distractions
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Ads, irrelevant content, and opaque algorithms stifle genuine interaction. Your community's messages get lost, and engagement suffers from constant external noise.
                </Typography>
              </Box>
            </Grid>

            {/* Problem 3: Trust Issues & Brand Dilution */}
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Warning color="info" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Compromised Trust & Brand Consistency
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Building trust is paramount for any community. When your interactions happen on platforms known for privacy breaches and misinformation, your brand's integrity is at risk.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 3. Solution Section: Your Platform's Unique Value Proposition for Creators */}
      <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: theme.palette.background.default }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" gutterBottom sx={{ mb: 6 }}>
            The Solution: Your Dedicated, Private Social Network
          </Typography>
          <Grid container spacing={{ xs: 4, md: 6 }} justifyContent="center">
            {/* Solution 1: Full Control & Ownership */}
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <AdminPanelSettings color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Complete Control & Data Sovereignty
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  You own your network, your data, and your rules. Customize everything from branding to moderation, ensuring a safe and tailored experience for your members.
                </Typography>
              </Box>
            </Grid>

            {/* Solution 2: Privacy & Trust by Design (for your members) */}
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Shield color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Built-in Privacy & GDPR Compliance
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Attract and retain members with a platform designed for privacy. No ads, no tracking, no AI exploitation. Hosted entirely within the EU for maximum data protection.
                </Typography>
              </Box>
            </Grid>

            {/* Solution 3: Foster Deeper Engagement & Authentic Connections */}
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Groups color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Focus on Authentic Community & Engagement
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Provide a clean, focused environment free from distractions. Empower your members to connect genuinely, fostering stronger bonds and more meaningful interactions.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 4. Call to Action Section (for Network Creators) */}
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          textAlign: 'center',
          backgroundColor: theme.palette.secondary.main,
          color: theme.palette.secondary.contrastText,
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
            Ready to Build the Social Network Your Community Deserves?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Take back control and cultivate a thriving, private online space for your members.
          </Typography>
          <Button
            variant="contained"
            size="large"
            color="primary"
            endIcon={<ArrowForward />}
            // onClick={() => navigate('/start-your-network')} // Placeholder for navigation
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
            Launch Your Private Network Now
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