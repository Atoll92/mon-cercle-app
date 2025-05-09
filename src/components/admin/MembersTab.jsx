import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
  PersonRemove as PersonRemoveIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { inviteUserToNetwork, toggleMemberAdmin, removeMemberFromNetwork } from '../../api/networks';

const MembersTab = ({ members, user, network, onMembersChange }) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [dialogMember, setDialogMember] = useState(null);

  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    
    setInviting(true);
    setError(null);
    setMessage('');
    
    const result = await inviteUserToNetwork(inviteEmail, network.id, user.id);
    
    if (result.success) {
      setMessage(result.message);
      setInviteEmail('');
      // Refresh members if needed
      if (result.message.includes('added to your network')) {
        onMembersChange();
      }
    } else {
      setError(result.message);
    }
    
    setInviting(false);
  };

  const confirmAction = (action, member) => {
    setDialogAction(action);
    setDialogMember(member);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setDialogAction(null);
    setDialogMember(null);
  };

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
    if (memberId === user.id) {
      setError('You cannot remove yourself from the network.');
      return;
    }
    
    setError(null);
    setMessage('');
    
    const result = await removeMemberFromNetwork(memberId);
    
    if (result.success) {
      setMessage(result.message);
      onMembersChange();
    } else {
      setError(result.message);
    }
  };

  const handleToggleAdmin = async (memberId, currentRole) => {
    if (memberId === user.id) {
      setError('You cannot change your own admin status.');
      return;
    }
    
    setError(null);
    setMessage('');
    
    const result = await toggleMemberAdmin(memberId, currentRole);
    
    if (result.success) {
      setMessage(result.message);
      onMembersChange();
    } else {
      setError(result.message);
    }
  };

  return (
    <>
      {message && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Invite Members
        </Typography>
        <form onSubmit={handleInvite}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
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
              {inviting ? 'Sending...' : 'Invite'}
            </Button>
          </Box>
        </form>
      </Box>

      <Typography variant="h5" component="h2" gutterBottom>
        Network Members ({members.length})
      </Typography>
      
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
                        {member.full_name?.charAt(0).toUpperCase() || '?'}
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

      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>
          {dialogAction === 'remove' ? 'Remove Member' : 
           dialogAction === 'toggleAdmin' && dialogMember?.role === 'admin' ? 'Remove Admin Privileges' : 
           'Grant Admin Privileges'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogAction === 'remove' ? 
              `Are you sure you want to remove ${dialogMember?.full_name || 'this user'}?` : 
              dialogAction === 'toggleAdmin' && dialogMember?.role === 'admin' ? 
                `Remove admin privileges from ${dialogMember?.full_name || 'this user'}?` : 
                `Grant admin privileges to ${dialogMember?.full_name || 'this user'}?`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleConfirmedAction} autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MembersTab;