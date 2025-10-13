// Edge Function: sympa-batch-moderate
// Purpose: Batch process moderation commands to Sympa at 18h daily
// This function is triggered by cron and sends all pending moderation commands
/// <reference types="https://esm.sh/@types/node@18/index.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SYMPA_COMMAND_EMAIL = Deno.env.get('SYMPA_COMMAND_EMAIL') || 'sympa@lists.riseup.net'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@your-domain.com'
const REZOPROSPEC_NETWORK_ID = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ModerationResult {
  annonceId: string
  success: boolean
  error?: string
  emailId?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting batch moderation process...')

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current time
    const now = new Date()
    console.log(`⏰ Current time: ${now.toISOString()}`)

    // Fetch all annonces that are scheduled to be sent and haven't been sent yet
    const { data: annonces, error: fetchError } = await supabase
      .from('annonces_moderation')
      .select('*')
      .not('scheduled_send_at', 'is', null)
      .is('sent_at', null)
      .in('status', ['approved', 'rejected'])
      .lte('scheduled_send_at', now.toISOString())
      .order('scheduled_send_at', { ascending: true })

    if (fetchError) {
      throw new Error(`Failed to fetch pending annonces: ${fetchError.message}`)
    }

    if (!annonces || annonces.length === 0) {
      console.log('✅ No pending annonces to process')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending annonces to process',
          processed: 0,
          sent: 0,
          failed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 Found ${annonces.length} annonces to process`)

    // Process each annonce
    const results: ModerationResult[] = []
    let sentCount = 0
    let failedCount = 0

    for (const annonce of annonces) {
      try {
        console.log(`\n📧 Processing annonce ${annonce.id} - ${annonce.status}`)

        // Validate category
        if (!annonce.category) {
          throw new Error('Annonce must have a category assigned')
        }

        // Check if we have Sympa data
        if (!annonce.sympa_auth_token) {
          console.warn(`⚠️ Annonce ${annonce.id} does not have Sympa auth token. Marking as processed without sending.`)

          // Update as processed without syncing
          await supabase
            .from('annonces_moderation')
            .update({
              sent_at: now.toISOString(),
              synced_to_sympa: false
            })
            .eq('id', annonce.id)

          results.push({
            annonceId: annonce.id,
            success: true,
            error: 'No Sympa data - processed locally only'
          })
          continue
        }

        // Build Sympa command
        const sympaMainList = 'rezoprospec' // Main list for now
        let sympaCommand: string

        if (annonce.status === 'approved') {
          sympaCommand = `DISTRIBUTE ${sympaMainList} ${annonce.sympa_auth_token}`
        } else if (annonce.status === 'rejected') {
          sympaCommand = `REJECT ${sympaMainList} ${annonce.sympa_auth_token}`
        } else {
          throw new Error(`Invalid status: ${annonce.status}`)
        }

        console.log(`📧 Sending Sympa command: ${sympaCommand.substring(0, 50)}...`)

        // Send email via Resend API
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
          throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`)
        }

        const resendResult = await resendResponse.json()
        console.log(`✅ Email sent successfully: ${resendResult.id}`)

        // Update annonce in database
        const { error: updateError } = await supabase
          .from('annonces_moderation')
          .update({
            sent_at: now.toISOString(),
            sympa_command: sympaCommand,
            synced_to_sympa: true
          })
          .eq('id', annonce.id)

        if (updateError) {
          console.error(`Failed to update annonce ${annonce.id}:`, updateError)
          throw updateError
        }

        sentCount++
        results.push({
          annonceId: annonce.id,
          success: true,
          emailId: resendResult.id
        })

      } catch (error) {
        console.error(`❌ Error processing annonce ${annonce.id}:`, error)
        failedCount++

        // Update annonce with error (but don't mark as sent)
        await supabase
          .from('annonces_moderation')
          .update({
            updated_at: now.toISOString()
          })
          .eq('id', annonce.id)

        results.push({
          annonceId: annonce.id,
          success: false,
          error: error.message || 'Unknown error'
        })
      }
    }

    console.log(`\n✅ Batch processing complete:`)
    console.log(`   - Total processed: ${annonces.length}`)
    console.log(`   - Successfully sent: ${sentCount}`)
    console.log(`   - Failed: ${failedCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Batch processing complete',
        processed: annonces.length,
        sent: sentCount,
        failed: failedCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in sympa-batch-moderate:', error)
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
