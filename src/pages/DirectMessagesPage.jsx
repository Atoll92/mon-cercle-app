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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ArrowBack as ArrowBackIcon,
  Forum as ForumIcon,
  Add as AddIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon
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
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [newChatUserId, setNewChatUserId] = useState('');
  
  // Use a ref to track if initialization has been attempted
  const initAttemptedRef = useRef(false);
  // Ref to track the latest userId to prevent re-initialization on the same ID
  const lastUserIdRef = useRef(null);

  // Debug logging for state
  console.log("Current state:", {
    selectedConversationId,
    partnerState: partner ? `${partner.id} (${partner.full_name})` : 'none',
    conversationsCount: conversations.length,
    conversationsLoading
  });
  
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

  // This effect sets the default conversation if none is selected
  useEffect(() => {
    // If we don't have a selected conversation but have some in the list, select the first one
    if (!selectedConversationId && !conversationsLoading && conversations.length > 0 && !isMobile) {
      const firstConversation = conversations[0];
      setSelectedConversationId(firstConversation.id);
      setActiveConversation(firstConversation.id);
      setPartner(firstConversation.partner);
      console.log('Auto-selecting first conversation:', firstConversation.id);
    }
  }, [conversations, selectedConversationId, conversationsLoading, setActiveConversation, isMobile]);
  
  // Select a conversation from the list
  const handleSelectConversation = (conversationId) => {
    // Safety check
    if (!conversationId) {
      console.error('Attempted to select conversation with null ID');
      return;
    }
    
    console.log('Selecting conversation:', conversationId);
    
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (!conversation) {
      console.error('Could not find conversation:', conversationId);
      return;
    }
    
    // Properly set both the selected ID and the partner from the same conversation object
    // to ensure they stay in sync
    console.log('Found conversation to select:', conversation);
    setSelectedConversationId(conversationId);
    setActiveConversation(conversationId);
    
    // Make sure we have the partner data
    if (!conversation.partner) {
      console.error('Selected conversation has no partner data:', conversation);
    } else {
      // Set the partner explicitly from the conversation
      setPartner(conversation.partner);
      console.log('Setting partner to:', conversation.partner);
    }
    
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
    setNewChatDialogOpen(true);
  };

  const handleStartNewChat = async () => {
    if (!newChatUserId.trim()) {
      return;
    }

    // Close dialog and navigate to start the conversation
    setNewChatDialogOpen(false);
    setNewChatUserId('');
    navigate(`/messages/${newChatUserId.trim()}`);
  };
  
  // Responsive layout setup
  const renderMobileLayout = () => (
    <>
      {/* Mobile layout with sliding views */}
      {showChat ? (
        // Chat view for mobile
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <IconButton edge="start" onClick={handleBackToList} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {partner ? partner.full_name : 'Messages'}
            </Typography>
            <IconButton edge="end" onClick={toggleDrawer}>
              <ForumIcon />
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            {selectedConversationId && partner ? (
              <DirectMessageChat 
                conversationId={selectedConversationId}
                partner={partner}
                onBack={handleBackToList}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  Select a conversation to start messaging
                </Typography>
              </Box>
            )}
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
          <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <IconButton edge="start" component={Link} to="/dashboard" sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Messages
            </Typography>
            <IconButton edge="end" onClick={handleNewConversation}>
              <AddIcon />
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <DirectMessagesList onSelectConversation={handleSelectConversation} />
          </Box>
        </Box>
      )}
    </>
  );
  
  // Desktop/tablet responsive layout
  const renderDesktopLayout = () => (
    <Paper sx={{ 
      overflow: 'hidden', 
      height: '80vh', 
      display: 'flex', 
      width: '100%' 
    }}>
      {/* Sidebar with conversation list */}
      <Box 
        sx={{ 
          // width: isTablet ? '30%' : '25%',
          width: `max(250px, ${isTablet ? '30%' : '25%'})`,
          minWidth: `max(250px, ${isTablet ? '30%' : '25%'})`,
          borderRight: 1, 
          borderColor: 'divider',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider', 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Conversations
          </Typography>
          <IconButton size="small" onClick={handleNewConversation}>
            <AddIcon />
          </IconButton>
        </Box>
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <DirectMessagesList onSelectConversation={handleSelectConversation} />
        </Box>
      </Box>
      
      {/* Main chat area */}
      <Box sx={{ 
        flexGrow: 1, 
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {selectedConversationId && partner ? (
          <DirectMessageChat 
            key={selectedConversationId}
            conversationId={selectedConversationId}
            partner={partner}
            onBack={handleBackToList}
          />
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%', 
              p: 3
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Select a conversation or start a new one
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleNewConversation}
            >
              New Conversation
            </Button>
          </Box>
        )}
      </Box>
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
          
          {/* {initLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Initializing conversation...
              </Typography>
            </Box>
          )} */}
        </Container>
      )}
      
      {isMobile ? (
        renderMobileLayout()
      ) : (
        <Container maxWidth="xl" sx={{ mb: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {renderDesktopLayout()}
        </Container>
      )}

      {/* New Chat Dialog */}
      <Dialog open={newChatDialogOpen} onClose={() => setNewChatDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start New Conversation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="User ID"
            fullWidth
            variant="outlined"
            value={newChatUserId}
            onChange={(e) => setNewChatUserId(e.target.value)}
            helperText="Enter the ID of the user you want to message"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewChatDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStartNewChat} variant="contained" color="primary">
            Start Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DirectMessagesPage;