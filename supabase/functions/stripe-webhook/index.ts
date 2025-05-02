// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

serve(async (req) => {
  try {
    // Get the signature from the header
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      console.error('Missing Stripe signature')
      return new Response('Webhook Error: Missing stripe signature', { status: 400 })
    }
    
    // Get the raw request body
    const body = await req.text()
    
    // Verify the event
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
    
    console.log(`Event received: ${event.type}`)
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const { userId, networkId } = session.metadata || {}
        
        if (!networkId) {
          console.error('No network ID in metadata')
          return new Response('Missing networkId in metadata', { status: 400 })
        }
        
        // Update network subscription status
        const { error } = await supabase
          .from('networks')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_status: 'active',
            subscription_plan: getPlanFromPriceId(session.amount_total, session.price_id),
            subscription_end_date: null // Will be updated when we get more subscription details
          })
          .eq('id', networkId)
        
        if (error) {
          console.error('Database update error:', error)
          throw error
        }
        
        break
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()
        
        const { error } = await supabase
          .from('networks')
          .update({
            subscription_status: subscription.status,
            subscription_plan: getPlanFromPriceId(
              subscription.items.data[0].price.unit_amount,
              subscription.items.data[0].price.id
            ),
            subscription_end_date: currentPeriodEnd
          })
          .eq('stripe_subscription_id', subscription.id)
        
        if (error) {
          console.error('Database update error:', error)
          throw error
        }
        
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        
        const { error } = await supabase
          .from('networks')
          .update({
            subscription_status: 'canceled',
            subscription_plan: 'community'
          })
          .eq('stripe_subscription_id', subscription.id)
        
        if (error) {
          console.error('Database update error:', error)
          throw error
        }
        
        break
      }
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(err.message, { status: 400 })
  }
})

function getPlanFromPriceId(amount: number | null, priceId: string): string {
  // Map price IDs to plan names
  const priceToPlans: Record<string, string> = {
    'price_1RK6Vk2KqNIKpvjTKgFNpV0y': 'organization',
    'price_nonprofit': 'nonprofit',
    'price_organization': 'organization',
    'price_network': 'network',
    'price_business': 'business',
    // Add annual plan mappings
  }
  
  // Try to match by price ID
  if (priceId && priceToPlans[priceId]) {
    return priceToPlans[priceId]
  }
  
  // Fallback to matching by amount
  if (amount === 4900) return 'nonprofit'
  if (amount === 9700) return 'organization'
  if (amount === 24700) return 'network'
  if (amount === 49700) return 'business'
  
  return 'community'
}