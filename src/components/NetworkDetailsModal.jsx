// src/components/NetworkDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { formatTimeAgo, formatDate as formatDateUtil } from '../utils/dateFormatting';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import Spinner from './Spinner';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Event as EventIcon,
  Article as NewsIcon,
  Folder as FilesIcon,
  Storage as StorageIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { getNetworkDetails } from '../api/superAdmin';

const NetworkDetailsModal = ({ open, onClose, networkId }) => {
  const [networkDetails, setNetworkDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && networkId) {
      fetchNetworkDetails();
    }
  }, [open, networkId]);

  const fetchNetworkDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const details = await getNetworkDetails(networkId);
      setNetworkDetails(details);
    } catch (err) {
      console.error('Error fetching network details:', err);
      setError('Failed to load network details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStorageLimit = (plan) => {
    switch (plan) {
      case 'free': return 2048; // 2GB in MB
      case 'community': return 10240; // 10GB in MB
      case 'organization': return 102400; // 100GB in MB
      case 'business': return 5242880; // 5TB in MB
      default: return 2048;
    }
  };

  const getStoragePercentage = (used, plan) => {
    const limit = getStorageLimit(plan);
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            Network Details
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <Spinner />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {networkDetails && (
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Network Name
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {networkDetails.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Network ID
                      </Typography>
                      <Typography variant="body1" fontFamily="monospace">
                        {networkDetails.id}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Created Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(networkDetails.created_at)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Privacy Level
                      </Typography>
                      <Chip
                        label={networkDetails.privacy_level || 'Private'}
                        color="primary"
                        size="small"
                      />
                    </Grid>
                    {networkDetails.description && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Description
                        </Typography>
                        <Typography variant="body1">
                          {networkDetails.description}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Subscription & Storage */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Subscription & Storage
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Current Plan
                    </Typography>
                    <Chip
                      label={networkDetails.subscription_plan || 'Free'}
                      color="secondary"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Storage Usage
                    </Typography>
                    <Box display="flex" alignItems="center" mt={0.5}>
                      <StorageIcon sx={{ mr: 1, fontSize: 20 }} />
                      <Typography variant="body1">
                        {networkDetails.storage_used_mb} MB / {getStorageLimit(networkDetails.subscription_plan)} MB
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={getStoragePercentage(networkDetails.storage_used_mb, networkDetails.subscription_plan)}
                      sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Activity Statistics */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Activity Statistics
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Total Members"
                        secondary={`${networkDetails.total_members} (${networkDetails.admin_count} admins, ${networkDetails.member_count} members)`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <EventIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Events"
                        secondary={`${networkDetails.event_count} events created`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <NewsIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="News Posts"
                        secondary={`${networkDetails.news_count} posts published`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Members */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Members ({networkDetails.profiles?.length || 0})
                  </Typography>
                  <List>
                    {networkDetails.profiles?.slice(0, 5).map((member, index) => (
                      <React.Fragment key={member.id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar>
                              {member.role === 'admin' ? <AdminIcon /> : <PersonIcon />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body1">
                                  {member.full_name || 'Unknown User'}
                                </Typography>
                                <Chip
                                  label={member.role}
                                  size="small"
                                  color={member.role === 'admin' ? 'primary' : 'default'}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {member.contact_email}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Joined {formatTimeAgo(member.created_at)}
                                  {member.last_active && (
                                    <> • Last active {formatTimeAgo(member.last_active)}</>
                                  )}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < 4 && networkDetails.profiles.length > index + 1 && <Divider />}
                      </React.Fragment>
                    ))}
                    {networkDetails.profiles?.length > 5 && (
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="body2" color="text.secondary" align="center">
                              ... and {networkDetails.profiles.length - 5} more members
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NetworkDetailsModal;