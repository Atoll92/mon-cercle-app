import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  Stack,
  Alert,
  Link as MuiLink,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Event as EventIcon,
  CalendarMonth as CalendarMonthIcon,
  LocationOn as LocationOnIcon,
  Groups as GroupsIcon,
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon,
  ArrowForward,
  Close as CloseIcon,
} from '@mui/icons-material';
import EventParticipation from './EventParticipation';
import LinkifiedText from './LinkifiedText';
import UserContent from './UserContent';
import { formatEventDate } from '../utils/dateFormatting';
import { useTranslation } from '../hooks/useTranslation';

const EventDetailsDialog = ({
  open,
  onClose,
  event,
  user,
  onParticipationChange,
  showParticipants = true
}) => {
  const { t } = useTranslation();

  if (!event) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1,
        px: 2,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EventIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" component="div">
            {event.title}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ color: 'primary.contrastText' }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0, borderTopWidth: '0px' }}>
        {event.cover_image_url && (
          <Box sx={{ 
            width: '100%',
            position: 'relative'
          }}>
            <img 
              src={event.cover_image_url} 
              alt={event.title}
              style={{ 
                width: '100%', 
              }} 
            />
          </Box>
        )}
        
        <Box sx={{ p: 3 }}>
          {/* Event Details Section - Full Width */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 2,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
            }}
          >
            <Stack spacing={1.5}>
              {/* Date/Time */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonthIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.primary">
                  {event.end_date ? (
                    <>
                      {t('eventDetails.from')} <strong>{formatEventDate(event.date, true)}</strong> {t('eventDetails.to')} <strong>{formatEventDate(event.end_date, true)}</strong>
                    </>
                  ) : (
                    <strong>{formatEventDate(event.date, true)}</strong>
                  )}
                </Typography>
              </Box>

              {/* Location */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOnIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.primary">
                  {event.location}
                </Typography>
              </Box>

              {/* Category */}
              {event.category && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={event.category.name}
                    size="small"
                    sx={{
                      bgcolor: event.category.color || '#666',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>
              )}

              {/* Capacity */}
              {event.capacity && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GroupsIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.primary">
                    {event.capacity} {t('eventDetails.attendeesMax')}
                  </Typography>
                </Box>
              )}

              {/* Event Link */}
              {event.event_link && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinkIcon fontSize="small" color="action" />
                  <MuiLink
                    href={event.event_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '0.875rem',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      },
                      wordBreak: 'break-all'
                    }}
                  >
                    {event.event_link}
                    <OpenInNewIcon fontSize="inherit" sx={{ ml: 0.5 }} />
                  </MuiLink>
                </Box>
              )}

              {/* RSVP Section */}
              {user && (
                  <EventParticipation
                    event={event}
                    showParticipants={showParticipants}
                    onStatusChange={onParticipationChange ?
                      (status) => onParticipationChange(event.id, status) :
                      undefined
                    }
                  />
              )}
            </Stack>
          </Paper>

          

          {/* Description Section */}
          {event.description ? (
            <>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {t('eventDetails.aboutThisEvent')}
              </Typography>
              <UserContent
                content={event.description}
                html={false}
                sx={{
                  fontSize: '1rem',
                  lineHeight: 1.7
                }}
              />
            </>
          ) : (
            <Alert severity="info" variant="outlined">
              {t('eventDetails.noDescription')}
            </Alert>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: { xs: 1, sm: 2 }, display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {event.event_link && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<LinkIcon />}
              href={event.event_link}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ px: { xs: 1, sm: 2 }, py: { xs: 0.5, sm: 1 } }}
            >
              {t('eventDetails.visitEventLink')}
            </Button>
          )}
          {event.network_id && event.id && (
            <Button
              component={Link}
              to={`/network/${event.network_id}/event/${event.id}`}
              variant="contained"
              color="primary"
              endIcon={<ArrowForward />}
              sx={{ px: { xs: 1, sm: 2 }, py: { xs: 0.5, sm: 1 } }}
            >
              {t('eventDetails.viewEventPage')}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EventDetailsDialog;