// Edge Function: sympa-manage-subscription
// Purpose: Manage user subscriptions to Sympa mailing list (subscribe/unsubscribe)
/// <reference types="https://esm.sh/@types/node@18/index.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SYMPA_COMMAND_EMAIL = Deno.env.get('SYMPA_COMMAND_EMAIL') || 'sympa@lists.riseup.net'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@your-domain.com'
const SYMPA_LIST_NAME = 'rezoprospec'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SubscriptionRequest {
  subscriptionId?: string  // For approve/reject
  profileId?: string       // For direct subscribe
  email: string
  action: 'subscribe' | 'unsubscribe' | 'approve' | 'reject'
  authToken?: string       // Optional auth token from Sympa
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Parse request body
    const { subscriptionId, profileId, email, action, authToken }: SubscriptionRequest = await req.json()

    if (!email || !action) {
      throw new Error('Missing required fields: email and action')
    }

    if (!['subscribe', 'unsubscribe', 'approve', 'reject'].includes(action)) {
      throw new Error('Invalid action. Must be "subscribe", "unsubscribe", "approve", or "reject"')
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`📧 Processing Sympa subscription: ${action} for ${email}`)

    let sympaCommand: string
    let newStatus: string | null = null
    let subscriptionQueueId = subscriptionId

    // Build Sympa command based on action
    switch (action) {
      case 'subscribe':
      case 'approve': {
        // For subscribe or approve, we need to add the user to the list
        sympaCommand = authToken
          ? `AUTH ${authToken} ADD ${SYMPA_LIST_NAME} ${email}`
          : `ADD ${SYMPA_LIST_NAME} ${email}`

        newStatus = action === 'approve' ? 'approved' : 'synced'

        // If approving, get the subscription ID if not provided
        if (action === 'approve' && !subscriptionQueueId) {
          const { data: subscription } = await supabase
            .from('sympa_subscription_queue')
            .select('id')
            .eq('email', email)
            .eq('status', 'pending')
            .single()

          if (subscription) {
            subscriptionQueueId = subscription.id
          }
        }
        break
      }

      case 'unsubscribe': {
        sympaCommand = authToken
          ? `AUTH ${authToken} DEL ${SYMPA_LIST_NAME} ${email}`
          : `DEL ${SYMPA_LIST_NAME} ${email}`

        newStatus = 'rejected'
        break
      }

      case 'reject': {
        // For reject, we just update the queue status, no Sympa command needed
        newStatus = 'rejected'
        sympaCommand = '' // No command to send

        if (!subscriptionQueueId && profileId) {
          const { data: subscription } = await supabase
            .from('sympa_subscription_queue')
            .select('id')
            .eq('profile_id', profileId)
            .eq('status', 'pending')
            .single()

          if (subscription) {
            subscriptionQueueId = subscription.id
          }
        }
        break
      }
    }

    // Send Sympa command email if needed
    if (sympaCommand && action !== 'reject') {
      console.log(`📧 Sending Sympa command: ${sympaCommand.substring(0, 50)}...`)

      if (!RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY not configured')
      }

      const emailPayload = {
        from: FROM_EMAIL,
        to: SYMPA_COMMAND_EMAIL,
        subject: sympaCommand,
        text: sympaCommand,
      }

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify(emailPayload)
      })

      if (!resendResponse.ok) {
        const errorData = await resendResponse.json()
        throw new Error(`Failed to send Sympa command email: ${JSON.stringify(errorData)}`)
      }

      const resendResult = await resendResponse.json()
      console.log(`✅ Sympa command email sent successfully: ${resendResult.id}`)
    }

    // Update subscription queue if applicable
    if (subscriptionQueueId && newStatus) {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      if (action === 'approve' || action === 'subscribe') {
        updateData.synced_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('sympa_subscription_queue')
        .update(updateData)
        .eq('id', subscriptionQueueId)

      if (updateError) {
        console.error('Failed to update subscription queue:', updateError)
        // Don't throw here, the Sympa command was already sent
      }
    } else if (profileId && newStatus && (action === 'subscribe' || action === 'unsubscribe')) {
      // Update or create subscription queue entry
      const { error: upsertError } = await supabase
        .from('sympa_subscription_queue')
        .upsert({
          profile_id: profileId,
          email: email,
          status: newStatus,
          synced_at: new Date().toISOString()
        }, {
          onConflict: 'profile_id'
        })

      if (upsertError) {
        console.error('Failed to upsert subscription queue:', upsertError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${action} for ${email}`,
        action,
        email
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in sympa-manage-subscription:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
