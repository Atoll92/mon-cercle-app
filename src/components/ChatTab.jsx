import React, { useState } from 'react';
import { PageTransition } from './AnimatedComponents';
import { useNetwork } from '../context/networkContext';
import {
  Typography,
  Paper,
  Divider,
  Alert,
  IconButton,
  Dialog,
  AppBar,
  Toolbar,
  Box,
  Slide,
  Fade,
  Zoom
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
      <Paper sx={{ p: 3, mt: 2, position: 'relative' }} >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Fade in timeout={500}>
            <Typography variant="h5">
              Network Chat
            </Typography>
          </Fade>
        
        {isUserMember && (
          <IconButton 
            onClick={handleFullscreenOpen} 
            color="primary"
            sx={{ 
              '&:hover': { 
                bgcolor: 'rgba(25, 118, 210, 0.15)',
                transform: 'scale(1.1)'
              },
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              transition: 'all 0.2s ease',
              ml: 1,
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}
            title="Expand chat to fullscreen"
            aria-label="Fullscreen chat"
          >
            <FullscreenIcon />
          </IconButton>
        )}
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {isUserMember ? (
        <Chat networkId={networkId} isFullscreen={false} backgroundImageUrl={network?.background_image_url} />
      ) : (
        <Alert severity="info">
          You must be a member of this network to participate in the chat
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
            bgcolor: darkMode ? '#121212' : '#f5f5f5'
          }
        }}
      >
        <AppBar position="static" color="primary" elevation={3} sx={{ 
          borderBottom: '1px solid',
          borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }}>
          <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleFullscreenClose}
              aria-label="close fullscreen"
              sx={{ mr: 1 }}
            >
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 1, flex: 1, fontWeight: 500 }}>
              Network Chat (Fullscreen Mode)
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={handleFullscreenClose}
              aria-label="exit fullscreen"
              sx={{ 
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'scale(1.1)' } 
              }}
              title="Exit fullscreen"
            >
              <FullscreenExitIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        <Box sx={{ 
          height: 'calc(100vh - 64px)', 
          p: { xs: 1, sm: 2 },
          bgcolor: darkMode ? 'rgba(18,18,18,0.9)' : 'rgba(245,245,245,0.9)'
        }}>
          <Chat networkId={networkId} isFullscreen={true} backgroundImageUrl={network?.background_image_url} />
        </Box>
      </Dialog>
      </Paper>
    </PageTransition>
  );
};

export default ChatTab;