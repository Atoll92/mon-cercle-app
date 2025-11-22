import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { PageTransition } from './AnimatedComponents';
import { useNetwork } from '../context/networkContext';
import {
  Typography,
  Paper,
  Alert,
  IconButton,
  Dialog,
  AppBar,
  Toolbar,
  Box,
  Slide,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import Chat from './Chat';

// Transition for the fullscreen dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ChatTab = ({ networkId, isUserMember, darkMode = false }) => {
  const { t } = useTranslation();
  const [fullscreen, setFullscreen] = useState(false);
  const { network } = useNetwork();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Lock body scroll on mobile when chat tab is active
  useEffect(() => {
    if (!isUserMember || !isMobile) return;

    // Save original styles
    const originalStyle = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      width: document.body.style.width,
      height: document.body.style.height,
    };

    // Lock body scroll on mobile
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    return () => {
      // Restore original styles
      document.body.style.overflow = originalStyle.overflow;
      document.body.style.position = originalStyle.position;
      document.body.style.width = originalStyle.width;
      document.body.style.height = originalStyle.height;
    };
  }, [isUserMember, isMobile]);

  const handleFullscreenOpen = () => {
    setFullscreen(true);
  };

  const handleFullscreenClose = () => {
    setFullscreen(false);
  };

  // On mobile, render a fullscreen-like experience directly
  if (isMobile && isUserMember) {
    return (
      <Box
        id="chat-tab-mobile"
        sx={{
          // Fixed positioning to cover the viewport below the network header
          position: 'fixed',
          // Use CSS variable set by NetworkHeader, fallback to 56px (typical mobile header)
          top: 'var(--network-header-height, 56px)',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1100, // Below network header (1200) but above content
          display: 'flex',
          flexDirection: 'column',
          bgcolor: darkMode ? '#121212' : '#f8f9fa',
          // Use safe area insets for notched devices (bottom only since header handles top)
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Chat Container - fills entire space (no header for cleaner mobile UI) */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0, // Critical for flex overflow
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Chat
            networkId={networkId}
            isFullscreen={true} // Treat mobile as fullscreen for optimal layout
            backgroundImageUrl={network?.background_image_url}
          />
        </Box>

        {/* Fullscreen Dialog - same as desktop */}
        <Dialog
          fullScreen
          open={fullscreen}
          onClose={handleFullscreenClose}
          TransitionComponent={Transition}
          sx={{
            '& .MuiDialog-paper': {
              bgcolor: darkMode ? '#121212' : '#f8f9fa',
            },
          }}
        >
          <AppBar position="static" color="primary" elevation={2}>
            <Toolbar sx={{ minHeight: 56, px: 1 }}>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleFullscreenClose}
                aria-label={t('chatTab.closeFullscreen')}
                size="small"
                sx={{ mr: 1 }}
              >
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flex: 1, fontWeight: 500, fontSize: '1.1rem' }}>
                {t('chatTab.networkChat')}
              </Typography>
            </Toolbar>
          </AppBar>
          <Box
            sx={{
              flex: 1,
              overflow: 'hidden',
              bgcolor: darkMode ? 'rgba(18,18,18,0.95)' : 'rgba(248,249,250,0.95)',
            }}
          >
            <Chat
              networkId={networkId}
              isFullscreen={true}
              backgroundImageUrl={network?.background_image_url}
            />
          </Box>
        </Dialog>
      </Box>
    );
  }

  // Desktop/tablet view - original Paper-based layout
  return (
    <PageTransition>
      <Paper
        id="chat-tab-container"
        sx={{
          p: 2,
          mt: 1.5,
          position: 'relative',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        {isUserMember && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              mb: 1,
              pb: 1,
              borderBottom: '1px solid',
              borderBottomColor: 'divider',
            }}
          >
            <IconButton
              onClick={handleFullscreenOpen}
              size="small"
              color="primary"
              sx={{
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.12)',
                  transform: 'scale(1.05)',
                },
                backgroundColor: 'rgba(25, 118, 210, 0.06)',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                p: 1,
              }}
              title={t('chatTab.expandToFullscreen')}
              aria-label={t('chatTab.fullscreenChat')}
            >
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {isUserMember ? (
          <Box sx={{ minHeight: 0 }}>
            <Chat
              networkId={networkId}
              isFullscreen={false}
              backgroundImageUrl={network?.background_image_url}
            />
          </Box>
        ) : (
          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              '& .MuiAlert-message': {
                fontSize: '0.9rem',
              },
            }}
          >
            {t('chatTab.membershipRequired')}
          </Alert>
        )}

        {/* Fullscreen Dialog */}
        <Dialog
          fullScreen
          open={fullscreen}
          onClose={handleFullscreenClose}
          TransitionComponent={Transition}
          sx={{
            '& .MuiDialog-paper': {
              bgcolor: darkMode ? '#121212' : '#f8f9fa',
              borderRadius: 0,
            },
          }}
        >
          <AppBar
            position="static"
            color="primary"
            elevation={2}
            sx={{
              borderBottom: '1px solid',
              borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Toolbar sx={{ minHeight: 64, px: 3 }}>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleFullscreenClose}
                aria-label={t('chatTab.closeFullscreen')}
                size="small"
                sx={{
                  mr: 2,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flex: 1, fontWeight: 500, fontSize: '1.25rem' }}>
                {t('chatTab.networkChat')}
              </Typography>
            </Toolbar>
          </AppBar>

          <Box
            sx={{
              height: 'calc(100vh - 64px)',
              p: 1,
              bgcolor: darkMode ? 'rgba(18,18,18,0.95)' : 'rgba(248,249,250,0.95)',
              overflow: 'hidden',
            }}
          >
            <Chat
              networkId={networkId}
              isFullscreen={true}
              backgroundImageUrl={network?.background_image_url}
            />
          </Box>
        </Dialog>
      </Paper>
    </PageTransition>
  );
};

export default ChatTab;
