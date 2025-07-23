import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MembersDetailModal from './MembersDetailModal';
import {
  Typography,
  Paper,
  Divider,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Chip
} from '@mui/material';
import InvitationLinkWidget from './InvitationLinkWidget';

const AboutTab = ({ network, networkMembers, isUserAdmin, currentUserId }) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  
  const handleCreatorClick = () => {
    const creator = networkMembers.find(m => m.id === network.created_by);
    if (creator) {
      setSelectedMember(creator);
      setMemberModalOpen(true);
    }
  };
  return (
    <Paper sx={{ p: 3, mt: 1.5 }}>      
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Network Details
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Network ID:</strong> {network.id}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Created:</strong> {new Date(network.created_at).toLocaleDateString()}
                </Typography>
                
                {network.created_by && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Created by:</strong>{' '}
                    <Chip
                      label={networkMembers.find(m => m.id === network.created_by)?.full_name || 'Unknown'}
                      size="small"
                      onClick={handleCreatorClick}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    />
                  </Typography>
                )}
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Members:</strong> {networkMembers.length}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Administrators:</strong> {
                    networkMembers.filter(m => m.role === 'admin').length
                  }
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              
              {network.description ? (
                <Typography variant="body1" paragraph>
                  {network.description}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No description provided for this network.
                </Typography>
              )}
              
              {isUserAdmin && (
                <Button
                  variant="outlined"
                  component={Link}
                  to="/admin"
                  sx={{ mt: 2 }}
                >
                  Edit Network Details
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Member Details Modal */}
      <MembersDetailModal
        open={memberModalOpen}
        onClose={() => {
          setMemberModalOpen(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        currentUserId={currentUserId}
      />
    </Paper>
  );
};

export default AboutTab;