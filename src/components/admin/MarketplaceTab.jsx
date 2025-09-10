import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  Stack,
  InputAdornment,
  useTheme
} from '@mui/material';
import {
  Store as StoreIcon,
  Settings as SettingsIcon,
  Category as CategoryIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  LocalOffer as LocalOfferIcon
} from '@mui/icons-material';

const MarketplaceTab = ({ networkId, darkMode }) => {
  const theme = useTheme();
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [marketplaceEnabled, setMarketplaceEnabled] = useState(false);
  const [commissionRate, setCommissionRate] = useState(10);
  const [allowDigitalGoods, setAllowDigitalGoods] = useState(true);
  const [allowPhysicalGoods, setAllowPhysicalGoods] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Mock data for development
  const mockCategories = [
    { id: 1, name: 'Electronics', itemCount: 45, status: 'active' },
    { id: 2, name: 'Books', itemCount: 123, status: 'active' },
    { id: 3, name: 'Clothing', itemCount: 67, status: 'active' },
    { id: 4, name: 'Digital Downloads', itemCount: 34, status: 'active' },
    { id: 5, name: 'Services', itemCount: 12, status: 'inactive' }
  ];

  // Courses are now managed separately from marketplace

  const mockListings = [
    { id: 1, title: 'Vintage Camera', seller: 'John Doe', price: 150, category: 'Electronics', type: 'physical', status: 'active', views: 234 },
    { id: 2, title: 'E-book Collection', seller: 'Jane Smith', price: 25, category: 'Books', type: 'digital', status: 'pending', views: 89 },
    { id: 3, title: 'Handmade Scarf', seller: 'Alice Johnson', price: 45, category: 'Clothing', type: 'physical', status: 'active', views: 156 },
    { id: 4, title: 'Web Design Template', seller: 'Bob Wilson', price: 80, category: 'Digital Downloads', type: 'digital', status: 'active', views: 412 }
  ];

  const mockTransactions = [
    { id: 1, date: '2025-01-28', buyer: 'User A', seller: 'User B', item: 'Vintage Camera', amount: 150, commission: 15, status: 'completed' },
    { id: 2, date: '2025-01-27', buyer: 'User C', seller: 'User D', item: 'E-book Collection', amount: 25, commission: 2.5, status: 'completed' },
    { id: 3, date: '2025-01-26', buyer: 'User E', seller: 'User F', item: 'Handmade Scarf', amount: 45, commission: 4.5, status: 'pending' }
  ];

  const handleTabChange = (event, newValue) => {
    setActiveSubTab(newValue);
  };


  const renderGeneralSettings = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        General Marketplace Settings
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControlLabel
            control={
              <Switch
                checked={marketplaceEnabled}
                onChange={(e) => setMarketplaceEnabled(e.target.checked)}
                color="primary"
              />
            }
            label="Enable Marketplace"
            sx={{ mb: 2 }}
          />
          
          {marketplaceEnabled && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Marketplace is enabled. Users can now list and purchase items within your network.
            </Alert>
          )}
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Allowed Item Types
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={allowDigitalGoods}
                  onChange={(e) => setAllowDigitalGoods(e.target.checked)}
                  disabled={!marketplaceEnabled}
                />
              }
              label="Digital Goods (e-books, templates, software)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={allowPhysicalGoods}
                  onChange={(e) => setAllowPhysicalGoods(e.target.checked)}
                  disabled={!marketplaceEnabled}
                />
              }
              label="Physical Goods (require shipping)"
            />
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Commission & Fees
          </Typography>
          
          <TextField
            label="Commission Rate (%)"
            type="number"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            disabled={!marketplaceEnabled}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>
            }}
            sx={{ mb: 2, width: 200 }}
            helperText="Percentage taken from each sale"
          />
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Moderation Settings
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                disabled={!marketplaceEnabled}
              />
            }
            label="Require admin approval for new listings"
          />
        </CardContent>
      </Card>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" color="primary" disabled={!marketplaceEnabled}>
          Save Settings
        </Button>
        <Button variant="outlined">
          Cancel
        </Button>
      </Box>
    </Box>
  );

  const renderCategories = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Product Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
        >
          Add Category
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category Name</TableCell>
              <TableCell align="center">Items</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell align="center">{category.itemCount}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={category.status}
                    size="small"
                    color={category.status === 'active' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderListings = () => (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="electronics">Electronics</MenuItem>
                <MenuItem value="books">Books</MenuItem>
                <MenuItem value="clothing">Clothing</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
            >
              More Filters
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Seller</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="center">Type</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="center">Views</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockListings.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell>{listing.title}</TableCell>
                <TableCell>{listing.seller}</TableCell>
                <TableCell>{listing.category}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={listing.type}
                    size="small"
                    variant="outlined"
                    color={listing.type === 'digital' ? 'info' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">${listing.price}</TableCell>
                <TableCell align="center">{listing.views}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={listing.status}
                    size="small"
                    color={listing.status === 'active' ? 'success' : listing.status === 'pending' ? 'warning' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderTransactions = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Sales
                </Typography>
              </Box>
              <Typography variant="h4">$1,245</Typography>
              <Typography variant="caption" color="success.main">
                +12% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShoppingCartIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Orders
                </Typography>
              </Box>
              <Typography variant="h4">47</Typography>
              <Typography variant="caption" color="primary.main">
                This month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <InventoryIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Active Listings
                </Typography>
              </Box>
              <Typography variant="h4">128</Typography>
              <Typography variant="caption" color="text.secondary">
                Across all categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocalOfferIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Commission Earned
                </Typography>
              </Box>
              <Typography variant="h4">$124.50</Typography>
              <Typography variant="caption" color="text.secondary">
                10% commission rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Recent Transactions
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Buyer</TableCell>
              <TableCell>Seller</TableCell>
              <TableCell>Item</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Commission</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.date}</TableCell>
                <TableCell>{transaction.buyer}</TableCell>
                <TableCell>{transaction.seller}</TableCell>
                <TableCell>{transaction.item}</TableCell>
                <TableCell align="right">${transaction.amount}</TableCell>
                <TableCell align="right">${transaction.commission}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={transaction.status}
                    size="small"
                    color={transaction.status === 'completed' ? 'success' : 'warning'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderShippingPayment = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShippingIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Shipping Settings
                </Typography>
              </Box>
              
              <Stack spacing={2}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Allow sellers to set shipping rates"
                />
                <FormControlLabel
                  control={<Switch />}
                  label="Enable calculated shipping"
                />
                <TextField
                  label="Default shipping zone"
                  fullWidth
                  size="small"
                  defaultValue="United States"
                />
                <TextField
                  label="Maximum shipping cost"
                  type="number"
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PaymentIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Payment Methods
                </Typography>
              </Box>
              
              <Stack spacing={2}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Credit/Debit Cards"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="PayPal"
                />
                <FormControlLabel
                  control={<Switch />}
                  label="Bank Transfer"
                />
                <FormControlLabel
                  control={<Switch />}
                  label="Cryptocurrency"
                />
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" color="text.secondary">
                  Payout Settings
                </Typography>
                <TextField
                  label="Minimum payout amount"
                  type="number"
                  size="small"
                  defaultValue={50}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
                <FormControl size="small">
                  <InputLabel>Payout frequency</InputLabel>
                  <Select defaultValue="weekly" label="Payout frequency">
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="biweekly">Bi-weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3 }}>
        <Button variant="contained" color="primary">
          Save Settings
        </Button>
      </Box>
    </Box>
  );


  const renderPolicies = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Marketplace Policies & Security
      </Typography>
      
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1">
                Security Settings
              </Typography>
            </Box>
            
            <Stack spacing={2}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Require email verification for sellers"
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Enable dispute resolution system"
              />
              <FormControlLabel
                control={<Switch />}
                label="Require ID verification for high-value transactions"
              />
              <TextField
                label="High-value transaction threshold"
                type="number"
                size="small"
                defaultValue={500}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Stack>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Prohibited Items
            </Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              placeholder="List prohibited items or categories (one per line)"
              defaultValue="Weapons&#10;Illegal substances&#10;Counterfeit goods&#10;Adult content"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Terms of Service
            </Typography>
            <TextField
              multiline
              rows={6}
              fullWidth
              placeholder="Enter marketplace terms of service..."
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Return & Refund Policy
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Default return period (days)"
                type="number"
                size="small"
                defaultValue={30}
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Allow sellers to set custom return policies"
              />
              <TextField
                multiline
                rows={4}
                fullWidth
                placeholder="Enter default return policy..."
              />
            </Stack>
          </CardContent>
        </Card>
      </Stack>
      
      <Box sx={{ mt: 3 }}>
        <Button variant="contained" color="primary">
          Save Policies
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <StoreIcon sx={{ mr: 1, fontSize: 28 }} />
        <Typography variant="h5" component="h2">
          Marketplace Management
        </Typography>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeSubTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<SettingsIcon />} iconPosition="start" label="General" />
          <Tab icon={<CategoryIcon />} iconPosition="start" label="Categories" />
          <Tab icon={<InventoryIcon />} iconPosition="start" label="Listings" />
          <Tab icon={<ShoppingCartIcon />} iconPosition="start" label="Transactions" />
          <Tab icon={<ShippingIcon />} iconPosition="start" label="Shipping & Payment" />
          <Tab icon={<SecurityIcon />} iconPosition="start" label="Policies & Security" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {activeSubTab === 0 && renderGeneralSettings()}
          {activeSubTab === 1 && renderCategories()}
          {activeSubTab === 2 && renderListings()}
          {activeSubTab === 3 && renderTransactions()}
          {activeSubTab === 4 && renderShippingPayment()}
          {activeSubTab === 5 && renderPolicies()}
        </Box>
      </Paper>

    </Box>
  );
};

export default MarketplaceTab;