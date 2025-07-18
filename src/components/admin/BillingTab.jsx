import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseclient';
import { useAuth } from '../../context/authcontext';
import { fetchNetworkDetails } from '../../api/networks';
import { createCheckoutSession } from '../../services/stripeService';
import { PRICE_IDS } from '../../stripe/config';
import { 
  cancelSubscription, 
  reactivateSubscription, 
  getCustomerPortalUrl, 
  loadRealInvoices 
} from '../../services/subscriptionService';

// UI Components
import Spinner from '../Spinner';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Divider,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  alpha,
  IconButton,
  Tooltip
} from '@mui/material';

// Icons
import {
  AttachMoney as AttachMoneyIcon,
  VerifiedUser as VerifiedUserIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  Cancel as CancelIcon,
  ArrowUpward as ArrowUpwardIcon,
  Groups as GroupsIcon,
  Storage as StorageIcon,
  Business as BusinessIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

// Subscription Plans Data
const planDetails = {
  community: {
    name: 'Community',
    price: 17,
    description: 'Perfect for small communities',
    color: 'primary',
    members: '100',
    storage: '10GB',
    admins: '2'
  },
  nonprofit: {
    name: 'Non-Profit',
    price: 49,
    description: 'For educational and non-profit organizations',
    color: 'success',
    members: '500',
    storage: '50GB',
    admins: '3'
  },
  organization: {
    name: 'Organization',
    price: 97,
    description: 'For growing organizations and associations',
    color: 'primary', 
    members: '500',
    storage: '100GB',
    admins: '5'
  },
  network: {
    name: 'Network',
    price: 247,
    description: 'For large networks and professional organizations',
    color: 'secondary',
    members: '2,500',
    storage: '1TB',
    admins: '10'
  },
  business: {
    name: 'Business',
    price: 497,
    description: 'For enterprises with advanced needs and SLAs',
    color: 'info',
    members: '10,000',
    storage: '5TB',
    admins: '20'
  }
};

const BillingTab = ({ activeProfile, darkMode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State
  const [loading, setLoading] = useState(true);
  const [networkDetails, setNetworkDetails] = useState(null);
  const [profile, setProfile] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Load payment history with real data
  const loadPaymentHistory = async (networkId) => {
    try {
      setLoadingPaymentHistory(true);
      
      if (!networkId) {
        setPaymentHistory([]);
        return;
      }
      
      // Load real invoices using the subscription service
      const invoices = await loadRealInvoices(networkId);
      setPaymentHistory(invoices);
    } catch (err) {
      console.error("Error loading payment history:", err);
      // Don't set an error - this is non-critical
      setPaymentHistory([]);
    } finally {
      setLoadingPaymentHistory(false);
    }
  };

  // Load user profile and network details
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Get user profile to fetch network ID
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', activeProfile.id)
          .single();
          
        if (profileError) throw profileError;
        
        setProfile(profileData);
        
        if (!profileData.network_id) {
          setError("You don't have a network associated with your account.");
          setLoading(false);
          return;
        }
        
        // Fetch network details
        const networkData = await fetchNetworkDetails(profileData.network_id);
        if (!networkData) throw new Error("Network not found");
        
        setNetworkDetails(networkData);
        
        // Fetch real payment history
        await loadPaymentHistory(profileData.network_id);
        
      } catch (err) {
        console.error("Error loading billing data:", err);
        setError("Failed to load subscription information. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, navigate]);
  
  // Refresh network details
  const handleRefresh = async () => {
    if (!profile?.network_id) return;
    
    try {
      setRefreshing(true);
      
      const networkData = await fetchNetworkDetails(profile.network_id);
      if (networkData) {
        setNetworkDetails(networkData);
        
        // Refresh payment history
        await loadPaymentHistory(profile.network_id);
      }
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!profile?.network_id || !networkDetails?.stripe_subscription_id) return;
    
    try {
      setLoading(true);
      
      // Use the cancellation service to cancel via Stripe API
      await cancelSubscription(profile.network_id);
      
      // Refresh data to show updated status
      await handleRefresh();
      
      setCancelDialogOpen(false);
    } catch (err) {
      console.error("Error canceling subscription:", err);
      setError("Failed to cancel subscription. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle subscription reactivation
  const handleReactivateSubscription = async () => {
    if (!profile?.network_id || !networkDetails?.stripe_subscription_id) return;
    
    try {
      setLoading(true);
      
      // Use the reactivation service to reactivate via Stripe API
      await reactivateSubscription(profile.network_id);
      
      // Refresh data to show updated status
      await handleRefresh();
    } catch (err) {
      console.error("Error reactivating subscription:", err);
      setError("Failed to reactivate subscription. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle subscription upgrade
  const handleUpgradeSubscription = async (selectedPlan) => {
    if (!selectedPlan || !profile?.network_id) return;
    
    try {
      setRedirecting(true);
      
      // Get the price ID for the selected plan
      const planKey = selectedPlan.toLowerCase();
      const priceId = PRICE_IDS[planKey];
      
      if (!priceId) {
        throw new Error("Invalid price ID for selected plan");
      }
      
      // Redirect to checkout
      await createCheckoutSession(priceId, profile.network_id);
      
    } catch (err) {
      console.error("Error starting upgrade:", err);
      setError(`Failed to start upgrade process: ${err.message}`);
      setRedirecting(false);
    }
  };
  
  // Handle opening Stripe Portal
  const handleOpenStripePortal = async () => {
    if (!profile?.network_id || !networkDetails?.stripe_customer_id) return;
    
    try {
      setRedirecting(true);
      
      // Get the portal URL from the service
      const portalUrl = await getCustomerPortalUrl(profile.network_id);
      
      // Redirect to Stripe's customer portal
      window.location.href = portalUrl;
    } catch (err) {
      console.error("Error opening Stripe Portal:", err);
      setError("Failed to open payment portal. Please try again later.");
      setRedirecting(false);
    }
  };

  // Get plan info
  const getCurrentPlanInfo = () => {
    const planKey = networkDetails?.subscription_plan || 'community';
    return planDetails[planKey] || planDetails.community;
  };
  
  // Get available upgrade plans
  const getAvailableUpgradePlans = () => {
    const currentPlan = networkDetails?.subscription_plan || 'community';
    
    // Define the plan hierarchy
    const planHierarchy = ['community', 'nonprofit', 'organization', 'network', 'business'];
    
    // Find current plan position
    const currentIndex = planHierarchy.indexOf(currentPlan);
    
    // Return plans higher than current
    return planHierarchy
      .slice(currentIndex + 1)
      .map(plan => planDetails[plan]);
  };

  // Show loading state while fetching data
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <Spinner size={120} sx={{ mb: 4 }} />
        <Typography variant="h6">Loading subscription information...</Typography>
      </Box>
    );
  }

  // Show error if one occurred
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 4 }}>
        {error}
      </Alert>
    );
  }
  
  const currentPlan = getCurrentPlanInfo();
  const upgradePlans = getAvailableUpgradePlans();
  
  // Determine subscription status text and color
  let statusText = "Free Plan";
  let statusColor = "default";
  let statusIcon = <CloseIcon />;
  
  if (networkDetails) {
    switch (networkDetails.subscription_status) {
      case 'active':
        statusText = "Active";
        statusColor = "success";
        statusIcon = <CheckIcon />;
        break;
      case 'canceled':
        statusText = "Canceled";
        statusColor = "warning";
        statusIcon = <HourglassEmptyIcon />;
        break;
      case 'past_due':
        statusText = "Past Due";
        statusColor = "error";
        statusIcon = <WarningIcon />;
        break;
      case 'unpaid':
        statusText = "Unpaid";
        statusColor = "error";
        statusIcon = <WarningIcon />;
        break;
      default:
        statusText = networkDetails.subscription_status || "Free Plan";
        statusColor = "default";
        statusIcon = <CloseIcon />;
    }
  }

  return (
    <Box>
      {redirecting && (
        <Box 
          sx={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            zIndex: 9999
          }}
        >
          <Spinner size={120} sx={{ mb: 3 }} />
          <Typography variant="h5" align="center">
            Redirecting to payment service...
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            Please wait while we connect to our secure payment provider.
          </Typography>
        </Box>
      )}

      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={600}>
          Subscription & Billing
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Spinner size={48} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            onClick={() => navigate('/billing')}
          >
            Full Billing Page
          </Button>
        </Box>
      </Box>

      {/* Current Subscription Details */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Current Plan"
              titleTypographyProps={{ variant: 'h6' }}
              avatar={<VerifiedUserIcon color="primary" />}
              action={
                <Chip 
                  icon={statusIcon}
                  label={statusText}
                  color={statusColor}
                  variant={statusColor === 'default' ? 'outlined' : 'filled'}
                />
              }
            />
            
            <Divider />
            
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h5" color={`${currentPlan.color}.main`} gutterBottom>
                    {currentPlan.name} Plan
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    {currentPlan.description}
                  </Typography>
                  
                  {networkDetails?.subscription_end_date && networkDetails.subscription_status !== 'canceled' && (
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
                      Next billing date: {new Date(networkDetails.subscription_end_date).toLocaleDateString()}
                    </Typography>
                  )}
                  
                  {networkDetails?.subscription_end_date && networkDetails.subscription_status === 'canceled' && (
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}>
                      <HourglassEmptyIcon fontSize="small" sx={{ mr: 1 }} />
                      Access until: {new Date(networkDetails.subscription_end_date).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                  <Typography variant="h4" color={`${currentPlan.color}.main`} fontWeight="bold">
                    {typeof currentPlan.price === 'number' && currentPlan.price > 0 ? 
                      `€${currentPlan.price}` : 
                      'FREE'}
                  </Typography>
                  
                  {typeof currentPlan.price === 'number' && currentPlan.price > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      per month
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 2
                  }}>
                    <GroupsIcon color="primary" />
                    <Typography variant="h6" color="primary.main">
                      {currentPlan.members}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Members
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    borderRadius: 2
                  }}>
                    <StorageIcon color="success" />
                    <Typography variant="h6" color="success.main">
                      {currentPlan.storage}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Storage
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    bgcolor: alpha(theme.palette.secondary.main, 0.05),
                    borderRadius: 2
                  }}>
                    <BusinessIcon color="secondary" />
                    <Typography variant="h6" color="secondary.main">
                      {currentPlan.admins}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Admin accounts
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              {networkDetails?.subscription_status === 'active' && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  Your subscription is currently active. You can cancel anytime to stop auto-renewal.
                </Alert>
              )}
              
              {networkDetails?.subscription_status === 'canceled' && (
                <Alert severity="warning" sx={{ mt: 3 }}>
                  Your subscription has been canceled but remains active until the end of your current billing period.
                </Alert>
              )}
              
              {networkDetails?.subscription_status === 'past_due' && (
                <Alert severity="error" sx={{ mt: 3 }}>
                  Your payment is past due. Please update your payment method to avoid service interruption.
                </Alert>
              )}
            </CardContent>
            
            <Divider />
            
            <CardActions sx={{ p: 2 }}>
              {/* Actions for active subscriptions */}
              {networkDetails?.subscription_status === 'active' && (
                <>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    startIcon={<CreditCardIcon />}
                    disabled={!networkDetails?.stripe_customer_id}
                    onClick={handleOpenStripePortal}
                  >
                    Manage Payment
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    color="error"
                    startIcon={<CancelIcon />}
                    disabled={!networkDetails?.stripe_subscription_id}
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    Cancel Subscription
                  </Button>
                </>
              )}
              
              {/* Actions for canceled subscriptions */}
              {networkDetails?.subscription_status === 'canceled' && (
                <Button 
                  variant="outlined" 
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={handleReactivateSubscription}
                >
                  Reactivate Subscription
                </Button>
              )}
              
              {/* Actions for past due subscriptions */}
              {networkDetails?.subscription_status === 'past_due' && (
                <Button 
                  variant="contained" 
                  color="error"
                  startIcon={<PaymentIcon />}
                  disabled={!networkDetails?.stripe_customer_id}
                  onClick={handleOpenStripePortal}
                >
                  Update Payment Method
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={5}>
          {/* Payment History */}
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              title="Recent Payments"
              titleTypographyProps={{ variant: 'h6' }}
              avatar={<ReceiptIcon color="primary" />}
            />
            
            <Divider />
            
            <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
              {loadingPaymentHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Spinner />
                </Box>
              ) : paymentHistory.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentHistory.slice(0, 5).map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            {new Date(invoice.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>€{invoice.amount}</TableCell>
                          <TableCell>
                            <Chip 
                              label={invoice.status} 
                              color={invoice.status === 'paid' ? 'success' : 'error'} 
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No payment history found.
                  </Typography>
                </Box>
              )}
            </CardContent>
            
            {networkDetails?.stripe_customer_id && (
              <>
                <Divider />
                <CardActions sx={{ p: 2 }}>
                  <Button 
                    fullWidth
                    startIcon={<ReceiptIcon />}
                    onClick={handleOpenStripePortal}
                  >
                    View All Invoices
                  </Button>
                </CardActions>
              </>
            )}
          </Card>
        </Grid>
      </Grid>
      
      {/* Upgrade Options for non-business plans */}
      {upgradePlans.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardHeader
            title="Available Upgrades"
            titleTypographyProps={{ variant: 'h6' }}
            avatar={<ArrowUpwardIcon color="primary" />}
          />
          
          <Divider />
          
          <CardContent>
            <Grid container spacing={2}>
              {upgradePlans.map((plan) => (
                <Grid item xs={12} sm={6} md={4} key={plan.name}>
                  <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" color={`${plan.color}.main`} gutterBottom>
                        {plan.name}
                      </Typography>
                      
                      <Typography variant="h4" fontWeight="bold" color={`${plan.color}.main`}>
                        €{plan.price}
                        <Typography variant="caption" color="text.secondary">
                          /mo
                        </Typography>
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        {plan.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <GroupsIcon fontSize="small" sx={{ mr: 1 }} color="action" />
                        <Typography variant="body2">{plan.members} Members</Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <StorageIcon fontSize="small" sx={{ mr: 1 }} color="action" />
                        <Typography variant="body2">{plan.storage} Storage</Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BusinessIcon fontSize="small" sx={{ mr: 1 }} color="action" />
                        <Typography variant="body2">{plan.admins} Admins</Typography>
                      </Box>
                    </CardContent>
                    
                    <CardActions>
                      <Button 
                        variant="contained" 
                        color={plan.color}
                        fullWidth
                        onClick={() => handleUpgradeSubscription(plan.name)}
                      >
                        Upgrade
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
      
      {/* Cancel Subscription Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CancelIcon color="error" sx={{ mr: 1 }} />
            Cancel Subscription
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your subscription? You'll still have access to premium features until the end of your current billing period on <strong>{networkDetails?.subscription_end_date && new Date(networkDetails.subscription_end_date).toLocaleDateString()}</strong>. After that, your plan will be downgraded to the Family plan.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Keep My Subscription
          </Button>
          <Button 
            onClick={handleCancelSubscription} 
            color="error"
            variant="contained"
          >
            Cancel Subscription
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingTab;