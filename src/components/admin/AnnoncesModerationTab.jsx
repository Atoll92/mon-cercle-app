// File: src/components/admin/AnnoncesModerationTab.jsx
import { useState, useEffect, useRef } from 'react';
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
  useTheme as useMuiTheme
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  Category as CategoryIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  CheckCircleOutline as SyncedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useTranslation } from '../../hooks/useTranslation';
import { fetchAnnonces, moderateAnnonceWithSympa } from '../../api/annonces';
import Spinner from '../Spinner';

const CATEGORIES = [
  { value: 'logement', label: 'Logement', color: '#2196f3' },
  { value: 'ateliers', label: 'Ateliers', color: '#9c27b0' },
  { value: 'cours', label: 'Cours', color: '#ff9800' },
  { value: 'materiel', label: 'Matériel', color: '#4caf50' },
  { value: 'echange', label: 'Échange', color: '#e91e63' },
  { value: 'casting', label: 'Casting', color: '#f44336' },
  { value: 'annonces', label: 'Annonces', color: '#00bcd4' },
  { value: 'dons', label: 'Dons', color: '#8bc34a' }
];

const STATUS_FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Validées' },
  { value: 'rejected', label: 'Rejetées' }
];

function AnnoncesModerationTab({ networkId, darkMode }) {
  const { t } = useTranslation();
  const muiTheme = useMuiTheme();
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [moderating, setModerating] = useState({});
  const [expandedMessages, setExpandedMessages] = useState({});
  const [truncatedMessages, setTruncatedMessages] = useState({});

  const loadAnnonces = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAnnonces(networkId, filter === 'all' ? null : filter);
      setAnnonces(data || []);
    } catch (err) {
      console.error('Error loading annonces:', err);
      setError('Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (networkId) {
      loadAnnonces();
    }
  }, [networkId, filter]);

  const handleModerate = async (annonceId, status, category = null) => {
    try {
      setModerating(prev => ({ ...prev, [annonceId]: true }));

      // Use the new moderateAnnonceWithSympa API that triggers Sympa sync
      const result = await moderateAnnonceWithSympa(annonceId, status, category);

      console.log('Moderation result:', result);

      // Update local state with sync status
      setAnnonces(prev => prev.map(a =>
        a.id === annonceId
          ? {
              ...a,
              status,
              category: category || a.category,
              moderated_at: new Date().toISOString(),
              synced_to_sympa: result?.synced || false
            }
          : a
      ));

      // Show success message
      if (result?.synced) {
        setError(null);
      } else {
        setError('Modération réussie (pas de synchronisation Sympa)');
      }
    } catch (err) {
      console.error('Error moderating annonce:', err);
      setError('Erreur lors de la modération de l\'annonce: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setModerating(prev => ({ ...prev, [annonceId]: false }));
    }
  };

  const handleCategoryChange = async (annonceId, category) => {
    try {
      await moderateAnnonceWithSympa(annonceId, null, category);
      setAnnonces(prev => prev.map(a =>
        a.id === annonceId ? { ...a, category } : a
      ));
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Erreur lors de la mise à jour de la catégorie');
    }
  };

  const filteredAnnonces = annonces.filter(annonce => {
    const matchesCategory = categoryFilter === 'all' || annonce.category === categoryFilter;
    const matchesSearch = !searchQuery ||
      annonce.sender_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      annonce.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      annonce.content?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category) => {
    return CATEGORIES.find(c => c.value === category)?.color || muiTheme.palette.grey[500];
  };

  const getCategoryLabel = (category) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Validée';
      case 'rejected': return 'Rejetée';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  const toggleMessageExpansion = (annonceId) => {
    setExpandedMessages(prev => ({
      ...prev,
      [annonceId]: !prev[annonceId]
    }));
  };

  if (loading && annonces.length === 0) {
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
            placeholder="Rechercher par email, sujet ou contenu..."
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

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Catégorie</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Catégorie"
            >
              <MenuItem value="all">Toutes</MenuItem>
              {CATEGORIES.map(cat => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tooltip title="Actualiser">
            <IconButton onClick={loadAnnonces} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Stats */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Chip
            label={`Total: ${annonces.length}`}
            variant="outlined"
          />
          <Chip
            label={`En attente: ${annonces.filter(a => a.status === 'pending').length}`}
            color="warning"
            variant="outlined"
          />
          <Chip
            label={`Validées: ${annonces.filter(a => a.status === 'approved').length}`}
            color="success"
            variant="outlined"
          />
          <Chip
            label={`Rejetées: ${annonces.filter(a => a.status === 'rejected').length}`}
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

      {/* Annonces List */}
      {filteredAnnonces.length === 0 ? (
        <Paper
          sx={{
            p: 8,
            textAlign: 'center',
            bgcolor: muiTheme.palette.background.paper,
            border: `1px solid ${muiTheme.palette.custom.border}`
          }}
        >
          <EmailIcon sx={{ fontSize: 80, color: muiTheme.palette.grey[400], mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {searchQuery || categoryFilter !== 'all'
              ? 'Aucune annonce ne correspond aux filtres'
              : filter === 'pending'
              ? 'Aucune annonce en attente de modération'
              : 'Aucune annonce'}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {filteredAnnonces.map((annonce) => (
            <Card
              key={annonce.id}
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
                  {/* Header with status and category */}
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Chip
                        label={getStatusLabel(annonce.status)}
                        color={getStatusColor(annonce.status)}
                        size="small"
                      />
                      {annonce.category && (
                        <Chip
                          label={getCategoryLabel(annonce.category)}
                          size="small"
                          sx={{
                            bgcolor: getCategoryColor(annonce.category),
                            color: 'white',
                            fontWeight: 'medium'
                          }}
                        />
                      )}
                      {/* Sympa sync status indicator */}
                      {annonce.status !== 'pending' && (
                        <Tooltip title={annonce.synced_to_sympa ? 'Synchronisé avec Sympa' : 'Non synchronisé avec Sympa'}>
                          <Chip
                            icon={annonce.synced_to_sympa ? <SyncedIcon /> : <SyncIcon />}
                            label={annonce.synced_to_sympa ? 'Sympa ✓' : 'App uniquement'}
                            size="small"
                            variant="outlined"
                            color={annonce.synced_to_sympa ? 'success' : 'default'}
                          />
                        </Tooltip>
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      <DateIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                      {new Date(annonce.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Stack>

                  {/* Sender info */}
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ fontSize: 18, mr: 1, color: muiTheme.palette.text.secondary }} />
                      <Typography variant="body2" color="text.secondary">
                        {annonce.sender_email}
                      </Typography>
                    </Box>
                    {annonce.sender_name && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ fontSize: 18, mr: 1, color: muiTheme.palette.text.secondary }} />
                        <Typography variant="body2" color="text.secondary">
                          {annonce.sender_name}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  {/* Subject */}
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 'medium' }}>
                    {annonce.subject || 'Sans sujet'}
                  </Typography>

                  {/* Content */}
                  <Box>
                    <Typography
                      ref={(el) => {
                        if (el && !expandedMessages[annonce.id]) {
                          // Check if content is actually truncated
                          const isTruncated = el.scrollHeight > el.clientHeight;
                          if (truncatedMessages[annonce.id] !== isTruncated) {
                            setTruncatedMessages(prev => ({
                              ...prev,
                              [annonce.id]: isTruncated
                            }));
                          }
                        }
                      }}
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        ...(!expandedMessages[annonce.id] && {
                          maxHeight: 120,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 5,
                          WebkitBoxOrient: 'vertical'
                        })
                      }}
                    >
                      {annonce.content}
                    </Typography>
                    {truncatedMessages[annonce.id] && !expandedMessages[annonce.id] && (
                      <Button
                        size="small"
                        onClick={() => toggleMessageExpansion(annonce.id)}
                        endIcon={<ExpandMoreIcon />}
                        sx={{ mb: 1 }}
                      >
                        Voir plus
                      </Button>
                    )}
                    {expandedMessages[annonce.id] && (
                      <Button
                        size="small"
                        onClick={() => toggleMessageExpansion(annonce.id)}
                        endIcon={<ExpandLessIcon />}
                        sx={{ mb: 1 }}
                      >
                        Voir moins
                      </Button>
                    )}
                  </Box>

                  {annonce.moderated_at && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Modérée le {new Date(annonce.moderated_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  )}
                </CardContent>

                <Divider />

                <CardActions sx={{ p: 2, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  {/* Category selector */}
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Catégorie</InputLabel>
                    <Select
                      value={annonce.category || ''}
                      onChange={(e) => handleCategoryChange(annonce.id, e.target.value)}
                      label="Catégorie"
                      disabled={moderating[annonce.id]}
                    >
                      <MenuItem value="">
                        <em>Non catégorisée</em>
                      </MenuItem>
                      {CATEGORIES.map(cat => (
                        <MenuItem key={cat.value} value={cat.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: cat.color,
                                mr: 1
                              }}
                            />
                            {cat.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Action buttons */}
                  <Stack direction="row" spacing={1}>
                    {annonce.status !== 'approved' && (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<ApproveIcon />}
                        onClick={() => handleModerate(annonce.id, 'approved', annonce.category)}
                        disabled={moderating[annonce.id]}
                        size="small"
                      >
                        Valider
                      </Button>
                    )}
                    {annonce.status !== 'rejected' && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<RejectIcon />}
                        onClick={() => handleModerate(annonce.id, 'rejected')}
                        disabled={moderating[annonce.id]}
                        size="small"
                      >
                        Rejeter
                      </Button>
                    )}
                    {annonce.status !== 'pending' && (
                      <Button
                        variant="outlined"
                        onClick={() => handleModerate(annonce.id, 'pending')}
                        disabled={moderating[annonce.id]}
                        size="small"
                      >
                        Remettre en attente
                      </Button>
                    )}
                  </Stack>
                </CardActions>
              </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default AnnoncesModerationTab;
