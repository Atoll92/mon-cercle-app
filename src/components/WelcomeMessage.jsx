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
import { useTranslation } from '../hooks/useTranslation';
import confetti from 'canvas-confetti';

function WelcomeMessage({ open, onClose, network, user, onStartTour }) {
  const { t } = useTranslation();
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
      title: t('welcomeMessage.features.socialWall.title'),
      description: t('welcomeMessage.features.socialWall.description')
    },
    {
      icon: <GroupsIcon />,
      title: t('welcomeMessage.features.membersDirectory.title'),
      description: t('welcomeMessage.features.membersDirectory.description')
    },
    {
      icon: <EventIcon />,
      title: t('welcomeMessage.features.eventsCalendar.title'),
      description: t('welcomeMessage.features.eventsCalendar.description')
    },
    {
      icon: <ArticleIcon />,
      title: t('welcomeMessage.features.newsUpdates.title'),
      description: t('welcomeMessage.features.newsUpdates.description')
    },
    {
      icon: <ChatIcon />,
      title: t('welcomeMessage.features.realtimeChat.title'),
      description: t('welcomeMessage.features.realtimeChat.description')
    },
    {
      icon: <FolderIcon />,
      title: t('welcomeMessage.features.sharedFiles.title'),
      description: t('welcomeMessage.features.sharedFiles.description')
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
                {t('welcomeMessage.title', { networkName: network?.name })}
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                {t('welcomeMessage.greeting', { userName: user?.full_name || user?.email?.split('@')[0] })}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ backgroundColor: 'background.paper', pt: 3 }}>
          <Alert
            severity="success"
            icon={<AutoAwesomeIcon />}
            sx={{ mb: 3 }}
          >
            {t('welcomeMessage.successMessage')}
          </Alert>

          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            {t('welcomeMessage.keyFeatures')}
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

          {/* <Box sx={{
            p: 2,
            backgroundColor: 'background.paper',
            borderRadius: 1,
            textAlign: 'center'
          }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('welcomeMessage.needHelp')}
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
              {t('welcomeMessage.takeQuickTour')}
            </Button>
          </Box> */}
        </DialogContent>

        <DialogActions sx={{
          backgroundColor: 'background.default',
          justifyContent: 'center',
          py: 3
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
            {t('welcomeMessage.startExploring')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default WelcomeMessage;