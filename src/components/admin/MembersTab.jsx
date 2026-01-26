import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation.jsx';
import Spinner from '../Spinner';
import { formatDate } from '../../utils/dateFormatting';
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
  Tooltip,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Snackbar,
  Stack,
  Card,
  CardContent,
  Grid,
  InputAdornment
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
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { Link } from 'react-router-dom';
import { inviteUserToNetwork, toggleMemberAdmin, removeMemberFromNetwork, getNetworkPendingInvitations, updateNetworkDetails } from '../../api/networks';
import BatchInviteModal from './BatchInviteModal';
import InvitationLinksTab from './InvitationLinksTab';
import Switch from '@mui/material/Switch';

// Helper function to validate emails
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const MembersTab = ({ members, activeProfile, network, onMembersChange, onNetworkUpdate, darkMode = false }) => {
  const { t } = useTranslation();
  const [inviteEmail, setInviteEmail] = useState('');
  const [emailList, setEmailList] = useState([]);
  const [inviteAsAdmin, setInviteAsAdmin] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [allowMemberInvites, setAllowMemberInvites] = useState(network?.allow_member_invites || false);
  const [updatingMemberInvites, setUpdatingMemberInvites] = useState(false);
  const [batchInviting, setBatchInviting] = useState(false);
  const [invitationProgress, setInvitationProgress] = useState(0);
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

  // Sync allowMemberInvites state with network prop
  useEffect(() => {
    setAllowMemberInvites(network?.allow_member_invites || false);
  }, [network?.allow_member_invites]);

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

  // Handle toggle for allowing member invites
  const handleToggleMemberInvites = async (event) => {
    const newValue = event.target.checked;
    setUpdatingMemberInvites(true);
    setError(null);

    const result = await updateNetworkDetails(network.id, {
      allow_member_invites: newValue
    });

    if (result.success) {
      setAllowMemberInvites(newValue);
      setMessage(t('admin.members.memberInvitesUpdated'));
      // Notify parent to refresh network data
      if (onNetworkUpdate) {
        onNetworkUpdate();
      }
    } else {
      setError(result.message || t('admin.members.errors.updateFailed'));
    }

    setUpdatingMemberInvites(false);
  };

  const addEmailToList = () => {
    if (!inviteEmail || !isValidEmail(inviteEmail)) {
      setError(t('admin.members.errors.invalidEmail'));
      return;
    }
    
    if (emailList.includes(inviteEmail)) {
      setError(t('admin.members.errors.emailAlreadyAdded'));
      return;
    }
    
    setEmailList([...emailList, inviteEmail]);
    setInviteEmail('');
    setError(null);
  };

  const removeEmailFromList = (emailToRemove) => {
    setEmailList(emailList.filter(email => email !== emailToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      addEmailToList();
    }
  };

  const handleSingleInvite = async (email) => {
    setInviting(true);
    setError(null);
    setMessage('');
    
    const result = await inviteUserToNetwork(email, network.id, activeProfile.id, inviteAsAdmin ? 'admin' : 'member');
    
    if (result.success) {
      setMessage(result.message);
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
    return result;
  };

  const handleBatchInvite = async () => {
    if (emailList.length === 0) {
      setError(t('admin.members.errors.addAtLeastOneEmail'));
      return;
    }
    
    setBatchInviting(true);
    setInvitationProgress(0);
    setError(null);
    setMessage('');
    
    let successful = 0;
    let failed = 0;
    const failedEmails = [];
    
    try {
      for (let i = 0; i < emailList.length; i++) {
        const email = emailList[i];
        
        try {
          const result = await inviteUserToNetwork(email, network.id, activeProfile.id, inviteAsAdmin ? 'admin' : 'member');
          
          if (result.success) {
            successful++;
          } else {
            failed++;
            failedEmails.push(`${email} (${result.message})`);
          }
        } catch (err) {
          console.error(`Error inviting ${email}:`, err);
          failed++;
          failedEmails.push(`${email} (Error: ${err.message || 'Unknown error'})`);
        }
        
        // Update progress
        setInvitationProgress(Math.round(((i + 1) / emailList.length) * 100));
      }
      
      // Show final result
      if (failed === 0) {
        setMessage(t('admin.members.success.invitationsSent', { count: successful }));
        setEmailList([]); // Clear the list on success
        setInviteAsAdmin(false);
      } else if (successful === 0) {
        setError(t('admin.members.errors.allInvitationsFailed', { count: failed }));
      } else {
        setMessage(t('admin.members.success.partialInvitationsSent', { successful, failed }));
        if (failedEmails.length > 0) {
          setError(t('admin.members.errors.failedEmails', { emails: failedEmails.join(', ') }));
        }
        // Remove successful emails from the list
        const successfulCount = successful;
        const remainingEmails = emailList.slice(-failed);
        setEmailList(remainingEmails);
      }
      
      // Refresh data
      onMembersChange();
      const invitationsResult = await getNetworkPendingInvitations(network.id);
      if (invitationsResult.success) {
        setPendingInvitations(invitationsResult.invitations);
      }
      setInvitationLinksRefresh(prev => prev + 1);
      
    } catch (error) {
      console.error('Error sending invitations:', error);
      setError(t('admin.members.errors.sendInvitationsError'));
    } finally {
      setBatchInviting(false);
      setInvitationProgress(0);
    }
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
    if (memberId === activeProfile.id) {
      setError(t('admin.members.errors.cannotRemoveSelf'));
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
    if (memberId === activeProfile.id) {
      setError(t('admin.members.errors.cannotChangeOwnAdmin'));
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
          <Tab label={t('admin.members.tabs.currentMembers')} />
          <Tab label={t('admin.members.tabs.inviteMembers')} />
        </Tabs>
      </Box>

      {/* Tab Panel 0: Current Members */}
      {activeTab === 0 && (
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
{t('admin.members.networkMembers', { count: members.length })}
          </Typography>
          
          {members.length > 0 ? (
            <TableContainer component={Paper}>
              <Table aria-label="members table">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('admin.members.table.name')}</TableCell>
                    <TableCell>{t('admin.members.table.role')}</TableCell>
                    <TableCell>{t('admin.members.table.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map(member => (
                    <TableRow 
                      key={member.id}
                      sx={member.id === activeProfile?.id ? { 
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
                              {member.full_name || t('admin.members.unnamedUser')}
                              {member.id === activeProfile?.id && ` (${t('admin.members.you')})`}
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
{t('admin.members.buttons.view')}
                          </Button>
                          {member.id !== activeProfile.id && (
                            <>
                              <Button 
                                size="small"
                                variant="outlined"
                                color={member.role === 'admin' ? 'warning' : 'info'}
                                startIcon={<AdminIcon />}
                                onClick={() => confirmAction('toggleAdmin', member)}
                              >
{member.role === 'admin' ? t('admin.members.buttons.removeAdmin') : t('admin.members.buttons.makeAdmin')}
                              </Button>
                              <Button 
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<PersonRemoveIcon />}
                                onClick={() => confirmAction('remove', member)}
                              >
{t('admin.members.buttons.remove')}
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
{t('admin.members.noMembersFound')}
            </Typography>
          )}

          {/* Pending Invitations Section */}
          {loadingInvitations ? (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Spinner />
            </Box>
          ) : pendingInvitations.length > 0 ? (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" component="h3" gutterBottom>
{t('admin.members.invitations', { count: pendingInvitations.length })}
              </Typography>
              <TableContainer component={Paper}>
                <Table aria-label="pending invitations table">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('admin.members.table.email')}</TableCell>
                      <TableCell>{t('admin.members.table.invitedBy')}</TableCell>
                      <TableCell>{t('admin.members.table.invitedOn')}</TableCell>
                      <TableCell>{t('admin.members.table.role')}</TableCell>
                      <TableCell>{t('admin.members.table.status')}</TableCell>
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
{invitation.inviter?.full_name || t('admin.members.system')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(invitation.created_at)}
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
                            <Tooltip title={t('admin.members.acceptedOn', { date: formatDate(invitation.updated_at || invitation.created_at) })}>
                              <Chip 
                                label={t('admin.members.status.accepted')} 
                                color="success"
                                size="small"
                                icon={<CheckCircleIcon />}
                              />
                            </Tooltip>
                          ) : (
                            <Chip 
                              label={t('admin.members.status.pending')} 
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
{t('admin.members.inviteViaEmail')}
            </Typography>
            
            {/* Email Collection Interface */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
label={t('admin.members.addEmailAddress')}
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  variant="outlined"
placeholder={t('admin.members.emailPlaceholder')}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={addEmailToList}
                          disabled={!inviteEmail || !isValidEmail(inviteEmail) || emailList.includes(inviteEmail)}
                          edge="end"
                        >
                          <AddIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Tooltip title={t('admin.members.fileImportTooltip')}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<GroupAddIcon />}
                    onClick={() => setBatchInviteOpen(true)}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
{t('admin.members.fileImport')}
                  </Button>
                </Tooltip>
              </Box>
              
              {/* Email Chips Display */}
              {emailList.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
{t('admin.members.emailsToInvite', { count: emailList.length })}
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 1,
                      maxHeight: 200,
                      overflow: 'auto'
                    }}
                  >
                    {emailList.map((email, index) => (
                      <Chip
                        key={index}
                        label={email}
                        onDelete={() => removeEmailFromList(email)}
                        deleteIcon={<CloseIcon />}
                        variant="outlined"
                        color="primary"
                        size="small"
                      />
                    ))}
                  </Paper>
                </Box>
              )}
              
              {/* Admin checkbox and action buttons */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={inviteAsAdmin}
                      onChange={(e) => setInviteAsAdmin(e.target.checked)}
                      color="primary"
                    />
                  }
label={t('admin.members.inviteAsAdmin')}
                />
                
                {emailList.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => setEmailList([])}
                      disabled={batchInviting}
                      size="small"
                    >
{t('admin.members.buttons.clearAll')}
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PersonAddIcon />}
                      onClick={handleBatchInvite}
                      disabled={batchInviting || emailList.length === 0}
                    >
{batchInviting ? t('admin.members.invitingProgress', { progress: invitationProgress }) : t('admin.members.inviteCount', { count: emailList.length, people: emailList.length === 1 ? t('admin.members.person') : t('admin.members.people') })}
                    </Button>
                  </Box>
                )}
              </Box>
              
              {/* Progress indicator for batch invites */}
              {batchInviting && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
{t('admin.members.sendingInvitations', { progress: invitationProgress })}
                  </Typography>
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 6, 
                      backgroundColor: 'grey.300', 
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: `${invitationProgress}%`, 
                        height: '100%', 
                        backgroundColor: 'primary.main',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
{t('admin.members.invitationLinks')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
{t('admin.members.invitationLinksDescription')}
            </Typography>

            {/* Allow member invites toggle */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={allowMemberInvites}
                    onChange={handleToggleMemberInvites}
                    disabled={updatingMemberInvites}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">
                      {t('admin.members.allowMemberInvites')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('admin.members.allowMemberInvitesDescription')}
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', ml: 0 }}
              />
            </Paper>

            {/* Embed the InvitationLinksTab component here */}
            <InvitationLinksTab networkId={network.id} darkMode={darkMode} refreshTrigger={invitationLinksRefresh} />
          </Box>
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>
{dialogAction === 'remove' ? t('admin.members.dialogs.removeMember') : 
           dialogAction === 'toggleAdmin' && dialogMember?.role === 'admin' ? t('admin.members.dialogs.removeAdminPrivileges') : 
           t('admin.members.dialogs.grantAdminPrivileges')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
{dialogAction === 'remove' ? 
              t('admin.members.dialogs.confirmRemove', { name: dialogMember?.full_name || t('admin.members.thisUser') }) : 
              dialogAction === 'toggleAdmin' && dialogMember?.role === 'admin' ? 
                t('admin.members.dialogs.confirmRemoveAdmin', { name: dialogMember?.full_name || t('admin.members.thisUser') }) : 
                t('admin.members.dialogs.confirmGrantAdmin', { name: dialogMember?.full_name || t('admin.members.thisUser') })
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {error && openDialog && (
            <Alert severity="error" sx={{ flex: 1, mr: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Button onClick={handleDialogClose}>{t('admin.members.buttons.cancel')}</Button>
          <Button onClick={handleConfirmedAction} autoFocus>
            {t('admin.members.buttons.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Batch Invite Modal */}
      <BatchInviteModal
        open={batchInviteOpen}
        onClose={() => setBatchInviteOpen(false)}
        onInvite={inviteUserToNetwork}
        network={network}
        activeProfile={activeProfile}
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