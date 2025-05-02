import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../supabaseclient';
import { STRIPE_PUBLIC_KEY } from '../stripe/config';

let stripePromise;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

export const createCheckoutSession = async (priceId, networkId) => {
  try {
    console.log('Starting checkout with price ID:', priceId);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Log the parameters we're sending to the function
    console.log('Creating checkout session with:', {
      priceId,
      userId: user.id,
      networkId,
      successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/pricing`,
    });

    // Create a direct request to the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId,
        userId: user.id,
        networkId,
        successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`,
      },
    });

    if (error) {
      console.error('Function invoke error:', error);
      throw error;
    }

    // Log the response for debugging
    console.log('Checkout session response:', data);

    // Handle the redirect to Stripe
    if (data.url) {
      window.location.href = data.url;
    } else if (data.sessionId) {
      const stripe = await getStripe();
      if (!stripe) throw new Error('Stripe failed to load');
      
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
      
      if (stripeError) throw stripeError;
    } else {
      throw new Error('No checkout URL or session ID received');
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

