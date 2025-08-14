// Simplified process-notifications edge function
// No dependencies on new tables or logging

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('📨 Starting notification processing...')

    // Get pending notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('notification_queue')
      .select(`
        id,
        recipient_id,
        network_id,
        notification_type,
        subject_line,
        content_preview,
        related_item_id,
        metadata,
        profiles!notification_queue_recipient_id_fkey (
          contact_email,
          full_name
        ),
        networks!notification_queue_network_id_fkey (
          name
        )
      `)
      .eq('is_sent', false)
      .is('error_message', null)
      .limit(50)

    if (fetchError) {
      throw new Error(`Failed to fetch notifications: ${fetchError.message}`)
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No pending notifications', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📨 Processing ${notifications.length} notifications`)

    let sent = 0
    let failed = 0

    // Process each notification
    for (const notification of notifications) {
      try {
        // Skip if no email
        if (!notification.profiles?.contact_email) {
          console.log(`Skipping notification ${notification.id} - no email`)
          continue
        }

        // Prepare email data
        let inviterName = 'Network Update'
        
        // Extract appropriate name from metadata based on notification type
        if (notification.metadata) {
          try {
            const metadata = JSON.parse(notification.metadata)
            
            // For direct messages
            if (notification.notification_type === 'direct_message' && metadata.senderName) {
              inviterName = metadata.senderName
            }
            // For events
            else if (notification.notification_type === 'event' && metadata.organizerName) {
              inviterName = metadata.organizerName
            }
            // For news posts
            else if (notification.notification_type === 'news' && metadata.authorName) {
              inviterName = metadata.authorName
            }
            // For portfolio posts
            else if (notification.notification_type === 'post' && metadata.authorName) {
              inviterName = metadata.authorName
            }
            // For mentions
            else if (notification.notification_type === 'mention' && metadata.mentionerName) {
              inviterName = metadata.mentionerName
            }
            // For event proposals
            else if (notification.notification_type === 'event_proposal' && metadata.proposerName) {
              inviterName = metadata.proposerName
            }
          } catch (e) {
            console.warn('Failed to parse metadata for name extraction:', e)
          }
        }
        
        const emailData = {
          toEmail: notification.profiles.contact_email,
          networkName: notification.networks?.name || 'Network',
          inviterName: inviterName,
          type: notification.notification_type,
          subject: notification.subject_line,
          content: notification.content_preview,
          relatedItemId: notification.related_item_id,
        }

        // Add metadata if present
        if (notification.metadata) {
          try {
            const metadata = JSON.parse(notification.metadata)
            Object.assign(emailData, metadata)
          } catch (e) {
            console.warn('Failed to parse metadata:', e)
          }
        }

        // Send email via network-invite function
        const { error: emailError } = await supabase.functions.invoke('network-invite', {
          body: emailData
        })

        if (emailError) {
          throw emailError
        }

        // Mark as sent
        await supabase
          .from('notification_queue')
          .update({ 
            is_sent: true, 
            sent_at: new Date().toISOString() 
          })
          .eq('id', notification.id)

        sent++

        // Rate limit delay
        await new Promise(resolve => setTimeout(resolve, 600))

      } catch (error) {
        console.error(`Failed to process notification ${notification.id}:`, error)
        
        // Mark as failed
        await supabase
          .from('notification_queue')
          .update({ 
            error_message: error.message || 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id)

        failed++
      }
    }

    // Clean up old notifications (optional)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    await supabase
      .from('notification_queue')
      .delete()
      .lt('sent_at', sevenDaysAgo.toISOString())
      .eq('is_sent', true)

    return new Response(
      JSON.stringify({
        success: true,
        processed: notifications.length,
        sent,
        failed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})