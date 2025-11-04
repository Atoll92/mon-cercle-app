import { Box, Typography, Button, Stack, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpIcon from '@mui/icons-material/Help';
import WidgetHeader from './shared/WidgetHeader';
import WidgetSkeleton from './shared/WidgetSkeleton';
import WidgetEmptyState from './shared/WidgetEmptyState';
import { formatEventDate } from '../utils/dateFormatting';

/**
 * EventCard - Internal component to display individual event
 */
const EventCard = ({ event, participationStatus, onViewDetails, t }) => {
  const getParticipationIcon = (status) => {
    switch (status) {
      case 'attending': return <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />;
      case 'declined': return <CancelIcon fontSize="small" sx={{ color: 'error.main' }} />;
      case 'maybe': return <HelpIcon fontSize="small" sx={{ color: 'warning.main' }} />;
      default: return null;
    }
  };

  return (
    <Paper
      variant="outlined"
      onClick={onViewDetails}
      sx={{
        p: 1,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        minHeight: 80,
        flexWrap: 'wrap',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)',
          borderColor: 'primary.main'
        }
      }}
    >
      <Box sx={{
        width: 120, height: 80,
        bgcolor: event.cover_image_url ? 'transparent' : 'primary.light',
        borderRadius: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: 'white', overflow: 'hidden', flexShrink: 0
      }}>
        {event.cover_image_url ? (
          <img src={event.cover_image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            <Typography variant="body2" fontWeight="bold" sx={{ lineHeight: 1 }}>
              {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
            </Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ lineHeight: 1 }}>
              {new Date(event.date).getDate()}
            </Typography>
          </>
        )}
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap sx={{ mb: 0.5 }}>{event.title}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
            <EventIcon fontSize="inherit" sx={{ mr: 0.5 }} />
            {formatEventDate(event.date)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
            <LocationOnIcon fontSize="inherit" sx={{ mr: 0.5 }} />
            {event.location}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {participationStatus ? (
            <>
              {getParticipationIcon(participationStatus)}
              <Typography variant="caption" color="text.secondary">
                {t(`dashboard.events.participation.${participationStatus === 'declined' ? 'notAttending' : participationStatus}`)}
              </Typography>
            </>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {t('dashboard.events.participation.noResponse')}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

/**
 * UpcomingEventsWidget - Displays upcoming events in a consistent widget format
 * @param {Object} props
 * @param {Array} props.events - Array of event objects
 * @param {boolean} props.loading - Loading state
 * @param {Object} props.eventParticipation - Map of event IDs to participation status
 * @param {Function} props.onViewDetails - Callback when event details are clicked
 * @param {Function} props.onCreateEvent - Callback when create event is clicked (admin only)
 * @param {boolean} props.isAdmin - Whether the user is an admin
 * @param {boolean} props.darkMode - Dark mode flag
 * @param {Object} props.wrapperRef - Ref for the wrapper box (optional)
 */
const UpcomingEventsWidget = ({
  events = [],
  loading = false,
  eventParticipation = {},
  onViewDetails,
  onCreateEvent,
  isAdmin = false,
  darkMode = false,
  wrapperRef
}) => {
  const { t } = useTranslation();
  const hasEvents = events.length > 0;

  if (loading) {
    return <WidgetSkeleton showHeader={true} contentLines={3} showImage={true} />;
  }

  if (!hasEvents) {
    return (
      <Box
        ref={wrapperRef}
        sx={{
          width: '100%',
          height: '100%',
          minHeight: 400,
          maxHeight: 600,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: darkMode ? 'grey.900' : 'background.paper',
          borderRadius: 2,
          boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}
      >
        <WidgetHeader
          icon={<EventIcon color="primary" />}
          title={t('dashboard.network.upcomingEvents')}
          action={
            isAdmin && (
              <Button
                variant="contained"
                size="small"
                onClick={onCreateEvent}
                startIcon={<AddIcon />}
              >
                {t('dashboard.buttons.createEvent')}
              </Button>
            )
          }
        />

        <Box sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WidgetEmptyState
            emptyIcon={<EventIcon />}
            emptyMessage={t('dashboard.events.noUpcoming')}
            emptySubMessage={isAdmin ? t('dashboard.buttons.createEvent') : t('dashboard.widgets.checkBackLater')}
            action={
              isAdmin && (
                <Button
                  variant="outlined"
                  component={Link}
                  to="/admin?tab=events"
                  startIcon={<AddIcon />}
                  size="small"
                >
                  {t('dashboard.buttons.createEvent')}
                </Button>
              )
            }
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      ref={wrapperRef}
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 400,
        maxHeight: 600,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: darkMode ? 'grey.900' : 'background.paper',
        borderRadius: 2,
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}
    >
      <WidgetHeader
        icon={<EventIcon color="primary" />}
        title={t('dashboard.network.upcomingEvents')}
        viewAllLink="/network?tab=events"
        viewAllText={t('dashboard.buttons.viewAll')}
        action={
          isAdmin && (
            <Button
              variant="contained"
              size="small"
              onClick={onCreateEvent}
              startIcon={<AddIcon />}
            >
              {t('dashboard.buttons.createEvent')}
            </Button>
          )
        }
      />
      <Box sx={{
        flex: 1,
        p: 2,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        <Stack spacing={1}>
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              participationStatus={eventParticipation[event.id]}
              onViewDetails={() => onViewDetails(event)}
              t={t}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default UpcomingEventsWidget;
