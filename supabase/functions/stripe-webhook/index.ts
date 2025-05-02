import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      console.error("Missing Stripe signature")
      return new Response('Missing signature', {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }
    
    const body = await req.text()
    
    // Log the incoming webhook data for debugging
    console.log("Incoming webhook payload:", body.substring(0, 500) + "...")
    console.log("Signature:", signature)
    
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET')
    }
    
    // Construct the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      )
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(`Webhook signature verification failed: ${err.message}`, { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      })
    }
    
    console.log(`Webhook event received: ${event.type}`)
    
    // Rest of your code to handle different events...
    if (event.type === 'checkout.session.completed') {
      // Your existing code...
    }
    
    // Handle invoice.payment_succeeded event (this was in your error message)
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object
      console.log('Invoice payment succeeded. Invoice ID:', invoice.id)
      
      // Get subscription ID from the invoice
      const subscriptionId = invoice.subscription
      
      if (subscriptionId) {
        // Look up the network that has this subscription ID
        const { data: networks, error: networkError } = await supabase
          .from('networks')
          .select('id')
          .eq('stripe_subscription_id', subscriptionId)
          .limit(1)
        
        if (networkError) {
          console.error('Error finding network:', networkError)
        } else if (networks && networks.length > 0) {
          const networkId = networks[0].id
          
          // Update the subscription status
          const { data, error } = await supabase
            .from('networks')
            .update({
              subscription_status: 'active',
              subscription_updated_at: new Date().toISOString()
            })
            .eq('id', networkId)
          
          if (error) {
            console.error('Error updating network:', error)
          } else {
            console.log('Network updated successfully:', data)
          }
        } else {
          console.log('No network found with subscription ID:', subscriptionId)
        }
      }
    }
    
    // Return a success response
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error(`Webhook error: ${err.message}`)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})