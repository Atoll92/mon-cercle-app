import React, { useState  } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  CardHeader,
  Switch, 
  Divider, 
  Chip, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  useMediaQuery,
  IconButton,
  Stack,
  FormControlLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Check as CheckIcon, 
  Close as CloseIcon, 
  Info as InfoIcon,
  Groups as GroupsIcon,
  Palette as PaletteIcon,
  Storage as StorageIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  Headset as SupportIcon,
  Cloud as CloudIcon,
  Code as CodeIcon,
  Bookmark as BookmarkIcon,
  EventNote as EventIcon,
  School as SchoolIcon,
  Add as AddIcon,
  VisibilityOff as VisibilityOffIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { Business } from '@mui/icons-material';
import { Groups } from '@mui/icons-material';
import { Security } from '@mui/icons-material';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import CancelIcon from '@mui/icons-material/Cancel';
import BusinessIcon from '@mui/icons-material/Business';
import ThreeJSBackground from '../components/ThreeJSBackground';
import { createCheckoutSession } from '../services/stripeService';
import { useAuth } from '../context/authcontext';
import { PRICE_IDS, ANNUAL_PRICE_IDS } from '../stripe/config';
import { PRICE_ID } from '../stripe/config';


const PricingPage = () => {
  const [annual, setAnnual] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  // Calculate discounted annual prices (10 months for price of 12)
  const getAnnualPrice = (monthlyPrice) => {
    if (typeof monthlyPrice === 'number') {
      return Math.round((monthlyPrice * 10) / 12);
    }
    return monthlyPrice;
  };

  const navigate = useNavigate();


  const { user } = useAuth();
const [loadingPlan, setLoadingPlan] = useState(null);

const handlePlanSelect = async (plan) => {
  // If user not logged in, redirect to signup
  if (!user) {
    navigate('/signup');
    return;
  }

  // Handle free plan
  if (plan.price === 0) {
    navigate('/signup');
    return;
  }
  
  // Define price mappings for all paid plans
  const priceMappings = {
    17: PRICE_IDS.community, // Community plan €17 (was family)
    49: PRICE_IDS.nonprofit, // Non-profit plan €49
    97: 'price_1RK6qr2KqNIKpvjTZh47uSJO', // Organization plan €97 (using existing ID)
    247: PRICE_IDS.network, // Network plan €247
    497: PRICE_IDS.business, // Business plan €497
  };
  
  const priceId = priceMappings[plan.price];
  
  if (priceId && priceId !== 'price_community' && !priceId.includes('price_test')) {
    try {
      setLoadingPlan(plan.name);
      
      // Get user's network ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('network_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        alert('Could not retrieve your account information. Please try again.');
        setLoadingPlan(null);
        return;
      }
      
      if (!profile || !profile.network_id) {
        console.error('User has no network ID:', profile);
        alert('Your account is not associated with a network. Please create one first.');
        setLoadingPlan(null);
        return;
      }

      console.log('Starting checkout with:', { priceId, networkId: profile.network_id, plan: plan.name });
      await createCheckoutSession(priceId, profile.network_id);
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert(`Payment error: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingPlan(null);
    }
  } else {
    // For plans without proper price IDs configured
    alert('This plan is not yet available. Please contact support.');
  }
};
  // Calculate annual savings in euros
  const getAnnualSavings = (monthlyPrice) => {
    if (typeof monthlyPrice === 'number') {
      return Math.round(monthlyPrice * 12 - monthlyPrice * 10);
    }
    return 0;
  };

  const plans = [
    {
      name: 'Family',
      price: 0,
      description: 'For personal networks and small groups',
      features: [
        { name: 'Members', value: '20', icon: <GroupsIcon color="primary" /> },
        { name: 'Storage', value: '2GB', icon: <StorageIcon color="primary" /> },
        { name: 'Admin accounts', value: '1', icon: <AdminIcon color="primary" /> },
        { name: 'White label', value: false, icon: <PaletteIcon color="primary" /> },
        { name: 'Wiki', value: true, icon: <BookmarkIcon color="primary" /> },
        { name: 'Events', value: true, icon: <EventIcon color="primary" /> },
        { name: 'Zero tracking by design', value: true, icon: <VisibilityOffIcon color="primary" /> },
        { name: 'Support', value: 'Community', icon: <SupportIcon color="primary" /> },
        { name: 'API Access', value: false, icon: <CodeIcon color="primary" /> },
      ],
      popular: false,
      color: 'default',
      buttonVariant: 'outlined',
      buttonText: 'Get Started Free',
      icon: <Groups color="primary" sx={{ fontSize: 40 }} />,
      addOns: []
    },
    {
      name: 'Community',
      price: 17,
      description: 'For small communities and groups',
      features: [
        { name: 'Members', value: '100', icon: <GroupsIcon color="primary" /> },
        { name: 'Storage', value: '10GB', icon: <StorageIcon color="primary" /> },
        { name: 'Admin accounts', value: '2', icon: <AdminIcon color="primary" /> },
        { name: 'White label', value: false, icon: <PaletteIcon color="primary" /> },
        { name: 'Wiki', value: true, icon: <BookmarkIcon color="primary" /> },
        { name: 'Events', value: true, icon: <EventIcon color="primary" /> },
        { name: 'Zero tracking by design', value: true, icon: <VisibilityOffIcon color="primary" /> },
        { name: 'Support', value: 'Email', icon: <SupportIcon color="primary" /> },
        { name: 'API Access', value: false, icon: <CodeIcon color="primary" /> },
      ],
      popular: false,
      color: 'default',
      buttonVariant: 'outlined',
      buttonText: 'Start 14-Day Trial',
      icon: <Groups color="primary" sx={{ fontSize: 40 }} />,
      badge: 'POPULAR',
      addOns: [
        { name: 'White Label', price: 99 }
      ]
    },
    {
      name: 'Non-Profit',
      price: 49,
      description: 'For educational and non-profit organizations',
      features: [
        { name: 'Members', value: '500', icon: <GroupsIcon color="primary" /> },
        { name: 'Storage', value: '50GB', icon: <StorageIcon color="primary" /> },
        { name: 'Admin accounts', value: '3', icon: <AdminIcon color="primary" /> },
        { name: 'White label', value: true, icon: <PaletteIcon color="primary" /> },
        { name: 'Wiki', value: true, icon: <BookmarkIcon color="primary" /> },
        { name: 'Events', value: true, icon: <EventIcon color="primary" /> },
        { name: 'Zero tracking by design', value: true, icon: <VisibilityOffIcon color="primary" /> },
        { name: 'Support', value: 'Email', icon: <SupportIcon color="primary" /> },
        { name: 'API Access', value: false, icon: <CodeIcon color="primary" /> },
      ],
      popular: false,
      color: 'success',
      buttonVariant: 'outlined',
      buttonText: 'Verify & Start',
      icon: <SchoolIcon color="success" sx={{ fontSize: 40 }} />,
      badge: 'SPECIAL RATE',
      addOns: []
    },
    {
      name: 'Organization',
      price: 97,
      description: 'For growing organizations and associations',
      features: [
        { name: 'Members', value: '500', icon: <GroupsIcon color="primary" /> },
        { name: 'Storage', value: '100GB', icon: <StorageIcon color="primary" /> },
        { name: 'Admin accounts', value: '5', icon: <AdminIcon color="primary" /> },
        { name: 'White label', value: true, icon: <PaletteIcon color="primary" /> },
        { name: 'Wiki', value: true, icon: <BookmarkIcon color="primary" /> },
        { name: 'Events', value: true, icon: <EventIcon color="primary" /> },
        { name: 'Zero tracking by design', value: true, icon: <VisibilityOffIcon color="primary" /> },
        { name: 'Support', value: 'Priority', icon: <SupportIcon color="primary" /> },
        { name: 'API Access', value: false, icon: <CodeIcon color="primary" /> },
      ],
      popular: true,
      color: 'primary',
      buttonVariant: 'contained',
      buttonText: 'Start 14-Day Trial',
      icon: <Business color="primary" sx={{ fontSize: 40 }} />,
      addOns: []
    },
    {
      name: 'Network',
      price: 247,
      description: 'For large networks and professional organizations',
      features: [
        { name: 'Members', value: '2,500', icon: <GroupsIcon color="primary" /> },
        { name: 'Storage', value: '1TB', icon: <StorageIcon color="primary" /> },
        { name: 'Admin accounts', value: '10', icon: <AdminIcon color="primary" /> },
        { name: 'White label', value: true, icon: <PaletteIcon color="primary" /> },
        { name: 'Wiki', value: true, icon: <BookmarkIcon color="primary" /> },
        { name: 'Events', value: true, icon: <EventIcon color="primary" /> },
        { name: 'Zero tracking by design', value: true, icon: <VisibilityOffIcon color="primary" /> },
        { name: 'Support', value: 'Priority', icon: <SupportIcon color="primary" /> },
        { name: 'API Access', value: true, icon: <CodeIcon color="primary" /> },
      ],
      popular: false,
      color: 'secondary',
      buttonVariant: 'outlined',
      buttonText: 'Start 14-Day Trial',
      icon: <BusinessIcon color="secondary" sx={{ fontSize: 40 }} />,
      addOns: []
    },
    {
      name: 'Business',
      price: 497,
      description: 'For enterprises with advanced needs and SLAs',
      features: [
        { name: 'Members', value: '10,000', icon: <GroupsIcon color="primary" /> },
        { name: 'Storage', value: '5TB', icon: <StorageIcon color="primary" /> },
        { name: 'Admin accounts', value: '20', icon: <AdminIcon color="primary" /> },
        { name: 'White label', value: true, icon: <PaletteIcon color="primary" /> },
        { name: 'Wiki', value: true, icon: <BookmarkIcon color="primary" /> },
        { name: 'Events', value: true, icon: <EventIcon color="primary" /> },
        { name: 'Zero tracking by design', value: true, icon: <VisibilityOffIcon color="primary" /> },
        { name: 'Support', value: '24/7 Dedicated', icon: <SupportIcon color="primary" /> },
        { name: 'API Access', value: true, icon: <CodeIcon color="primary" /> },
      ],
      popular: false,
      color: 'info',
      buttonVariant: 'outlined',
      buttonText: 'Start 14-Day Trial',
      icon: <Security color="info" sx={{ fontSize: 40 }} />,
      addOns: []
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Custom enterprise solution with bespoke features',
      features: [
        { name: 'Members', value: 'Unlimited', icon: <GroupsIcon color="primary" /> },
        { name: 'Storage', value: 'Unlimited', icon: <StorageIcon color="primary" /> },
        { name: 'Admin accounts', value: 'Unlimited', icon: <AdminIcon color="primary" /> },
        { name: 'White label', value: true, icon: <PaletteIcon color="primary" /> },
        { name: 'Wiki', value: true, icon: <BookmarkIcon color="primary" /> },
        { name: 'Zero tracking by design', value: true, icon: <VisibilityOffIcon color="primary" /> },
        { name: 'Events', value: true, icon: <EventIcon color="primary" /> },
        { name: 'Support', value: 'VIP Concierge', icon: <SupportIcon color="primary" /> },
        { name: 'API Access', value: true, icon: <CodeIcon color="primary" /> },
      ],
      popular: false,
      color: 'error',
      buttonVariant: 'outlined',
      buttonText: 'Contact Sales',
      icon: <Security color="error" sx={{ fontSize: 40 }} />,
      addOns: []
    }
  ];

  // Filter out Network and Business tiers
  const visiblePlans = plans.filter(plan => plan.name !== 'Network' && plan.name !== 'Business');
  
  // For desktop view, we'll determine the number of plans to show based on screen size
  const desktopPlans = visiblePlans;

  // For mobile/tablet view, show all plans
  const mobilePlans = visiblePlans;

  const FeatureRow = ({ feature, value }) => (
    <ListItem>
      <ListItemIcon>
        {typeof value === 'boolean' ? (
          value ? <CheckIcon color="success" /> : <CloseIcon color="error" />
        ) : (
          feature.icon
        )}
      </ListItemIcon>
      <ListItemText 
        primary={feature.name} 
        secondary={typeof value !== 'boolean' ? value : null} 
      />
    </ListItem>
  );

  const handleToggleChange = () => {
    setAnnual(!annual);
  };

  return (
    <>
    <ThreeJSBackground />

    <Container maxWidth="xl" sx={{ py: 8, zIndex: 99, backdropFilter: 'blur(8px)',
      backgroundColor: alpha(theme.palette.background.paper, 0.4) }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="primary">
          Simple, Transparent Pricing
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: '700px', mx: 'auto' }}>
          Choose the plan that works best for your organization's needs
        </Typography>
        
        {/* Billing toggle */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          mt: 4, 
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          py: 2,
          px: 4,
          borderRadius: 3,
          maxWidth: 'fit-content',
          mx: 'auto'
        }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: !annual ? 600 : 400,
              color: !annual ? 'primary.main' : 'text.secondary'
            }}
          >
            Monthly
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={annual}
                onChange={handleToggleChange}
                color="primary"
                sx={{ mx: 2 }}
              />
            }
            label=""
          />
          
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: annual ? 600 : 400,
              color: annual ? 'primary.main' : 'text.secondary'
            }}
          >
            Annual
          </Typography>
          
          <Chip 
            label="Save up to €594/yr" 
            color="success" 
            size="small" 
            sx={{ ml: 1, display: annual ? 'inline-flex' : 'none' }}
          />
        </Box>
        
        {/* Usage-based pricing notice */}
        <Alert 
          severity="info" 
          icon={<AttachMoneyIcon />}
          sx={{ 
            mt: 3, 
            maxWidth: 600, 
            mx: 'auto', 
            '& .MuiAlert-message': { display: 'flex', alignItems: 'center' } 
          }}
        >
          All plans include €2/additional member beyond your plan limit for up to 30 days
        </Alert>
        <Alert 
          severity="info" 
          icon={<SchoolIcon />}
          sx={{ 
            mt: 3, 
            maxWidth: 500, 
            mx: 'auto', 
            '& .MuiAlert-message': { display: 'flex', alignItems: 'center' } 
          }}
        >
          Educational & non-profits receive 30% off all plans
        </Alert>
      </Box>

      {/* Desktop Pricing Table */}
      {!isTablet && (
        <TableContainer 
          component={Paper} 
          elevation={4}
          sx={{ 
            borderRadius: 4, 
            overflow: 'hidden',
            mb: 8,
            paddingTop: 5
          }}
        >
          <Table size={isLargeScreen ? "medium" : "small"}>
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ 
                    background: alpha(theme.palette.primary.main, 0.05),
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    width: '16%',
                    py: 3
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">Features</Typography>
                </TableCell>
                
                {desktopPlans.map((plan, index) => (
                  <TableCell 
                    key={plan.name} 
                    align="center" 
                    sx={{ 
                      position: 'relative',
                      background: plan.popular ? alpha(theme.palette.primary.main, 0.05) : 'white',
                      borderBottom: plan.popular 
                        ? `2px solid ${theme.palette.primary.main}` 
                        : `2px solid ${theme.palette.divider}`,
                      py: 3,
                      width: `${84/desktopPlans.length}%`
                    }}
                  >
                    {plan.popular && (
                      <Chip
                        label="Most Popular"
                        color="primary"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          px: 1
                        }}
                      />
                    )}
                    
                    {plan.badge && !plan.popular && (
                      <Chip
                        label={plan.badge}
                        color={plan.color}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          px: 1
                        }}
                      />
                    )}
                    
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                      {plan.icon}
                    </Box>
                    
                    <Typography variant="h5" gutterBottom fontWeight="bold" color={`${plan.color}.main`}>
                      {plan.name}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ height: 40, mb: 2 }}>
                      {plan.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', mt: 3, mb: 2 }}>
                      <Typography variant="h3" fontWeight="bold" color={`${plan.color}.main`}>
                        {typeof plan.price === 'number' ? 
                          (plan.price === 0 ? 'Free' : `€${annual ? getAnnualPrice(plan.price) : plan.price}`) : 
                          plan.price}
                      </Typography>
                      {typeof plan.price === 'number' && plan.price > 0 && (
                        <Typography variant="subtitle1" color="text.secondary" sx={{ ml: 1 }}>
                          /{annual ? 'mo' : 'month'}
                        </Typography>
                      )}
                    </Box>
                    
                    {annual && typeof plan.price === 'number' && plan.price > 0 && (
                      <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 2, fontWeight: 'bold' }}>
                        Save €{getAnnualSavings(plan.price)}/year
                      </Typography>
                    )}
                    
                    <Button 
    variant={plan.buttonVariant} 
    color={plan.color === 'default' ? 'primary' : plan.color} 
    sx={{ /* your styles */ }}
    fullWidth
    onClick={() => handlePlanSelect(plan)}
    disabled={loadingPlan === plan.name}
  >
    {loadingPlan === plan.name ? (
      <CircularProgress size={24} color="inherit" />
    ) : (
      plan.buttonText
    )}
  </Button>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            
            <TableBody>
              {plans[0].features.map((feature, idx) => (
                <TableRow 
                  key={feature.name}
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <TableCell 
                    sx={{ 
                      borderLeft: `4px solid ${theme.palette.primary.main}`, 
                      fontWeight: 500
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {feature.icon}
                      <Typography sx={{ ml: 1 }}>{feature.name}</Typography>
                    </Box>
                  </TableCell>
                  
                  {desktopPlans.map((plan) => (
                    <TableCell 
                      key={`${plan.name}-${feature.name}`} 
                      align="center"
                      sx={{ 
                        backgroundColor: plan.popular ? alpha(theme.palette.primary.main, 0.03) : 'inherit',
                        fontWeight: 500
                      }}
                    >
                      {typeof plan.features[idx].value === 'boolean' ? (
                        plan.features[idx].value ? (
                          <CheckIcon sx={{ color: theme.palette.success.main }} />
                        ) : (
                          <CloseIcon sx={{ color: theme.palette.error.main }} />
                        )
                      ) : (
                        <Typography>
                          {plan.features[idx].value}
                        </Typography>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              
              {/* Additional members pricing row */}
              <TableRow sx={{ backgroundColor: alpha(theme.palette.secondary.main, 0.05) }}>
                <TableCell sx={{ 
                  borderLeft: `4px solid ${theme.palette.secondary.main}`, 
                  fontWeight: 500 
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AddIcon color="secondary" />
                    <Typography sx={{ ml: 1 }}>Additional members</Typography>
                  </Box>
                </TableCell>
                
                {desktopPlans.map((plan) => (
                  <TableCell 
                    key={`${plan.name}-addons`} 
                    align="center"
                    sx={{ fontWeight: 500 }}
                  >
                    {plan.name === 'Enterprise' ? 'Included' : (plan.name === 'Free' ? 'Not available' : '€2/member/month')}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Mobile/Tablet Cards View - Show all plans in a scrollable container */}
      {isTablet && (
        <Box sx={{ mb: 8, overflow: 'auto', pb: 2 }}>
          <Stack 
            direction="row" 
            spacing={3} 
            sx={{ 
              minWidth: 'min-content', // Ensure cards don't shrink too small
              pb: 1 // Add padding to show box shadow
            }}
          >
            {mobilePlans.map((plan) => (
              <Card 
                key={plan.name}
                elevation={plan.popular ? 8 : 2}
                sx={{ 
                  minWidth: 280,
                  maxWidth: 330,
                  borderRadius: 4,
                  position: 'relative',
                  overflow: 'visible',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)'
                  },
                  border: plan.popular ? `2px solid ${theme.palette.primary.main}` : 'none',
                }}
              >
                {plan.popular && (
                  <Chip
                    label="Most Popular"
                    color="primary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -12,
                      right: 24,
                      fontWeight: 'bold',
                      zIndex: 1
                    }}
                  />
                )}
                
                {plan.badge && !plan.popular && (
                  <Chip
                    label={plan.badge}
                    color={plan.color}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -12,
                      right: 24,
                      fontWeight: 'bold',
                      zIndex: 1
                    }}
                  />
                )}
                
                <CardHeader
                  title={
                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        {plan.icon}
                      </Box>
                      <Typography variant="h5" component="h2" fontWeight="bold" color={`${plan.color}.main`}>
                        {plan.name}
                      </Typography>
                    </Box>
                  }
                  subheader={
                    <Typography variant="body2" color="text.secondary" align="center">
                      {plan.description}
                    </Typography>
                  }
                  sx={{
                    textAlign: 'center',
                    pb: 0,
                    backgroundColor: plan.popular ? alpha(theme.palette.primary.main, 0.05) : 'transparent'
                  }}
                />
                
                <CardContent sx={{ pt: 0 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'baseline', 
                    my: 3 
                  }}>
                    <Typography 
                      variant="h3" 
                      component="span" 
                      fontWeight="bold" 
                      color={`${plan.color}.main`}
                    >
                      {typeof plan.price === 'number' ? 
                        (plan.price === 0 ? 'Free' : `€${annual ? getAnnualPrice(plan.price) : plan.price}`) : 
                        plan.price}
                    </Typography>
                    
                    {typeof plan.price === 'number' && plan.price > 0 && (
                      <Typography variant="subtitle1" color="text.secondary" sx={{ ml: 1 }}>
                        /{annual ? 'mo' : 'month'}
                      </Typography>
                    )}
                  </Box>
                  
                  {annual && typeof plan.price === 'number' && plan.price > 0 && (
                    <Typography variant="caption" color="success.main" align="center" display="block" fontWeight="bold">
                      Save €{getAnnualSavings(plan.price)}/year
                    </Typography>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <List disablePadding>
                    {plan.features.map((feature) => (
                      <ListItem 
                        key={feature.name} 
                        disableGutters 
                        sx={{ py: 1 }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {typeof feature.value === 'boolean' ? (
                            feature.value ? 
                              <CheckIcon color="success" /> : 
                              <CloseIcon color="error" />
                          ) : (
                            feature.icon
                          )}
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature.name} 
                          secondary={typeof feature.value !== 'boolean' ? feature.value : null}
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                      </ListItem>
                    ))}
                    
                    {/* Additional member pricing */}
                    <ListItem disableGutters sx={{ py: 1, bgcolor: alpha(theme.palette.secondary.main, 0.05), px: 1, borderRadius: 1, mt: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <AddIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Additional members" 
                        secondary={plan.name === 'Enterprise' ? 'Included' : (plan.name === 'Free' ? 'Not available' : '€2/member/month')}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                  </List>
                </CardContent>
                
                <CardActions sx={{ p: 3, pt: 1, justifyContent: 'center' }}>
                  <Button 
                    variant={plan.buttonVariant} 
                    color={plan.color === 'default' ? 'primary' : plan.color}
                    size="large"
                    fullWidth
                    onClick={() => handlePlanSelect(plan)}
                    disabled={loadingPlan === plan.name}
                    sx={{ 
                      py: 1.5, 
                      borderRadius: 2,
                      fontWeight: 500
                    }}
                  >
                    {loadingPlan === plan.name ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      plan.buttonText
                    )}
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Stack>
          
          {/* Scroll indicator for mobile */}
          <Box sx={{ textAlign: 'center', mt: 2, display: { sm: 'none' } }}>
            <Typography variant="caption" color="text.secondary">
              Swipe to see more plans →
            </Typography>
          </Box>
        </Box>
      )}
      
      {/* Comparison Table */}
      <Box sx={{ my: 8 }}>
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom 
          fontWeight="bold" 
          color="primary" 
          align="center"
          sx={{ mb: 3 }}
        >
          How We Compare
        </Typography>
        
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  Feature
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Conclav
                </TableCell>
                <TableCell align="center">
                  Competitors
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Free Tier</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>20 members, 2GB storage</TableCell>
                <TableCell align="center">Usually no free tier</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Members in Starter Tier</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>100 (€17/mo)</TableCell>
                <TableCell align="center">20-50 (€15-30/mo)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>White Label Option</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>€97/mo</TableCell>
                <TableCell align="center">€300+/mo</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Privacy by Design</TableCell>
                <TableCell align="center"><CheckIcon color="success" /></TableCell>
                <TableCell align="center"><CloseIcon color="error" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Non-Profit Discount</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>€49/mo Plan</TableCell>
                <TableCell align="center">Usually 10-15%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>5-Year Total Cost (500 Members)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>€4,400 (Organization annual)</TableCell>
                <TableCell align="center">€9,000-12,000</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      {/* FAQ Section */}
      <Box sx={{ mt: 10, mb: 8 }}>
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom 
          fontWeight="bold" 
          color="primary" 
          align="center"
          sx={{ mb: 5 }}
        >
          Frequently Asked Questions
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%', borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                Do you offer discounts for educational institutions?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Yes, we offer a dedicated Non-Profit tier at €49/mo for verified educational institutions and 
                non-profit organizations with 500 members included. Contact our sales team for verification.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%', borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                <SwapVertIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                Can I upgrade or downgrade my plan?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Yes, you can change your plan at any time. When upgrading, we'll prorate the remaining days 
                in your billing cycle. When downgrading, the new price takes effect on your next billing date.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%', borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                <GroupsIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                What happens if we exceed our member limit?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                You can exceed your member limit at a rate of €2 per additional member for up to 30 days. 
                After that, you'll need to upgrade to a higher tier or remove members to comply with your plan's limits.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%', borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                <CancelIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                Can I cancel my subscription?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Yes, you can cancel your subscription at any time. You'll maintain access until the end of your current billing period. We don't offer refunds for partial months.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      {/* CTA Section */}
      <Paper
        elevation={8}
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #3f51b5 100%)',
          color: 'white',
          borderRadius: 6,
          p: { xs: 4, md: 6 },
          textAlign: 'center',
          mb: 8,
          mt: 10
        }}
      >
        <Typography variant="h3" component="h2" gutterBottom fontWeight="bold">
          Ready to get started?
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, maxWidth: 700, mx: 'auto', opacity: 0.9 }}>
          Try Conclav free for 14 days. No credit card required. Cancel anytime.
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          onClick={() => navigate('/signup')}
          sx={{ 
            px: 6, 
            py: 1.5, 
            borderRadius: 2,
            fontSize: '1.1rem',
            fontWeight: 500,
            boxShadow: theme.shadows[8],
            '&:hover': {
              boxShadow: theme.shadows[12],
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Start Your Free Trial
        </Button>
        <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
          Full access to all features. No credit card required.
        </Typography>
      </Paper>
      
      {/* Stripe logos and security notice */}
      <Box sx={{ textAlign: 'center', my: 8 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Secure payment processing with
        </Typography>
        <img 
          src="https://cdn.worldvectorlogo.com/logos/stripe-4.svg" 
          alt="Stripe" 
          style={{ height: 40, marginBottom: 16 }}
        />
        <Typography variant="caption" color="text.secondary" display="block">
          All payments processed securely. We never store your credit card information.
        </Typography>
      </Box>
    </Container>
    </>
  );
};

export default PricingPage;