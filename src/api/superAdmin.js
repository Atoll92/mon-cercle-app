// src/api/superAdmin.js
import { supabase } from '../supabaseclient';

// Fetch all networks with analytics
export const fetchAllNetworks = async () => {
  try {
    // First get all networks
    const { data: networks, error: networksError } = await supabase
      .from('networks')
      .select('*')
      .order('created_at', { ascending: false });

    if (networksError) throw networksError;

    // For each network, get member count and file sizes separately
    const processedData = await Promise.all(
      networks.map(async (network) => {
        try {
          // Get member count
          const { count: memberCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('network_id', network.id);

          // Get file sizes
          const { data: files } = await supabase
            .from('network_files')
            .select('file_size')
            .eq('network_id', network.id);

          const totalFileSize = files?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;

          return {
            ...network,
            member_count: memberCount || 0,
            storage_used_mb: Math.round(totalFileSize / (1024 * 1024)),
            storage_limit_mb: getStorageLimit(network.subscription_plan),
            status: network.status || 'active'
          };
        } catch (err) {
          console.warn(`Error processing network ${network.id}:`, err);
          return {
            ...network,
            member_count: 0,
            storage_used_mb: 0,
            storage_limit_mb: getStorageLimit(network.subscription_plan),
            status: network.status || 'active'
          };
        }
      })
    );

    return processedData;
  } catch (error) {
    console.error('Error fetching all networks:', error);
    throw error;
  }
};

// Get storage limit based on subscription plan
const getStorageLimit = (plan) => {
  switch (plan) {
    case 'free': return 2 * 1024; // 2GB in MB
    case 'community': return 10 * 1024; // 10GB in MB
    case 'organization': return 100 * 1024; // 100GB in MB
    case 'business': return 5 * 1024 * 1024; // 5TB in MB
    default: return 2 * 1024; // Default to free tier
  }
};

// Get overall analytics
export const getNetworkAnalytics = async () => {
  try {
    // Initialize default values
    let totalNetworks = 0;
    let totalUsers = 0;
    let activeSubscriptions = 0;
    let totalStorageGB = 0;
    let newNetworks = 0;
    let newUsers = 0;

    try {
      // Get total networks
      const { count: networksCount } = await supabase
        .from('networks')
        .select('*', { count: 'exact', head: true });
      totalNetworks = networksCount || 0;
    } catch (err) {
      console.warn('Error fetching networks count:', err);
    }

    try {
      // Get total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      totalUsers = usersCount || 0;
    } catch (err) {
      console.warn('Error fetching users count:', err);
    }

    try {
      // Get active subscriptions (networks with paid plans)
      const { count: subscriptionsCount } = await supabase
        .from('networks')
        .select('*', { count: 'exact', head: true })
        .not('subscription_plan', 'is', null)
        .neq('subscription_plan', 'free');
      activeSubscriptions = subscriptionsCount || 0;
    } catch (err) {
      console.warn('Error fetching subscriptions count:', err);
    }

    try {
      // Get total storage usage
      const { data: storageData } = await supabase
        .from('network_files')
        .select('file_size');

      if (storageData) {
        const totalStorageBytes = storageData.reduce((sum, file) => sum + (file.file_size || 0), 0);
        totalStorageGB = Math.round(totalStorageBytes / (1024 * 1024 * 1024));
      }
    } catch (err) {
      console.warn('Error fetching storage data:', err);
    }

    try {
      // Get networks created in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: newNetworksCount } = await supabase
        .from('networks')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());
      newNetworks = newNetworksCount || 0;
    } catch (err) {
      console.warn('Error fetching new networks:', err);
    }

    try {
      // Get users joined in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: newUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());
      newUsers = newUsersCount || 0;
    } catch (err) {
      console.warn('Error fetching new users:', err);
    }

    return {
      totalNetworks,
      totalUsers,
      activeSubscriptions,
      totalStorageGB,
      newNetworks,
      newUsers,
      growth: {
        networksGrowth: newNetworks,
        usersGrowth: newUsers
      }
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    // Return default values instead of throwing
    return {
      totalNetworks: 0,
      totalUsers: 0,
      activeSubscriptions: 0,
      totalStorageGB: 0,
      newNetworks: 0,
      newUsers: 0,
      growth: {
        networksGrowth: 0,
        usersGrowth: 0
      }
    };
  }
};

// Update network status (suspend, activate, delete)
export const updateNetworkStatus = async (networkId, action, data = {}) => {
  try {
    let updateData = {};

    switch (action) {
      case 'suspend':
        updateData = {
          status: 'suspended',
          suspension_reason: data.reason || 'Suspended by admin',
          suspended_at: new Date().toISOString()
        };
        break;
      case 'activate':
        updateData = {
          status: 'active',
          suspension_reason: null,
          suspended_at: null
        };
        break;
      case 'delete':
        // For delete, we'll actually delete the network
        const { error: deleteError } = await supabase
          .from('networks')
          .delete()
          .eq('id', networkId);
        
        if (deleteError) throw deleteError;
        return { success: true };
      default:
        throw new Error('Invalid action');
    }

    const { data: result, error } = await supabase
      .from('networks')
      .update(updateData)
      .eq('id', networkId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating network status:', error);
    throw error;
  }
};

// Get detailed network information
export const getNetworkDetails = async (networkId) => {
  try {
    // Get network basic info
    const { data: network, error: networkError } = await supabase
      .from('networks')
      .select('*')
      .eq('id', networkId)
      .single();

    if (networkError) throw networkError;

    // Get profiles separately
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, contact_email, role, created_at, last_active')
      .eq('network_id', networkId);

    if (profilesError) {
      console.warn('Error fetching profiles:', profilesError);
    }

    // Get event count
    const { count: eventCount } = await supabase
      .from('network_events')
      .select('*', { count: 'exact', head: true })
      .eq('network_id', networkId);

    // Get news count
    const { count: newsCount } = await supabase
      .from('network_news')
      .select('*', { count: 'exact', head: true })
      .eq('network_id', networkId);

    // Get files data
    const { data: files } = await supabase
      .from('network_files')
      .select('file_size, created_at')
      .eq('network_id', networkId);

    // Calculate additional metrics
    const totalFileSize = files?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;
    const adminCount = profiles?.filter(p => p.role === 'admin').length || 0;
    const memberCount = profiles?.filter(p => p.role === 'member').length || 0;

    return {
      ...network,
      profiles: profiles || [],
      storage_used_mb: Math.round(totalFileSize / (1024 * 1024)),
      admin_count: adminCount,
      member_count: memberCount,
      total_members: profiles?.length || 0,
      event_count: eventCount || 0,
      news_count: newsCount || 0
    };
  } catch (error) {
    console.error('Error fetching network details:', error);
    throw error;
  }
};

// Export network data to CSV
export const exportNetworkData = async () => {
  try {
    const networks = await fetchAllNetworks();
    
    // Create CSV headers
    const headers = [
      'Network ID',
      'Network Name',
      'Created Date',
      'Members',
      'Subscription Plan',
      'Status',
      'Storage Used (MB)',
      'Admin Email',
      'Last Activity'
    ];

    // Create CSV rows
    const rows = networks.map(network => [
      network.id,
      network.name,
      new Date(network.created_at).toLocaleDateString(),
      network.member_count,
      network.subscription_plan || 'free',
      network.status || 'active',
      network.storage_used_mb,
      network.admin_email || '',
      network.last_activity ? new Date(network.last_activity).toLocaleDateString() : 'N/A'
    ]);

    // Convert to CSV format
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  } catch (error) {
    console.error('Error exporting network data:', error);
    throw error;
  }
};

// Get user activity across all networks
export const getUserActivity = async (limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        contact_email,
        last_active,
        created_at,
        networks!inner(
          name
        )
      `)
      .order('last_active', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user activity:', error);
    throw error;
  }
};

// Get system health metrics
export const getSystemHealth = async () => {
  try {
    // Get database size and performance metrics
    const { data: dbStats, error: dbError } = await supabase
      .rpc('get_database_stats'); // You'll need to create this RPC function

    if (dbError) {
      console.warn('Could not fetch database stats:', dbError);
    }

    // Get recent errors (if you have error logging)
    const { data: recentErrors, error: errorsError } = await supabase
      .from('error_logs') // If you have error logging table
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (errorsError) {
      console.warn('Could not fetch recent errors:', errorsError);
    }

    return {
      database: dbStats || {},
      errors: recentErrors || [],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching system health:', error);
    throw error;
  }
};

// Update subscription plan for a network
export const updateNetworkSubscription = async (networkId, newPlan, subscriptionData = {}) => {
  try {
    const updateData = {
      subscription_plan: newPlan,
      subscription_status: subscriptionData.status || 'active',
      subscription_end_date: subscriptionData.endDate || null,
      stripe_customer_id: subscriptionData.customerId || null,
      stripe_subscription_id: subscriptionData.subscriptionId || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('networks')
      .update(updateData)
      .eq('id', networkId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating network subscription:', error);
    throw error;
  }
};