import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { formatDate } from '../utils/dateFormatting';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';

import {
  Typography,
  Paper,
  Divider,
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  CardActions,
  Chip,
  Tab,
  Tabs,
  List,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Menu,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import Spinner from './Spinner';

import {
  Description as PageIcon,
  Category as CategoryIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MoreVert as MoreIcon,
  FeaturedPlayList as FeaturedIcon
} from '@mui/icons-material';

const WikiTab = ({ networkId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pages, setPages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [featuredPages, setFeaturedPages] = useState([]);
  const [recentPages, setRecentPages] = useState([]);
  const [popularPages, setPopularPages] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        
        // Fetch user profile
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, network_id')
            .eq('id', activeProfile.id)
            .single();
            
          if (!profileError) {
            setIsAdmin(profileData.role === 'admin' && profileData.network_id === networkId);
          }
        }
        
        // Fetch all categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('wiki_categories')
          .select('*')
          .eq('network_id', networkId)
          .order('name');
          
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);
        
        // Fetch all pages
        const { data: pagesData, error: pagesError } = await supabase
          .from('wiki_pages')
          .select(`
            *,
            creator:created_by(id, full_name)
          `)
          .eq('network_id', networkId)
          .order('title');
          
        if (pagesError) throw pagesError;
        
        const filteredPages = pagesData.filter(p => p.is_published || isAdmin);
        setPages(filteredPages || []);
        
        // Set featured pages (just use the first few for now - in a real app you'd have a featured flag)
        setFeaturedPages(filteredPages.slice(0, 3));
        
        // Set recent pages
        const sortedByDate = [...filteredPages].sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        );
        setRecentPages(sortedByDate.slice(0, 5));
        
        // Set popular pages
        const sortedByViews = [...filteredPages].sort(
          (a, b) => b.views_count - a.views_count
        );
        setPopularPages(sortedByViews.slice(0, 5));
      } catch (error) {
        console.error('Error fetching wiki data:', error);
        setError(t('wikiTab.loadPagesFailed'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [networkId, user, isAdmin, activeProfile]);

  // Filter pages based on search query
  const filteredPages = searchQuery 
    ? pages.filter(page => 
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (page.creator?.full_name && page.creator.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : pages;

  const handleTabChange = (_, newValue) => {
    setCurrentTab(newValue);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleMenuClick = (event, page) => {
    setAnchorEl(event.currentTarget);
    setSelectedPage(page);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPage(null);
  };

  const handleEdit = () => {
    navigate(`/network/${networkId}/wiki/edit/${selectedPage.slug}`);
    handleMenuClose();
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (!selectedPage) return;
    
    try {
      setDeleting(true);
      
      const { error } = await supabase
        .from('wiki_pages')
        .delete()
        .eq('id', selectedPage.id);
        
      if (error) throw error;
      
      setPages(pages.filter(p => p.id !== selectedPage.id));
      setShowDeleteDialog(false);
      setSelectedPage(null);
    } catch (error) {
      console.error('Error deleting page:', error);
      setError(t('wikiTab.deletePageFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const renderPageCard = (page) => (
    <Card key={page.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea 
        component={Link} 
        to={`/network/${networkId}/wiki/${page.slug}`}
        sx={{ flexGrow: 1 }}
      >
        <CardContent>
          <Typography variant="h6" component="div" gutterBottom>
            {page.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('wikiTab.createdBy', { name: page.creator?.full_name || t('wikiTab.unknown') })}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Chip 
              icon={<ViewIcon fontSize="small" />}
              label={t('wikiTab.viewsCount', { count: page.views_count })}
              size="small"
              variant="outlined"
            />
            {!page.is_published && (
              <Chip 
                label={t('wikiTab.draft')}
                size="small"
                color="warning"
              />
            )}
          </Box>
        </CardContent>
      </CardActionArea>
      {isAdmin && (
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <IconButton 
            size="small"
            onClick={(e) => handleMenuClick(e, page)}
          >
            <MoreIcon fontSize="small" />
          </IconButton>
        </CardActions>
      )}
    </Card>
  );

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Spinner size={120} />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 1.5 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Header section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to={`/network/${networkId}/wiki/new`}
        >
          {t('wikiTab.createPage')}
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Search bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder={t('wikiTab.searchPlaceholder')}
          value={searchQuery}
          onChange={handleSearchChange}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton onClick={clearSearch} edge="end">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }
          }}
        />
      </Box>

      {/* Main content area */}
      <Box>
        <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label={t('wikiTab.allPages')} />
          <Tab label={t('wikiTab.categories')} />
          <Tab label={t('wikiTab.featuredPages')} />
        </Tabs>

        {/* All Pages tab */}
        {currentTab === 0 && (
          <Box>
            {filteredPages.length > 0 ? (
              <Grid container spacing={3}>
                {filteredPages.map(page => (
                  <Grid item xs={12} sm={6} md={4} key={page.id}>
                    {renderPageCard(page)}
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1">
                  {t('wikiTab.noPagesFound')}
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  component={Link}
                  to={`/network/${networkId}/wiki/new`}
                  sx={{ mt: 2 }}
                >
                  {t('wikiTab.createFirstPage')}
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Categories tab */}
        {currentTab === 1 && (
          <Box>
            {categories.length > 0 ? (
              <Grid container spacing={3}>
                {categories.map(category => (
                  <Grid item xs={12} sm={6} md={4} key={category.id}>
                    <Card>
                      <CardActionArea 
                        component={Link} 
                        to={`/network/${networkId}/wiki/category/${category.slug}`}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <CategoryIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6" component="div">
                              {category.name}
                            </Typography>
                          </Box>
                          {category.description && (
                            <Typography variant="body2" color="text.secondary">
                              {category.description}
                            </Typography>
                          )}
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1">
                  {t('wikiTab.noCategoriesFound')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('wikiTab.categoriesInfo')}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Featured Pages tab */}
        {currentTab === 2 && (
          <Grid container spacing={3}>
            {/* Featured pages section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <FeaturedIcon sx={{ mr: 1 }} />
                {t('wikiTab.featuredPages')}
              </Typography>
              <Grid container spacing={2}>
                {featuredPages.length > 0 ? featuredPages.map(page => (
                  <Grid item xs={12} sm={6} md={4} key={page.id}>
                    {renderPageCard(page)}
                  </Grid>
                )) : (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      {t('wikiTab.noFeaturedPages')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Grid>

            {/* Recent and Popular columns */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                {t('wikiTab.recentlyUpdated')}
              </Typography>
              <List>
                {recentPages.map(page => (
                  <ListItemButton 
                    key={page.id}
                    component={Link}
                    to={`/network/${networkId}/wiki/${page.slug}`}
                  >
                    <ListItemIcon>
                      <PageIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={page.title}
                      secondary={t('wikiTab.updatedOn', { date: formatDate(page.updated_at) })}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                {t('wikiTab.mostPopular')}
              </Typography>
              <List>
                {popularPages.map(page => (
                  <ListItemButton
                    key={page.id}
                    component={Link}
                    to={`/network/${networkId}/wiki/${page.slug}`}
                  >
                    <ListItemIcon>
                      <PageIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={page.title}
                      secondary={t('wikiTab.viewsCount', { count: page.views_count })}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Page action menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          {t('wikiTab.edit')}
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('wikiTab.delete')}
        </MenuItem>
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>{t('wikiTab.confirmDeletion')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('wikiTab.deleteConfirmMessage', { title: selectedPage?.title })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>{t('wikiTab.cancel')}</Button>
          <Button 
            onClick={confirmDelete} 
            color="error"
            disabled={deleting}
          >
            {deleting ? t('wikiTab.deleting') : t('wikiTab.deletePage')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default WikiTab;