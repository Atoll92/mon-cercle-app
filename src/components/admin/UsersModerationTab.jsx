// File: src/components/admin/UsersModerationTab.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Divider,
  Card,
  CardContent,
  CardActions,
  Stack,
  Tooltip,
  Grid,
  Avatar,
  useTheme as useMuiTheme
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  PendingActions as PendingIcon
} from '@mui/icons-material';
import { fetchSubscriptionRequests, approveSubscription, rejectSubscription } from '../../api/sympaSync';
import Spinner from '../Spinner';

const STATUS_FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvées' },
  { value: 'rejected', label: 'Rejetées' },
  { value: 'synced', label: 'Synchronisées' }
];

function UsersModerationTab({ networkId, darkMode }) {
  const muiTheme = useMuiTheme();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState({});

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSubscriptionRequests(networkId, filter === 'all' ? null : filter);
      setSubscriptions(data || []);
    } catch (err) {
      console.error('Error loading subscription requests:', err);
      setError('Erreur lors du chargement des demandes d\'inscription');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (networkId) {
      loadSubscriptions();
    }
  }, [networkId, filter]);

  const handleApprove = async (subscriptionId, email) => {
    try {
      setProcessing(prev => ({ ...prev, [subscriptionId]: true }));
      setError(null);

      await approveSubscription(subscriptionId, email);

      setSuccessMessage(`Demande d'inscription approuvée pour ${email}`);
      setTimeout(() => setSuccessMessage(''), 3000);

      // Reload subscriptions
      await loadSubscriptions();
    } catch (err) {
      console.error('Error approving subscription:', err);
      setError('Erreur lors de l\'approbation de la demande: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setProcessing(prev => ({ ...prev, [subscriptionId]: false }));
    }
  };

  const handleReject = async (subscriptionId, profileId) => {
    try {
      setProcessing(prev => ({ ...prev, [subscriptionId]: true }));
      setError(null);

      await rejectSubscription(subscriptionId, profileId);

      setSuccessMessage('Demande d\'inscription rejetée');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Reload subscriptions
      await loadSubscriptions();
    } catch (err) {
      console.error('Error rejecting subscription:', err);
      setError('Erreur lors du rejet de la demande: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setProcessing(prev => ({ ...prev, [subscriptionId]: false }));
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = !searchQuery ||
      sub.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'synced': return 'info';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Approuvée';
      case 'synced': return 'Synchronisée';
      case 'rejected': return 'Rejetée';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  if (loading && subscriptions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Spinner size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with filters */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Rechercher par email ou nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 250 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              label="Statut"
            >
              {STATUS_FILTERS.map(status => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tooltip title="Actualiser">
            <IconButton onClick={loadSubscriptions} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Stats */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Chip
            label={`Total: ${subscriptions.length}`}
            variant="outlined"
          />
          <Chip
            label={`En attente: ${subscriptions.filter(s => s.status === 'pending').length}`}
            color="warning"
            variant="outlined"
          />
          <Chip
            label={`Approuvées: ${subscriptions.filter(s => s.status === 'approved' || s.status === 'synced').length}`}
            color="success"
            variant="outlined"
          />
          <Chip
            label={`Rejetées: ${subscriptions.filter(s => s.status === 'rejected').length}`}
            color="error"
            variant="outlined"
          />
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Subscriptions List */}
      {filteredSubscriptions.length === 0 ? (
        <Paper
          sx={{
            p: 8,
            textAlign: 'center',
            bgcolor: muiTheme.palette.background.paper,
            border: `1px solid ${muiTheme.palette.custom.border}`
          }}
        >
          <PendingIcon sx={{ fontSize: 80, color: muiTheme.palette.grey[400], mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {searchQuery
              ? 'Aucune demande ne correspond aux filtres'
              : filter === 'pending'
              ? 'Aucune demande en attente'
              : 'Aucune demande d\'inscription'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredSubscriptions.map((subscription) => (
            <Grid item xs={12} md={6} key={subscription.id}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${muiTheme.palette.custom.border}`,
                  bgcolor: muiTheme.palette.background.paper,
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)'
                  }
                }}
              >
                <CardContent>
                  {/* Header with status */}
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Chip
                      label={getStatusLabel(subscription.status)}
                      color={getStatusColor(subscription.status)}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      <DateIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                      {new Date(subscription.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Stack>

                  {/* User info */}
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Avatar
                      src={subscription.profiles?.profile_picture_url}
                      sx={{ width: 56, height: 56 }}
                    >
                      {subscription.profiles?.full_name?.charAt(0) || subscription.email.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      {subscription.profiles?.full_name && (
                        <Typography variant="h6" sx={{ mb: 0.5 }}>
                          {subscription.profiles.full_name}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <EmailIcon sx={{ fontSize: 16, mr: 1, color: muiTheme.palette.text.secondary }} />
                        <Typography variant="body2" color="text.secondary">
                          {subscription.email}
                        </Typography>
                      </Box>
                      {subscription.profiles?.created_at && (
                        <Typography variant="caption" color="text.secondary">
                          Membre depuis le {new Date(subscription.profiles.created_at).toLocaleDateString('fr-FR')}
                        </Typography>
                      )}
                    </Box>
                  </Stack>

                  {/* Motivation */}
                  {subscription.motivation && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: muiTheme.palette.action.hover, borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                        Motivation:
                      </Typography>
                      <Typography variant="body2">
                        {subscription.motivation}
                      </Typography>
                    </Box>
                  )}

                  {/* Categories */}
                  {subscription.categories && subscription.categories.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Catégories sélectionnées:
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {subscription.categories.map(cat => (
                          <Chip key={cat} label={cat} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {subscription.synced_at && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Synchronisée le {new Date(subscription.synced_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  )}
                </CardContent>

                {subscription.status === 'pending' && (
                  <>
                    <Divider />
                    <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<ApproveIcon />}
                        onClick={() => handleApprove(subscription.id, subscription.email)}
                        disabled={processing[subscription.id]}
                        size="small"
                      >
                        Approuver
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<RejectIcon />}
                        onClick={() => handleReject(subscription.id, subscription.profile_id)}
                        disabled={processing[subscription.id]}
                        size="small"
                      >
                        Rejeter
                      </Button>
                    </CardActions>
                  </>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default UsersModerationTab;
