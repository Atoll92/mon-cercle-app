import { supabase } from '../supabaseclient';

// Fetch all categories for a network
export const fetchNetworkCategories = async (networkId, activeOnly = true) => {
  try {
    let query = supabase
      .from('network_categories')
      .select('*')
      .eq('network_id', networkId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { data: null, error };
  }
};

// Create a new category
export const createCategory = async (categoryData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('network_categories')
      .insert({
        ...categoryData,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating category:', error);
    return { data: null, error };
  }
};

// Update a category
export const updateCategory = async (categoryId, updates) => {
  try {
    const { data, error } = await supabase
      .from('network_categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating category:', error);
    return { data: null, error };
  }
};

// Delete a category
export const deleteCategory = async (categoryId) => {
  try {
    const { error } = await supabase
      .from('network_categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { error };
  }
};

// Toggle category active status
export const toggleCategoryStatus = async (categoryId, isActive) => {
  return updateCategory(categoryId, { is_active: isActive });
};

// Reorder categories
export const reorderCategories = async (categories) => {
  try {
    const updates = categories.map((cat, index) => ({
      id: cat.id,
      sort_order: index
    }));

    const promises = updates.map(update =>
      supabase
        .from('network_categories')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
    );

    const results = await Promise.all(promises);
    const hasError = results.some(result => result.error);

    if (hasError) {
      throw new Error('Failed to update category order');
    }

    return { error: null };
  } catch (error) {
    console.error('Error reordering categories:', error);
    return { error };
  }
};

// Generate slug from name
export const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};