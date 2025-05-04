import React from 'react';
import { Link } from 'react-router-dom';
import {
  Typography,
  Paper,
  Divider,
  Box,
  Avatar,
  Chip
} from '@mui/material';

const SocialWallTab = ({ socialWallItems = [], networkMembers = [] }) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Network Social Wall
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {socialWallItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No activity to display yet.
          </Typography>
        </Box>
      ) : (
        <Box className="projects-grid" sx={{ mt: 2 }}>
          {socialWallItems.map((item, index) => (
            <div key={`${item.itemType}-${item.id}`} className="project-card">
              <div className="project-card-inner">
                {/* Header with user info */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  p: 2, 
                  borderBottom: '1px solid', 
                  borderColor: 'divider'
                }}>
                  <Avatar 
                    src={item.itemType === 'portfolio' ? item.memberAvatar : 
                        networkMembers.find(m => m.id === item.created_by)?.profile_picture_url} 
                    sx={{ mr: 1.5, width: 40, height: 40 }}
                  >
                    {item.itemType === 'portfolio' ? 
                      (item.memberName ? item.memberName.charAt(0).toUpperCase() : 'U') : 
                      (networkMembers.find(m => m.id === item.created_by)?.full_name?.charAt(0).toUpperCase() || 'U')}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {item.itemType === 'portfolio' ? 
                        item.memberName : 
                        networkMembers.find(m => m.id === item.created_by)?.full_name || 'Network Admin'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Typography>
                      <Chip 
                        size="small" 
                        label={item.itemType === 'portfolio' ? 'Portfolio' : 'News'} 
                        sx={{ ml: 1, height: 20 }}
                        color={item.itemType === 'portfolio' ? 'secondary' : 'primary'}
                      />
                    </Box>
                  </Box>
                </Box>
                
                {/* Image for portfolio items */}
                {item.itemType === 'portfolio' && item.image_url && (
                  <div className="project-thumbnail" style={{ height: 160 }}>
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                    />
                  </div>
                )}
                
                {/* Content based on item type */}
                <div className="project-info">
                  <h4 className="project-title">{item.title}</h4>
                  
                  {item.itemType === 'portfolio' ? (
                    <p className="project-description">{item.description}</p>
                  ) : (
                    <div 
                      className="project-description tiptap-output"
                      dangerouslySetInnerHTML={{ 
                        __html: item.content && item.content.length > 150 
                          ? item.content.substring(0, 150) + '...' 
                          : item.content 
                      }}
                    />
                  )}
                  
                  {item.itemType === 'portfolio' && item.url ? (
                    <a 
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-project-btn"
                    >
                      View Project
                    </a>
                  ) : (
                    <Link 
                      to={item.itemType === 'portfolio' ? 
                        `/profile/${item.memberId}` : 
                        `/news/${item.id}`}
                      className="view-project-btn"
                      style={{ display: 'inline-block', textDecoration: 'none' }}
                    >
                      {item.itemType === 'portfolio' ? 'View Profile' : 'Read Full Post'}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default SocialWallTab;