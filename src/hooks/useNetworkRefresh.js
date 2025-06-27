import { useEffect, useState } from 'react';

// Global event emitter for network updates
class NetworkRefreshEmitter {
  constructor() {
    this.listeners = new Set();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  emit(networkId) {
    this.listeners.forEach(callback => callback(networkId));
  }
}

// Global instance
const networkRefreshEmitter = new NetworkRefreshEmitter();

// Hook for components that need to refresh when network data changes
export const useNetworkRefresh = (networkId, onRefresh) => {
  useEffect(() => {
    const unsubscribe = networkRefreshEmitter.subscribe((updatedNetworkId) => {
      // Only refresh if it's the same network or if no specific network is specified
      if (!networkId || !updatedNetworkId || networkId === updatedNetworkId) {
        onRefresh?.();
      }
    });

    return unsubscribe;
  }, [networkId, onRefresh]);
};

// Function to trigger network refresh across all components
export const triggerNetworkRefresh = (networkId) => {
  networkRefreshEmitter.emit(networkId);
};

export default useNetworkRefresh;