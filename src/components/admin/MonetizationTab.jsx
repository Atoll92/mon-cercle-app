import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseclient';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import Spinner from '../Spinner';
import {
  AttachMoney as MoneyIcon,
  Event as EventIcon,
  People as PeopleIcon,
  CardGiftcard as DonationIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as BankIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  Euro as EuroIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useTheme as useMuiTheme } from '@mui/material/styles';

function MonetizationTab({ networkId, network }) {
  const muiTheme = useMuiTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', severity: 'success' });
  const [monetizationSettings, setMonetizationSettings] = useState({
    enabled: network?.features_config?.monetization || false,
    currency: network?.features_config?.currency || 'EUR',
    stripeAccountId: network?.stripe_account_id || '',
    paypalEmail: ''
  });

  // Paid Events State
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventPricing, setEventPricing] = useState({});

  // Membership State
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showPlanDialog, setShowPlanDialog] = useState(false);

  // Donations State
  const [donationSettings, setDonationSettings] = useState({
    enabled: false,
    suggestedAmounts: [5, 10, 25, 50],
    customAmount: true,
    message: 'Support our community'
  });

  // Revenue Overview State
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    eventRevenue: 0,
    membershipRevenue: 0,
    donationRevenue: 0,
    pendingPayouts: 0
  });

  useEffect(() => {
    // Load monetization settings and data
    loadMonetizationData();
  }, [networkId]);

  const handleToggleMonetization = async () => {
    try {
      setLoading(true);
      const newValue = !monetizationSettings.enabled;
      
      // Update network configuration
      const { error } = await supabase
        .from('networks')
        .update({ 
          features_config: { 
            ...network?.features_config,
            monetization: newValue 
          } 
        })
        .eq('id', networkId);
        
      if (error) throw error;
      
      setMonetizationSettings({ ...monetizationSettings, enabled: newValue });
      setMessage({ 
        text: `Monetization ${newValue ? 'enabled' : 'disabled'} successfully`, 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Error toggling monetization:', error);
      setMessage({ text: 'Failed to update monetization settings', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadMonetizationData = async () => {
    setLoading(true);
    try {
      // Simulate loading data - replace with actual API calls
      // Load events
      setEvents([
        { id: 1, title: 'Annual Conference', date: '2025-03-15', price: 25, currency: 'EUR', ticketsSold: 45 },
        { id: 2, title: 'Workshop Series', date: '2025-02-20', price: 15, currency: 'EUR', ticketsSold: 20 }
      ]);

      // Load membership plans
      setMembershipPlans([
        { id: 1, name: 'Basic', price: 0, interval: 'month', features: ['Access to network', 'Basic chat'] },
        { id: 2, name: 'Premium', price: 10, interval: 'month', features: ['All Basic features', 'Priority support', 'Exclusive content'] },
        { id: 3, name: 'Pro', price: 25, interval: 'month', features: ['All Premium features', 'Admin tools', 'Analytics'] }
      ]);

      // Load revenue stats
      setRevenueStats({
        totalRevenue: 2850,
        eventRevenue: 1575,
        membershipRevenue: 1000,
        donationRevenue: 275,
        pendingPayouts: 500
      });
    } catch (error) {
      console.error('Error loading monetization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSaveEventPricing = (eventId) => {
    // Save event pricing - implement API call
    console.log('Saving event pricing:', eventId, eventPricing[eventId]);
    setEditingEvent(null);
  };

  const handleSavePlan = () => {
    // Save membership plan - implement API call
    console.log('Saving membership plan:', editingPlan);
    setShowPlanDialog(false);
    setEditingPlan(null);
  };

  const handleDeletePlan = (planId) => {
    // Delete membership plan - implement API call
    console.log('Deleting plan:', planId);
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <Box>
      {message.text && (
        <Alert severity={message.severity} sx={{ mb: 2 }} onClose={() => setMessage({ text: '', severity: 'success' })}>
          {message.text}
        </Alert>
      )}
      <Paper sx={{ p: 3, bgcolor: muiTheme.palette.background.paper }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: muiTheme.palette.custom.lightText }}>
            <MoneyIcon color="primary" />
            Monetization Settings
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={monetizationSettings.enabled}
                onChange={handleToggleMonetization}
                color="primary"
                disabled={loading}
              />
            }
            label="Enable Monetization"
          />
        </Box>

        {!monetizationSettings.enabled && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Enable monetization to start accepting payments for events, memberships, and donations. When disabled, all pricing information will be hidden from regular users.
          </Alert>
        )}

        {monetizationSettings.enabled && (
          <>
            {/* Revenue Overview Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Total Revenue
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(revenueStats.totalRevenue)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUpIcon color="success" fontSize="small" />
                      <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                        +12% this month
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Event Revenue
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(revenueStats.eventRevenue)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      65 tickets sold
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Membership Revenue
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(revenueStats.membershipRevenue)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      40 active subscribers
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Donations
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(revenueStats.donationRevenue)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      11 supporters
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab label="Paid Events" icon={<EventIcon />} iconPosition="start" />
              <Tab label="Membership Plans" icon={<PeopleIcon />} iconPosition="start" />
              <Tab label="Donations" icon={<DonationIcon />} iconPosition="start" />
              <Tab label="Payment Settings" icon={<SettingsIcon />} iconPosition="start" />
            </Tabs>

            {/* Tab Panels */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Paid Events
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Set ticket prices for your events and track sales.
                </Typography>

                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Event</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Tickets Sold</TableCell>
                        <TableCell>Revenue</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>{event.title}</TableCell>
                          <TableCell>{format(new Date(event.date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            {editingEvent === event.id ? (
                              <TextField
                                size="small"
                                value={eventPricing[event.id]?.price || event.price}
                                onChange={(e) => setEventPricing({
                                  ...eventPricing,
                                  [event.id]: { price: e.target.value }
                                })}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">€</InputAdornment>
                                }}
                                sx={{ width: 100 }}
                              />
                            ) : (
                              formatCurrency(event.price)
                            )}
                          </TableCell>
                          <TableCell>{event.ticketsSold}</TableCell>
                          <TableCell>{formatCurrency(event.price * event.ticketsSold)}</TableCell>
                          <TableCell align="right">
                            {editingEvent === event.id ? (
                              <>
                                <Button size="small" onClick={() => handleSaveEventPricing(event.id)}>
                                  Save
                                </Button>
                                <Button size="small" onClick={() => setEditingEvent(null)}>
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <IconButton size="small" onClick={() => setEditingEvent(event.id)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {activeTab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Membership Plans
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setEditingPlan({ name: '', price: 0, interval: 'month', features: [] });
                      setShowPlanDialog(true);
                    }}
                  >
                    Add Plan
                  </Button>
                </Box>
                
                <Grid container spacing={2}>
                  {membershipPlans.map((plan) => (
                    <Grid item xs={12} md={4} key={plan.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {plan.name}
                          </Typography>
                          <Typography variant="h3" gutterBottom>
                            {formatCurrency(plan.price)}
                            <Typography component="span" variant="body2" color="text.secondary">
                              /{plan.interval}
                            </Typography>
                          </Typography>
                          <List dense>
                            {plan.features.map((feature, index) => (
                              <ListItem key={index}>
                                <ListItemText primary={feature} />
                              </ListItem>
                            ))}
                          </List>
                          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => {
                                setEditingPlan(plan);
                                setShowPlanDialog(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleDeletePlan(plan.id)}
                            >
                              Delete
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Plan Dialog */}
                <Dialog open={showPlanDialog} onClose={() => setShowPlanDialog(false)} maxWidth="sm" fullWidth>
                  <DialogTitle>
                    {editingPlan?.id ? 'Edit Membership Plan' : 'Create Membership Plan'}
                  </DialogTitle>
                  <DialogContent>
                    <TextField
                      fullWidth
                      label="Plan Name"
                      value={editingPlan?.name || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Price"
                      type="number"
                      value={editingPlan?.price || 0}
                      onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">€</InputAdornment>
                      }}
                      margin="normal"
                    />
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Billing Interval</InputLabel>
                      <Select
                        value={editingPlan?.interval || 'month'}
                        onChange={(e) => setEditingPlan({ ...editingPlan, interval: e.target.value })}
                      >
                        <MenuItem value="month">Monthly</MenuItem>
                        <MenuItem value="year">Yearly</MenuItem>
                      </Select>
                    </FormControl>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setShowPlanDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSavePlan}>Save</Button>
                  </DialogActions>
                </Dialog>
              </Box>
            )}

            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Donation Settings
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={donationSettings.enabled}
                      onChange={(e) => setDonationSettings({ ...donationSettings, enabled: e.target.checked })}
                    />
                  }
                  label="Enable Donations"
                  sx={{ mb: 3 }}
                />

                {donationSettings.enabled && (
                  <>
                    <TextField
                      fullWidth
                      label="Donation Message"
                      value={donationSettings.message}
                      onChange={(e) => setDonationSettings({ ...donationSettings, message: e.target.value })}
                      multiline
                      rows={2}
                      sx={{ mb: 3 }}
                    />

                    <Typography variant="subtitle1" gutterBottom>
                      Suggested Amounts
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                      {donationSettings.suggestedAmounts.map((amount, index) => (
                        <Chip
                          key={index}
                          label={formatCurrency(amount)}
                          onDelete={() => {
                            const newAmounts = [...donationSettings.suggestedAmounts];
                            newAmounts.splice(index, 1);
                            setDonationSettings({ ...donationSettings, suggestedAmounts: newAmounts });
                          }}
                        />
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          const newAmount = prompt('Enter amount:');
                          if (newAmount) {
                            setDonationSettings({
                              ...donationSettings,
                              suggestedAmounts: [...donationSettings.suggestedAmounts, parseFloat(newAmount)]
                            });
                          }
                        }}
                      >
                        Add Amount
                      </Button>
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={donationSettings.customAmount}
                          onChange={(e) => setDonationSettings({ ...donationSettings, customAmount: e.target.checked })}
                        />
                      }
                      label="Allow Custom Amounts"
                    />
                  </>
                )}
              </Box>
            )}

            {activeTab === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Payment Settings
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PaymentIcon />
                          Stripe Integration
                        </Typography>
                        <TextField
                          fullWidth
                          label="Stripe Account ID"
                          value={monetizationSettings.stripeAccountId}
                          onChange={(e) => setMonetizationSettings({ ...monetizationSettings, stripeAccountId: e.target.value })}
                          placeholder="acct_xxxxxxxxxxxxx"
                          margin="normal"
                        />
                        <Button variant="outlined" sx={{ mt: 2 }}>
                          Connect Stripe Account
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BankIcon />
                          Bank Account
                        </Typography>
                        <Alert severity="info" sx={{ mt: 2 }}>
                          Connect your Stripe account to manage bank transfers and payouts.
                        </Alert>
                        <Typography variant="body2" sx={{ mt: 2 }}>
                          Pending Payout: <strong>{formatCurrency(revenueStats.pendingPayouts)}</strong>
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Currency Settings
                        </Typography>
                        <FormControl sx={{ mt: 2, minWidth: 200 }}>
                          <InputLabel>Default Currency</InputLabel>
                          <Select
                            value={monetizationSettings.currency}
                            onChange={(e) => setMonetizationSettings({ ...monetizationSettings, currency: e.target.value })}
                          >
                            <MenuItem value="EUR">EUR (€)</MenuItem>
                            <MenuItem value="USD">USD ($)</MenuItem>
                            <MenuItem value="GBP">GBP (£)</MenuItem>
                          </Select>
                        </FormControl>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}

export default MonetizationTab;