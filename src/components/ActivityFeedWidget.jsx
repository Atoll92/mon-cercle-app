/**
 * ActivityFeedWidget Component
 * Compact activity feed widget for dashboard
 */

import React from 'react';
import ActivityFeed from './ActivityFeed';
import { useNetwork } from '../context/networkContext';

/**
 * ActivityFeedWidget - Compact version for dashboard
 */
const ActivityFeedWidget = () => {
  const { network } = useNetwork();

  // Check if activity feed feature is enabled
  const isActivityFeedEnabled = React.useMemo(() => {
    if (!network?.features_config) return false;

    try {
      const config = typeof network.features_config === 'string'
        ? JSON.parse(network.features_config)
        : network.features_config;
      return config.activity_feed === true;
    } catch (e) {
      console.error('Error parsing features config:', e);
      return false;
    }
  }, [network?.features_config]);

  if (!network?.id || !isActivityFeedEnabled) {
    return null;
  }

  return (
    <ActivityFeed
      networkId={network.id}
      limit={10}
      compact={true}
      autoRefresh={true}
    />
  );
};

export default ActivityFeedWidget;
