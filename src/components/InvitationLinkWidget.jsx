import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Alert
} from '@mui/material';
import Spinner from './Spinner';
import {
  ContentCopy as CopyIcon,
  QrCode2 as QrCodeIcon,
  Link as LinkIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import QRCode from 'qrcode';
import { getActiveInvitationLinks } from '../api/invitations';

function InvitationLinkWidget({ networkId }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchInvitations();
  }, [networkId]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const data = await getActiveInvitationLinks(networkId);
      // Only show active, non-expired invitations
      const activeInvitations = data.filter(inv => {
        if (!inv.is_active) return false;
        if (inv.expires_at && new Date(inv.expires_at) < new Date()) return false;
        if (inv.max_uses && inv.uses_count >= inv.max_uses) return false;
        return true;
      });
      setInvitations(activeInvitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (invitation) => {
    const link = `${window.location.origin}/join/${invitation.code}`;
    navigator.clipboard.writeText(link);
    setCopiedId(invitation.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShowQR = async (invitation) => {
    setSelectedInvitation(invitation);
    const link = `${window.location.origin}/join/${invitation.code}`;
    try {
      const url = await QRCode.toDataURL(link, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(url);
      setShowQRDialog(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Spinner size={48} />
      </Paper>
    );
  }

  if (invitations.length === 0) {
    return null; // Don't show widget if no active invitations
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinkIcon /> Join This Network
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Share these links to invite new members
      </Typography>

      <Stack spacing={2}>
        {invitations.map((invitation) => (
          <Box
            key={invitation.id}
            sx={{
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              {invitation.name || 'General Invitation'}
            </Typography>
            
            {invitation.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {invitation.description}
              </Typography>
            )}

            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              {invitation.max_uses && (
                <Chip
                  icon={<PeopleIcon />}
                  label={`${invitation.uses_count}/${invitation.max_uses} used`}
                  size="small"
                  color={invitation.uses_count >= invitation.max_uses ? "error" : "default"}
                />
              )}
              {invitation.expires_at && (
                <Chip
                  icon={<ScheduleIcon />}
                  label={`Expires ${new Date(invitation.expires_at).toLocaleDateString()}`}
                  size="small"
                  color={new Date(invitation.expires_at) < new Date() ? "error" : "default"}
                />
              )}
            </Stack>

            <Stack direction="row" spacing={1}>
              <Tooltip title={copiedId === invitation.id ? "Copied!" : "Copy link"}>
                <IconButton
                  size="small"
                  onClick={() => handleCopyLink(invitation)}
                  color={copiedId === invitation.id ? "success" : "default"}
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Show QR code">
                <IconButton
                  size="small"
                  onClick={() => handleShowQR(invitation)}
                >
                  <QrCodeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        ))}
      </Stack>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onClose={() => setShowQRDialog(false)}>
        <DialogTitle>
          QR Code for {selectedInvitation?.name || 'Invitation'}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pt: 2 }}>
          {qrCodeUrl && (
            <img src={qrCodeUrl} alt="QR Code" style={{ maxWidth: '100%' }} />
          )}
          <Typography variant="body2" sx={{ mt: 2 }}>
            Scan this code to join the network
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQRDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default InvitationLinkWidget;