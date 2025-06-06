import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { fetchNetworkDetails } from '../api/networks';
import { createCheckoutSession } from '../services/stripeService';
import { PRICE_IDS } from '../stripe/config';
import { 
  cancelSubscription, 
  reactivateSubscription, 
  getCustomerPortalUrl, 
  loadRealInvoices 
} from '../services/subscriptionService';

// UI Components
import {
  Box,
  Container,
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
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha
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
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowUpward as ArrowUpwardIcon,
  Cancel as CancelIcon,
  ArrowForward as ArrowForwardIcon,
  Business as BusinessIcon,
  Groups as GroupsIcon,
  Storage as StorageIcon,
  WorkspacePremium as PremiumIcon,
  School as SchoolIcon,
  WebAsset as WebAssetIcon
} from '@mui/icons-material';

// Subscription Plans Data
const planDetails = {
  community: {
    name: 'Community',
    price: 17,
    description: 'Perfect for small communities',
    icon: <GroupsIcon color="primary" />,
    color: 'primary',
    members: '100',
    storage: '10GB',
    admins: '2'
  },
  nonprofit: {
    name: 'Non-Profit',
    price: 49,
    description: 'For educational and non-profit organizations',
    icon: <SchoolIcon color="success" />,
    color: 'success',
    members: '500',
    storage: '50GB',
    admins: '3'
  },
  organization: {
    name: 'Organization',
    price: 97,
    description: 'For growing organizations and associations',
    icon: <BusinessIcon color="primary" />,
    color: 'primary', 
    members: '500',
    storage: '100GB',
    admins: '5'
  },
  network: {
    name: 'Network',
    price: 247,
    description: 'For large networks and professional organizations',
    icon: <PremiumIcon color="secondary" />,
    color: 'secondary',
    members: '2,500',
    storage: '1TB',
    admins: '10'
  },
  business: {
    name: 'Business',
    price: 497,
    description: 'For enterprises with advanced needs and SLAs',
    icon: <BusinessIcon color="info" />,
    color: 'info',
    members: '10,000',
    storage: '5TB',
    admins: '20'
  }
};

const BillingPage = () => {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State
  const [loading, setLoading] = useState(true);
  const [networkDetails, setNetworkDetails] = useState(null);
  const [profile, setProfile] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState(null);
  const [annual, setAnnual] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  
  // Calculate discounted annual prices (10 months for price of 12)
  const getAnnualPrice = (monthlyPrice) => {
    if (typeof monthlyPrice === 'number') {
      return Math.round((monthlyPrice * 10) / 12);
    }
    return monthlyPrice;
  };
  
  // Calculate annual savings in euros
  const getAnnualSavings = (monthlyPrice) => {
    if (typeof monthlyPrice === 'number') {
      return Math.round(monthlyPrice * 12 - monthlyPrice * 10);
    }
    return 0;
  };

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
  const handleUpgradeSubscription = async () => {
    if (!selectedUpgradePlan || !profile?.network_id) return;
    
    try {
      setRedirecting(true);
      
      // Get the price ID for the selected plan
      const planKey = selectedUpgradePlan.toLowerCase();
      const priceId = annual ? 
        `price_${planKey}_annual` : // Replace with your actual annual price IDs
        PRICE_IDS[planKey];
      
      if (!priceId) {
        throw new Error("Invalid price ID for selected plan");
      }
      
      // Redirect to checkout
      await createCheckoutSession(priceId, profile.network_id);
      
      setUpgradeDialogOpen(false);
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
  
  // Handle annual toggle
  const handleToggleAnnual = () => {
    setAnnual(!annual);
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
      <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} sx={{ mb: 4 }} />
          <Typography variant="h5">Loading subscription information...</Typography>
        </Box>
      </Container>
    );
  }

  // Show error if one occurred
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')}
            startIcon={<ArrowForwardIcon />}
          >
            Return to Dashboard
          </Button>
        </Box>
      </Container>
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
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
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
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h5" align="center">
            Redirecting to payment service...
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            Please wait while we connect to our secure payment provider.
          </Typography>
        </Box>
      )}
      
      {/* Header */}
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          mb: 4
        }}
      >
        <Box 
          sx={{ 
            p: 3, 
            background: 'linear-gradient(120deg, #2196f3, #3f51b5)', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AttachMoneyIcon sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant="h4" component="h1" fontWeight="500">
              Subscription Management
            </Typography>
          </Box>
          
          <Button 
            variant="contained" 
            color="inherit" 
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            disabled={refreshing}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.15)', 
              '&:hover': { 
                bgcolor: 'rgba(255,255,255,0.25)'
              },
              color: 'white'
            }}
          >
            {refreshing ? <CircularProgress size={24} color="inherit" /> : 'Refresh'}
          </Button>
        </Box>
      </Paper>

      {/* Current Subscription Details */}
      <Grid container spacing={4}>
        <Grid item xs={12} lg={7}>
          <Card 
            sx={{ 
              borderRadius: 2, 
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              height: '100%'
            }}
          >
            <CardHeader
              title="Current Plan"
              titleTypographyProps={{ variant: 'h5' }}
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
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                mb: 3
              }}>
                <Box sx={{ mr: 2, mt: 1 }}>
                  {currentPlan.icon}
                </Box>
                
                <Box>
                  <Typography variant="h5" color={`${currentPlan.color}.main`} gutterBottom>
                    {currentPlan.name} Plan
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
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
                    bgcolor: 'rgba(33, 150, 243, 0.05)',
                    borderRadius: 2
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                      <GroupsIcon color="primary" />
                    </Box>
                    <Typography variant="h6" color="primary.main" gutterBottom>
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
                    bgcolor: 'rgba(76, 175, 80, 0.05)',
                    borderRadius: 2
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                      <StorageIcon color="success" />
                    </Box>
                    <Typography variant="h6" color="success.main" gutterBottom>
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
                    bgcolor: 'rgba(156, 39, 176, 0.05)',
                    borderRadius: 2
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                      <BusinessIcon color="secondary" />
                    </Box>
                    <Typography variant="h6" color="secondary.main" gutterBottom>
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
                    Manage Payment Methods
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
                <>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    startIcon={<RefreshIcon />}
                    onClick={handleReactivateSubscription}
                  >
                    Reactivate Subscription
                  </Button>
                  
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<ArrowUpwardIcon />}
                    onClick={() => setUpgradeDialogOpen(true)}
                    disabled={upgradePlans.length === 0}
                  >
                    Change Plan
                  </Button>
                </>
              )}
              
              {/* Actions for subscriptions */}
              {(!networkDetails?.subscription_status) && (
                <Button 
                  variant="contained" 
                  color="primary"
                  startIcon={<ArrowUpwardIcon />}
                  onClick={() => setUpgradeDialogOpen(true)}
                  disabled={upgradePlans.length === 0}
                >
                  Upgrade Plan
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
          <Card 
            sx={{ 
              borderRadius: 2, 
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <CardHeader
              title="Payment History"
              titleTypographyProps={{ variant: 'h5' }}
              avatar={<ReceiptIcon color="primary" />}
            />
            
            <Divider />
            
            <CardContent sx={{ flexGrow: 1 }}>
              {loadingPaymentHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : paymentHistory.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Receipt</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentHistory.map((invoice) => (
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
                          <TableCell>
                            {invoice.pdf ? (
                              <Button
                                href={invoice.pdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="small"
                                startIcon={<ReceiptIcon />}
                              >
                                View
                              </Button>
                            ) : (
                              <Button
                                disabled
                                size="small"
                                startIcon={<ReceiptIcon />}
                              >
                                N/A
                              </Button>
                            )}
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
                  
                  {(!networkDetails?.subscription_status) && (
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<ArrowUpwardIcon />}
                      onClick={() => setUpgradeDialogOpen(true)}
                      sx={{ mt: 2 }}
                    >
                      Upgrade to Premium
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
            
            {paymentHistory.length > 0 && networkDetails?.stripe_customer_id && (
              <>
                <Divider />
                <CardActions sx={{ p: 2 }}>
                  <Button 
                    startIcon={<WebAssetIcon />}
                    onClick={handleOpenStripePortal}
                  >
                    View All in Stripe Portal
                  </Button>
                </CardActions>
              </>
            )}
          </Card>
        </Grid>
      </Grid>
      
      {/* Upgrade Options Section */}
      {(networkDetails?.subscription_status === 'canceled' || 
        !networkDetails?.subscription_status) && upgradePlans.length > 0 && (
        <Card 
          sx={{ 
            borderRadius: 2, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            mt: 4
          }}
        >
          <CardHeader
            title="Available Upgrades"
            titleTypographyProps={{ variant: 'h5' }}
            avatar={<ArrowUpwardIcon color="primary" />}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: !annual ? 600 : 400,
                    color: !annual ? 'primary.main' : 'text.secondary',
                    mr: 1
                  }}
                >
                  Monthly
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={annual}
                      onChange={handleToggleAnnual}
                      color="primary"
                    />
                  }
                  label=""
                />
                
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: annual ? 600 : 400,
                    color: annual ? 'primary.main' : 'text.secondary',
                    ml: 1
                  }}
                >
                  Annual
                </Typography>
                
                <Chip 
                  label="Save up to 17%" 
                  color="success" 
                  size="small" 
                  sx={{ ml: 1, display: annual ? 'inline-flex' : 'none' }}
                />
              </Box>
            }
          />
          
          <Divider />
          
          <CardContent>
            <Grid container spacing={3}>
              {upgradePlans.map((plan) => (
                <Grid item xs={12} sm={6} md={4} key={plan.name}>
                  <Card 
                    sx={{ 
                      borderRadius: 2,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    <CardHeader
                      title={plan.name}
                      titleTypographyProps={{ 
                        variant: 'h6', 
                        align: 'center',
                        color: `${plan.color}.main`
                      }}
                      sx={{ 
                        pb: 0,
                        bgcolor: alpha(theme.palette[plan.color].main, 0.05)
                      }}
                    />
                    
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'baseline',
                        mb: 2
                      }}>
                        <Typography variant="h4" fontWeight="bold" color={`${plan.color}.main`}>
                          €{annual ? getAnnualPrice(plan.price) : plan.price}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary" sx={{ ml: 1 }}>
                          /mo
                        </Typography>
                      </Box>
                      
                      {annual && (
                        <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
                          Save €{getAnnualSavings(plan.price)}/year
                        </Typography>
                      )}
                      
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
                        {plan.description}
                      </Typography>
                      
                      <List dense sx={{ flexGrow: 1 }}>
                        <ListItem>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <GroupsIcon color="primary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={`${plan.members} Members`}
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <StorageIcon color="primary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={`${plan.storage} Storage`}
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <BusinessIcon color="primary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={`${plan.admins} Admin accounts`}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                    
                    <CardActions>
                      <Button 
                        variant="contained" 
                        color={plan.color}
                        fullWidth
                        onClick={() => {
                          setSelectedUpgradePlan(plan.name.toLowerCase());
                          setUpgradeDialogOpen(true);
                        }}
                      >
                        Upgrade to {plan.name}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
      
      {/* FAQ Section */}
      <Card 
        sx={{ 
          borderRadius: 2, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          mt: 4
        }}
      >
        <CardHeader
          title="Frequently Asked Questions"
          titleTypographyProps={{ variant: 'h5' }}
        />
        
        <Divider />
        
        <CardContent>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">When will my subscription renew?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                Your subscription will automatically renew on {networkDetails?.subscription_end_date ? 
                  new Date(networkDetails.subscription_end_date).toLocaleDateString() : 
                  'the end of your billing cycle'}. You can cancel anytime before this date to prevent auto-renewal.
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">How do I update my payment method?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                You can update your payment method by clicking on the "Manage Payment Methods" button in your current plan section.
                This will redirect you to Stripe's secure customer portal where you can add, remove, or update your payment details.
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">What happens if I cancel my subscription?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                If you cancel your subscription, you'll still have access to all premium features until the end of your current billing period.
                After that, your plan will be downgraded to the Family plan. You can upgrade again at any time.
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Can I switch to annual billing?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                Yes! You can switch from monthly to annual billing when upgrading your plan. Annual billing gives you a significant discount - 
                equivalent to getting 12 months for the price of 10. To switch an existing subscription to annual billing, 
                you can cancel your current subscription and then select the annual option when upgrading.
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Do you offer refunds?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                We don't typically offer refunds for subscription payments, but we evaluate requests on a case-by-case basis.
                If you're experiencing issues with our service or have special circumstances, please contact our support team.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
      
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
            No, Keep My Subscription
          </Button>
          <Button 
            onClick={handleCancelSubscription} 
            color="error"
            variant="contained"
          >
            Yes, Cancel Subscription
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Upgrade Subscription Dialog */}
      <Dialog
        open={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ArrowUpwardIcon color="primary" sx={{ mr: 1 }} />
            Upgrade Subscription
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedUpgradePlan && (
            <>
              <DialogContentText paragraph>
                You're about to upgrade to the <strong>{selectedUpgradePlan}</strong> plan. This will be billed {annual ? 'annually' : 'monthly'} at the rate of <strong>€{annual ? getAnnualPrice(planDetails[selectedUpgradePlan.toLowerCase()].price) : planDetails[selectedUpgradePlan.toLowerCase()].price}/month</strong>.
              </DialogContentText>
              
              {annual && (
                <DialogContentText paragraph>
                  With annual billing, you'll save <strong>€{getAnnualSavings(planDetails[selectedUpgradePlan.toLowerCase()].price)}</strong> per year compared to monthly billing.
                </DialogContentText>
              )}
              
              <DialogContentText>
                You'll be redirected to a secure checkout page to complete your payment. Your subscription will be activated immediately upon successful payment.
              </DialogContentText>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpgradeSubscription} 
            color="primary"
            variant="contained"
            disabled={redirecting}
          >
            {redirecting ? <CircularProgress size={24} /> : 'Proceed to Checkout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BillingPage;