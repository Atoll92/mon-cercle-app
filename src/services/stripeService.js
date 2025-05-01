// src/services/stripeService.js
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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId,
        userId: user.id,
        networkId,
        successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`,
      },
    });

    if (error) throw error;

    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe failed to load');

    // Redirect to checkout
    if (data.url) {
      window.location.href = data.url;
    } else {
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
      if (stripeError) throw stripeError;
    }

  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};