import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useDirectMessages } from '../context/directMessagesContext';
import { getUserForMessaging, getOrCreateConversation } from '../api/directMessages';
import DirectMessagesList from '../components/DirectMessagesList';
import DirectMessageChat from '../components/DirectMessageChat';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Divider,
  useMediaQuery,
  IconButton,
  CircularProgress,
  Alert,
  Fab,
  Drawer,
  AppBar,
  Toolbar
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ArrowBack as ArrowBackIcon,
  Forum as ForumIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';

function DirectMessagesPage() {
  const { userId } = useParams(); // Optional param if starting a conversation with someone
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const { 
    conversations, 
    loading: conversationsLoading,
    setActiveConversation,
    addConversation,
    refreshConversations
  } = useDirectMessages();
  
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [partner, setPartner] = useState(null);
  const [showChat, setShowChat] = useState(!isMobile);
  const [initLoading, setInitLoading] = useState(false);
  const [initError, setInitError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Use a ref to track if initialization has been attempted
  const initAttemptedRef = useRef(false);
  // Ref to track the latest userId to prevent re-initialization on the same ID
  const lastUserIdRef = useRef(null);
  
  // If userId is provided, start or get conversation with that user
  useEffect(() => {
    // Skip if we've already initialized for this userId or no userId is provided
    if (!userId || !user || userId === user.id) {
      return;
    }
    
    // Skip if we're already initializing for this userId
    if (lastUserIdRef.current === userId && initAttemptedRef.current) {
      return;
    }
    
    const initConversation = async () => {
      try {
        // Set flags to prevent re-initialization
        initAttemptedRef.current = true;
        lastUserIdRef.current = userId;
        
        setInitLoading(true);
        setInitError(null);
        console.log('Initializing conversation with user:', userId);
        
        // Get partner info
        const { user: partnerData, error: userError } = await getUserForMessaging(userId);
        
        if (userError) {
          console.error('Error fetching partner info:', userError);
          throw new Error('Could not find the user you want to message');
        }
        
        if (!partnerData) {
          throw new Error('User not found');
        }
        
        setPartner(partnerData);
        console.log('Partner data retrieved:', partnerData);
        
        // Check if a conversation with this partner already exists in our list
        const existingConversation = conversations.find(conv => 
          conv.partner && conv.partner.id === userId
        );
        
        if (existingConversation) {
          console.log('Found existing conversation in state:', existingConversation.id);
          setSelectedConversationId(existingConversation.id);
          setActiveConversation(existingConversation.id);
          setShowChat(true);
          setInitLoading(false);
          return;
        }
        
        // Get or create conversation
        const { conversation, error } = await getOrCreateConversation(user.id, userId);
        
        if (error) {
          console.error('Error getting/creating conversation:', error);
          throw new Error('Failed to start conversation');
        }
        
        if (!conversation) {
          throw new Error('Could not create conversation');
        }
        
        console.log('Conversation retrieved/created:', conversation);
        
        // Add conversation to the list if needed
        const conversationWithPartner = {
          ...conversation,
          partner: partnerData,
          last_message: null,
          unread_count: 0
        };
        
        addConversation(conversationWithPartner);
        
        // Set as active conversation
        setSelectedConversationId(conversation.id);
        setActiveConversation(conversation.id);
        setShowChat(true);
        
      } catch (error) {
        console.error('Error initializing conversation:', error);
        setInitError(error.message || 'Failed to start conversation');
        // Reset initialization flags on error so we can try again
        initAttemptedRef.current = false;
        lastUserIdRef.current = null;
      } finally {
        setInitLoading(false);
      }
    };
    
    initConversation();
    
    // Clean up function
    return () => {
      // If we navigate away, reset the initialization flags
      if (lastUserIdRef.current === userId) {
        initAttemptedRef.current = false;
        lastUserIdRef.current = null;
      }
    };
  }, [userId, user, conversations, addConversation, setActiveConversation]);
  
  // Select a conversation from the list
  const handleSelectConversation = (conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (!conversation) {
      console.error('Could not find conversation:', conversationId);
      return;
    }
    
    setSelectedConversationId(conversationId);
    setActiveConversation(conversationId);
    setPartner(conversation.partner);
    setShowChat(true);
    setDrawerOpen(false);
    
    // Update URL if needed (optional)
    if (userId) {
      navigate('/messages');
    }
  };
  
  // Go back to conversation list on mobile
  const handleBackToList = () => {
    setShowChat(false);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // Handle new conversation button
  const handleNewConversation = () => {
    // This would open a modal or navigate to a page to select a user
    // For now, let's just navigate to the dashboard
    navigate('/dashboard');
  };
  
  // Responsive layout setup
  const renderMobileLayout = () => (
    <>
      {/* Mobile layout with sliding views */}
      {showChat ? (
        // Chat view for mobile
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <AppBar position="static" color="default" elevation={0}>
            <Toolbar>
              <IconButton edge="start" onClick={handleBackToList} sx={{ mr: 1 }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Messages
              </Typography>
              <IconButton edge="end" onClick={toggleDrawer}>
                <ForumIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <DirectMessageChat 
              conversationId={selectedConversationId}
              partner={partner}
              onBack={handleBackToList}
            />
          </Box>
          
          {/* Drawer for conversation list on mobile */}
          <Drawer
            anchor="right"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            PaperProps={{ sx: { width: '80%', maxWidth: 360 } }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Conversations
              </Typography>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ height: 'calc(100% - 64px)', overflow: 'hidden' }}>
              <DirectMessagesList onSelectConversation={handleSelectConversation} />
            </Box>
          </Drawer>
        </Box>
      ) : (
        // Conversation list view for mobile
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <AppBar position="static" color="default" elevation={0}>
            <Toolbar>
              <IconButton edge="start" component={Link} to="/dashboard" sx={{ mr: 1 }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Messages
              </Typography>
            </Toolbar>
          </AppBar>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <DirectMessagesList onSelectConversation={handleSelectConversation} />
          </Box>
          <Fab 
            color="primary" 
            aria-label="new message" 
            onClick={handleNewConversation}
            sx={{ position: 'absolute', bottom: 16, right: 16 }}
          >
            <AddIcon />
          </Fab>
        </Box>
      )}
    </>
  );
  
  // Desktop/tablet responsive layout
  const renderDesktopLayout = () => (
    <Paper sx={{ overflow: 'hidden', height: '80vh', display: 'flex' }}>
      <Grid container sx={{ height: '100%' }}>
        {/* Sidebar with conversation list - always visible on desktop */}
        <Grid 
          item 
          xs={12} 
          sm={isTablet ? 4 : 3} 
          sx={{ 
            borderRight: 1, 
            borderColor: 'divider',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Conversations
            </Typography>
            <IconButton size="small" onClick={handleNewConversation}>
              <AddIcon />
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <DirectMessagesList onSelectConversation={handleSelectConversation} />
          </Box>
        </Grid>
        
        {/* Main chat area */}
        <Grid item xs={12} sm={isTablet ? 8 : 9} sx={{ height: '100%' }}>
          <DirectMessageChat 
            conversationId={selectedConversationId}
            partner={partner}
            onBack={handleBackToList}
          />
        </Grid>
      </Grid>
    </Paper>
  );
  
  return (
    <Box sx={{ 
      height: isMobile ? 'calc(100vh - 56px)' : undefined,  
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#f5f7f9'
    }}>
      {!isMobile && (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Button
              component={Link}
              to="/dashboard"
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
              variant="text"
            >
              Dashboard
            </Button>
            <Typography variant="h5" component="h1">
              Messages
            </Typography>
          </Box>
          
          {initError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {initError}
            </Alert>
          )}
          
          {initLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Initializing conversation...
              </Typography>
            </Box>
          )}
        </Container>
      )}
      
      {isMobile ? (
        renderMobileLayout()
      ) : (
        <Container maxWidth="xl" sx={{ mb: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {renderDesktopLayout()}
        </Container>
      )}
    </Box>
  );
}

export default DirectMessagesPage;