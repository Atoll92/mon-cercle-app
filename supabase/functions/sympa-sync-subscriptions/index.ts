// Edge Function: sympa-sync-subscriptions
// Purpose: Sync member category preferences to Sympa lists
// This function processes pending subscriptions and sends SUB/UNSUB commands to Sympa
/// <reference types="https://esm.sh/@types/node@18/index.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SYMPA_COMMAND_EMAIL = Deno.env.get('SYMPA_COMMAND_EMAIL') || 'sympa@lists.riseup.net'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@your-domain.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SyncRequest {
  profileId?: string // If provided, sync only this profile
  batchSize?: number // Number of pending subscriptions to process (default: 50)
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
    const { profileId, batchSize = 50 }: SyncRequest = await req.json()

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`🔄 Starting Sympa subscription sync${profileId ? ` for profile ${profileId}` : ' (batch mode)'}`)

    // Fetch pending subscriptions
    let query = supabase
      .from('sympa_subscriptions')
      .select(`
        id,
        profile_id,
        email,
        status,
        sympa_lists (
          list_name,
          list_email,
          category
        )
      `)
      .in('status', ['pending', 'error'])
      .limit(batchSize)

    if (profileId) {
      query = query.eq('profile_id', profileId)
    }

    const { data: subscriptions, error: fetchError } = await query

    if (fetchError) {
      throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`)
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('✅ No pending subscriptions to sync')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending subscriptions',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 Found ${subscriptions.length} subscriptions to process`)

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process each subscription
    for (const subscription of subscriptions) {
      try {
        const listName = subscription.sympa_lists.list_name
        const listEmail = subscription.sympa_lists.list_email
        const userEmail = subscription.email
        const isUnsubscribe = subscription.status === 'unsubscribed'

        // Build Sympa command
        // Format: SUB listname email name OR UNSUB listname email
        let sympaCommand: string
        if (isUnsubscribe) {
          sympaCommand = `SIGNOFF ${listName}`
        } else {
          sympaCommand = `SUBSCRIBE ${listName}`
        }

        console.log(`📧 Sending command: ${sympaCommand} for ${userEmail}`)

        // Send email via Resend API
        // IMPORTANT: For Sympa to work, the From address must be the user's email
        // So we send the command email from the user's address
        const emailPayload = {
          from: userEmail, // User's email (must be authorized sender in Resend)
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
          throw new Error(`Resend API error: ${JSON.stringify(errorData)}`)
        }

        const resendResult = await resendResponse.json()
        console.log(`✅ Command sent successfully: ${resendResult.id}`)

        // Update subscription status
        const newStatus = isUnsubscribe ? 'unsubscribed' : 'subscribed'
        await supabase
          .from('sympa_subscriptions')
          .update({
            status: newStatus,
            last_synced_at: new Date().toISOString(),
            sync_error: null
          })
          .eq('id', subscription.id)

        results.success++

      } catch (error) {
        console.error(`❌ Failed to sync subscription ${subscription.id}:`, error)

        // Update subscription with error
        await supabase
          .from('sympa_subscriptions')
          .update({
            status: 'error',
            sync_error: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id)

        results.failed++
        results.errors.push(`${subscription.email}: ${error.message}`)
      }
    }

    console.log(`✅ Sync complete: ${results.success} succeeded, ${results.failed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${subscriptions.length} subscriptions`,
        processed: subscriptions.length,
        succeeded: results.success,
        failed: results.failed,
        errors: results.errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in sympa-sync-subscriptions:', error)
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
