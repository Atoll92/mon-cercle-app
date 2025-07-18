// src/components/admin/InvitationLinksTab.jsx
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Spinner,
  Snackbar,
  Switch,
  FormControlLabel,
  InputAdornment,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  QrCode as QrCodeIcon,
  Link as LinkIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Share as ShareIcon,
  Groups as GroupsIcon,
  AccessTime as TimeIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import {
  createInvitationLink,
  getNetworkInvitationLinks,
  deleteInvitationLink,
  toggleInvitationStatus,
  updateInvitationLink
} from '../../api/invitations';
import { useProfile } from '../../context/profileContext';

const InvitationLinksTab = ({ networkId, darkMode, refreshTrigger }) => {
  const { activeProfile } = useProfile();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [qrDialog, setQrDialog] = useState({ open: false, link: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    role: 'member',
    hasExpiry: false,
    expiryDays: 7,
    hasMaxUses: false,
    maxUses: 100
  });

  useEffect(() => {
    loadInvitations();
  }, [networkId]);

  // Reload invitations when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadInvitations();
    }
  }, [refreshTrigger]);

  const loadInvitations = async () => {
    setLoading(true);
    const result = await getNetworkInvitationLinks(networkId);
    if (result.success) {
      setInvitations(result.invitations);
    } else {
      showSnackbar('Failed to load invitation links', 'error');
    }
    setLoading(false);
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreateInvitation = async () => {
    if (!activeProfile?.id) {
      showSnackbar('No active profile found', 'error');
      return;
    }

    const data = {
      name: formData.name || 'General Invitation',
      description: formData.description || null,
      role: formData.role,
      maxUses: formData.hasMaxUses ? formData.maxUses : null,
      expiresAt: formData.hasExpiry 
        ? new Date(Date.now() + formData.expiryDays * 24 * 60 * 60 * 1000).toISOString()
        : null
    };

    const result = await createInvitationLink(networkId, activeProfile.id, data);
    
    if (result.success) {
      showSnackbar('Invitation link created successfully', 'success');
      setCreateDialog(false);
      setFormData({
        name: '',
        description: '',
        role: 'member',
        hasExpiry: false,
        expiryDays: 7,
        hasMaxUses: false,
        maxUses: 100
      });
      loadInvitations();
    } else {
      showSnackbar(result.error || 'Failed to create invitation link', 'error');
    }
  };

  const handleDeleteInvitation = async (linkId) => {
    if (!window.confirm('Are you sure you want to delete this invitation link?')) {
      return;
    }

    const result = await deleteInvitationLink(linkId);
    
    if (result.success) {
      showSnackbar('Invitation link deleted successfully', 'success');
      loadInvitations();
    } else {
      showSnackbar(result.error || 'Failed to delete invitation link', 'error');
    }
  };

  const handleToggleStatus = async (linkId) => {
    const result = await toggleInvitationStatus(linkId);
    
    if (result.success) {
      showSnackbar(result.message, 'success');
      loadInvitations();
    } else {
      showSnackbar(result.error || 'Failed to toggle status', 'error');
    }
  };

  const generateQRCode = async (invitation) => {
    try {
      const inviteUrl = `${window.location.origin}/join/${invitation.code}`;
      const qrDataUrl = await QRCode.toDataURL(inviteUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrDataUrl);
      setQrDialog({ open: true, link: invitation });
    } catch (error) {
      console.error('Error generating QR code:', error);
      showSnackbar('Failed to generate QR code', 'error');
    }
  };

  const copyToClipboard = (code) => {
    const inviteUrl = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      showSnackbar('Link copied to clipboard!', 'success');
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusChip = (invitation) => {
    if (!invitation.is_active) {
      return <Chip label="Inactive" size="small" color="default" />;
    }
    
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return <Chip label="Expired" size="small" color="error" />;
    }
    
    if (invitation.max_uses && invitation.uses_count >= invitation.max_uses) {
      return <Chip label="Limit Reached" size="small" color="warning" />;
    }
    
    return <Chip label="Active" size="small" color="success" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <Spinner />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Invitation Links</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialog(true)}
        >
          Create Invitation Link
        </Button>
      </Box>

      {invitations.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <LinkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No invitation links yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Create invitation links to allow people to join your network easily
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialog(true)}
            >
              Create First Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="center">Uses</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">{invitation.name}</Typography>
                      {invitation.description && (
                        <Typography variant="caption" color="text.secondary">
                          {invitation.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{getStatusChip(invitation)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={invitation.role || 'member'} 
                      color={invitation.role === 'admin' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                      <GroupsIcon fontSize="small" />
                      <Typography variant="body2">
                        {invitation.uses_count}
                        {invitation.max_uses && ` / ${invitation.max_uses}`}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(invitation.expires_at)}</TableCell>
                  <TableCell>{formatDate(invitation.created_at)}</TableCell>
                  <TableCell align="right">
                    <Box display="flex" gap={0.5} justifyContent="flex-end">
                      <Tooltip title="Copy Link">
                        <IconButton size="small" onClick={() => copyToClipboard(invitation.code)}>
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Show QR Code">
                        <IconButton size="small" onClick={() => generateQRCode(invitation)}>
                          <QrCodeIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={invitation.is_active ? 'Deactivate' : 'Activate'}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleToggleStatus(invitation.id)}
                          color={invitation.is_active ? 'default' : 'success'}
                        >
                          {invitation.is_active ? <CloseIcon /> : <CheckIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteInvitation(invitation.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Invitation Dialog */}
      <Dialog 
        open={createDialog} 
        onClose={() => setCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Invitation Link</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Link Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., General Invitation, Event 2024"
            />
            
            <TextField
              label="Description (Optional)"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add notes about this invitation link"
            />
            
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                label="Role"
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.hasExpiry}
                  onChange={(e) => setFormData({ ...formData, hasExpiry: e.target.checked })}
                />
              }
              label="Set Expiration"
            />
            
            {formData.hasExpiry && (
              <TextField
                label="Expires in (days)"
                type="number"
                fullWidth
                value={formData.expiryDays}
                onChange={(e) => setFormData({ ...formData, expiryDays: parseInt(e.target.value) || 7 })}
                InputProps={{
                  inputProps: { min: 1 }
                }}
              />
            )}
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.hasMaxUses}
                  onChange={(e) => setFormData({ ...formData, hasMaxUses: e.target.checked })}
                />
              }
              label="Limit Number of Uses"
            />
            
            {formData.hasMaxUses && (
              <TextField
                label="Maximum Uses"
                type="number"
                fullWidth
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 100 })}
                InputProps={{
                  inputProps: { min: 1 }
                }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateInvitation}
            disabled={!formData.name.trim()}
          >
            Create Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog 
        open={qrDialog.open} 
        onClose={() => setQrDialog({ open: false, link: null })}
        maxWidth="sm"
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">QR Code</Typography>
            <IconButton onClick={() => setQrDialog({ open: false, link: null })} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {qrDialog.link && (
            <Box textAlign="center">
              <Typography variant="subtitle1" gutterBottom>
                {qrDialog.link.name}
              </Typography>
              <Box mb={2}>
                <img src={qrCodeUrl} alt="QR Code" style={{ maxWidth: '100%' }} />
              </Box>
              <TextField
                fullWidth
                value={`${window.location.origin}/join/${qrDialog.link.code}`}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => copyToClipboard(qrDialog.link.code)}>
                        <CopyIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Share this QR code or link to invite people to your network
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              const link = document.createElement('a');
              link.download = `${qrDialog.link.name.replace(/\s+/g, '-')}-qr-code.png`;
              link.href = qrCodeUrl;
              link.click();
            }}
            startIcon={<QrCodeIcon />}
          >
            Download QR Code
          </Button>
          <Button onClick={() => setQrDialog({ open: false, link: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InvitationLinksTab;