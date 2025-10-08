// File: src/components/admin/UsersModerationTab.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Divider,
  Stack,
  Tooltip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useTheme as useMuiTheme
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  HourglassEmpty as PendingIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useTranslation } from '../../hooks/useTranslation';
import Spinner from '../Spinner';
import { supabase } from '../../supabaseclient';

const STATUS_OPTIONS = {
  pending: { label: 'En attente', color: 'warning', icon: <PendingIcon /> },
  approved: { label: 'Admis', color: 'success', icon: <ApproveIcon /> },
  rejected: { label: 'Refusé', color: 'error', icon: <RejectIcon /> }
};

function UsersModerationTab({ networkId, members, onMembersChange, darkMode }) {
  const muiTheme = useMuiTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [motivationDialogOpen, setMotivationDialogOpen] = useState(false);

  // Transform members data to match our UI needs and sort by created_at (latest first)
  const users = members
    .map(member => ({
      id: member.id,
      email: member.contact_email,
      name: member.full_name,
      status: member.moderation_status || 'approved', // Default to approved if no moderation_status
      requestDate: member.created_at,
      motivation: member.presentation || ''
    }))
    .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

  // Filter users based on status and search query
  useEffect(() => {
    let filtered = users;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Filter by search query (email or name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(query) ||
        user.name.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [users, statusFilter, searchQuery]);

  const handleApprove = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: 'approving' }));
    try {
      // Update the profile's moderation_status to 'approved'
      const { error } = await supabase
        .from('profiles')
        .update({ moderation_status: 'approved' })
        .eq('id', userId);

      if (error) throw error;

      setSuccessMessage('Utilisateur approuvé avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Refresh members list to update the UI
      if (onMembersChange) {
        onMembersChange();
      }
    } catch (error) {
      console.error('Error approving user:', error);
      setErrorMessage('Erreur lors de l\'approbation');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };

  const handleReject = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: 'rejecting' }));
    try {
      // Update the profile's moderation_status to 'rejected'
      const { error } = await supabase
        .from('profiles')
        .update({ moderation_status: 'rejected' })
        .eq('id', userId);

      if (error) throw error;

      setSuccessMessage('Utilisateur rejeté');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Refresh members list to update the UI
      if (onMembersChange) {
        onMembersChange();
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      setErrorMessage('Erreur lors du rejet');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Refresh members list from parent component
      if (onMembersChange) {
        await onMembersChange();
      }
    } catch (error) {
      setErrorMessage('Erreur lors du rafraîchissement');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOpenMotivation = (user) => {
    setSelectedUser(user);
    setMotivationDialogOpen(true);
  };

  const handleCloseMotivation = () => {
    setSelectedUser(null);
    setMotivationDialogOpen(false);
  };

  const getStatusChip = (status) => {
    const statusInfo = STATUS_OPTIONS[status];
    return (
      <Chip
        label={statusInfo.label}
        color={statusInfo.color}
        size="small"
        icon={statusInfo.icon}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spinner size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with filters */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          bgcolor: muiTheme.palette.background.paper,
          border: `1px solid ${muiTheme.palette.custom.border}`
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Typography variant="h6" sx={{ color: muiTheme.palette.custom.lightText }}>
            Modération des Utilisateurs
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            variant="outlined"
            size="small"
          >
            Actualiser
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                label="Statut"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="pending">En attente</MenuItem>
                <MenuItem value="approved">Admis</MenuItem>
                <MenuItem value="rejected">Refusé</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={8}>
            <TextField
              fullWidth
              size="small"
              placeholder="Rechercher par email ou nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
        </Grid>

        {/* Stats */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`En attente: ${users.filter(u => u.status === 'pending').length}`}
            color="warning"
            variant="outlined"
          />
          <Chip
            label={`Admis: ${users.filter(u => u.status === 'approved').length}`}
            color="success"
            variant="outlined"
          />
          <Chip
            label={`Refusés: ${users.filter(u => u.status === 'rejected').length}`}
            color="error"
            variant="outlined"
          />
        </Box>
      </Paper>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: muiTheme.palette.background.paper,
            border: `1px solid ${muiTheme.palette.custom.border}`
          }}
        >
          <Typography color="text.secondary">
            Aucun utilisateur trouvé
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: `1px solid ${muiTheme.palette.custom.border}`,
            bgcolor: muiTheme.palette.background.paper
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date de demande</TableCell>
                <TableCell>Motivation</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2">{user.email}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2">{user.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{getStatusChip(user.status)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <DateIcon fontSize="small" color="action" />
                      <Typography variant="body2">{formatDate(user.requestDate)}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: user.motivation ? 'pointer' : 'default',
                          '&:hover': user.motivation ? { textDecoration: 'underline' } : {}
                        }}
                        onClick={() => user.motivation && handleOpenMotivation(user)}
                      >
                        {user.motivation || '-'}
                      </Typography>
                      {user.motivation && (
                        <IconButton
                          size="small"
                          onClick={() => handleOpenMotivation(user)}
                          sx={{ padding: 0.5 }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {user.status === 'pending' && (
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<ApproveIcon />}
                          onClick={() => handleApprove(user.id)}
                          disabled={!!actionLoading[user.id]}
                        >
                          {actionLoading[user.id] === 'approving' ? 'En cours...' : 'Admettre'}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<RejectIcon />}
                          onClick={() => handleReject(user.id)}
                          disabled={!!actionLoading[user.id]}
                        >
                          {actionLoading[user.id] === 'rejecting' ? 'En cours...' : 'Refuser'}
                        </Button>
                      </Stack>
                    )}
                    {user.status === 'approved' && (
                      <Chip
                        label="Approuvé"
                        color="success"
                        size="small"
                        icon={<CheckCircleIcon />}
                      />
                    )}
                    {user.status === 'rejected' && (
                      <Chip
                        label="Rejeté"
                        color="error"
                        size="small"
                        icon={<CancelIcon />}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Motivation Dialog */}
      <Dialog
        open={motivationDialogOpen}
        onClose={handleCloseMotivation}
        maxWidth="sm"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle sx={{ pr: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Détails de la demande</Typography>
                <IconButton
                  onClick={handleCloseMotivation}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Candidat
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedUser.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedUser.email}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Date de demande
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedUser.requestDate)}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Statut actuel
                </Typography>
                {getStatusChip(selectedUser.status)}
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Présentation / Motivation
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedUser.motivation || 'Aucune présentation fournie'}
                  </Typography>
                </Paper>
              </Box>
            </DialogContent>
            {selectedUser.status === 'pending' && (
              <DialogActions sx={{ p: 2 }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={() => {
                    handleReject(selectedUser.id);
                    handleCloseMotivation();
                  }}
                  disabled={!!actionLoading[selectedUser.id]}
                >
                  {actionLoading[selectedUser.id] === 'rejecting' ? 'En cours...' : 'Refuser'}
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<ApproveIcon />}
                  onClick={() => {
                    handleApprove(selectedUser.id);
                    handleCloseMotivation();
                  }}
                  disabled={!!actionLoading[selectedUser.id]}
                >
                  {actionLoading[selectedUser.id] === 'approving' ? 'En cours...' : 'Admettre'}
                </Button>
              </DialogActions>
            )}
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default UsersModerationTab;
