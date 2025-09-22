import { supabase } from '../supabaseclient';

// Fetch all categories for a network
export const fetchNetworkCategories = async (networkId, activeOnly = true, type = null) => {
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

    // Filter by type if specified
    if (type) {
      // Include both the specific type and 'general' categories
      query = query.in('type', [type, 'general']);
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

    // Get the user's profile ID for the network
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('network_id', categoryData.network_id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found for this network');
    }

    const { data, error } = await supabase
      .from('network_categories')
      .insert({
        ...categoryData,
        created_by: profile.id
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('A category with this slug already exists in this network');
      }
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Error creating category:', error);
    return { data: null, error: error.message || error };
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

    if (error) {
      if (error.code === '23505') {
        throw new Error('A category with this slug already exists in this network');
      }
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Error updating category:', error);
    return { data: null, error: error.message || error };
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

// Fetch categories grouped by type
export const fetchCategoriesByType = async (networkId, activeOnly = true) => {
  try {
    let query = supabase
      .from('network_categories')
      .select('*')
      .eq('network_id', networkId)
      .order('type', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group categories by type
    const grouped = {
      event: [],
      news: [],
      portfolio: [],
      general: []
    };

    data?.forEach(category => {
      if (grouped[category.type]) {
        grouped[category.type].push(category);
      }
    });

    return { data: grouped, error: null };
  } catch (error) {
    console.error('Error fetching categories by type:', error);
    return { data: null, error };
  }
};