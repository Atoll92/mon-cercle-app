// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container,
  useTheme
} from '@mui/material';

const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        py: 3,
        mt: 'auto',
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(245, 245, 245, 0.9)',
        backdropFilter: 'blur(5px)',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
            <Box 
              component="img"
              src="/logo.png"
              alt="Conclav Logo"
              sx={{ 
                height: 32,
                width: 'auto',
                mr: 1.5,
                filter: theme.palette.mode === 'dark' ? 'brightness(1.5)' : 'none'
              }}
            />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                letterSpacing: 1,
                backgroundImage: 'linear-gradient(120deg, #2196f3, #3f51b5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: 16, sm: 20 }
              }}
            >
              CONCLAV
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" textAlign={{ xs: 'center', sm: 'right' }}>
            © {currentYear} Conclav Networks. All rights reserved.
            <Box component="span" sx={{ mx: 1.5 }}>|</Box>
            <Link to="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</Link>
            <Box component="span" sx={{ mx: 1 }}>•</Box>
            <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
            <Box component="span" sx={{ mx: 1 }}>•</Box>
            <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;