import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  Tooltip,
  Grid
} from '@mui/material';
import Spinner from '../Spinner';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ColorLens as ColorIcon
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  fetchNetworkCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  reorderCategories,
  generateSlug
} from '../../api/categories';

// Predefined color palette
const COLOR_PALETTE = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'
];

// Sortable Item Component
const SortableItem = ({ category, onEdit, onDelete, onToggleStatus }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        bgcolor: isDragging ? 'action.hover' : 'background.paper',
        borderRadius: 1,
        border: 1,
        borderColor: 'divider'
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{ mr: 2, cursor: 'grab' }}
      >
        <DragIcon color="action" />
      </Box>
      
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={category.name}
              size="small"
              sx={{
                bgcolor: category.color,
                color: 'white',
                fontWeight: 'medium'
              }}
            />
            <Typography variant="caption" color="textSecondary">
              /{category.slug}
            </Typography>
            {!category.is_active && (
              <Chip label="Inactive" size="small" color="default" />
            )}
          </Box>
        }
        secondary={category.description}
      />
      
      <ListItemSecondaryAction>
        <Tooltip title={category.is_active ? 'Deactivate' : 'Activate'}>
          <Switch
            edge="end"
            checked={category.is_active}
            onChange={() => onToggleStatus(category.id, category.is_active)}
          />
        </Tooltip>
        <IconButton
          edge="end"
          onClick={() => onEdit(category)}
          sx={{ ml: 1 }}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          edge="end"
          onClick={() => onDelete(category)}
          sx={{ ml: 1 }}
        >
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

const CategoriesTab = ({ networkId }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#6366f1',
    is_active: true
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [networkId]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await fetchNetworkCategories(networkId, false); // Get all categories
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      setError('Failed to load categories');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-generate slug from name if not editing
      if (name === 'name' && !editingCategory) {
        updated.slug = generateSlug(value);
      }
      
      return updated;
    });
  };

  const handleColorSelect = (color) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const handleSwitchChange = (e) => {
    setFormData(prev => ({ ...prev, is_active: e.target.checked }));
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      if (!formData.name.trim()) {
        setError('Category name is required');
        return;
      }

      if (!formData.slug.trim()) {
        setError('Category slug is required');
        return;
      }

      const categoryData = {
        network_id: networkId,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        color: formData.color,
        is_active: formData.is_active
      };

      if (editingCategory) {
        const { error } = await updateCategory(editingCategory.id, categoryData);
        if (error) throw error;
        setSuccess('Category updated successfully');
      } else {
        const { error } = await createCategory(categoryData);
        if (error) throw error;
        setSuccess('Category created successfully');
      }

      handleCloseDialog();
      loadCategories();
    } catch (err) {
      setError(err.message || 'Failed to save category');
      console.error('Error saving category:', err);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color || '#6366f1',
      is_active: category.is_active
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      setError(null);
      const { error } = await deleteCategory(categoryToDelete.id);
      if (error) throw error;
      
      setSuccess('Category deleted successfully');
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
      loadCategories();
    } catch (err) {
      setError(err.message || 'Failed to delete category');
      console.error('Error deleting category:', err);
    }
  };

  const handleToggleStatus = async (categoryId, currentStatus) => {
    try {
      setError(null);
      const { error } = await toggleCategoryStatus(categoryId, !currentStatus);
      if (error) throw error;
      
      setSuccess('Category status updated');
      loadCategories();
    } catch (err) {
      setError(err.message || 'Failed to update category status');
      console.error('Error toggling category status:', err);
    }
  };

  const handleDragEnd = async (event) => {
    const {active, over} = event;

    if (active.id !== over.id) {
      const oldIndex = categories.findIndex(cat => cat.id === active.id);
      const newIndex = categories.findIndex(cat => cat.id === over.id);
      
      const newCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(newCategories);

      try {
        const { error } = await reorderCategories(newCategories);
        if (error) throw error;
        setSuccess('Category order updated');
      } catch (err) {
        setError(err.message || 'Failed to update category order');
        loadCategories(); // Reload to get original order
      }
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#6366f1',
      is_active: true
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <Spinner />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Content Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Add Category
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {categories.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography color="textSecondary" gutterBottom>
            No categories created yet
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Create categories to organize your network's content
          </Typography>
        </Box>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map(cat => cat.id)}
            strategy={verticalListSortingStrategy}
          >
            <List>
              {categories.map((category) => (
                <SortableItem
                  key={category.id}
                  category={category}
                  onEdit={handleEdit}
                  onDelete={(cat) => {
                    setCategoryToDelete(cat);
                    setDeleteConfirmOpen(true);
                  }}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </List>
          </SortableContext>
        </DndContext>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Category Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Slug (URL-friendly identifier)"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              margin="normal"
              required
              helperText="Used in URLs and filters. Only lowercase letters, numbers, and hyphens."
            />
            
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={2}
            />
            
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Category Color
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: formData.color,
                    borderRadius: 1,
                    border: '2px solid',
                    borderColor: 'divider'
                  }}
                />
                <Typography variant="body2">{formData.color}</Typography>
              </Box>
              <Grid container spacing={1}>
                {COLOR_PALETTE.map((color) => (
                  <Grid item key={color}>
                    <IconButton
                      onClick={() => handleColorSelect(color)}
                      sx={{
                        p: 0.5,
                        border: formData.color === color ? '2px solid' : 'none',
                        borderColor: 'primary.main'
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: color,
                          borderRadius: 0.5,
                          '&:hover': {
                            transform: 'scale(1.1)'
                          }
                        }}
                      />
                    </IconButton>
                  </Grid>
                ))}
              </Grid>
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={handleSwitchChange}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the category "{categoryToDelete?.name}"?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Content using this category will not be deleted, but will no longer have a category assigned.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoriesTab;