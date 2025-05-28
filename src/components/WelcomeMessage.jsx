import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Alert
} from '@mui/material';
import {
  Celebration as CelebrationIcon,
  Groups as GroupsIcon,
  Event as EventIcon,
  Article as ArticleIcon,
  ChatBubble as ChatIcon,
  Folder as FolderIcon,
  Dashboard as DashboardIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import confetti from 'canvas-confetti';

function WelcomeMessage({ open, onClose, network, user, onStartTour }) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open && !showConfetti) {
      // Trigger confetti animation
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 500);
      setShowConfetti(true);
    }
  }, [open, showConfetti]);

  const features = [
    {
      icon: <DashboardIcon />,
      title: 'Social Wall',
      description: 'See all network activity in one place'
    },
    {
      icon: <GroupsIcon />,
      title: 'Members Directory',
      description: 'Connect with other network members'
    },
    {
      icon: <EventIcon />,
      title: 'Events Calendar',
      description: 'Discover and join network events'
    },
    {
      icon: <ArticleIcon />,
      title: 'News & Updates',
      description: 'Stay informed with network news'
    },
    {
      icon: <ChatIcon />,
      title: 'Real-time Chat',
      description: 'Engage in conversations with members'
    },
    {
      icon: <FolderIcon />,
      title: 'Shared Files',
      description: 'Access and share network resources'
    }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogTitle sx={{ 
          textAlign: 'center', 
          color: 'white',
          pt: 4,
          pb: 2
        }}>
          <Stack spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'white',
                color: '#667eea'
              }}
            >
              <CelebrationIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h2" gutterBottom>
                Welcome to {network?.name}!
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Hi {user?.full_name || user?.email?.split('@')[0]}, we're thrilled to have you here!
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ backgroundColor: 'white', pt: 3 }}>
          <Alert 
            severity="success" 
            icon={<AutoAwesomeIcon />}
            sx={{ mb: 3 }}
          >
            You've successfully joined the network! Here's what you can explore:
          </Alert>

          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Key Features
          </Typography>
          
          <List sx={{ py: 0 }}>
            {features.map((feature, index) => (
              <ListItem 
                key={index}
                sx={{ 
                  px: 0,
                  '&:hover': {
                    backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    borderRadius: 1
                  }
                }}
              >
                <ListItemIcon sx={{ color: '#667eea' }}>
                  {feature.icon}
                </ListItemIcon>
                <ListItemText
                  primary={feature.title}
                  secondary={feature.description}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ 
            p: 2, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 1,
            textAlign: 'center'
          }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Need help getting started?
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<ArrowForwardIcon />}
              onClick={() => {
                onClose();
                onStartTour();
              }}
              sx={{ 
                mt: 1,
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                boxShadow: '0 3px 5px 2px rgba(102, 126, 234, .3)',
              }}
            >
              Take a Quick Tour
            </Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          backgroundColor: 'white', 
          justifyContent: 'center',
          pb: 3
        }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            size="large"
            sx={{ 
              borderColor: '#667eea',
              color: '#667eea',
              '&:hover': {
                borderColor: '#764ba2',
                backgroundColor: 'rgba(102, 126, 234, 0.05)'
              }
            }}
          >
            Start Exploring
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default WelcomeMessage;