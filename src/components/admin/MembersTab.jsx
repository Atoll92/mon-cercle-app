import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Snackbar,
  Stack,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
  PersonRemove as PersonRemoveIcon,
  GroupAdd as GroupAddIcon,
  Link as LinkIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
  Check as CheckIcon,
  AccessTime as TimeIcon,
  Groups as GroupsIcon2,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { Link } from 'react-router-dom';
import { inviteUserToNetwork, toggleMemberAdmin, removeMemberFromNetwork, getNetworkPendingInvitations } from '../../api/networks';
import BatchInviteModal from './BatchInviteModal';
import InvitationLinksTab from './InvitationLinksTab';

const MembersTab = ({ members, user, network, onMembersChange, darkMode = false }) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteAsAdmin, setInviteAsAdmin] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [dialogMember, setDialogMember] = useState(null);
  const [batchInviteOpen, setBatchInviteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [invitationLinksRefresh, setInvitationLinksRefresh] = useState(0);

  // Fetch pending invitations
  useEffect(() => {
    const fetchPendingInvitations = async () => {
      console.log('MembersTab: Starting to fetch pending invitations for network:', network.id);
      setLoadingInvitations(true);
      const result = await getNetworkPendingInvitations(network.id);
      console.log('MembersTab: API result:', result);
      if (result.success) {
        setPendingInvitations(result.invitations);
        console.log('MembersTab: Set pending invitations:', result.invitations.length);
      }
      setLoadingInvitations(false);
    };

    if (network?.id) {
      console.log('MembersTab: Network ID exists, fetching invitations');
      fetchPendingInvitations();
    } else {
      console.log('MembersTab: No network ID, skipping fetch');
    }
  }, [network?.id, members]);

  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    
    setInviting(true);
    setError(null);
    setMessage('');
    
    const result = await inviteUserToNetwork(inviteEmail, network.id, user.id, inviteAsAdmin ? 'admin' : 'member');
    
    if (result.success) {
      setMessage(result.message);
      setInviteEmail('');
      setInviteAsAdmin(false);
      // Refresh members if needed
      if (result.message.includes('added to your network')) {
        onMembersChange();
      } else {
        // Refresh pending invitations if a new invitation was sent
        const invitationsResult = await getNetworkPendingInvitations(network.id);
        if (invitationsResult.success) {
          setPendingInvitations(invitationsResult.invitations);
        }
        // Trigger refresh of invitation links table
        setInvitationLinksRefresh(prev => prev + 1);
      }
    } else {
      setError(result.message);
    }
    
    setInviting(false);
  };

  const confirmAction = (action, member) => {
    setDialogAction(action);
    setDialogMember(member);
    setError(null);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setDialogAction(null);
    setDialogMember(null);
    setError(null);
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
    
    const result = await removeMemberFromNetwork(memberId, network.id);
    
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

      {error && !openDialog && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs for switching between members list and invitations */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Current Members" />
          <Tab label="Invite Members" />
        </Tabs>
      </Box>

      {/* Tab Panel 0: Current Members */}
      {activeTab === 0 && (
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Network Members ({members.length})
          </Typography>
          
          {members.length > 0 ? (
            <TableContainer component={Paper}>
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
                            alt={member.full_name}
                            sx={{ mr: 2 }}
                          >
                            {member.full_name?.[0] || '?'}
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

          {/* Pending Invitations Section */}
          {loadingInvitations ? (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : pendingInvitations.length > 0 ? (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" component="h3" gutterBottom>
                Invitations ({pendingInvitations.length})
              </Typography>
              <TableContainer component={Paper}>
                <Table aria-label="pending invitations table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>Invited By</TableCell>
                      <TableCell>Invited On</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingInvitations.map(invitation => (
                      <TableRow key={invitation.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {invitation.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {invitation.inviter?.full_name || 'System'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(invitation.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={invitation.role || 'member'} 
                            color={invitation.role === 'admin' ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {invitation.status === 'accepted' ? (
                            <Tooltip title={`Accepted on ${new Date(invitation.updated_at || invitation.created_at).toLocaleDateString()}`}>
                              <Chip 
                                label="Accepted" 
                                color="success"
                                size="small"
                                icon={<CheckCircleIcon />}
                              />
                            </Tooltip>
                          ) : (
                            <Chip 
                              label="Pending" 
                              color="warning"
                              size="small"
                              icon={<TimeIcon />}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : null}
        </Box>
      )}

      {/* Tab Panel 1: Invite Members */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Invite via Email
            </Typography>
            <form onSubmit={handleInvite}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                  <Tooltip title="Invite multiple members from a CSV, Excel, or text file">
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<GroupAddIcon />}
                      onClick={() => setBatchInviteOpen(true)}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Batch Invite
                    </Button>
                  </Tooltip>
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={inviteAsAdmin}
                      onChange={(e) => setInviteAsAdmin(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Invite as Admin"
                />
              </Box>
            </form>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Invitation Links
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create reusable invitation links that anyone can use to join your network
            </Typography>
            
            {/* Embed the InvitationLinksTab component here */}
            <InvitationLinksTab networkId={network.id} darkMode={darkMode} refreshTrigger={invitationLinksRefresh} />
          </Box>
        </Box>
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
          {error && openDialog && (
            <Alert severity="error" sx={{ flex: 1, mr: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleConfirmedAction} autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Batch Invite Modal */}
      <BatchInviteModal
        open={batchInviteOpen}
        onClose={() => setBatchInviteOpen(false)}
        onInvite={inviteUserToNetwork}
        network={network}
        user={user}
        onSuccess={() => {
          // Refresh invitation links table after batch invite
          setInvitationLinksRefresh(prev => prev + 1);
          // Also refresh pending invitations
          getNetworkPendingInvitations(network.id).then(result => {
            if (result.success) {
              setPendingInvitations(result.invitations);
            }
          });
        }}
      />
    </>
  );
};

export default MembersTab;