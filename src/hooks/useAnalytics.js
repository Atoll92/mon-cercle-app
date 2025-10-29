/**
 * useAnalytics Hook
 * Provides easy access to analytics tracking functions
 */

import { useCallback } from 'react';
import { supabase } from '../supabaseclient';
import { trackEvent, trackError } from '../api/analytics';

/**
 * Hook for tracking analytics events
 * @returns {Object} Analytics tracking functions
 */
export const useAnalytics = () => {

  /**
   * Track a custom event
   * @param {string} eventType - Type of event
   * @param {Object} options - Event options (userId, networkId, profileId, metadata)
   */
  const track = useCallback(async (eventType, options = {}) => {
    try {
      await trackEvent(supabase, eventType, options);
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Fail silently to not disrupt user experience
    }
  }, [supabase]);

  /**
   * Track an error
   * @param {Error} error - Error object
   * @param {Object} context - Error context (component, action, networkId, profileId)
   */
  const trackErrorEvent = useCallback(async (error, context = {}) => {
    try {
      await trackError(supabase, error, context);
    } catch (err) {
      console.error('Error tracking error event:', err);
      // Fail silently
    }
  }, [supabase]);

  /**
   * Track user login
   */
  const trackLogin = useCallback(async () => {
    await track('user_login');
  }, [track]);

  /**
   * Track network creation
   * @param {string} networkId - Network ID
   * @param {Object} metadata - Additional metadata
   */
  const trackNetworkCreated = useCallback(async (networkId, metadata = {}) => {
    await track('network_created', {
      networkId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });
  }, [track]);

  /**
   * Track member invitation
   * @param {string} networkId - Network ID
   * @param {number} count - Number of members invited
   */
  const trackMemberInvited = useCallback(async (networkId, count = 1) => {
    await track('member_invited', {
      networkId,
      metadata: { count }
    });
  }, [track]);

  /**
   * Track member joined
   * @param {string} networkId - Network ID
   * @param {string} profileId - Profile ID
   */
  const trackMemberJoined = useCallback(async (networkId, profileId) => {
    await track('member_joined', {
      networkId,
      profileId
    });
  }, [track]);

  /**
   * Track profile completion
   * @param {string} profileId - Profile ID
   * @param {string} networkId - Network ID
   * @param {Object} metadata - Profile completion details
   */
  const trackProfileCompleted = useCallback(async (profileId, networkId, metadata = {}) => {
    await track('profile_completed', {
      profileId,
      networkId,
      metadata
    });
  }, [track]);

  /**
   * Track first post creation
   * @param {string} profileId - Profile ID
   * @param {string} networkId - Network ID
   * @param {string} postType - Type of post (portfolio, news, etc.)
   */
  const trackFirstPostCreated = useCallback(async (profileId, networkId, postType = 'portfolio') => {
    await track('first_post_created', {
      profileId,
      networkId,
      metadata: { postType }
    });
  }, [track]);

  /**
   * Track event creation
   * @param {string} networkId - Network ID
   * @param {string} profileId - Profile ID
   */
  const trackFirstEventCreated = useCallback(async (networkId, profileId) => {
    await track('first_event_created', {
      networkId,
      profileId
    });
  }, [track]);

  /**
   * Track feature usage
   * @param {string} feature - Feature name (messaging, wiki, files, etc.)
   * @param {Object} options - Additional options
   */
  const trackFeatureUsed = useCallback(async (feature, options = {}) => {
    await track('feature_used', {
      ...options,
      metadata: {
        feature,
        ...options.metadata
      }
    });
  }, [track]);

  /**
   * Track network setup completion
   * @param {string} networkId - Network ID
   * @param {Object} metadata - Setup details
   */
  const trackNetworkSetupCompleted = useCallback(async (networkId, metadata = {}) => {
    await track('network_setup_completed', {
      networkId,
      metadata
    });
  }, [track]);

  return {
    track,
    trackError: trackErrorEvent,
    trackLogin,
    trackNetworkCreated,
    trackMemberInvited,
    trackMemberJoined,
    trackProfileCompleted,
    trackFirstPostCreated,
    trackFirstEventCreated,
    trackFeatureUsed,
    trackNetworkSetupCompleted
  };
};
