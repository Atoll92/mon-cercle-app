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

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const { userId, networkId } = session.metadata

        // Update network subscription status
        await supabase
          .from('networks')
          .update({
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            subscription_status: 'active',
            subscription_plan: getPlanFromPriceId(session.price_id)
          })
          .eq('id', networkId)

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        
        await supabase
          .from('networks')
          .update({
            subscription_status: subscription.status,
            subscription_plan: getPlanFromPriceId(subscription.items.data[0].price.id)
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        
        await supabase
          .from('networks')
          .update({
            subscription_status: 'canceled',
            subscription_plan: 'community'
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(err.message, { status: 400 })
  }
})

function getPlanFromPriceId(priceId: string): string {
  // Map price IDs to plan names
  const priceToPlans = {
    'price_nonprofit': 'nonprofit',
    'price_organization': 'organization',
    'price_network': 'network',
    'price_business': 'business',
    // Add annual plan mappings
  }
  
  return priceToPlans[priceId] || 'community'
}