// src/pages/WikiEditPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import QuillEditor from '../components/QuillEditor';

import {
  Container,
  Paper,
  Typography,
  Box,
  Breadcrumbs,
  CircularProgress,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Alert,
  FormHelperText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
} from '@mui/material';

import {
  Save as SaveIcon,
  Preview as PreviewIcon,
  Cancel as CancelIcon,
  AddCircleOutline as AddCategoryIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

const WikiEditPage = () => {
  const { networkId, pageSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isNewPage, setIsNewPage] = useState(() => {
    console.log('Initial pageSlug:', pageSlug);
    // pageSlug === 'new' indicates we're creating a new page
    // pageSlug === undefined might happen during initial render
    return pageSlug === 'new' || pageSlug === undefined;
  });
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [revisionComment, setRevisionComment] = useState('');
  const [slug, setSlug] = useState('');
  const [titleError, setTitleError] = useState('');
  const [customSlug, setCustomSlug] = useState(false);
  
  // Categories
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  
  // Preview mode
  const [previewMode, setPreviewMode] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Fetching data for wiki page. isNewPage:", isNewPage, "pageSlug:", pageSlug, "networkId:", networkId);
        
        // Check if user is authenticated
        if (!user) {
          console.log('User not authenticated, redirecting to login');
          // Instead of redirecting to network page, redirect to login
          navigate('/login', { state: { returnTo: `/network/${networkId}/wiki/${isNewPage ? 'new' : `edit/${pageSlug}`}` } });
          return;
        }
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, network_id')
          .eq('id', user.id)
          .single();
          
        if (!profileError) {
          setUserProfile(profileData);
          setIsAdmin(profileData.role === 'admin' && profileData.network_id === networkId);
        } else {
          console.error('Error fetching profile:', profileError);
          // Don't redirect, just show an error
          setError('Failed to retrieve your profile. Please try refreshing the page.');
        }
        
        // Fetch all categories for this network
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('wiki_categories')
          .select('id, name, slug')
          .eq('network_id', networkId)
          .order('name');
          
        if (!categoriesError) {
          setAllCategories(categoriesData || []);
        }
        
        // If explicitly creating a new page (pageSlug === 'new') or the URL pattern suggests a new page,
        // then skip trying to fetch existing page data
        if (isNewPage) {
          console.log('Creating a new page, skipping fetch of existing page');
          setLoading(false);
          return;
        }
        
        // If editing existing page, fetch its data
        console.log('Attempting to fetch existing page data for slug:', pageSlug);
        const { data: pageData, error: pageError } = await supabase
          .from('wiki_pages')
          .select('*')
          .eq('network_id', networkId)
          .eq('slug', pageSlug)
          .single();
          
        console.log('Page fetch result:', { pageData, errorCode: pageError?.code, errorMessage: pageError?.message });
          
        if (pageError) {
          if (pageError.code === 'PGRST116') {
            console.log('Page not found, treating as error since we\'re in edit mode');
            setError('Page not found. It may have been deleted or never existed.');
          } else {
            throw pageError;
          }
          setLoading(false);
          return;
        }
        
        setPage(pageData);
        setTitle(pageData.title);
        setContent(pageData.content || '');
        setSlug(pageData.slug);
        
        // Fetch page categories
        const { data: pageCategoriesData, error: pageCategoriesError } = await supabase
          .from('wiki_page_categories')
          .select('category_id')
          .eq('page_id', pageData.id);
          
        if (!pageCategoriesError && pageCategoriesData) {
          const categoryIds = pageCategoriesData.map(pc => pc.category_id);
          setSelectedCategories(categoryIds);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load page data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [networkId, pageSlug, user, navigate, isNewPage]);

  // Generate slug from title
  useEffect(() => {
    if (!customSlug && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      setSlug(generatedSlug);
    }
  }, [title, customSlug]);

  const validateForm = () => {
    let isValid = true;
    
    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else {
      setTitleError('');
    }
    
    return isValid;
  };

  const handleSave = async (publishImmediately = false) => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      console.log("Saving wiki page:", { isNewPage, title, networkId });
      
      if (isNewPage) {
        // Create new page
        const { data: newPage, error: pageError } = await supabase
          .from('wiki_pages')
          .insert({
            network_id: networkId,
            title: title.trim(),
            slug: slug,
            content: content,
            is_published: isAdmin || publishImmediately,
            created_by: user.id,
            last_edited_by: user.id,
            views_count: 0 // Add default view count
          })
          .select();
          
        if (pageError) {
          console.error("Error creating page:", pageError);
          throw pageError;
        }
        
        // Make sure we got a valid page back
        if (!newPage || newPage.length === 0) {
          throw new Error("Failed to create page: No page data returned");
        }
        
        const createdPage = newPage[0]; // Get the first page from the array
        console.log("Created new page:", createdPage);
        
        // Create initial revision
        const { error: revisionError } = await supabase
          .from('wiki_revisions')
          .insert({
            page_id: createdPage.id,
            content: content,
            revision_number: 1,
            created_by: user.id,
            comment: revisionComment || 'Initial version',
            is_approved: isAdmin || publishImmediately,
            approved_by: isAdmin || publishImmediately ? user.id : null,
            approved_at: isAdmin || publishImmediately ? new Date().toISOString() : null
          });
          
        if (revisionError) throw revisionError;
        
        // Add categories if any are selected
        if (selectedCategories.length > 0) {
          const categoryInserts = selectedCategories.map(categoryId => ({
            page_id: createdPage.id,
            category_id: categoryId
          }));
          
          const { error: categoriesError } = await supabase
            .from('wiki_page_categories')
            .insert(categoryInserts);
            
          if (categoriesError) throw categoriesError;
        }
        
        navigate(`/network/${networkId}/wiki/${slug}`);
      } else {
        // For updating existing page, first make sure we have page data
        // If we don't have page data yet, try to fetch it again
        if (!page) {
          const { data: pageData, error: pageError } = await supabase
            .from('wiki_pages')
            .select('*')
            .eq('network_id', networkId)
            .eq('slug', pageSlug)
            .single();
            
          if (pageError) {
            throw new Error('Page not found or could not be accessed. Unable to update.');
          }
          
          setPage(pageData);
          
          // If we've just fetched the page data, continue with the update
          const currentPage = pageData;
          
          // If admin or publishing immediately, update the page directly
          if (isAdmin || publishImmediately) {
            const { error: updateError } = await supabase
              .from('wiki_pages')
              .update({
                title: title.trim(),
                slug: slug,
                content: content,
                is_published: true,
                last_edited_by: user.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', currentPage.id);
              
            if (updateError) throw updateError;
          }
          
          // Get next revision number
          const { data: latestRevision, error: revisionFetchError } = await supabase
            .from('wiki_revisions')
            .select('revision_number')
            .eq('page_id', currentPage.id)
            .order('revision_number', { ascending: false })
            .limit(1)
            .single();
            
          const nextRevisionNumber = (revisionFetchError || !latestRevision) ? 1 : latestRevision.revision_number + 1;
          
          // Create new revision
          const { error: revisionError } = await supabase
            .from('wiki_revisions')
            .insert({
              page_id: currentPage.id,
              content: content,
              revision_number: nextRevisionNumber,
              created_by: user.id,
              comment: revisionComment || 'Updated content',
              is_approved: isAdmin || publishImmediately,
              approved_by: isAdmin || publishImmediately ? user.id : null,
              approved_at: isAdmin || publishImmediately ? new Date().toISOString() : null
            });
            
          if (revisionError) throw revisionError;
          
          // Update categories - first delete existing ones
          const { error: deleteCategoriesError } = await supabase
            .from('wiki_page_categories')
            .delete()
            .eq('page_id', currentPage.id);
            
          if (deleteCategoriesError) throw deleteCategoriesError;
          
          // Then add new ones
          if (selectedCategories.length > 0) {
            const categoryInserts = selectedCategories.map(categoryId => ({
              page_id: currentPage.id,
              category_id: categoryId
            }));
            
            const { error: categoriesError } = await supabase
              .from('wiki_page_categories')
              .insert(categoryInserts);
              
            if (categoriesError) throw categoriesError;
          }
          
          // Navigate to the appropriate page
          if (slug !== pageSlug) {
            navigate(`/network/${networkId}/wiki/${slug}`);
          } else {
            navigate(`/network/${networkId}/wiki/${pageSlug}`);
          }
        } else {
          // Normal update flow when page data is available
          
          // If admin or publishing immediately, update the page directly
          if (isAdmin || publishImmediately) {
            const { error: pageError } = await supabase
              .from('wiki_pages')
              .update({
                title: title.trim(),
                slug: slug,
                content: content,
                is_published: true,
                last_edited_by: user.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', page.id);
              
            if (pageError) throw pageError;
          }
          
          // Get next revision number
          const { data: latestRevision, error: revisionFetchError } = await supabase
            .from('wiki_revisions')
            .select('revision_number')
            .eq('page_id', page.id)
            .order('revision_number', { ascending: false })
            .limit(1)
            .single();
            
          if (revisionFetchError && revisionFetchError.code !== 'PGRST116') throw revisionFetchError;
          
          const nextRevisionNumber = latestRevision ? latestRevision.revision_number + 1 : 1;
          
          // Create new revision
          const { error: revisionError } = await supabase
            .from('wiki_revisions')
            .insert({
              page_id: page.id,
              content: content,
              revision_number: nextRevisionNumber,
              created_by: user.id,
              comment: revisionComment || 'Updated content',
              is_approved: isAdmin || publishImmediately,
              approved_by: isAdmin || publishImmediately ? user.id : null,
              approved_at: isAdmin || publishImmediately ? new Date().toISOString() : null
            });
            
          if (revisionError) throw revisionError;
          
          // Update categories - first delete existing ones
          const { error: deleteCategoriesError } = await supabase
            .from('wiki_page_categories')
            .delete()
            .eq('page_id', page.id);
            
          if (deleteCategoriesError) throw deleteCategoriesError;
          
          // Then add new ones
          if (selectedCategories.length > 0) {
            const categoryInserts = selectedCategories.map(categoryId => ({
              page_id: page.id,
              category_id: categoryId
            }));
            
            const { error: categoriesError } = await supabase
              .from('wiki_page_categories')
              .insert(categoryInserts);
              
            if (categoriesError) throw categoriesError;
          }
          
          // If slug has changed, navigate to new URL, otherwise stay on same page
          if (slug !== pageSlug) {
            navigate(`/network/${networkId}/wiki/${slug}`);
          } else {
            navigate(`/network/${networkId}/wiki/${pageSlug}`);
          }
        }
      }
    } catch (error) {
      console.error('Error saving page:', error);
      setError(`Failed to save the page: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };
        
      

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      setCreatingCategory(true);
      
      // Generate slug for new category
      const categorySlug = newCategoryName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // If RPC not available, try direct insert with auth 
      const { data: newCategory, error } = await supabase
        .from('wiki_categories')
        .insert({
          network_id: networkId,
          name: newCategoryName.trim(),
          slug: categorySlug,
          created_by: user.id // Add this in case your RLS policy requires it
        })
        .select()
        .single();

      //if we hit a 23505 error, it means the category already exists
      if (error && error.code === '23505') {
        console.error('Category already exists:', error);
        setError('Category slug already exists. Please choose a different name.');
        setCreatingCategory(false);
        return;
      }

      // If we hit a different error, log it and inform the user
      if (error) {
        // If still getting RLS error, inform the user
        console.error('Category creation error:', error);
        throw new Error('Permission denied. You may not have rights to create categories. Error message ' + error.message + '. Details: ' + error.details);
      }
      
      // Add to list of categories
      setAllCategories([...allCategories, newCategory]);
      
      // Select the new category
      setSelectedCategories([...selectedCategories, newCategory.id]);
      
      // Reset and close dialog
      setNewCategoryName('');
      setShowNewCategoryDialog(false);
    } catch (error) {
      console.error('Error creating category:', error);
      setError(`Failed to create category: ${error.message}`);
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCategoryChange = (event) => {
    setSelectedCategories(event.target.value.filter((id) => id));
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        {/* Breadcrumb navigation */}
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs>
            <Link to={`/network/${networkId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              Network
            </Link>
            <Link to={`/network/${networkId}/wiki`} style={{ textDecoration: 'none', color: 'inherit' }}>
              Wiki
            </Link>
            <Typography color="textPrimary">
              {isNewPage ? 'New Page' : `Edit: ${page?.title}`}
            </Typography>
          </Breadcrumbs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Page header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1">
            {isNewPage ? 'Create New Wiki Page' : 'Edit Wiki Page'}
          </Typography>
        </Box>

        {/* Form fields */}
        <Box component="form" noValidate sx={{ mb: 4 }}>
          <Stack spacing={3}>
            {/* Title field */}
            <TextField
              label="Page Title"
              fullWidth
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={!!titleError}
              helperText={titleError}
              disabled={previewMode}
            />

            {/* Slug field */}
            <Box>
              <TextField
                label="Page URL Slug"
                fullWidth
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={!customSlug || previewMode}
                helperText={`This will be the URL of your page: /network/${networkId}/wiki/${slug}`}
                InputProps={{
                  sx: { fontFamily: 'monospace' }
                }}
              />
              <Button
                size="small"
                onClick={() => setCustomSlug(!customSlug)}
                sx={{ mt: 1 }}
                disabled={previewMode}
              >
                {customSlug ? 'Auto-generate from title' : 'Customize slug'}
              </Button>
            </Box>

            {/* Categories */}
            <FormControl>
              <InputLabel id="categories-label">Categories</InputLabel>
              <Select
                labelId="categories-label"
                multiple
                value={selectedCategories}
                onChange={handleCategoryChange}
                input={<OutlinedInput label="Categories" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const category = allCategories.find(cat => cat.id === value);
                      return (
                        <Chip key={value} label={category ? category.name : value} />
                      );
                    })}
                  </Box>
                )}
                disabled={previewMode}
              >
                {allCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
                <Divider key="divider" />
                <MenuItem key="add-new-category" onClick={() => setShowNewCategoryDialog(true)}>
                  <AddCategoryIcon sx={{ mr: 1 }} />
                  Add New Category
                </MenuItem>
              </Select>
            </FormControl>

            {/* Content field */}
            <Typography variant="subtitle1" gutterBottom>
              Page Content
            </Typography>
            <Box className="mb-16">
              <QuillEditor
                value={content}
                setContent={setContent}
              />
            </Box>

            {/* Revision comment */}
            <TextField
              label="Revision Comment"
              fullWidth
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
              helperText="Briefly describe your changes (optional)"
            />

            {/* Submission notice for non-admins */}
            {!isAdmin && (
              <Alert severity="info">
                Your changes will be submitted for approval by a network administrator before they are published.
              </Alert>
            )}
          </Stack>
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
          <Button
            component={Link}
            to={isNewPage ? `/network/${networkId}/wiki` : `/network/${networkId}/wiki/${pageSlug}`}
            startIcon={<ArrowBackIcon />}
          >
            Cancel
          </Button>
          
          <Box>
            {!isAdmin && (
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={() => handleSave(true)}
                disabled={saving || previewMode}
                sx={{ mr: 2 }}
              >
                {saving ? 'Saving...' : 'Submit for Review'}
              </Button>
            )}
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={() => handleSave(false)}
              disabled={saving || previewMode}
            >
              {saving ? 'Saving...' : (isAdmin ? 'Save & Publish' : 'Save Draft')}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* New Category Dialog */}
      <Dialog
        open={showNewCategoryDialog}
        onClose={() => setShowNewCategoryDialog(false)}
      >
        <DialogTitle>Create New Category</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter a name for the new category. It will be available to all wiki pages in this network.
          </DialogContentText>
          <TextField
            autoFocus
            label="Category Name"
            fullWidth
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewCategoryDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateCategory} 
            variant="contained"
            disabled={!newCategoryName.trim() || creatingCategory}
          >
            {creatingCategory ? 'Creating...' : 'Create Category'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WikiEditPage;