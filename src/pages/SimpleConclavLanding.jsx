import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  Stack,
  Paper
} from '@mui/material';
import { 
  Security, 
  Speed, 
  Group, 
  Shield, 
  Rocket,
  Block,
  Public,
  ArrowForward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SimpleConclavLanding = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 6 }}>
        <Box textAlign="center" mb={6}>
          {/* European Badge */}
          <Chip 
            label="🇪🇺 Made in Europe • No Silicon Valley" 
            sx={{ 
              mb: 4, 
              bgcolor: '#1565C0', 
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1rem',
              py: 1,
              px: 2
            }} 
          />
          
          {/* Main Title */}
          <Typography 
            variant="h1" 
            sx={{ 
              fontSize: { xs: '3rem', md: '5rem' },
              fontWeight: 'bold',
              mb: 3,
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Conclav
          </Typography>
          
          {/* Subtitle */}
          <Typography 
            variant="h4" 
            sx={{ 
              mb: 3, 
              color: 'text.primary',
              fontWeight: 500,
              fontSize: { xs: '1.5rem', md: '2rem' }
            }}
          >
            The micro social network that respects you
          </Typography>
          
          {/* Description */}
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 5, 
              color: 'text.secondary',
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.8,
              fontSize: { xs: '1.1rem', md: '1.25rem' }
            }}
          >
            Create your own networks instantly. No tracking. No ads. No corporate surveillance. 
            <strong> Just authentic connections.</strong>
          </Typography>

          {/* CTA Buttons */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" mb={3}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Rocket />}
              onClick={() => navigate('/signup')}
              sx={{
                py: 2.5,
                px: 5,
                fontSize: '1.2rem',
                borderRadius: 4,
                boxShadow: 4,
                bgcolor: '#1976d2',
                '&:hover': {
                  bgcolor: '#1565c0',
                  boxShadow: 8,
                  transform: 'translateY(-3px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Start Free Trial
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/demo')}
              sx={{
                py: 2.5,
                px: 5,
                fontSize: '1.2rem',
                borderRadius: 4,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-3px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              See Demo
            </Button>
          </Stack>

          {/* Trial Info */}
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
            30 days free • No credit card • Cancel anytime
          </Typography>
        </Box>
      </Container>

      {/* Anti-GAFAM Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Block sx={{ fontSize: 80, color: 'error.main', mb: 3 }} />
            <Typography variant="h3" gutterBottom fontWeight="bold" color="text.primary">
              Break Free from Big Tech
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, color: 'text.secondary', maxWidth: '600px', mx: 'auto' }}>
              No Google. No Meta. No Amazon. No Apple. No Microsoft tracking you.
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={4} textAlign="center">
              <Shield sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom fontWeight="bold">
                European Privacy
              </Typography>
              <Typography color="text.secondary">
                GDPR compliant by design. Your data stays in Europe, protected by the world's strongest privacy laws.
              </Typography>
            </Grid>

            <Grid item xs={12} md={4} textAlign="center">
              <Speed sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Zero Bloat
              </Typography>
              <Typography color="text.secondary">
                No ads, no tracking scripts, no analytics. Just pure functionality that loads instantly.
              </Typography>
            </Grid>

            <Grid item xs={12} md={4} textAlign="center">
              <Group sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Your Networks
              </Typography>
              <Typography color="text.secondary">
                Create unlimited private communities. You control who joins and what gets shared.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Why Conclav Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" textAlign="center" gutterBottom fontWeight="bold" mb={6}>
          Everything you need. Nothing you don't.
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 4, height: '100%' }}>
              <Security sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Simple & Secure
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                Create networks in seconds. Share portfolios, organize events, message members. 
                All with bank-level security and zero corporate surveillance.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 4, height: '100%' }}>
              <Public sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom fontWeight="bold">
                European Alternative
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                Built in France, hosted in Europe. A real alternative to Silicon Valley platforms 
                that respect your privacy and digital sovereignty.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Final CTA Section */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="md" textAlign="center">
          <Typography variant="h3" gutterBottom fontWeight="bold">
            Ready to own your digital space?
          </Typography>
          <Typography variant="h6" sx={{ mb: 5, opacity: 0.9 }}>
            Join thousands creating authentic communities without Big Tech interference
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<Rocket />}
            onClick={() => navigate('/signup')}
            sx={{
              py: 3,
              px: 6,
              fontSize: '1.3rem',
              borderRadius: 4,
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'grey.100',
                transform: 'translateY(-3px)',
                boxShadow: 6
              },
              transition: 'all 0.3s ease'
            }}
          >
            Start Your Free Trial
          </Button>
          
          <Typography variant="body2" sx={{ mt: 3, opacity: 0.8 }}>
            30 days free • Setup in under 5 minutes • Cancel anytime
          </Typography>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            justifyContent="space-between" 
            alignItems="center"
            spacing={2}
          >
            <Typography variant="h6" fontWeight="bold">
              Conclav
            </Typography>
            
            <Stack direction="row" spacing={3}>
              <Button color="inherit" onClick={() => navigate('/privacy')}>
                Privacy
              </Button>
              <Button color="inherit" onClick={() => navigate('/terms')}>
                Terms
              </Button>
              <Button color="inherit" onClick={() => navigate('/contact')}>
                Contact
              </Button>
            </Stack>
            
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              © 2024 Conclav • Made in Europe 🇪🇺
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default SimpleConclavLanding;