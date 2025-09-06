// API functions for fetching notification history
import { supabase } from '../supabaseclient';
import { handleArrayError } from '../utils/errorHandling';

/**
 * Fetch notification history for a network
 * @param {string} networkId - The network ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated notification data
 */
export const fetchNotificationHistory = async (networkId, options = {}) => {
  try {
    const {
      page = 0,
      limit = 20,
      notificationType = null,
      recipientId = null,
      startDate = null,
      endDate = null,
      sentStatus = null // 'sent', 'pending', 'failed', or null for all
    } = options;

    // Build query
    let query = supabase
      .from('notification_queue')
      .select(`
        *,
        recipient:profiles!recipient_id(
          id,
          full_name,
          profile_picture_url,
          contact_email
        )
      `, { count: 'exact' })
      .eq('network_id', networkId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (notificationType) {
      query = query.eq('notification_type', notificationType);
    }

    if (recipientId) {
      query = query.eq('recipient_id', recipientId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Filter by sent status
    if (sentStatus === 'sent') {
      query = query.eq('is_sent', true);
    } else if (sentStatus === 'pending') {
      query = query.eq('is_sent', false).is('error_message', null);
    } else if (sentStatus === 'failed') {
      query = query.not('error_message', 'is', null);
    }

    // Apply pagination
    const from = page * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    console.log(`📧 [NotificationHistory] Query result:`, {
      dataLength: data?.length,
      count,
      firstItem: data?.[0],
      error
    });

    return {
      notifications: data || [],
      totalCount: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (error) {
    console.error('Error fetching notification history:', error);
    return {
      notifications: [],
      totalCount: 0,
      page: 0,
      limit: 20,
      totalPages: 0,
      error: error.message
    };
  }
};

/**
 * Get notification statistics for a network
 * @param {string} networkId - The network ID
 * @returns {Promise<Object>} Notification statistics
 */
export const fetchNotificationStats = async (networkId) => {
  try {
    // Get all notifications for the network
    const { data, error } = await supabase
      .from('notification_queue')
      .select('is_sent, error_message, notification_type, created_at')
      .eq('network_id', networkId);

    if (error) throw error;

    const notifications = data || [];
    
    // Calculate statistics
    const stats = {
      total: notifications.length,
      sent: notifications.filter(n => n.is_sent).length,
      pending: notifications.filter(n => !n.is_sent && !n.error_message).length,
      failed: notifications.filter(n => n.error_message).length,
      byType: {},
      recentActivity: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0
      }
    };

    // Count by notification type
    const notificationTypes = ['news', 'event', 'mention', 'direct_message', 'post', 'event_proposal', 'event_status', 'event_reminder', 'comment', 'comment_reply'];
    notificationTypes.forEach(type => {
      stats.byType[type] = notifications.filter(n => n.notification_type === type).length;
    });

    // Calculate recent activity
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    notifications.forEach(n => {
      const createdAt = new Date(n.created_at);
      if (createdAt >= today) stats.recentActivity.today++;
      if (createdAt >= thisWeek) stats.recentActivity.thisWeek++;
      if (createdAt >= thisMonth) stats.recentActivity.thisMonth++;
    });

    return { success: true, stats };
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return { success: false, error: error.message, stats: null };
  }
};

/**
 * Export notification history as CSV
 * @param {string} networkId - The network ID
 * @param {Object} filters - Same filters as fetchNotificationHistory
 * @returns {Promise<string>} CSV data
 */
export const exportNotificationHistory = async (networkId, filters = {}) => {
  try {
    // Fetch all notifications without pagination
    const allNotifications = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await fetchNotificationHistory(networkId, {
        ...filters,
        page,
        limit: 100
      });

      if (result.notifications.length > 0) {
        allNotifications.push(...result.notifications);
        page++;
        hasMore = page < result.totalPages;
      } else {
        hasMore = false;
      }
    }

    // Create CSV header
    const headers = [
      'Date',
      'Time',
      'Type',
      'Recipient',
      'Email',
      'Subject',
      'Status',
      'Error'
    ];

    // Create CSV rows
    const rows = allNotifications.map(notification => {
      const date = new Date(notification.created_at);
      const status = notification.is_sent ? 'Sent' : (notification.error_message ? 'Failed' : 'Pending');
      
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        notification.notification_type,
        notification.recipient?.full_name || 'Unknown',
        notification.recipient?.contact_email || '',
        notification.subject_line,
        status,
        notification.error_message || ''
      ];
    });

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
  } catch (error) {
    console.error('Error exporting notification history:', error);
    throw error;
  }
};