// src/pages/SuperAdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  Storage as StorageIcon,
  MonetizationOn as MoneyIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as SuspendIcon,
  CheckCircle as ActiveIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Download as ExportIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { 
  fetchAllNetworks, 
  updateNetworkStatus, 
  getNetworkAnalytics,
  exportNetworkData 
} from '../api/superAdmin';
import { PageTransition } from '../components/AnimatedComponents';
import NetworkDetailsModal from '../components/NetworkDetailsModal';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [networks, setNetworks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', network: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [detailsModal, setDetailsModal] = useState({ open: false, networkId: null });

  // Check if user is super admin
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Check if user has super admin privileges
    // You can implement this based on your auth system
    const isSuperAdmin = user.email === 'admin@conclav.com' || user.app_metadata?.role === 'super_admin';
    
    if (!isSuperAdmin) {
      setError('You do not have permission to access this page.');
      setLoading(false);
      return;
    }
    
    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to load networks data
      try {
        const networksData = await fetchAllNetworks();
        setNetworks(networksData || []);
      } catch (err) {
        console.error('Error loading networks:', err);
        setNetworks([]);
      }
      
      // Try to load analytics data
      try {
        const analyticsData = await getNetworkAnalytics();
        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Error loading analytics:', err);
        // Set default analytics data
        setAnalytics({
          totalNetworks: 0,
          totalUsers: 0,
          activeSubscriptions: 0,
          totalStorageGB: 0,
          newNetworks: 0,
          newUsers: 0,
          growth: {
            networksGrowth: 0,
            usersGrowth: 0
          }
        });
      }
      
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load some dashboard data. You may not have the required permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleNetworkAction = async (action, networkId, data = {}) => {
    try {
      await updateNetworkStatus(networkId, action, data);
      await loadDashboardData(); // Refresh data
      setActionDialog({ open: false, type: '', network: null });
    } catch (err) {
      console.error('Error performing network action:', err);
      setError('Failed to perform action');
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportNetworkData();
      // Download CSV file
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `networks_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data');
    }
  };

  // Filter networks based on search and filters
  const filteredNetworks = networks.filter(network => {
    const matchesSearch = network.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         network.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || network.status === filterStatus;
    
    // Handle both 'free' and 'family' plan names
    let matchesPlan = false;
    if (filterPlan === 'all') {
      matchesPlan = true; // "all" should match everything
    } else if (filterPlan === 'family') {
      matchesPlan = network.subscription_plan === 'family' || network.subscription_plan === 'free' || !network.subscription_plan;
    } else {
      matchesPlan = network.subscription_plan === filterPlan;
    }
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'family': return 'default';
      case 'free': return 'default';
      case 'community': return 'primary';
      case 'organization': return 'secondary';
      case 'business': return 'info';
      default: return 'default';
    }
  };

  const getPlanDisplayName = (plan) => {
    switch (plan) {
      case 'family': return 'Family (Free)';
      case 'free': return 'Family (Free)';
      case 'community': return 'Community (€17)';
      case 'organization': return 'Organization';
      case 'business': return 'Business';
      default: return 'Family (Free)';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <PageTransition>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            Super Admin Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage all networks, users, and system analytics
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Analytics Cards */}
        {analytics && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="overline">
                        Total Networks
                      </Typography>
                      <Typography variant="h4" component="div">
                        {analytics.totalNetworks}
                      </Typography>
                    </Box>
                    <BusinessIcon color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="overline">
                        Total Users
                      </Typography>
                      <Typography variant="h4" component="div">
                        {analytics.totalUsers}
                      </Typography>
                    </Box>
                    <GroupIcon color="success" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="overline">
                        Active Subscriptions
                      </Typography>
                      <Typography variant="h4" component="div">
                        {analytics.activeSubscriptions}
                      </Typography>
                    </Box>
                    <MoneyIcon color="warning" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="overline">
                        Storage Used
                      </Typography>
                      <Typography variant="h4" component="div">
                        {analytics.totalStorageGB}GB
                      </Typography>
                    </Box>
                    <StorageIcon color="info" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search networks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Plan</InputLabel>
                  <Select
                    value={filterPlan}
                    label="Plan"
                    onChange={(e) => setFilterPlan(e.target.value)}
                  >
                    <MenuItem value="all">All Plans</MenuItem>
                    <MenuItem value="family">Family (Free)</MenuItem>
                    <MenuItem value="community">Community (€17)</MenuItem>
                    <MenuItem value="organization">Organization</MenuItem>
                    <MenuItem value="business">Business</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box display="flex" gap={1}>
                  <Button
                    startIcon={<RefreshIcon />}
                    onClick={loadDashboardData}
                    variant="outlined"
                  >
                    Refresh
                  </Button>
                  <Button
                    startIcon={<ExportIcon />}
                    onClick={handleExport}
                    variant="outlined"
                  >
                    Export
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Networks Table */}
        <Card>
          <CardHeader
            title="All Networks"
            subheader={`${filteredNetworks.length} networks found`}
          />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Network</TableCell>
                  <TableCell>Members</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Storage</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredNetworks.map((network) => (
                  <TableRow key={network.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {network.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {network.id}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Badge badgeContent={network.member_count} color="primary">
                        <GroupIcon />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPlanDisplayName(network.subscription_plan)}
                        color={getPlanColor(network.subscription_plan)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={network.status || 'Active'}
                        color={getStatusColor(network.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(network.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {network.storage_used_mb ? `${(network.storage_used_mb / 1024).toFixed(3)}GB` : '0.000GB'}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((network.storage_used_mb || 0) / (network.storage_limit_mb || 1000) * 100, 100)}
                          sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => setDetailsModal({ open: true, networkId: network.id })}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Suspend Network">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => setActionDialog({
                              open: true,
                              type: 'suspend',
                              network
                            })}
                          >
                            <SuspendIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Network">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setActionDialog({
                              open: true,
                              type: 'delete',
                              network
                            })}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Action Dialog */}
        <Dialog
          open={actionDialog.open}
          onClose={() => setActionDialog({ open: false, type: '', network: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {actionDialog.type === 'suspend' ? 'Suspend Network' : 'Delete Network'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              Are you sure you want to {actionDialog.type} the network "{actionDialog.network?.name}"?
            </Typography>
            {actionDialog.type === 'suspend' && (
              <TextField
                fullWidth
                label="Reason"
                multiline
                rows={3}
                placeholder="Enter reason for suspension..."
                sx={{ mt: 2 }}
              />
            )}
            {actionDialog.type === 'delete' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                This action cannot be undone. All network data will be permanently deleted.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActionDialog({ open: false, type: '', network: null })}>
              Cancel
            </Button>
            <Button
              color={actionDialog.type === 'delete' ? 'error' : 'warning'}
              variant="contained"
              onClick={() => handleNetworkAction(actionDialog.type, actionDialog.network?.id)}
            >
              {actionDialog.type === 'suspend' ? 'Suspend' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Network Details Modal */}
        <NetworkDetailsModal
          open={detailsModal.open}
          onClose={() => setDetailsModal({ open: false, networkId: null })}
          networkId={detailsModal.networkId}
        />
      </Container>
    </PageTransition>
  );
};

export default SuperAdminDashboard;