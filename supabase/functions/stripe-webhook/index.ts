// stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Get the signature from the header
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      console.error('Missing Stripe signature')
      return new Response(
        JSON.stringify({ error: 'Missing stripe signature' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }
    
    // Get environment variables
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Initialize Stripe and Supabase
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get the raw request body
    const body = await req.text()
    
    // Log request for debugging
    console.log('Received webhook. Signature:', signature.substring(0, 20) + '...')
    console.log('Webhook Secret starts with:', webhookSecret.substring(0, 4) + '...')
    
    // IMPORTANT CHANGE: Use constructEventAsync instead of constructEvent
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    )
    
    console.log(`Event received: ${event.type}`)
    
    // Process event based on type
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('Session object:', JSON.stringify(session, null, 2))
        
        // Extract metadata
        const { networkId } = session.metadata || {}
        
        if (!networkId) {
          console.error('No network ID in metadata:', session.metadata)
          return new Response(
            JSON.stringify({ error: 'Missing networkId in metadata' }), 
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          )
        }
        
        console.log(`Updating network ${networkId} for checkout.session.completed`)
        
        // Get the price ID - handle different versions of the API response structure
        const priceId = session.line_items?.data?.[0]?.price?.id || 
                      session.display_items?.[0]?.plan?.id || 
                      session.price_id
                      
        console.log('Price ID:', priceId)
        
        // Update network subscription status
        const { data, error } = await supabase
          .from('networks')
          .update({
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            subscription_status: 'active',
            subscription_plan: getPlanFromPriceId(session.amount_total, priceId),
            subscription_end_date: null // Will be updated when we get more subscription details
          })
          .eq('id', networkId)
          .select()
        
        if (error) {
          console.error('Database update error:', error)
          return new Response(
            JSON.stringify({ error: 'Database update failed', details: error }), 
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          )
        }
        
        console.log('Network updated successfully:', data)
        break
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()
        
        // Get price ID from subscription
        const priceId = subscription.items.data[0]?.price?.id || 'unknown'
        console.log('Subscription updated. Price ID:', priceId)
        
        const { data, error } = await supabase
          .from('networks')
          .update({
            subscription_status: subscription.status,
            subscription_plan: getPlanFromPriceId(
              subscription.items.data[0]?.price?.unit_amount,
              priceId
            ),
            subscription_end_date: currentPeriodEnd
          })
          .eq('stripe_subscription_id', subscription.id)
          .select()
        
        if (error) {
          console.error('Database update error:', error)
          return new Response(
            JSON.stringify({ error: 'Database update failed', details: error }), 
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          )
        }
        
        console.log('Network subscription updated successfully:', data)
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        
        const { data, error } = await supabase
          .from('networks')
          .update({
            subscription_status: 'canceled',
            subscription_plan: 'community'
          })
          .eq('stripe_subscription_id', subscription.id)
          .select()
        
        if (error) {
          console.error('Database update error:', error)
          return new Response(
            JSON.stringify({ error: 'Database update failed', details: error }), 
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          )
        }
        
        console.log('Network subscription canceled successfully:', data)
        break
      }
    }
    
    return new Response(
      JSON.stringify({ received: true, event_type: event.type }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(
      JSON.stringify({ error: err.message }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

function getPlanFromPriceId(amount: number | null, priceId: string | undefined): string {
  console.log('Determining plan from price:', { amount, priceId })
  
  // Map price IDs to plan names
  const priceToPlans: Record<string, string> = {
    'price_1RSy002KqNIKpvjTG7YyuZZ6': 'community', // Community plan €17/month
    'price_1RK6Vk2KqNIKpvjTKgFNpV0y': 'organization',
    'price_1RK6qr2KqNIKpvjTZh47uSJO': 'organization', // Added based on your PricingPage.jsx
    'price_nonprofit': 'nonprofit',
    'price_organization': 'organization',
    'price_network': 'network',
    'price_business': 'business',
    // Add annual plan mappings
  }
  
  // Try to match by price ID
  if (priceId && priceToPlans[priceId]) {
    console.log(`Found matching plan for price ID ${priceId}: ${priceToPlans[priceId]}`)
    return priceToPlans[priceId]
  }
  
  // Fallback to matching by amount (in cents)
  if (amount === 1700) return 'community'  // €17
  if (amount === 4900) return 'nonprofit'  // €49
  if (amount === 9700) return 'organization'  // €97
  if (amount === 24700) return 'network'  // €247
  if (amount === 49700) return 'business'  // €497
  
  console.log(`No matching plan found, defaulting to community. Amount: ${amount}, PriceID: ${priceId}`)
  return 'community'
}