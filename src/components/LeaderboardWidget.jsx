/**
 * LeaderboardWidget Component
 * Compact leaderboard widget for dashboard
 */

import React from 'react';
import Leaderboard from './Leaderboard';
import { useNetwork } from '../context/networkContext';

/**
 * LeaderboardWidget - Compact version for dashboard
 */
const LeaderboardWidget = () => {
  const { currentNetwork } = useNetwork();

  // Check if activity feed feature is enabled
  const isActivityFeedEnabled = React.useMemo(() => {
    if (!currentNetwork?.features_config) return false;

    try {
      const config = typeof currentNetwork.features_config === 'string'
        ? JSON.parse(currentNetwork.features_config)
        : currentNetwork.features_config;
      return config.activity_feed === true;
    } catch (e) {
      console.error('Error parsing features config:', e);
      return false;
    }
  }, [currentNetwork?.features_config]);

  if (!currentNetwork?.id || !isActivityFeedEnabled) {
    return null;
  }

  return (
    <Leaderboard
      networkId={currentNetwork.id}
      limit={5}
      defaultTab="overall"
      compact={true}
    />
  );
};

export default LeaderboardWidget;
