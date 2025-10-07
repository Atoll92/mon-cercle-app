import React, { useState } from 'react';
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
  Slide
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
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

  const handleFullscreenOpen = () => {
    setFullscreen(true);
  };

  const handleFullscreenClose = () => {
    setFullscreen(false);
  };

  return (
    <PageTransition>
      <Paper sx={{ 
        p: { xs: 1.5, sm: 2 }, 
        mt: 1.5, 
        position: 'relative',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        {isUserMember && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            mb: 1,
            pb: 1,
            borderBottom: '1px solid',
            borderBottomColor: 'divider'
          }}>
            <IconButton 
              onClick={handleFullscreenOpen} 
              size="small"
              color="primary"
              sx={{ 
                '&:hover': { 
                  bgcolor: 'rgba(25, 118, 210, 0.12)',
                  transform: 'scale(1.05)'
                },
                backgroundColor: 'rgba(25, 118, 210, 0.06)',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                p: 1
              }}
              title={t('chatTab.expandToFullscreen')}
              aria-label={t('chatTab.fullscreenChat')}
            >
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      
      {isUserMember ? (
        <Chat networkId={networkId} isFullscreen={false} backgroundImageUrl={network?.background_image_url} />
      ) : (
        <Alert 
          severity="info"
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-message': { 
              fontSize: '0.9rem' 
            }
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
            borderRadius: 0
          }
        }}
      >
        <AppBar 
          position="static" 
          color="primary" 
          elevation={2} 
          sx={{ 
            borderBottom: '1px solid',
            borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <Toolbar sx={{ 
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 1, sm: 3 }
          }}>
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
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              sx={{ 
                flex: 1, 
                fontWeight: 500,
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              {t('chatTab.networkChat')}
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Box sx={{ 
          height: 'calc(100vh - 64px)', 
          p: { xs: 0.5, sm: 1 },
          bgcolor: darkMode ? 'rgba(18,18,18,0.95)' : 'rgba(248,249,250,0.95)',
          overflow: 'hidden'
        }}>
          <Chat networkId={networkId} isFullscreen={true} backgroundImageUrl={network?.background_image_url} />
        </Box>
      </Dialog>
      </Paper>
    </PageTransition>
  );
};

export default ChatTab;