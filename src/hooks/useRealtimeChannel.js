import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseclient';

/**
 * Custom hook for managing Supabase realtime channels
 * Consolidates multiple subscriptions into a single channel
 */
export const useRealtimeChannel = (channelName, options = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const channelRef = useRef(null);
  const subscriptionsRef = useRef(new Map());

  useEffect(() => {
    // Create or reuse channel
    if (!channelRef.current) {
      channelRef.current = supabase.channel(channelName, {
        config: {
          broadcast: { self: true },
          presence: { key: options.presenceKey },
          ...options.config
        }
      });
    }

    const channel = channelRef.current;

    // Subscribe to channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setConnectionError(null);
      } else if (status === 'CHANNEL_ERROR') {
        setConnectionError(new Error('Failed to connect to realtime channel'));
        setIsConnected(false);
      } else if (status === 'CLOSED') {
        setIsConnected(false);
      }
    });

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      subscriptionsRef.current.clear();
    };
  }, [channelName, options.presenceKey]);

  /**
   * Add a database change subscription
   * @param {Object} config - Supabase realtime config
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  const onDatabaseChange = (config, callback) => {
    if (!channelRef.current) return () => {};

    const subscriptionId = `${config.event}_${config.table}_${config.filter || 'all'}`;
    
    // Remove existing subscription if it exists
    if (subscriptionsRef.current.has(subscriptionId)) {
      const existingCallback = subscriptionsRef.current.get(subscriptionId);
      channelRef.current.off('postgres_changes', existingCallback);
    }

    // Add new subscription
    channelRef.current.on('postgres_changes', config, callback);
    subscriptionsRef.current.set(subscriptionId, callback);

    // Return unsubscribe function
    return () => {
      if (channelRef.current && subscriptionsRef.current.has(subscriptionId)) {
        channelRef.current.off('postgres_changes', callback);
        subscriptionsRef.current.delete(subscriptionId);
      }
    };
  };

  /**
   * Add a presence subscription
   * @param {Object} config - Presence config
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  const onPresence = (config, callback) => {
    if (!channelRef.current) return () => {};

    channelRef.current.on('presence', config, callback);

    return () => {
      if (channelRef.current) {
        channelRef.current.off('presence', callback);
      }
    };
  };

  /**
   * Add a broadcast subscription
   * @param {Object} config - Broadcast config
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  const onBroadcast = (config, callback) => {
    if (!channelRef.current) return () => {};

    channelRef.current.on('broadcast', config, callback);

    return () => {
      if (channelRef.current) {
        channelRef.current.off('broadcast', callback);
      }
    };
  };

  /**
   * Track presence for current user
   * @param {Object} state - Presence state
   */
  const trackPresence = async (state) => {
    if (!channelRef.current || !isConnected) return;

    await channelRef.current.track(state);
  };

  /**
   * Send broadcast message
   * @param {Object} event - Event to broadcast
   */
  const broadcast = async (event) => {
    if (!channelRef.current || !isConnected) return;

    await channelRef.current.send(event);
  };

  return {
    channel: channelRef.current,
    isConnected,
    connectionError,
    onDatabaseChange,
    onPresence,
    onBroadcast,
    trackPresence,
    broadcast
  };
};

export default useRealtimeChannel;