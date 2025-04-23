import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Paper,
  Divider,
  Tooltip,
  alpha
} from '@mui/material';
import {
  Mail as MailIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

// This component handles large member lists efficiently using virtualization
const VirtualizedMemberList = ({ members, user, darkMode, onMemberSelect }) => {
  const [expandedItems, setExpandedItems] = useState({});
  
  // The number of items to load at once when scrolling
  const LOAD_BATCH_SIZE = 30;
  
  // Track if an item is loaded
  const isItemLoaded = (index) => index < members.length;
  
  // Load more items as user scrolls
  const loadMoreItems = (startIndex, stopIndex) => {
    return new Promise((resolve) => {
      // In a real app, you would fetch more items from your API here
      setTimeout(() => resolve(), 200);
    });
  };
  
  // Toggle expanded view for a member card
  const toggleExpanded = (e, memberId) => {
    e.stopPropagation();
    setExpandedItems(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };
  
  // Render an individual member row
  const renderMember = ({ index, style }) => {
    if (!isItemLoaded(index)) {
      return (
        <div style={style}>
          <Paper 
            sx={{ 
              p: 2, 
              m: 1, 
              display: 'flex',
              alignItems: 'center',
              height: '90%',
              bgcolor: darkMode ? alpha('#000', 0.2) : '#f5f5f5',
              backdropFilter: 'blur(8px)'
            }}
          >
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 40, height: 40, bgcolor: darkMode ? '#333' : '#e0e0e0', borderRadius: '50%', mr: 2 }} />
                <Box>
                  <Box sx={{ width: 120, height: 20, bgcolor: darkMode ? '#444' : '#e0e0e0', borderRadius: 1 }} />
                  <Box sx={{ width: 80, height: 16, bgcolor: darkMode ? '#333' : '#f0f0f0', borderRadius: 1, mt: 1 }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Box sx={{ width: 80, height: 32, bgcolor: darkMode ? '#333' : '#e0e0e0', borderRadius: 1 }} />
              </Box>
            </Box>
          </Paper>
        </div>
      );
    }
    
    const member = members[index];
    const isExpanded = expandedItems[member.id] || false;
    
    return (
      <div style={style}>
        <Paper 
          sx={{ 
            p: 2, 
            m: 1,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: darkMode ? alpha('#000', 0.3) : 'background.paper',
            backdropFilter: darkMode ? 'blur(8px)' : 'none',
            boxShadow: 2,
            border: darkMode ? `1px solid ${alpha('#fff', 0.1)}` : 'none',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 4
            }
          }}
          onClick={() => onMemberSelect && onMemberSelect(member)}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                src={member.profile_picture_url}
                sx={{ 
                  width: 50, 
                  height: 50, 
                  mr: 2,
                  border: `2px solid ${darkMode ? alpha('#fff', 0.2) : '#f0f0f0'}`
                }}
              >
                {member.full_name ? member.full_name.charAt(0).toUpperCase() : '?'}
              </Avatar>
              
              <Box>
                <Typography 
                  variant="subtitle1" 
                  fontWeight="500"
                  color={darkMode ? 'white' : 'text.primary'}
                >
                  {member.full_name || 'Unnamed User'}
                  {member.id === user?.id && ' (You)'}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Chip 
                    label={member.role === 'admin' ? 'Admin' : 'Member'} 
                    color={member.role === 'admin' ? 'primary' : 'default'}
                    size="small"
                    sx={{ 
                      height: 24,
                      bgcolor: darkMode ? 
                        (member.role === 'admin' ? alpha('#1976d2', 0.8) : alpha('#333', 0.8)) : 
                        undefined
                    }}
                  />
                  
                  {member.skills && member.skills.length > 0 && (
                    <Tooltip title={member.skills.join(', ')}>
                      <Chip
                        label={`${member.skills.length} skills`}
                        size="small"
                        color="secondary"
                        sx={{ 
                          height: 24, 
                          bgcolor: darkMode ? alpha('#9c27b0', 0.8) : undefined
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant={darkMode ? "outlined" : "contained"}
                component={Link}
                to={`/profile/${member.id}`}
                size="small"
                onClick={(e) => e.stopPropagation()}
                sx={{ 
                  minWidth: '100px',
                  color: darkMode ? 'white' : undefined,
                  borderColor: darkMode ? alpha('white', 0.3) : undefined,
                  '&:hover': {
                    borderColor: darkMode ? 'white' : undefined
                  }
                }}
              >
                View Profile
              </Button>
              
              {member.id !== user?.id && (
                <IconButton
                  component={Link}
                  to={`/messages/${member.id}`}
                  size="small"
                  onClick={(e) => e.stopPropagation()}
                  color={darkMode ? "inherit" : "primary"}
                  sx={{ 
                    color: darkMode ? 'white' : undefined,
                    '&:hover': { 
                      bgcolor: darkMode ? alpha('white', 0.1) : undefined
                    }
                  }}
                >
                  <MailIcon fontSize="small" />
                </IconButton>
              )}
              
              <IconButton
                size="small"
                onClick={(e) => toggleExpanded(e, member.id)}
                sx={{ 
                  color: darkMode ? 'white' : 'text.secondary',
                  transform: isExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.3s ease'
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          
          {isExpanded && (
            <>
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mt: 1 }}>
                {member.bio ? (
                  <Typography 
                    variant="body2" 
                    color={darkMode ? alpha('white', 0.7) : "text.secondary"}
                    paragraph
                  >
                    {member.bio}
                  </Typography>
                ) : (
                  <Typography 
                    variant="body2" 
                    color={darkMode ? alpha('white', 0.5) : "text.disabled"}
                    fontStyle="italic"
                  >
                    No bio available
                  </Typography>
                )}
                
                {member.skills && member.skills.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography 
                      variant="subtitle2" 
                      gutterBottom
                      color={darkMode ? 'white' : 'text.primary'}
                    >
                      Skills:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {member.skills.map(skill => (
                        <Chip 
                          key={skill} 
                          label={skill} 
                          size="small"
                          sx={{ 
                            bgcolor: darkMode ? alpha('#555', 0.8) : undefined,
                            color: darkMode ? 'white' : undefined
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {(member.contact_email || member.portfolio_url || member.linkedin_url) && (
                  <Box sx={{ mt: 2 }}>
                    <Typography 
                      variant="subtitle2" 
                      gutterBottom
                      color={darkMode ? 'white' : 'text.primary'}
                    >
                      Contact:
                    </Typography>
                    {member.contact_email && (
                      <Typography 
                        variant="body2" 
                        color={darkMode ? alpha('white', 0.7) : "text.secondary"}
                      >
                        Email: {member.contact_email}
                      </Typography>
                    )}
                    {member.portfolio_url && (
                      <Typography 
                        variant="body2" 
                        color={darkMode ? alpha('white', 0.7) : "text.secondary"}
                      >
                        <a 
                          href={member.portfolio_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: darkMode ? '#90caf9' : '#1976d2' }}
                        >
                          Portfolio
                        </a>
                      </Typography>
                    )}
                    {member.linkedin_url && (
                      <Typography 
                        variant="body2" 
                        color={darkMode ? alpha('white', 0.7) : "text.secondary"}
                      >
                        <a 
                          href={member.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: darkMode ? '#90caf9' : '#1976d2' }}
                        >
                          LinkedIn
                        </a>
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </>
          )}
        </Paper>
      </div>
    );
  };
  
  return (
    <Box sx={{ height: 800, width: '100%' }}>
      <AutoSizer>
        {({ height, width }) => (
          <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={members.length}
            loadMoreItems={loadMoreItems}
            threshold={LOAD_BATCH_SIZE}
          >
            {({ onItemsRendered, ref }) => (
              <List
                height={height}
                width={width}
                itemCount={members.length}
                itemSize={expandedItems ? (index => expandedItems[members[index]?.id] ? 280 : 90) : 90}
                onItemsRendered={onItemsRendered}
                ref={ref}
              >
                {renderMember}
              </List>
            )}
          </InfiniteLoader>
        )}
      </AutoSizer>
    </Box>
  );
};

export default VirtualizedMemberList;