import React, { useState, useEffect } from 'react';
import { useDirectMessages } from '../context/directMessagesContext';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { deleteConversation } from '../api/directMessages';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  Box,
  Badge,
  TextField,
  InputAdornment,
  IconButton,
  Spinner,
  Button,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  Message as MessageIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  FilterList as FilterListIcon,
  CircleOutlined as StatusOfflineIcon,
  Circle as StatusOnlineIcon
} from '@mui/icons-material';

function DirectMessagesList({ onSelectConversation, onConversationDeleted }) {
  const { conversations, loading, error, refreshConversations } = useDirectMessages();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [quickFilter, setQuickFilter] = useState('all'); // all, unread, recent
  const [openDialog, setOpenDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [alertError, setAlertError] = useState('');
  
  useEffect(() => {
    // Refresh conversations when component mounts
    refreshConversations();
  }, [refreshConversations]);
  
  const handleMenuClick = (event, conversation) => {
    event.stopPropagation();
    console.log('🗑️ Menu clicked, setting conversation:', conversation);
    setAnchorEl(event.currentTarget);
    setSelectedConversation(conversation);
  };
  
  const handleMenuClose = () => {
    console.log('🗑️ Menu closing, clearing conversation');
    setAnchorEl(null);
    setSelectedConversation(null);
  };
  
  const handleDeleteClick = () => {
    console.log('🗑️ Delete clicked, selectedConversation before dialog:', selectedConversation);
    // Don't call handleMenuClose() here as it clears selectedConversation
    // Just close the menu and keep the conversation selected for deletion
    setAnchorEl(null);
    setOpenDialog(true);
  };
  
  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedConversation(null);
    setAlertError('');
  };
  
  const handleConfirmedDelete = async () => {
    console.log('🗑️ Delete button clicked!');
    console.log('Selected conversation:', selectedConversation);
    console.log('User ID:', user?.id);
    
    if (!selectedConversation || !user?.id) {
      console.error('Missing data - selectedConversation:', selectedConversation, 'user.id:', user?.id);
      return;
    }
    
    setDeleting(true);
    setAlertError('');
    
    try {
      console.log('🗑️ Calling deleteConversation API...');
      const result = await deleteConversation(selectedConversation.id, activeProfile.id);
      console.log('🗑️ API result:', result);
      
      if (result.success) {
        console.log('✅ Delete successful!');
        setMessage(`Conversation with ${selectedConversation.partner?.full_name || 'Unknown User'} has been deleted.`);
        // Notify parent component about the deletion
        if (onConversationDeleted) {
          onConversationDeleted(selectedConversation.id);
        }
        // Refresh conversations to remove the deleted one
        refreshConversations();
        // Close dialog
        setOpenDialog(false);
        setSelectedConversation(null);
      } else {
        console.error('❌ Delete failed:', result.error);
        setAlertError(result.error?.message || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error('❌ Exception during delete:', error);
      setAlertError('An unexpected error occurred while deleting the conversation');
    } finally {
      setDeleting(false);
    }
  };
  
  // Format timestamp for last message
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Yesterday';
    } else if (now.getFullYear() === date.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Apply filters to conversations
  const getFilteredConversations = () => {
    // First filter by search term
    let filtered = conversations.filter(conversation => {
      const partnerName = conversation.partner?.full_name || '';
      const lastMessageContent = conversation.last_message?.content || '';
      
      return partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             lastMessageContent.toLowerCase().includes(searchTerm.toLowerCase());
    });
    
    // Then apply quick filters
    if (quickFilter === 'unread') {
      filtered = filtered.filter(c => c.unread_count > 0);
    } else if (quickFilter === 'recent') {
      // Sort by most recent first (already happens by default, but being explicit)
      filtered.sort((a, b) => {
        const aTime = a.last_message?.created_at || a.last_message_at;
        const bTime = b.last_message?.created_at || b.last_message_at;
        return new Date(bTime) - new Date(aTime);
      });
    }
    
    return filtered;
  };
  
  const filteredConversations = getFilteredConversations();
  
  const handleFilterChange = (filter) => {
    setQuickFilter(filter);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Spinner size={24} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 2, color: 'error.main' }}>
        <Typography variant="body2">{error}</Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={refreshConversations}
          sx={{ mt: 1 }}
        >
          Retry
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper', color: 'text.primary', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search and filter bar */}
      <Box sx={{ p: 2, pb: 1 }}>
        <TextField
          fullWidth
          placeholder="Search messages"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Button 
            variant={quickFilter === 'all' ? "contained" : "text"} 
            size="small"
            onClick={() => handleFilterChange('all')}
            sx={{ minWidth: 0, px: 1 }}
            color={quickFilter === 'all' ? "primary" : "inherit"}
          >
            All
          </Button>
          <Button 
            variant={quickFilter === 'unread' ? "contained" : "text"} 
            size="small"
            onClick={() => handleFilterChange('unread')}
            sx={{ minWidth: 0, px: 1 }}
            color={quickFilter === 'unread' ? "primary" : "inherit"}
          >
            Unread
          </Button>
          <Button 
            variant={quickFilter === 'recent' ? "contained" : "text"}
            size="small"
            onClick={() => handleFilterChange('recent')}
            sx={{ minWidth: 0, px: 1 }}
            color={quickFilter === 'recent' ? "primary" : "inherit"}
          >
            Recent
          </Button>
          <IconButton size="small">
            <FilterListIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      <Divider />
      
      {/* Conversation list */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {filteredConversations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <MessageIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {searchTerm || quickFilter !== 'all' ? 
                'No conversations match your filters' : 
                'No conversations yet'}
            </Typography>
            {(searchTerm || quickFilter !== 'all') && (
              <Button 
                variant="text" 
                size="small" 
                onClick={() => {
                  setSearchTerm('');
                  setQuickFilter('all');
                }}
                sx={{ mt: 1 }}
              >
                Clear filters
              </Button>
            )}
          </Box>
        ) : (
          <List sx={{ width: '100%', bgcolor: 'background.paper', color: 'text.primary', pt: 0 }}>
            {filteredConversations.map((conversation) => {
              const partner = conversation.partner || {};
              const lastMessage = conversation.last_message;
              const isOnline = Math.random() > 0.7; // Simulated online status
              
              return (
                <React.Fragment key={conversation.id}>
                  <ListItemButton 
                    alignItems="flex-start" 
                    onClick={() => onSelectConversation(conversation.id)}
                    sx={{ 
                      py: 1.5,
                      px: 2,
                      backgroundColor: conversation.unread_count > 0 ? (theme) => theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 'rgba(25, 118, 210, 0.08)' : 'transparent',
                      '&:hover': {
                        backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          isOnline ? 
                            <StatusOnlineIcon sx={{ fontSize: 10, color: 'success.main' }} /> : 
                            null
                        }
                      >
                        <Badge
                          overlap="circular"
                          badgeContent={conversation.unread_count > 0 ? conversation.unread_count : 0}
                          color="primary"
                          invisible={conversation.unread_count === 0}
                        >
                          <Avatar 
                            alt={partner.full_name} 
                            src={partner.profile_picture_url}
                            sx={{ width: 48, height: 48 }}
                          >
                            {partner.full_name ? partner.full_name.charAt(0).toUpperCase() : 'U'}
                          </Avatar>
                        </Badge>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography
                            variant="subtitle2"
                            fontWeight={conversation.unread_count > 0 ? 600 : 400}
                            noWrap
                            sx={{ maxWidth: 'calc(100% - 40px)' }}
                          >
                            {partner.full_name || 'Unknown User'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {lastMessage && (
                              <Typography variant="caption" color="text.secondary">
                                {formatTime(lastMessage.created_at)}
                              </Typography>
                            )}
                            <IconButton 
                              size="small" 
                              onClick={(e) => handleMenuClick(e, conversation)}
                              sx={{ ml: 0.5, p: 0.5 }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          sx={{
                            // display: 'inline',
                            textWrap: 'nowrap',
                            fontWeight: conversation.unread_count > 0 ? 500 : 400,
                            color: conversation.unread_count > 0 ? 'text.primary' : 'text.secondary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            fontSize: '0.875rem',
                            lineHeight: 1.4,
                          }}
                        >
                          {lastMessage ? (
                            lastMessage.sender_id === user?.id ? (
                                  `You: ${lastMessage.content}`
                            ) : (
                              lastMessage.content
                            )
                          ) : (
                            <span>Start a conversation</span>
                          )}
                        </Typography>
                      }
                      primaryTypographyProps={{ noWrap: true }}
                    />
                  </ListItemButton>
                  <Divider component="li" variant="inset" />
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'background.paper',
              color: 'text.primary'
            }
          }
        }}
      >
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Delete Conversation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your conversation with {selectedConversation?.partner?.full_name || 'this user'}? 
            This action cannot be undone and will permanently delete all messages in this conversation.
          </DialogContentText>
          {alertError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {alertError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmedDelete} 
            color="error" 
            disabled={deleting}
            startIcon={deleting ? <Spinner size={16} /> : null}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Toast */}
      <Snackbar
        open={!!message}
        autoHideDuration={4000}
        onClose={() => setMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setMessage('')} severity="success" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DirectMessagesList;