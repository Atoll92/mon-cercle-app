// src/services/subscriptionService.js
import { supabase } from '../supabaseclient';

/**
 * Cancel a subscription
 * @param {string} networkId - The ID of the network
 * @param {boolean} cancelAtPeriodEnd - Whether to cancel at the end of the billing period
 * @returns {Promise<Object>} - The result of the cancellation
 */
export const cancelSubscription = async (networkId, cancelAtPeriodEnd = true) => {
  try {
    const { data, error } = await supabase.functions.invoke('manage-subscription', {
      body: {
        action: 'cancel',
        networkId,
        cancelAtPeriodEnd
      }
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

/**
 * Reactivate a canceled subscription
 * @param {string} networkId - The ID of the network
 * @returns {Promise<Object>} - The result of the reactivation
 */
export const reactivateSubscription = async (networkId) => {
  try {
    const { data, error } = await supabase.functions.invoke('manage-subscription', {
      body: {
        action: 'reactivate',
        networkId
      }
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
};

/**
 * Get a URL to the Stripe customer portal
 * @param {string} networkId - The ID of the network
 * @returns {Promise<string>} - The URL to the customer portal
 */
export const getCustomerPortalUrl = async (networkId) => {
  try {
    const { data, error } = await supabase.functions.invoke('manage-subscription', {
      body: {
        action: 'get_portal_session',
        networkId
      }
    });

    if (error) {
      throw error;
    }

    return data.url;
  } catch (error) {
    console.error('Error getting customer portal URL:', error);
    throw error;
  }
};

/**
 * Get invoices for a subscription
 * @param {string} networkId - The ID of the network
 * @returns {Promise<Array>} - The invoices
 */
export const getInvoices = async (networkId) => {
  try {
    const { data, error } = await supabase.functions.invoke('manage-subscription', {
      body: {
        action: 'get_invoices',
        networkId
      }
    });

    if (error) {
      throw error;
    }

    return data.invoices;
  } catch (error) {
    console.error('Error getting invoices:', error);
    throw error;
  }
};

/**
 * Get subscription details from the database
 * @param {string} networkId - The ID of the network
 * @returns {Promise<Object>} - The subscription details
 */
export const getSubscriptionDetails = async (networkId) => {
  try {
    const { data, error } = await supabase
      .from('networks')
      .select('subscription_status, subscription_plan, subscription_end_date, stripe_customer_id, stripe_subscription_id')
      .eq('id', networkId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting subscription details:', error);
    throw error;
  }
};

/**
 * Update the BillingPage with real invoice data instead of mock data
 * @param {Object} props - Component props
 * @param {string} props.networkId - The ID of the network
 * @returns {Promise<Array>} - The invoices
 */
export const loadRealInvoices = async (networkId) => {
  try {
    // First check if the network has a Stripe customer ID
    const { data: network, error: networkError } = await supabase
      .from('networks')
      .select('stripe_customer_id')
      .eq('id', networkId)
      .single();
      
    if (networkError || !network?.stripe_customer_id) {
      console.log('No customer ID found for this network');
      return [];
    }
    
    // Get the invoices from Stripe via our Edge Function
    return await getInvoices(networkId);
  } catch (error) {
    console.error('Error loading invoices:', error);
    return [];
  }
};