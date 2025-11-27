import React, { useEffect, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Alert,
  Skeleton,
  useTheme
} from '@mui/material';
import {
  ConfirmationNumber as TicketIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { useTranslation } from '../hooks/useTranslation';
import { getHelloAssoEmbedUrl } from '../utils/helloAssoEmbed';

/**
 * HelloAsso Ticketing Widget Component
 * Displays an embedded HelloAsso ticketing widget for events
 */
const HelloAssoWidget = ({ organizationSlug, formSlug, formType = 'Event', eventLink }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const embedUrl = getHelloAssoEmbedUrl(organizationSlug, formSlug, formType);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleIframeLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TicketIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              {t('pages.event.buyTickets') || 'Buy Tickets'}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<OpenInNewIcon />}
            href={eventLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('pages.event.openHelloAsso') || 'Open in HelloAsso'}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('pages.event.helloAssoDescription') || 'Purchase your tickets securely through HelloAsso'}
        </Typography>

        {loading && (
          <Skeleton
            variant="rectangular"
            width="100%"
            height={400}
            sx={{ borderRadius: 2 }}
          />
        )}

        {error && (
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                href={eventLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('pages.event.openHelloAsso') || 'Open in HelloAsso'}
              </Button>
            }
          >
            {t('pages.event.helloAssoLoadError') || 'Unable to load the ticketing widget. Please click the button to purchase tickets directly on HelloAsso.'}
          </Alert>
        )}

        <Box
          sx={{
            display: loading || error ? 'none' : 'block',
            width: '100%',
            minHeight: 400,
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title="HelloAsso Ticketing Widget"
            width="100%"
            height="750"
            style={{
              border: 'none',
              borderRadius: theme.shape.borderRadius
            }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
          {t('pages.event.poweredByHelloAsso') || 'Powered by HelloAsso - Secure online ticketing'}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default HelloAssoWidget;
