import React, { useState } from 'react';
import { Box, Paper, Typography, Alert, alpha, useTheme as useMuiTheme, CircularProgress } from '@mui/material';
import { Favorite as FavoriteIcon } from '@mui/icons-material';
import { useTranslation } from '../hooks/useTranslation';

/**
 * DonationTab Component
 *
 * Embeds a HelloAsso donation widget iframe within the network page.
 * HelloAsso is a French platform for associations to collect donations.
 *
 * @param {string} helloAssoUrl - The HelloAsso widget URL to embed
 * @param {boolean} darkMode - Whether dark mode is enabled
 */
const DonationTab = ({ helloAssoUrl, darkMode }) => {
  const { t } = useTranslation();
  const muiTheme = useMuiTheme();
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  // Validate URL
  if (!helloAssoUrl) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mt: 2,
          textAlign: 'center',
          backgroundColor: darkMode
            ? alpha('#000000', 0.3)
            : alpha('#ffffff', 0.8),
          border: `1px solid ${darkMode
            ? alpha('#ffffff', 0.1)
            : alpha('#000000', 0.1)}`,
          borderRadius: 2,
        }}
      >
        <FavoriteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          {t('dashboard.donation.notConfigured')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('dashboard.donation.contactAdmin')}
        </Typography>
      </Paper>
    );
  }

  const handleIframeLoad = () => {
    setIframeLoading(false);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeLoading(false);
    setIframeError(true);
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* HelloAsso Widget */}
      <Paper
        elevation={0}
        sx={{
          p: 0,
          overflow: 'hidden',
          backgroundColor: darkMode
            ? alpha('#000000', 0.3)
            : alpha('#ffffff', 0.95),
          border: `1px solid ${darkMode
            ? alpha('#ffffff', 0.1)
            : alpha('#000000', 0.1)}`,
          borderRadius: 2,
          position: 'relative',
          minHeight: '750px',
        }}
      >
        {/* Loading State */}
        {iframeLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: darkMode
                ? alpha('#000000', 0.5)
                : alpha('#ffffff', 0.8),
              zIndex: 10,
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t('dashboard.donation.loading')}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Error State */}
        {iframeError && (
          <Alert severity="error" sx={{ m: 3 }}>
            {t('dashboard.donation.loadError')}
          </Alert>
        )}

        {/* HelloAsso iframe */}
        <iframe
          src={helloAssoUrl}
          title={t('dashboard.donation.iframeTitle')}
          width="100%"
          height="750"
          style={{
            border: 'none',
            display: iframeError ? 'none' : 'block',
          }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="payment"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
        />
      </Paper>

      {/* Security Notice */}
      <Alert
        severity="info"
        sx={{
          mt: 3,
          backgroundColor: darkMode
            ? alpha('#2196f3', 0.1)
            : alpha('#2196f3', 0.05),
          border: `1px solid ${darkMode
            ? alpha('#2196f3', 0.3)
            : alpha('#2196f3', 0.2)}`,
        }}
      >
        {t('dashboard.donation.securityNotice')}
      </Alert>
    </Box>
  );
};

export default DonationTab;
