import React, { useState } from 'react';
import { useDirectMessages } from '../context/directMessagesContext';
import { useAuth } from '../context/authcontext';
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
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Message as MessageIcon
} from '@mui/icons-material';

function DirectMessagesList({ onSelectConversation }) {
  const { conversations, loading, error } = useDirectMessages();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 2, color: 'error.main' }}>
        <Typography variant="body2">{error}</Typography>
      </Box>
    );
  }
  
  // Format timestamp for last message
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
                    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  // Filter conversations by search term
  const filteredConversations = conversations.filter(conversation => {
    const partnerName = conversation.partner?.full_name || '';
    return partnerName.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2, pb: 1 }}>
        <TextField
          fullWidth
          placeholder="Search conversations"
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
        />
      </Box>
      
      {filteredConversations.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <MessageIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No conversations yet
          </Typography>
        </Box>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper', pt: 0 }}>
          {filteredConversations.map((conversation) => {
            const partner = conversation.partner || {};
            const lastMessage = conversation.last_message;
            
            return (
              <React.Fragment key={conversation.id}>
                <ListItem 
                  alignItems="flex-start" 
                  button
                  onClick={() => onSelectConversation(conversation.id)}
                  sx={{ 
                    backgroundColor: conversation.unread_count > 0 ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      badgeContent={conversation.unread_count > 0 ? conversation.unread_count : 0}
                      color="primary"
                      invisible={conversation.unread_count === 0}
                    >
                      <Avatar 
                        alt={partner.full_name} 
                        src={partner.profile_picture_url}
                        sx={{ width: 40, height: 40 }}
                      >
                        {partner.full_name ? partner.full_name.charAt(0).toUpperCase() : 'U'}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={conversation.unread_count > 0 ? 600 : 400}
                        >
                          {partner.full_name || 'Unknown User'}
                        </Typography>
                        {lastMessage && (
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(lastMessage.created_at)}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: conversation.unread_count > 0 ? 500 : 400,
                          color: conversation.unread_count > 0 ? 'text.primary' : 'text.secondary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {lastMessage ? (
                          lastMessage.sender_id === user?.id ? (
                            <span>You: {lastMessage.content}</span>
                          ) : (
                            lastMessage.content
                          )
                        ) : (
                          <span>No messages yet</span>
                        )}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Box>
  );
}

export default DirectMessagesList;