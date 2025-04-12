// src/pages/NetworkAdminPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon,
  Save as SaveIcon,
  AdminPanelSettings as AdminIcon,
  PersonRemove as PersonRemoveIcon
} from '@mui/icons-material';

function NetworkAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [network, setNetwork] = useState(null);
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [networkName, setNetworkName] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [dialogMember, setDialogMember] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get admin's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        setProfile(profileData);
        
        // Check if user is an admin
        if (profileData.role !== 'admin') {
          setError('You do not have admin privileges.');
          return;
        }
        
        // Get network info
        if (!profileData.network_id) {
          setError('You are not part of any network.');
          return;
        }
        
        const { data: networkData, error: networkError } = await supabase
          .from('networks')
          .select('*')
          .eq('id', profileData.network_id)
          .single();
          
        if (networkError) throw networkError;
        setNetwork(networkData);
        setNetworkName(networkData.name);
        
        // Get network members
        const { data: membersData, error: membersError } = await supabase
          .from('profiles')
          .select('*')
          .eq('network_id', profileData.network_id)
          .order('full_name', { ascending: true });
          
        if (membersError) throw membersError;
        setMembers(membersData || []);
        
      } catch (error) {
        console.error('Error loading admin data:', error);
        setError('Failed to load network information.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setMessage('Please enter a valid email address.');
      return;
    }
    
    try {
      setInviting(true);
      setError(null);
      setMessage('');
      
      // Check if user already exists
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id, network_id, contact_email, full_name')
        .eq('contact_email', inviteEmail)
        .maybeSingle();
          
      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }
      
      if (existingUser) {
        // User exists
        if (existingUser.network_id === network.id) {
          setMessage('This user is already in your network.');
          return;
        }
        
        // Update their network_id to join this network
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ network_id: network.id })
          .eq('id', existingUser.id);
            
        if (updateError) throw updateError;
        
        // Send email notification using the Supabase Edge Function
        try {
          const { data: emailData, error: emailError } = await supabase.functions.invoke('network-invite', {
            body: {
              toEmail: existingUser.contact_email,
              networkName: network.name,
              inviterName: profile.full_name || 'Network Admin',
              type: 'existing_user'
            }
          });
            
          if (emailError) {
            console.error('Error sending email:', emailError);
          }
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Continue anyway, since the user was added to the network
        }
        
        setMessage(`User ${inviteEmail} added to your network! Email notification sent.`);
        
        // Refresh member list
        const { data: updatedMembers, error: membersError } = await supabase
          .from('profiles')
          .select('*')
          .eq('network_id', network.id)
          .order('full_name', { ascending: true });
            
        if (membersError) throw membersError;
        setMembers(updatedMembers || []);
      } else {
        // User doesn't exist - create an invitation record
        const { data: invitation, error: inviteError } = await supabase
          .from('invitations')
          .insert([{ 
            email: inviteEmail, 
            network_id: network.id, 
            invited_by: user.id,
            status: 'pending',
            role: 'member' // Default role for new users
          }])
          .select()
          .single();
            
        if (inviteError) throw inviteError;
        
        // Generate a unique token or use the invitation ID
        const inviteToken = btoa(`invite:${invitation.id}:${network.id}`);
        const inviteLink = `${window.location.origin}/signup?invite=${inviteToken}`;
        
        // Send invitation email using the Supabase Edge Function
        try {
          const { data: emailData, error: emailError } = await supabase.functions.invoke('network-invite', {
            body: {
              toEmail: inviteEmail,
              networkName: network.name,
              inviterName: profile.full_name || 'Network Admin',
              inviteLink: inviteLink,
              type: 'new_user'
            }
          });
            
          if (emailError) {
            console.error('Error sending email:', emailError);
            throw new Error('Failed to send invitation email. Please try again.');
          }
        } catch (emailError) {
          console.error('Failed to send invitation email:', emailError);
          throw new Error('Failed to send invitation email. Please try again.');
        }
        
        setMessage(`Invitation sent to ${inviteEmail}!`);
      }
      
      // Clear input
      setInviteEmail('');
      
    } catch (error) {
      console.error('Error inviting user:', error);
      setError(error.message || 'Failed to send invitation. Please try again.');
    } finally {
      setInviting(false);
    }
  };
  
  const handleUpdateNetwork = async (e) => {
    e.preventDefault();
    
    if (!networkName.trim()) {
      setMessage('Network name cannot be empty.');
      return;
    }
    
    try {
      setUpdating(true);
      setError(null);
      setMessage('');
      
      const { error } = await supabase
        .from('networks')
        .update({ name: networkName })
        .eq('id', network.id);
        
      if (error) throw error;
      
      setNetwork({ ...network, name: networkName });
      setMessage('Network updated successfully!');
      
    } catch (error) {
      console.error('Error updating network:', error);
      setError('Failed to update network. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  // Open confirmation dialog
  const confirmAction = (action, member) => {
    setDialogAction(action);
    setDialogMember(member);
    setOpenDialog(true);
  };
  
  // Dialog close without action
  const handleDialogClose = () => {
    setOpenDialog(false);
    setDialogAction(null);
    setDialogMember(null);
  };
  
  // Execute confirmed action
  const handleConfirmedAction = async () => {
    setOpenDialog(false);
    
    if (dialogAction === 'remove') {
      await handleRemoveMember(dialogMember.id);
    } else if (dialogAction === 'toggleAdmin') {
      await handleToggleAdmin(dialogMember.id, dialogMember.role);
    }
    
    setDialogAction(null);
    setDialogMember(null);
  };
  
  const handleRemoveMember = async (memberId) => {
    // Don't allow removing yourself
    if (memberId === user.id) {
      setError('You cannot remove yourself from the network.');
      return;
    }
    
    try {
      setError(null);
      setMessage('');
      
      // Update user's network_id to null
      const { error } = await supabase
        .from('profiles')
        .update({ network_id: null })
        .eq('id', memberId);
        
      if (error) throw error;
      
      // Update local state
      setMembers(members.filter(member => member.id !== memberId));
      setMessage('Member removed from network.');
      
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member. Please try again.');
    }
  };
  
  const handleToggleAdmin = async (memberId, currentRole) => {
    // Don't allow changing your own role
    if (memberId === user.id) {
      setError('You cannot change your own admin status.');
      return;
    }
    
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    
    try {
      setError(null);
      setMessage('');
      
      // Update user's role
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', memberId);
        
      if (error) throw error;
      
      // Update local state
      setMembers(members.map(member => 
        member.id === memberId 
          ? { ...member, role: newRole } 
          : member
      ));
      
      setMessage(`User ${newRole === 'admin' ? 'promoted to admin' : 'changed to regular member'}.`);
      
    } catch (error) {
      console.error('Error updating member role:', error);
      setError('Failed to update member role. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading admin panel...
        </Typography>
      </Box>
    );
  }
  
  if (error && (error.includes('privileges') || error.includes('not part'))) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" paragraph>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }
  
  if (!profile || profile.role !== 'admin') {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" paragraph>
            You don't have permission to access the admin panel.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            component={Link}
            to="/dashboard"
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" component="h1">
            Network Admin Panel
          </Typography>
        </Box>
      </Paper>
      
      {message && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Network Settings
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <form onSubmit={handleUpdateNetwork}>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Network Name"
                    id="networkName"
                    value={networkName}
                    onChange={(e) => setNetworkName(e.target.value)}
                    placeholder="Enter network name"
                    required
                    variant="outlined"
                  />
                </Box>
                <Button 
                  type="submit" 
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update Network'}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Invite Members
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <form onSubmit={handleInvite}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email to invite"
                    required
                    variant="outlined"
                  />
                  <Button 
                    type="submit" 
                    variant="contained"
                    color="primary"
                    startIcon={<PersonAddIcon />}
                    disabled={inviting}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    {inviting ? 'Sending...' : 'Send Invite'}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Network Members ({members.length})
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {members.length > 0 ? (
                <TableContainer>
                  <Table aria-label="members table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {members.map(member => (
                        <TableRow 
                          key={member.id}
                          sx={member.id === user.id ? { 
                            backgroundColor: 'rgba(25, 118, 210, 0.08)' 
                          } : {}}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                src={member.profile_picture_url}
                                sx={{ mr: 2, width: 32, height: 32 }}
                              >
                                {member.full_name ? member.full_name.charAt(0).toUpperCase() : '?'}
                              </Avatar>
                              <Box>
                                <Typography variant="body1">
                                  {member.full_name || 'Unnamed User'}
                                  {member.id === user.id && ' (You)'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {member.contact_email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={member.role || 'member'} 
                              color={member.role === 'admin' ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                component={Link}
                                to={`/profile/${member.id}`}
                              >
                                View
                              </Button>
                              
                              {member.id !== user.id && (
                                <>
                                  <Button 
                                    size="small"
                                    variant="outlined"
                                    color={member.role === 'admin' ? 'warning' : 'info'}
                                    startIcon={<AdminIcon />}
                                    onClick={() => confirmAction('toggleAdmin', member)}
                                  >
                                    {member.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                  </Button>
                                  <Button 
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={<PersonRemoveIcon />}
                                    onClick={() => confirmAction('remove', member)}
                                  >
                                    Remove
                                  </Button>
                                </>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography align="center" sx={{ py: 3 }}>
                  No members found in your network.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
      >
        <DialogTitle>
          {dialogAction === 'remove' ? 'Remove Member' : 
           dialogAction === 'toggleAdmin' && dialogMember?.role === 'admin' ? 'Remove Admin Privileges' : 
           'Grant Admin Privileges'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogAction === 'remove' ? 
              `Are you sure you want to remove ${dialogMember?.full_name || 'this user'} from your network?` : 
              dialogAction === 'toggleAdmin' && dialogMember?.role === 'admin' ? 
                `Are you sure you want to remove admin privileges from ${dialogMember?.full_name || 'this user'}?` : 
                `Are you sure you want to grant admin privileges to ${dialogMember?.full_name || 'this user'}?`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmedAction} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default NetworkAdminPage;