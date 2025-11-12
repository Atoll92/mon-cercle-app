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
    if (!network?.features_config) {
      console.log('[ActivityFeedWidget] No features_config found');
      return false;
    }

    try {
      const config = typeof network.features_config === 'string'
        ? JSON.parse(network.features_config)
        : network.features_config;

      console.log('[ActivityFeedWidget] Features config:', config);
      console.log('[ActivityFeedWidget] Activity feed enabled:', config.activity_feed);

      return config.activity_feed === true;
    } catch (e) {
      console.error('[ActivityFeedWidget] Error parsing features config:', e);
      return false;
    }
  }, [network?.features_config]);

  // Debug logging
  React.useEffect(() => {
    console.log('[ActivityFeedWidget] Network ID:', network?.id);
    console.log('[ActivityFeedWidget] Network name:', network?.name);
    console.log('[ActivityFeedWidget] Is enabled:', isActivityFeedEnabled);

    if (!network?.id) {
      console.log('[ActivityFeedWidget] Not rendering: No network ID');
    } else if (!isActivityFeedEnabled) {
      console.log('[ActivityFeedWidget] Not rendering: Activity feed not enabled in network settings');
      console.log('[ActivityFeedWidget] To enable: Go to Network Settings → Features & Modules → Enable Activity Feed');
    }
  }, [network?.id, network?.name, isActivityFeedEnabled]);

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
