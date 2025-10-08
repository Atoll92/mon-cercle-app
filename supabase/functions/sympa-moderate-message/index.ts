// Edge Function: sympa-moderate-message
// Purpose: Send moderation commands to Sympa via email using Resend API
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

interface ModerateRequest {
  annonceId: string
  action: 'approved' | 'rejected'
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
    const { annonceId, action }: ModerateRequest = await req.json()

    if (!annonceId || !action) {
      throw new Error('Missing required fields: annonceId and action')
    }

    if (!['approved', 'rejected'].includes(action)) {
      throw new Error('Invalid action. Must be "approved" or "rejected"')
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`📧 Processing Sympa moderation: ${action} for annonce ${annonceId}`)

    // Fetch annonce data
    const { data: annonce, error: fetchError } = await supabase
      .from('annonces_moderation')
      .select('*')
      .eq('id', annonceId)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch annonce: ${fetchError.message}`)
    }

    if (!annonce) {
      throw new Error('Annonce not found')
    }

    // Check if annonce has a category assigned
    if (!annonce.category) {
      throw new Error('Annonce must have a category assigned before moderation')
    }

    // Get the Sympa list for this category
    const { data: sympaList, error: listError } = await supabase
      .from('sympa_lists')
      .select('list_name, list_email, category')
      .eq('network_id', REZOPROSPEC_NETWORK_ID)
      .eq('category', annonce.category)
      .single()

    if (listError || !sympaList) {
      throw new Error(`Failed to find Sympa list for category "${annonce.category}": ${listError?.message}`)
    }

    console.log(`📋 Using Sympa list: ${sympaList.list_name} (${sympaList.list_email}) for category: ${annonce.category}`)

    // Check if we have the necessary Sympa data
    if (!annonce.sympa_ticket_id || !annonce.sympa_auth_token) {
      console.warn('⚠️ Annonce does not have Sympa ticket ID or auth token. Skipping Sympa sync.')

      // Update status in database without syncing to Sympa
      await supabase
        .from('annonces_moderation')
        .update({
          status: action,
          moderated_at: new Date().toISOString(),
          synced_to_sympa: false
        })
        .eq('id', annonceId)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Annonce moderated in app only (no Sympa data)',
          synced: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build Sympa command based on action and category-specific list
    // Format: DISTRIBUTE listname message_id OR REJECT listname message_id
    // The sympa_auth_token IS the message_id
    let sympaCommand: string
    if (action === 'approved') {
      sympaCommand = `DISTRIBUTE ${sympaList.list_name} ${annonce.sympa_auth_token}`
    } else {
      sympaCommand = `REJECT ${sympaList.list_name} ${annonce.sympa_auth_token}`
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
      text: sympaCommand, // Sympa only needs the command in subject, but include in body too
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

    // Update annonce in database
    const { error: updateError } = await supabase
      .from('annonces_moderation')
      .update({
        status: action,
        moderated_at: new Date().toISOString(),
        sympa_command: sympaCommand,
        synced_to_sympa: true
      })
      .eq('id', annonceId)

    if (updateError) {
      console.error('Failed to update annonce:', updateError)
      throw new Error(`Failed to update annonce: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Annonce ${action} and synced to Sympa`,
        emailId: resendResult.id,
        synced: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in sympa-moderate-message:', error)
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
