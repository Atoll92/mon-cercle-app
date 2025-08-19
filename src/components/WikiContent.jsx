// src/components/WikiContent.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import Spinner from './Spinner';

import {
  Typography,
  Box,
  Button,
  Divider,
  List,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Chip,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  CardActions,
  Menu,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Avatar,
  Fade,
  Grow,
  Skeleton,
  Stack,
  alpha,
  useTheme
} from '@mui/material';

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
  FeaturedPlayList as FeaturedIcon,
  AutoAwesome as AutoAwesomeIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Article as ArticleIcon
} from '@mui/icons-material';

const WikiContent = ({ networkId, currentCategory = null, showBreadcrumbs = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [network, setNetwork] = useState(null);
  const [pages, setPages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
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
        
        // Fetch network (only if showBreadcrumbs is true, otherwise it's not needed)
        if (showBreadcrumbs) {
          const { data: networkData, error: networkError } = await supabase
            .from('networks')
            .select('*')
            .eq('id', networkId)
            .single();
            
          if (networkError) throw networkError;
          setNetwork(networkData);
        }
        
        // Fetch user profile
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, network_id')
            .eq('id', activeProfile.id)
            .single();
            
          if (!profileError) {
            setUserProfile(profileData);
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
        
        if (currentCategory) {
          // Fetch pages for the current category
          const { data: categoryPagesData, error: categoryPagesError } = await supabase
            .from('wiki_page_categories')
            .select(`
              page_id,
              pages:page_id(
                id, title, slug, is_published, views_count, created_at, updated_at,
                creator:created_by(id, full_name)
              )
            `)
            .eq('category_id', currentCategory.id);
            
          if (categoryPagesError) throw categoryPagesError;
          
          const filteredPages = categoryPagesData
            .filter(p => p.pages.is_published || isAdmin)
            .map(p => p.pages);
            
          setPages(filteredPages || []);
        } else {
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
        }
      } catch (error) {
        console.error('Error fetching wiki data:', error);
        setError('Failed to load wiki pages. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [networkId, currentCategory, user, isAdmin, activeProfile]);

  // Filter pages based on search query
  const filteredPages = searchQuery 
    ? pages.filter(page => 
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (page.creator?.full_name && page.creator.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : pages;

  const handleTabChange = (event, newValue) => {
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
      setError('Failed to delete the page. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const renderPageCard = (page) => (
    <Grow in={true} timeout={500} key={page.id}>
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: theme.shadows[1],
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[6],
            '& .card-media': {
              transform: 'scale(1.05)'
            }
          }
        }}
      >
        <Box 
          className="card-media"
          sx={{ 
            height: 8, 
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            transition: 'transform 0.3s ease'
          }} 
        />
        <CardActionArea 
          component={Link} 
          to={`/network/${networkId}/wiki/${page.slug}`}
          sx={{ flexGrow: 1, p: 0 }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography 
              variant="h6" 
              component="div" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {page.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar 
                sx={{ 
                  width: 24, 
                  height: 24, 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {page.creator?.full_name?.charAt(0) || '?'}
                </Typography>
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                {page.creator?.full_name || 'Unknown'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                icon={<ViewIcon sx={{ fontSize: 16 }} />}
                label={page.views_count}
                size="small"
                sx={{ 
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  border: 'none',
                  fontWeight: 500
                }}
              />
              {!page.is_published && (
                <Chip 
                  label="Draft"
                  size="small"
                  sx={{ 
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.warning.main, 0.08),
                    color: theme.palette.warning.dark,
                    border: 'none',
                    fontWeight: 500
                  }}
                />
              )}
            </Box>
          </CardContent>
        </CardActionArea>
        {isAdmin && (
          <CardActions sx={{ px: 2, py: 1, bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
            <Box sx={{ flex: 1 }} />
            <IconButton 
              size="small"
              onClick={(e) => handleMenuClick(e, page)}
              sx={{ 
                '&:hover': { 
                  bgcolor: alpha(theme.palette.primary.main, 0.08) 
                } 
              }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </CardActions>
        )}
      </Card>
    </Grow>
  );

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="rectangular" height={40} width={200} sx={{ mb: 3, borderRadius: 1 }} />
          <Skeleton variant="rectangular" height={56} sx={{ mb: 3, borderRadius: 1 }} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              fontSize: 28
            }
          }}
        >
          {error}
        </Alert>
      )}

      {/* Header section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            {currentCategory ? `${currentCategory.name}` : 'Knowledge Base'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {currentCategory 
              ? currentCategory.description || 'Browse pages in this category'
              : 'Explore and contribute to your network\'s collective knowledge'}
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to={`/network/${networkId}/wiki/new`}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1.5,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            boxShadow: theme.shadows[2],
            '&:hover': {
              boxShadow: theme.shadows[4],
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Create Page
        </Button>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Search bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search pages..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton 
                  onClick={clearSearch} 
                  edge="end"
                  sx={{ 
                    '&:hover': { 
                      bgcolor: alpha(theme.palette.primary.main, 0.08) 
                    } 
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              '&.Mui-focused': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: 2
                }
              }
            }
          }}
        />
      </Box>

      {/* Main content area */}
      {currentCategory ? (
        /* Category view - just show all pages in this category */
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
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 8,
                px: 3,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.04)
              }}
            >
              <ArticleIcon 
                sx={{ 
                  fontSize: 64, 
                  color: theme.palette.primary.main,
                  opacity: 0.3,
                  mb: 2
                }} 
              />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                No pages found in this category
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start building your knowledge base by creating the first page
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                component={Link}
                to={`/network/${networkId}/wiki/new`}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5
                }}
              >
                Create First Page
              </Button>
            </Box>
          )}
        </Box>
      ) : (
        /* Home view - show tabs for different page groups */
        <Box>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange} 
            sx={{ 
              mb: 4,
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0'
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '1rem',
                mr: 3,
                '&.Mui-selected': {
                  fontWeight: 600
                }
              }
            }}
          >
            <Tab 
              label="All Pages" 
              icon={<PageIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
            />
            <Tab 
              label="Categories" 
              icon={<CategoryIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
            />
            <Tab 
              label="Featured" 
              icon={<AutoAwesomeIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
            />
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
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    px: 3,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.04)
                  }}
                >
                  <ArticleIcon 
                    sx={{ 
                      fontSize: 64, 
                      color: theme.palette.primary.main,
                      opacity: 0.3,
                      mb: 2
                    }} 
                  />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    No wiki pages found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Start building your knowledge base by creating the first page
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    component={Link}
                    to={`/network/${networkId}/wiki/new`}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      py: 1.5
                    }}
                  >
                    Create First Page
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
                      <Grow in={true} timeout={500}>
                        <Card
                          sx={{
                            height: '100%',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            borderRadius: 2,
                            overflow: 'hidden',
                            boxShadow: theme.shadows[1],
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: theme.shadows[6]
                            }
                          }}
                        >
                          <CardActionArea 
                            component={Link} 
                            to={`/network/${networkId}/wiki/category/${category.slug}`}
                            sx={{ height: '100%' }}
                          >
                            <CardContent sx={{ p: 3 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Box
                                  sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    mr: 2
                                  }}
                                >
                                  <CategoryIcon sx={{ color: theme.palette.primary.main }} />
                                </Box>
                                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                                  {category.name}
                                </Typography>
                              </Box>
                              {category.description && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {category.description}
                                </Typography>
                              )}
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      </Grow>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1">
                    No categories found.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Categories can be created when adding or editing a wiki page.
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
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="h5" 
                    gutterBottom 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontWeight: 600
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        mr: 2
                      }}
                    >
                      <AutoAwesomeIcon sx={{ color: theme.palette.warning.main }} />
                    </Box>
                    Featured Pages
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  {featuredPages.length > 0 ? featuredPages.map(page => (
                    <Grid item xs={12} sm={6} md={4} key={page.id}>
                      {renderPageCard(page)}
                    </Grid>
                  )) : (
                    <Grid item xs={12}>
                      <Box 
                        sx={{ 
                          textAlign: 'center', 
                          py: 6,
                          borderRadius: 2,
                          border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`
                        }}
                      >
                        <AutoAwesomeIcon 
                          sx={{ 
                            fontSize: 48, 
                            color: theme.palette.text.disabled,
                            mb: 2
                          }} 
                        />
                        <Typography variant="body1" color="text.secondary">
                          No featured pages yet.
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Grid>

              {/* Recent and Popular columns */}
              <Grid item xs={12} md={6}>
                <Box 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    height: '100%'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontWeight: 600,
                      mb: 3
                    }}
                  >
                    <ScheduleIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    Recently Updated
                  </Typography>
                  <List sx={{ py: 0 }}>
                    {recentPages.map((page, index) => (
                      <ListItemButton 
                        key={page.id}
                        component={Link}
                        to={`/network/${networkId}/wiki/${page.slug}`}
                        sx={{
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08)
                          }
                        }}
                      >
                        <ListItemIcon>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main
                            }}
                          >
                            <PageIcon fontSize="small" />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText 
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {page.title}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              Updated {new Date(page.updated_at).toLocaleDateString()}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    height: '100%'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontWeight: 600,
                      mb: 3
                    }}
                  >
                    <TrendingUpIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                    Most Popular
                  </Typography>
                  <List sx={{ py: 0 }}>
                    {popularPages.map((page, index) => (
                      <ListItemButton
                        key={page.id}
                        component={Link}
                        to={`/network/${networkId}/wiki/${page.slug}`}
                        sx={{
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.success.main, 0.08)
                          }
                        }}
                      >
                        <ListItemIcon>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                              color: theme.palette.success.main
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                              {index + 1}
                            </Typography>
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText 
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {page.title}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <ViewIcon sx={{ fontSize: 14 }} />
                              <Typography variant="caption" color="text.secondary">
                                {page.views_count} views
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>
      )}

      {/* Page action menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the page "{selectedPage?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={confirmDelete} 
            color="error"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Page'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WikiContent;