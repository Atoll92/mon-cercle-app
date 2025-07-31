import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // 1. Validate environment variables
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('Missing STRIPE_SECRET_KEY environment variable');
      return new Response(JSON.stringify({
        error: 'Missing STRIPE_SECRET_KEY'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    // 2. Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient()
    });
    // 3. Parse the request body with error handling
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error('Error parsing request body:', e);
      return new Response(JSON.stringify({
        error: 'Invalid request body'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    // 4. Validate request parameters
    const { priceId, userId, networkId, successUrl, cancelUrl } = requestData;
    if (!priceId) {
      return new Response(JSON.stringify({
        error: 'Price ID is required'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    // 5. Log the request for debugging
    console.log('Creating Stripe checkout session with:', {
      priceId,
      userId,
      networkId
    });
    // 6. Create checkout session with proper error handling
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: [
          'card'
        ],
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: successUrl || `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing`,
        metadata: {
          userId,
          networkId
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required'
      });
      // 7. Return the session
      return new Response(JSON.stringify({
        sessionId: session.id,
        url: session.url
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    } catch (stripeError) {
      // Handle specific Stripe errors
      console.error('Stripe error:', stripeError);
      return new Response(JSON.stringify({
        error: stripeError.message,
        type: 'stripe_error',
        code: stripeError.statusCode || 400
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
  } catch (error) {
    // General error handling
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
