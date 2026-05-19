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
  InputAdornment,
  alpha,
  LinearProgress,
  useTheme,
  Divider
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
  Add as AddIcon,
  Share as ShareIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  EmojiEvents as TrophyIcon,
  Send as SendIcon
} from '@mui/icons-material';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { Link } from 'react-router-dom';
import { inviteUserToNetwork, toggleMemberAdmin, removeMemberFromNetwork, getNetworkPendingInvitations, updateNetworkDetails } from '../../api/networks';
import { getOrCreatePublicInvitationLink } from '../../api/invitations';
import BatchInviteModal from './BatchInviteModal';
import InvitationLinksTab from './InvitationLinksTab';
import Switch from '@mui/material/Switch';
import confetti from 'canvas-confetti';

// Helper function to validate emails
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const MembersTab = ({ members, activeProfile, network, onMembersChange, onNetworkUpdate, darkMode = false }) => {
  const { t } = useTranslation();
  const theme = useTheme();
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

  // Quick Share state
  const [publicInviteLink, setPublicInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);
  const [showEmailSection, setShowEmailSection] = useState(false);

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

  // Fetch public invite link when switching to invite tab
  useEffect(() => {
    const fetchPublicLink = async () => {
      if (!network?.id || !activeProfile?.id) return;
      setLoadingLink(true);
      try {
        const result = await getOrCreatePublicInvitationLink(network.id, activeProfile.id);
        if (result.success) {
          setPublicInviteLink(`${window.location.origin}/join/${result.invitation.code}`);
        }
      } catch (err) {
        console.error('Error fetching public invite link:', err);
      } finally {
        setLoadingLink(false);
      }
    };
    if (activeTab === 1) {
      fetchPublicLink();
    }
  }, [activeTab, network?.id, activeProfile?.id]);

  // Quick Share helpers
  const handleCopyLink = () => {
    if (publicInviteLink) {
      navigator.clipboard.writeText(publicInviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const text = t('admin.members.shareMessage', {
      networkName: network?.name || 'our network',
      link: publicInviteLink
    }) || `Join ${network?.name || 'our network'} on Conclav! ${publicInviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = t('admin.members.shareEmailSubject', {
      networkName: network?.name || 'our network'
    }) || `Join ${network?.name} on Conclav`;
    const body = t('admin.members.shareEmailBody', {
      networkName: network?.name || 'our network',
      link: publicInviteLink
    }) || `I'd like to invite you to join ${network?.name} on Conclav.\n\nClick here to join: ${publicInviteLink}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const triggerInviteCelebration = (count) => {
    confetti({
      particleCount: Math.min(count * 30, 150),
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Handle pasting multiple emails
  const handleEmailPaste = (e) => {
    const pastedText = e.clipboardData?.getData('text') || '';
    const emails = pastedText
      .split(/[,;\n\s]+/)
      .map(s => s.trim().toLowerCase())
      .filter(s => isValidEmail(s));

    if (emails.length > 1) {
      e.preventDefault();
      const newEmails = emails.filter(em => !emailList.includes(em));
      setEmailList(prev => [...prev, ...newEmails]);
      setInviteEmail('');
      setError(null);
    }
  };

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
      triggerInviteCelebration(1);
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
        triggerInviteCelebration(successful);
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
          {/* ===== PRIMARY: Quick Share Section ===== */}
          <Card
            sx={{
              mb: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ShareIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  {t('admin.members.quickShare', 'Share invite link')}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                {t('admin.members.quickShareDescription', 'The easiest way to grow your network. Share this link anywhere — anyone who clicks it can join.')}
              </Typography>

              {loadingLink ? (
                <LinearProgress sx={{ borderRadius: 1 }} />
              ) : publicInviteLink ? (
                <Stack spacing={2}>
                  {/* Invite link display + copy */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1.5,
                      bgcolor: 'background.paper',
                      borderRadius: 1.5,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <LinkIcon color="action" fontSize="small" />
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                      }}
                    >
                      {publicInviteLink}
                    </Typography>
                    <Button
                      variant={linkCopied ? 'contained' : 'outlined'}
                      size="small"
                      color={linkCopied ? 'success' : 'primary'}
                      startIcon={linkCopied ? <CheckIcon /> : <CopyIcon />}
                      onClick={handleCopyLink}
                      sx={{ whiteSpace: 'nowrap', minWidth: 100 }}
                    >
                      {linkCopied ? t('common.copied', 'Copied!') : t('common.copy', 'Copy')}
                    </Button>
                  </Box>

                  {/* Share buttons */}
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<WhatsAppIcon />}
                      onClick={handleShareWhatsApp}
                      sx={{ color: '#25D366', borderColor: '#25D366', '&:hover': { borderColor: '#25D366', bgcolor: alpha('#25D366', 0.05) } }}
                    >
                      WhatsApp
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EmailIcon />}
                      onClick={handleShareEmail}
                    >
                      Email
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Alert severity="warning" variant="outlined">
                  {t('admin.members.linkError', 'Could not generate invite link. Please try again.')}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* ===== SECONDARY: Email Invites ===== */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => setShowEmailSection(!showEmailSection)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonAddIcon color="action" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    {t('admin.members.inviteViaEmail', 'Invite by email')}
                  </Typography>
                </Box>
                <IconButton size="small">
                  <AddIcon sx={{ transform: showEmailSection ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
                </IconButton>
              </Box>

              {!showEmailSection && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {t('admin.members.emailSectionHint', 'Send personalized invitations directly to email addresses, or import a list.')}
                </Typography>
              )}

              {showEmailSection && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      label={t('admin.members.addEmailAddress')}
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      onPaste={handleEmailPaste}
                      variant="outlined"
                      size="small"
                      placeholder={t('admin.members.emailPlaceholder')}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={addEmailToList}
                              disabled={!inviteEmail || !isValidEmail(inviteEmail) || emailList.includes(inviteEmail)}
                              edge="end"
                              size="small"
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
                        size="small"
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
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                        {t('admin.members.emailsToInvite', { count: emailList.length })}
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 150, overflow: 'auto' }}
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
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={inviteAsAdmin}
                          onChange={(e) => setInviteAsAdmin(e.target.checked)}
                          color="primary"
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">{t('admin.members.inviteAsAdmin')}</Typography>}
                    />
                    {emailList.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => setEmailList([])}
                          disabled={batchInviting}
                        >
                          {t('admin.members.buttons.clearAll')}
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<SendIcon />}
                          onClick={handleBatchInvite}
                          disabled={batchInviting || emailList.length === 0}
                        >
                          {batchInviting
                            ? t('admin.members.invitingProgress', { progress: invitationProgress })
                            : t('admin.members.inviteCount', { count: emailList.length, people: emailList.length === 1 ? t('admin.members.person') : t('admin.members.people') })}
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {/* Progress indicator */}
                  {batchInviting && (
                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('admin.members.sendingInvitations', { progress: invitationProgress })}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={invitationProgress}
                        sx={{ mt: 0.5, borderRadius: 1 }}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* ===== SETTINGS & ADVANCED ===== */}
          <Card variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
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
                      <Typography variant="body2" fontWeight={500}>
                        {t('admin.members.allowMemberInvites')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('admin.members.allowMemberInvitesDescription')}
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', ml: 0 }}
                />
              </Paper>

              {/* Invitation links management */}
              <InvitationLinksTab networkId={network.id} darkMode={darkMode} refreshTrigger={invitationLinksRefresh} />
            </CardContent>
          </Card>
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