import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Skeleton,
  Alert
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  QrCode2 as QrCodeIcon,
  Check as CheckIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import QRCode from 'qrcode';
import { getOrCreatePublicInvitationLink } from '../api/invitations';
import { useProfile } from '../context/profileContext';
import { useTranslation } from '../hooks/useTranslation';

function PublicInviteWidget({ networkId }) {
  const { t } = useTranslation();
  const { activeProfile } = useProfile();
  const [invitation, setInvitation] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchOrCreateInvitation = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getOrCreatePublicInvitationLink(networkId, activeProfile.id);

        if (result.success) {
          setInvitation(result.invitation);
          // Generate QR code
          const link = `${window.location.origin}/join/${result.invitation.code}`;
          const url = await QRCode.toDataURL(link, {
            width: 180,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
          setQrCodeUrl(url);
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (networkId && activeProfile?.id) {
      fetchOrCreateInvitation();
    }
  }, [networkId, activeProfile?.id]);

  const handleCopyLink = () => {
    if (invitation) {
      const link = `${window.location.origin}/join/${invitation.code}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <Box sx={{ mt: 3 }}>
        <Skeleton variant="text" width={150} height={32} />
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
          <Skeleton variant="rectangular" width={120} height={120} />
          <Skeleton variant="rectangular" width={150} height={40} />
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!invitation) {
    return null;
  }

  const inviteLink = `${window.location.origin}/join/${invitation.code}`;

  return (
    <Box sx={{ mt: 3 }}>
      <Typography
        variant="subtitle1"
        fontWeight={600}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2
        }}
      >
        <PersonAddIcon fontSize="small" />
        {t('about.inviteMembers', 'Invite Members')}
      </Typography>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'center', sm: 'flex-start' }}
      >
        {/* QR Code */}
        {qrCodeUrl && (
          <Box
            sx={{
              p: 1,
              bgcolor: 'white',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src={qrCodeUrl}
              alt={t('about.qrCodeAlt', 'QR Code to join network')}
              style={{ width: 120, height: 120, display: 'block' }}
            />
          </Box>
        )}

        {/* Copy Link Section */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t('about.shareInviteDescription', 'Share this link or QR code to invite new members:')}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              bgcolor: 'action.hover',
              borderRadius: 1,
              maxWidth: '100%',
              overflow: 'hidden'
            }}
          >
            <Typography
              variant="body2"
              sx={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: 'monospace',
                fontSize: '0.8rem'
              }}
            >
              {inviteLink}
            </Typography>

            <Tooltip title={copied ? t('common.copied', 'Copied!') : t('common.copyLink', 'Copy link')}>
              <IconButton
                size="small"
                onClick={handleCopyLink}
                color={copied ? 'success' : 'default'}
              >
                {copied ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>

          <Button
            variant="outlined"
            size="small"
            startIcon={copied ? <CheckIcon /> : <CopyIcon />}
            onClick={handleCopyLink}
            color={copied ? 'success' : 'primary'}
            sx={{ mt: 1.5 }}
          >
            {copied ? t('common.copied', 'Copied!') : t('about.copyInviteLink', 'Copy Invite Link')}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

export default PublicInviteWidget;
