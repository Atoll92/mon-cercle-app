import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// Handle CORS preflight requests
serve(async (req) => {
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
    
    console.log("Verifying webhook signature...")
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET')
    }

    // Construct the event
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
    
    console.log(`Webhook event received: ${event.type}`)

    // Handle checkout.session.completed events
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('Checkout session completed. Session ID:', session.id)
      
      // Extract metadata from the session
      const { userId, networkId } = session.metadata || {}
      if (!userId || !networkId) {
        console.error('Missing userId or networkId in session metadata')
        return new Response(JSON.stringify({ error: 'Missing metadata' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
      }
      
      console.log(`Updating network ${networkId} with subscription info`)
      console.log('Subscription ID:', session.subscription)
      console.log('Customer ID:', session.customer)
      
      // Update network subscription status - hardcode the plan for simplicity
      const { data, error } = await supabase
        .from('networks')
        .update({
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          subscription_status: 'active',
          subscription_plan: 'organization',
          subscription_updated_at: new Date().toISOString(),
          subscription_start_date: new Date().toISOString()
        })
        .eq('id', networkId)
        .select()
      
      if (error) {
        console.error('Error updating network:', error)
      } else {
        console.log('Network updated successfully:', data)
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