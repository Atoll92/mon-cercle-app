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
  Email as EmailIcon
} from '@mui/icons-material';
import { useTranslation } from '../../hooks/useTranslation';
import Spinner from '../Spinner';

const STATUS_OPTIONS = {
  pending: { label: 'En attente', color: 'warning', icon: <PendingIcon /> },
  approved: { label: 'Admis', color: 'success', icon: <ApproveIcon /> },
  rejected: { label: 'Refusé', color: 'error', icon: <RejectIcon /> }
};

// Mock data - will be replaced with real API calls later
const MOCK_USERS = [
  {
    id: '1',
    email: 'marie.dupont@example.com',
    name: 'Marie Dupont',
    status: 'pending',
    requestDate: '2025-10-05T10:30:00Z',
    motivation: 'Je suis comédienne et souhaite rejoindre le réseau pour trouver des opportunités'
  },
  {
    id: '2',
    email: 'jean.martin@example.com',
    name: 'Jean Martin',
    status: 'approved',
    requestDate: '2025-10-03T14:20:00Z',
    approvedDate: '2025-10-04T09:15:00Z',
    motivation: 'Producteur de spectacles vivants'
  },
  {
    id: '3',
    email: 'sophie.bernard@example.com',
    name: 'Sophie Bernard',
    status: 'rejected',
    requestDate: '2025-10-02T16:45:00Z',
    rejectedDate: '2025-10-03T11:30:00Z',
    motivation: 'Intéressée par le secteur du spectacle'
  },
  {
    id: '4',
    email: 'pierre.dubois@example.com',
    name: 'Pierre Dubois',
    status: 'pending',
    requestDate: '2025-10-06T08:15:00Z',
    motivation: 'Technicien son et lumière avec 10 ans d\'expérience'
  }
];

function UsersModerationTab({ networkId, darkMode }) {
  const muiTheme = useMuiTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState(MOCK_USERS);
  const [filteredUsers, setFilteredUsers] = useState(MOCK_USERS);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { ...user, status: 'approved', approvedDate: new Date().toISOString() }
          : user
      ));

      setSuccessMessage('Utilisateur approuvé avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
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
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { ...user, status: 'rejected', rejectedDate: new Date().toISOString() }
          : user
      ));

      setSuccessMessage('Utilisateur rejeté');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
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
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // For now, just use mock data
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
                    <Tooltip title={user.motivation || 'Aucune motivation fournie'}>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {user.motivation || '-'}
                      </Typography>
                    </Tooltip>
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
                      <Typography variant="caption" color="text.secondary">
                        Approuvé le {formatDate(user.approvedDate)}
                      </Typography>
                    )}
                    {user.status === 'rejected' && (
                      <Typography variant="caption" color="text.secondary">
                        Rejeté le {formatDate(user.rejectedDate)}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default UsersModerationTab;
