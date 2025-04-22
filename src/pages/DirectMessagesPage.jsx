import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useDirectMessages } from '../context/directMessagesContext';
import { getUserForMessaging, getOrCreateConversation } from '../api/directmessages';
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
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ArrowBack as ArrowBackIcon,
  Forum as ForumIcon
} from '@mui/icons-material';

function DirectMessagesPage() {
  const { userId } = useParams(); // Optional param if starting a conversation with someone
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
    
    // Update URL if needed (optional)
    if (userId) {
      navigate('/messages');
    }
  };
  
  // Go back to conversation list on mobile
  const handleBackToList = () => {
    setShowChat(false);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center' }}>
        <Button
          component={Link}
          to="/dashboard"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Dashboard
        </Button>
        <Typography variant="h5" component="h1">
          Messages
        </Typography>
      </Paper>
      
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
      
      <Paper sx={{ overflow: 'hidden' }}>
        <Grid container sx={{ height: '70vh' }}>
          {/* Conversations List - Show only on desktop or when not viewing a chat on mobile */}
          {(!isMobile || !showChat) && (
            <Grid item xs={12} sm={4} sx={{ 
              borderRight: { sm: 1 },
              borderColor: { sm: 'divider' },
              height: '100%'
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 2,
                borderBottom: 1,
                borderColor: 'divider'
              }}>
                <ForumIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Conversations
                </Typography>
              </Box>
              <DirectMessagesList onSelectConversation={handleSelectConversation} />
            </Grid>
          )}
          
          {/* Chat Window - Show only on desktop or when viewing a chat on mobile */}
          {(!isMobile || showChat) && (
            <Grid item xs={12} sm={8} sx={{ height: '100%', position: 'relative' }}>
              <DirectMessageChat 
                conversationId={selectedConversationId}
                partner={partner}
                onBack={handleBackToList}
              />
            </Grid>
          )}
        </Grid>
      </Paper>
    </Container>
  );
}

export default DirectMessagesPage;