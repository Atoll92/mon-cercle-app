// File: src/components/admin/AnnoncesModerationTab.jsx
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
  Tabs,
  Tab,
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
  CheckCircleOutline as SyncedIcon
} from '@mui/icons-material';
import { useTranslation } from '../../hooks/useTranslation';
import { fetchAnnonces, moderateAnnonceWithSympa } from '../../api/annonces';
import Spinner from '../Spinner';
import UserContent from '../UserContent';

// RezoProSpec uses 3 categories: general, logement, ateliers
const CATEGORIES = [
  { value: 'general', label: 'Général', color: '#00bcd4' },
  { value: 'logement', label: 'Logement', color: '#2196f3' },
  { value: 'ateliers', label: 'Ateliers', color: '#9c27b0' }
];

function AnnoncesModerationTab({ networkId, darkMode }) {
  const { t } = useTranslation();
  const muiTheme = useMuiTheme();
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0=Pending, 1=Batch Today, 2=All
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [moderating, setModerating] = useState({});

  const loadAnnonces = async () => {
    try {
      setLoading(true);
      setError(null);

      // Tab 0: Pending messages
      // Tab 1: Batch today (approved + rejected from today)
      // Tab 2: Recent (all messages from last 7 days)

      if (activeTab === 1) {
        // Batch today: Show moderated messages from today
        const data = await fetchAnnonces(networkId, null);
        console.log('📦 Batch view - All messages:', data);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.log('📦 Today start:', today.toISOString());

        const todayMessages = (data || []).filter(a => {
          if (!a.moderated_at) {
            return false;
          }
          if (a.status !== 'approved' && a.status !== 'rejected') {
            return false;
          }
          const moderatedDate = new Date(a.moderated_at);
          const isToday = moderatedDate >= today;
          console.log(`📦 Message ${a.id}: status=${a.status}, moderated_at=${a.moderated_at}, isToday=${isToday}`);
          return isToday;
        });

        console.log('📦 Filtered today messages:', todayMessages.length, todayMessages);
        setAnnonces(todayMessages);
      } else if (activeTab === 2) {
        // Recent: Show all messages from last 7 days
        const data = await fetchAnnonces(networkId, null);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentMessages = (data || []).filter(a => {
          const createdDate = new Date(a.created_at);
          return createdDate >= sevenDaysAgo;
        });

        setAnnonces(recentMessages);
      } else {
        // Tab 0: Pending messages
        const data = await fetchAnnonces(networkId, 'pending');
        setAnnonces(data || []);
      }
    } catch (err) {
      console.error('Error loading annonces:', err);
      setError('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (networkId) {
      loadAnnonces();
    }
  }, [networkId, activeTab]);

  const handleModerate = async (annonceId, status, category = null) => {
    try {
      setModerating(prev => ({ ...prev, [annonceId]: true }));

      // Use the new moderateAnnonceWithSympa API that triggers Sympa sync
      const result = await moderateAnnonceWithSympa(annonceId, status, category);

      console.log('Moderation result:', result);

      // Hide the message from UI when clicking Valider or Rejeter
      // (Keep "pending" status to allow "Remettre en attente" to work normally)
      if (status === 'approved' || status === 'rejected') {
        setAnnonces(prev => prev.filter(a => a.id !== annonceId));
      } else {
        // Update local state with sync status for other status changes
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
      }

      // Show success message
      if (result?.synced) {
        setError(null);
      } else if (status === 'approved' || status === 'rejected') {
        // Don't show error for successful moderation
        setError(null);
      } else {
        setError('Modération réussie (pas de synchronisation Sympa)');
      }
    } catch (err) {
      console.error('Error moderating annonce:', err);
      setError('Erreur lors de la modération du message: ' + (err.message || 'Erreur inconnue'));
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


  if (loading && annonces.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Spinner size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          aria-label="annonces moderation tabs"
        >
          <Tab
            label="En attente"
            icon={<Chip label={annonces.filter(a => a.status === 'pending').length} size="small" color="warning" />}
            iconPosition="end"
          />
          <Tab
            label="Batch du jour (7pm)"
            icon={<Chip label={activeTab === 1 ? annonces.length : '•'} size="small" color="info" />}
            iconPosition="end"
          />
          <Tab
            label="Récents (7 jours)"
            icon={<Chip label={activeTab === 2 ? annonces.length : '•'} size="small" />}
            iconPosition="end"
          />
        </Tabs>
      </Box>

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
        <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
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

        {/* Tab-specific info banners */}
        {activeTab === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
              ⏳ Messages en attente de modération
            </Typography>
            <Typography variant="caption">
              Assignez une catégorie et validez ou rejetez chaque message.
            </Typography>
          </Alert>
        )}

        {activeTab === 1 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
              📦 Batch du jour - Envoi à 19h00 (7pm)
            </Typography>
            <Typography variant="caption">
              Affiche tous les messages approuvés et rejetés aujourd'hui. Les messages approuvés ({annonces.filter(a => a.status === 'approved').length}) seront envoyés automatiquement par Sympa à 19h00.
              {annonces.length === 0 && ' Aucun message modéré aujourd\'hui.'}
            </Typography>
          </Alert>
        )}

        {activeTab === 2 && (
          <Alert severity="default" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
              📋 Messages récents (7 derniers jours)
            </Typography>
            <Typography variant="caption">
              Historique complet des messages reçus ces 7 derniers jours.
            </Typography>
          </Alert>
        )}
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
              ? 'Aucun message ne correspond aux filtres'
              : activeTab === 0
              ? 'Aucun message en attente de modération'
              : activeTab === 1
              ? 'Aucun message modéré aujourd\'hui'
              : 'Aucun message récent'}
          </Typography>
          {activeTab === 1 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Les messages approuvés ou rejetés aujourd'hui apparaîtront ici.
              <br />
              Les messages approuvés seront envoyés automatiquement à 19h00.
            </Typography>
          )}
          {activeTab === 2 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Aucun message reçu ces 7 derniers jours.
            </Typography>
          )}
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
                      {/* Batch mode indicator */}
                      {activeTab === 1 && annonce.moderated_at && (
                        <Tooltip title={`Modérée à ${new Date(annonce.moderated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}>
                          <Chip
                            label={`${annonce.status === 'approved' ? 'Validée' : 'Rejetée'} à ${new Date(annonce.moderated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                            size="small"
                            variant="outlined"
                            color={annonce.status === 'approved' ? 'success' : 'error'}
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
                  <UserContent
                    content={annonce.subject || 'Sans sujet'}
                    maxLines={1}
                    component="h6"
                    sx={{
                      mb: 1,
                      fontWeight: 'medium',
                      fontSize: '1.25rem',
                      lineHeight: 1.6
                    }}
                  />

                  {/* Content */}
                  <UserContent
                    content={annonce.content}
                    maxLines={10}
                    component="div"
                    sx={{
                      mb: 2,
                      color: 'text.secondary',
                      fontSize: '0.875rem'
                    }}
                  />

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
