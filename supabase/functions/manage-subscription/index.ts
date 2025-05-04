// supabase/functions/manage-subscription/index.js
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Get environment variables
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables')
    }
    
    // Initialize Stripe and Supabase
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse the request body
    const { action, networkId, subscriptionId, cancelAtPeriodEnd = true } = await req.json()
    
    // Validate required parameters
    if (!action) {
      throw new Error('Action is required')
    }
    
    if (!networkId && !subscriptionId) {
      throw new Error('Either networkId or subscriptionId is required')
    }
    
    // Get the subscription ID if only networkId was provided
    let stripeSubscriptionId = subscriptionId
    
    if (!stripeSubscriptionId && networkId) {
      const { data, error } = await supabase
        .from('networks')
        .select('stripe_subscription_id')
        .eq('id', networkId)
        .single()
        
      if (error || !data.stripe_subscription_id) {
        throw new Error('No subscription found for this network')
      }
      
      stripeSubscriptionId = data.stripe_subscription_id
    }
    
    // Execute the requested action
    switch (action) {
      case 'cancel': {
        // Cancel the subscription
        const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: cancelAtPeriodEnd,
        })
        
        // Update the subscription status in the database
        const { error } = await supabase
          .from('networks')
          .update({
            subscription_status: 'canceled'
          })
          .eq('stripe_subscription_id', stripeSubscriptionId)
        
        if (error) {
          throw error
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            subscription: {
              id: subscription.id,
              status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end
            }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        )
      }
      
      case 'reactivate': {
        // Reactivate a canceled subscription
        const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: false,
        })
        
        // Update the subscription status in the database
        const { error } = await supabase
          .from('networks')
          .update({
            subscription_status: 'active'
          })
          .eq('stripe_subscription_id', stripeSubscriptionId)
          
        if (error) {
          throw error
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            subscription: {
              id: subscription.id,
              status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end
            }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        )
      }
      
      case 'get_portal_session': {
        // First get the customer ID
        let customerId
        
        if (networkId) {
          const { data, error } = await supabase
            .from('networks')
            .select('stripe_customer_id')
            .eq('id', networkId)
            .single()
            
          if (error || !data.stripe_customer_id) {
            throw new Error('No customer found for this network')
          }
          
          customerId = data.stripe_customer_id
        } else {
          // Get customer ID from subscription
          const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
          customerId = subscription.customer
        }
        
        // Create a billing portal session
        const returnUrl = req.headers.get('origin') || 'https://example.com'
        
        const session = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${returnUrl}/billing`,
        })
        
        return new Response(
          JSON.stringify({
            success: true,
            url: session.url
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        )
      }
      
      case 'get_invoices': {
        // First get the customer ID
        let customerId
        
        if (networkId) {
          const { data, error } = await supabase
            .from('networks')
            .select('stripe_customer_id')
            .eq('id', networkId)
            .single()
            
          if (error || !data.stripe_customer_id) {
            throw new Error('No customer found for this network')
          }
          
          customerId = data.stripe_customer_id
        } else {
          // Get customer ID from subscription
          const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
          customerId = subscription.customer
        }
        
        // Get the customer's invoices
        const invoices = await stripe.invoices.list({
          customer: customerId,
          limit: 10,
        })
        
        // Format the invoices for the frontend
        const formattedInvoices = invoices.data.map(invoice => ({
          id: invoice.id,
          number: invoice.number,
          amount: invoice.amount_paid / 100, // Convert from cents to dollars/euros
          status: invoice.status,
          date: new Date(invoice.created * 1000).toISOString(),
          pdf: invoice.invoice_pdf,
          description: invoice.description || 'Subscription payment'
        }))
        
        return new Response(
          JSON.stringify({
            success: true,
            invoices: formattedInvoices
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        )
      }
      
      default:
        throw new Error(`Unsupported action: ${action}`)
    }
  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})