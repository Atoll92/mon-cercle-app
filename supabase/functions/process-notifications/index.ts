// Simplified process-notifications edge function
// No dependencies on new tables or logging
/// <reference types="https://esm.sh/@types/node@18/index.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ICS Generation Functions
const formatICSDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

const escapeICSText = (text: string): string => {
  if (!text) return ''
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .trim()
}

const generateICSContent = (eventData: any): string => {
  const {
    id,
    title,
    description = '',
    startDate,
    location = '',
    organizer = '',
    url = ''
  } = eventData

  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(start.getTime() + (60 * 60 * 1000)) // 1 hour duration

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Conclav//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:event-${id}@conclav.network`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${escapeICSText(title)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
  ]

  if (location) {
    icsLines.push(`LOCATION:${escapeICSText(location)}`)
  }

  if (organizer) {
    icsLines.push(`ORGANIZER;CN=${escapeICSText(organizer)}:noreply@conclav.network`)
  }

  if (url) {
    icsLines.push(`URL:${url}`)
  }

  icsLines.push(
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Event Reminder',
    'TRIGGER:-PT15M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  )

  return icsLines.join('\r\n')
}

const createICSAttachment = (eventData: any) => {
  const icsContent = generateICSContent(eventData)
  const base64Content = btoa(icsContent)

  const date = new Date(eventData.startDate)
  const dateStr = date.toISOString().split('T')[0]
  const titleSlug = eventData.title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30)

  return {
    filename: `${titleSlug}-${dateStr}.ics`,
    content: base64Content,
    type: 'text/calendar',
    disposition: 'attachment'
  }
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

    // First, get unique recipients with pending notifications (limit how many recipients we process per run)
    const { data: recipientsWithNotifications, error: recipientsFetchError } = await supabase
      .from('notification_queue')
      .select('recipient_id')
      .eq('is_sent', false)
      .is('error_message', null)
      .limit(50) // Process up to 50 recipients per invocation to avoid timeouts

    if (recipientsFetchError) {
      throw new Error(`Failed to fetch recipients: ${recipientsFetchError.message}`)
    }

    if (!recipientsWithNotifications || recipientsWithNotifications.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No pending notifications', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get unique recipient IDs
    const uniqueRecipientIds = [...new Set(recipientsWithNotifications.map(r => r.recipient_id))]
    console.log(`📨 Processing notifications for ${uniqueRecipientIds.length} recipients`)

    // Now fetch ALL notifications for these recipients (no limit on notifications per recipient)
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
        created_at,
        profiles!notification_queue_recipient_id_fkey (
          contact_email,
          full_name
        ),
        networks!notification_queue_network_id_fkey (
          name
        )
      `)
      .in('recipient_id', uniqueRecipientIds)
      .eq('is_sent', false)
      .is('error_message', null)
      .order('created_at', { ascending: true }) // Process oldest first

    if (fetchError) {
      throw new Error(`Failed to fetch notifications: ${fetchError.message}`)
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No notifications found for recipients', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📨 Found ${notifications.length} total notifications for ${uniqueRecipientIds.length} recipients`)

    // Group notifications by recipient, network, and type for batching
    const groupedNotifications = new Map()

    for (const notification of notifications) {
      // Skip if no email
      if (!notification.profiles?.contact_email) {
        console.log(`Skipping notification ${notification.id} - no email`)
        continue
      }

      // Create group key: recipient_network_type
      const groupKey = `${notification.recipient_id}_${notification.network_id}_${notification.notification_type}`

      if (!groupedNotifications.has(groupKey)) {
        groupedNotifications.set(groupKey, {
          recipient: notification.profiles,
          network: notification.networks,
          type: notification.notification_type,
          notifications: []
        })
      }

      groupedNotifications.get(groupKey).notifications.push(notification)
    }

    console.log(`📨 Grouped into ${groupedNotifications.size} batches`)

    let sent = 0
    let failed = 0

    // Process each group of notifications
    for (const [groupKey, group] of groupedNotifications) {
      try {
        const { recipient, network, type, notifications: groupNotifications } = group

        // Configuration for digest times (will eventually come from user preferences)
        const EVENT_DIGEST_HOUR = parseInt(Deno.env.get('EVENT_DIGEST_HOUR') || '16') // Default 16:00
        const EVENT_DIGEST_ENABLED = Deno.env.get('EVENT_DIGEST_ENABLED') !== 'false' // Default true

        // For event notifications, check if we should wait for digest
        if (type === 'event' && EVENT_DIGEST_ENABLED) {
          const now = new Date()
          const currentHour = now.getHours()

          // Get the oldest event notification creation time
          const oldestEventTime = Math.min(...groupNotifications.map(n => new Date(n.created_at).getTime()))
          const oldestEventDate = new Date(oldestEventTime)

          // Calculate today's digest time
          const todayDigestTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), EVENT_DIGEST_HOUR, 0, 0)

          // If oldest event was created before today's digest time and it's now past digest time, send
          // Otherwise, wait for the appropriate digest time
          if (oldestEventDate < todayDigestTime) {
            // Event was created before today's digest cutoff
            if (currentHour < EVENT_DIGEST_HOUR) {
              // Not yet digest time, skip for now
              console.log(`📅 Skipping event notifications for ${recipient.contact_email} - waiting until ${EVENT_DIGEST_HOUR}:00 for digest`)
              continue
            }
            // It's past digest time, proceed to send
          } else {
            // Event was created after today's digest time, will be sent tomorrow at digest time
            console.log(`📅 Skipping event notifications for ${recipient.contact_email} - created after today's ${EVENT_DIGEST_HOUR}:00 cutoff, will send tomorrow`)
            continue
          }
        }

        // For direct messages, check if we should wait for more messages
        if (type === 'direct_message') {
          // Check if all messages are recent (less than 5 minutes old)
          const now = new Date()
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

          const hasOldMessage = groupNotifications.some(notif => {
            const createdAt = new Date(notif.created_at)
            return createdAt < fiveMinutesAgo
          })

          // If no message is older than 5 minutes, skip this group for now
          // They will be processed in the next run when they're old enough
          if (!hasOldMessage) {
            console.log(`Skipping direct message group ${groupKey} - all messages are less than 5 minutes old`)
            continue
          }
          
          // Process messages that are ready to be sent
          if (groupNotifications.length > 1) {
            // Group messages by sender
            const messagesBySender = new Map()
            
            for (const notif of groupNotifications) {
              let senderName = 'Someone'
              let senderId = null
              
              if (notif.metadata) {
                try {
                  const metadata = JSON.parse(notif.metadata)
                  senderName = metadata.senderName || 'Someone'
                  senderId = metadata.senderId || null
                } catch (e) {
                  console.warn('Failed to parse metadata:', e)
                }
              }
              
              const senderKey = senderId || senderName
              if (!messagesBySender.has(senderKey)) {
                messagesBySender.set(senderKey, {
                  senderName,
                  messages: []
                })
              }
              
              messagesBySender.get(senderKey).messages.push({
                id: notif.id,
                content: notif.content_preview,
                relatedItemId: notif.related_item_id
              })
            }
            
            // Send one email per sender with all their messages
            for (const [, senderData] of messagesBySender) {
            const messageCount = senderData.messages.length
            const subject = messageCount > 1 
              ? `${senderData.senderName} sent you ${messageCount} messages on ${network?.name || 'Network'}`
              : `New message from ${senderData.senderName} on ${network?.name || 'Network'}`
            
            // Generate email HTML for grouped messages
            const messages = senderData.messages.map((m: any) => m.content).filter((c: any) => c)
            
            // Generate message boxes HTML
            let messageBoxesHtml = ''
            if (messages && messages.length > 0) {
              messageBoxesHtml = messages.map((msg: string) => `
                <div style="background-color: #e8f5e8; padding: 16px; border-left: 4px solid #4caf50; border-radius: 4px; margin-bottom: 12px;">
                  <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.5;">${msg || 'Message content not available'}</p>
                </div>
              `).join('')
            }
            
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                <div style="background-color: #4caf50; padding: 20px; border-radius: 8px 8px 0 0;">
                  <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">💌 ${messageCount > 1 ? `${messageCount} New Direct Messages` : 'New Direct Message'}</h2>
                  <p style="margin: 0; color: #e8f5e9; font-size: 14px;">${messageCount > 1 ? 'You have multiple private messages waiting' : 'You have a private message waiting'}</p>
                </div>
                
                <div style="background-color: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; border-top: none;">
                  <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
                    <p style="margin: 0; color: #666; font-size: 14px;">From: <strong>${senderData.senderName}</strong></p>
                    ${network?.name ? `<p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">Network: ${network.name}</p>` : ''}
                    ${messageCount > 1 ? `<p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">Number of messages: ${messageCount}</p>` : ''}
                  </div>
                  
                  <div style="margin-bottom: 20px;">
                    ${messageBoxesHtml}
                  </div>
                  
                  <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
                    <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/messages" 
                       style="display: inline-block; background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                      Read & Reply to ${messageCount > 1 ? 'Messages' : 'Message'}
                    </a>
                  </div>
                </div>
                
                <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
                  <p style="margin: 0 0 8px 0;">You're receiving this because you're subscribed to direct message notifications.</p>
                  <p style="margin: 0;">
                    <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit?tab=settings" 
                       style="color: #2196f3; text-decoration: none;">
                      Manage your notification preferences
                    </a>
                  </p>
                </div>
              </div>
            `
            
            // Send email directly via Resend API
            const emailPayload = {
              from: Deno.env.get('FROM_EMAIL') || 'noreply@your-domain.com',
              to: recipient.contact_email,
              subject: subject,
              html: emailHtml
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
            
            // Mark all messages in this group as sent
            const messageIds = senderData.messages.map((m: any) => m.id)
            await supabase
              .from('notification_queue')
              .update({ 
                is_sent: true, 
                sent_at: new Date().toISOString() 
              })
              .in('id', messageIds)
            
            sent += messageIds.length
            
            // Rate limit delay
            await new Promise(resolve => setTimeout(resolve, 600))
          }
        } else {
          // Single direct message - process it individually
          const notification = groupNotifications[0]
          
          // Extract sender name from metadata
          let inviterName = 'Someone'
          if (notification.metadata) {
            try {
              const metadata = JSON.parse(notification.metadata)
              inviterName = metadata.senderName || 'Someone'
            } catch (e) {
              console.warn('Failed to parse metadata:', e)
            }
          }
          
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
              <div style="background-color: #4caf50; padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">💌 New Direct Message</h2>
                <p style="margin: 0; color: #e8f5e9; font-size: 14px;">You have a private message waiting</p>
              </div>
              
              <div style="background-color: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; border-top: none;">
                <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
                  <p style="margin: 0; color: #666; font-size: 14px;">From: <strong>${inviterName}</strong></p>
                  ${network?.name ? `<p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">Network: ${network.name}</p>` : ''}
                </div>
                
                <div style="margin-bottom: 20px;">
                  <div style="background-color: #e8f5e8; padding: 16px; border-left: 4px solid #4caf50; border-radius: 4px; margin-bottom: 12px;">
                    <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.5;">${notification.content_preview || 'Message content not available'}</p>
                  </div>
                </div>
                
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
                  <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/messages" 
                     style="display: inline-block; background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                    Read & Reply to Message
                  </a>
                </div>
              </div>
              
              <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
                <p style="margin: 0 0 8px 0;">You're receiving this because you're subscribed to direct message notifications.</p>
                <p style="margin: 0;">
                  <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit?tab=settings" 
                     style="color: #2196f3; text-decoration: none;">
                    Manage your notification preferences
                  </a>
                </p>
              </div>
            </div>
          `
          
          // Send email directly via Resend API
          const emailPayload = {
            from: Deno.env.get('FROM_EMAIL') || 'noreply@your-domain.com',
            to: recipient.contact_email,
            subject: notification.subject_line || `New message from ${inviterName} on ${network?.name || 'Network'}`,
            html: emailHtml
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
        }
      } else if (type === 'event' && groupNotifications.length > 1) {
        // Multiple event notifications - send as digest
        console.log(`📅 Sending event digest with ${groupNotifications.length} events to ${recipient.contact_email}`)

        // Fetch all event details
        const eventIds = groupNotifications.map(n => n.related_item_id).filter(Boolean)
        const { data: events, error: eventsError } = await supabase
          .from('network_events')
          .select(`
            id,
            title,
            description,
            date,
            location,
            cover_image_url,
            created_by,
            profiles!network_events_created_by_fkey (
              full_name
            ),
            network_categories (
              name,
              color
            )
          `)
          .in('id', eventIds)
          .order('date', { ascending: true })

        if (eventsError) {
          console.error('📨 Error fetching events for digest:', eventsError)
        }

        const validEvents = events || []
        const eventCount = validEvents.length

        // Generate digest email HTML
        const emailSubject = `${eventCount} new events in ${network?.name || 'your network'}`

        // Build event cards HTML
        let eventCardsHtml = ''
        for (const event of validEvents) {
          const eventDate = event.date ? new Date(event.date) : null
          const formattedDate = eventDate
            ? eventDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'Date TBD'

          const categoryBadge = event.network_categories?.name
            ? `<span style="display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 16px; background-color: ${event.network_categories.color}15; border: 1px solid ${event.network_categories.color}40; font-size: 11px; font-weight: 600; color: ${event.network_categories.color}; letter-spacing: 0.02em;">#${event.network_categories.name}</span>`
            : ''

          eventCardsHtml += `
            <div style="background-color: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              ${event.cover_image_url ? `
              <img src="${event.cover_image_url}" alt="${event.title}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 12px;" />
              ` : ''}
              <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px; font-weight: 600;">${event.title}</h3>
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <span style="color: #666; font-size: 13px;">📅 ${formattedDate}</span>
                ${event.location ? `<span style="color: #666; font-size: 13px;">📍 ${event.location}</span>` : ''}
              </div>
              ${categoryBadge ? `<div style="margin-bottom: 8px;">${categoryBadge}</div>` : ''}
              <p style="margin: 0 0 12px 0; color: #666; font-size: 14px; line-height: 1.4;">
                ${event.description ? (event.description.length > 150 ? event.description.substring(0, 150) + '...' : event.description) : 'No description available'}
              </p>
              ${event.profiles?.full_name ? `
              <p style="margin: 8px 0 12px 0; color: #999; font-size: 12px;">Organized by ${event.profiles.full_name}</p>
              ` : ''}
              <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/network/${groupNotifications[0].network_id}/event/${event.id}"
                 style="display: inline-block; background-color: #ff9800; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 500;">
                View Event Details →
              </a>
            </div>
          `
        }

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #ff9800; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">📅 ${eventCount} New Event${eventCount > 1 ? 's' : ''} in ${network?.name || 'Your Network'}</h2>
              <p style="margin: 0; color: #fff3e0; font-size: 14px;">Your daily event digest</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; border-top: none;">
              ${eventCardsHtml}
            </div>

            <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
              <p style="margin: 0 0 8px 0;">You're receiving this daily event digest because you're subscribed to event notifications.</p>
              <p style="margin: 0;">
                <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit?tab=settings"
                   style="color: #ff9800; text-decoration: none;">
                  Manage your notification preferences
                </a>
              </p>
            </div>
          </div>
        `

        // Send the digest email
        const emailPayload = {
          from: Deno.env.get('FROM_EMAIL') || 'noreply@your-domain.com',
          to: recipient.contact_email,
          subject: emailSubject,
          html: emailHtml
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
          throw new Error(`Failed to send event digest: ${JSON.stringify(errorData)}`)
        }

        // Mark all event notifications as sent
        const notificationIds = groupNotifications.map(n => n.id)
        await supabase
          .from('notification_queue')
          .update({
            is_sent: true,
            sent_at: new Date().toISOString()
          })
          .in('id', notificationIds)

        sent += notificationIds.length

        // Rate limit delay
        await new Promise(resolve => setTimeout(resolve, 600))

      } else {
        // For other notification types or single events, process individually
          for (const notification of groupNotifications) {
            // Prepare email data
            let inviterName = 'Network Update'

            // Extract appropriate name from metadata based on notification type
            // Note: News, portfolio posts, and events now fetch author name directly from database
            // Direct messages are handled in the grouped section above and never reach here
            if (notification.metadata) {
              try {
                const metadata = JSON.parse(notification.metadata)

                // For mentions
                if (notification.notification_type === 'mention' && metadata.mentionerName) {
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
            
            // Generate email HTML based on notification type
            let emailSubject = notification.subject_line || `Notification from ${notification.networks?.name || 'Network'}`
            let emailHtml = ''
            let icsAttachment: any = null // For event ICS attachments

            const subject = notification.subject_line
            const content = notification.content_preview
            const networkName = notification.networks?.name || 'Network'

            // Parse metadata for additional data
            let metadata: any = {}
            if (notification.metadata) {
              try {
                metadata = JSON.parse(notification.metadata)
              } catch (e) {
                console.warn('Failed to parse metadata:', e)
              }
            }

            if (notification.notification_type === 'news') {
              // Fetch full news post data with category
              const { data: newsPost, error: newsError } = await supabase
                .from('network_news')
                .select(`
                  id,
                  title,
                  content,
                  media_url,
                  media_type,
                  image_url,
                  created_by,
                  profiles!network_news_created_by_fkey (
                    full_name
                  ),
                  network_categories (
                    name,
                    color
                  )
                `)
                .eq('id', notification.related_item_id)
                .single()

              if (newsError) {
                console.error('📨 Error fetching news post:', newsError)
              }

              const postTitle = newsPost?.title || ''
              const postContent = newsPost?.content || content || 'Content not available'
              const hasMedia = !!(newsPost?.media_url || newsPost?.image_url)
              const mediaType = newsPost?.media_type || (newsPost?.image_url ? 'image' : '')
              const mediaUrl = newsPost?.media_url || newsPost?.image_url || ''
              const authorName = newsPost?.profiles?.full_name || inviterName
              const categoryName = newsPost?.network_categories?.name || null
              const categoryColor = newsPost?.network_categories?.color || '#2196f3'

              console.log('📨 Creating news notification email with:', {
                subject,
                postTitle,
                authorName,
                categoryName,
                categoryColor,
                networkName
              })
              emailSubject = `New post in ${networkName}${categoryName ? ` [${categoryName}]` : ''}${postTitle ? `: ${postTitle}` : ''}`
              emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                  <div style="background-color: #2196f3; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">📰 New Post in ${networkName}</h2>
                    <p style="margin: 0; color: #e3f2fd; font-size: 14px;">Stay connected with your network</p>
                  </div>

                  <div style="background-color: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; border-top: none;">
                    <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                      <p style="margin: 0; color: #666; font-size: 14px;">Posted by <strong>${authorName}</strong></p>
                      ${categoryName ? `
                      <span style="display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 16px; background-color: ${categoryColor}15; border: 1px solid ${categoryColor}40; font-size: 11px; font-weight: 600; color: ${categoryColor}; letter-spacing: 0.02em; white-space: nowrap;">#${categoryName}</span>
                      ` : ''}
                    </div>
                    
                    ${postTitle ? `
                    <div style="margin-bottom: 16px;">
                      <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px; font-weight: 600;">${postTitle}</h3>
                    </div>
                    ` : ''}
                    
                    <div style="margin-bottom: 20px;">
                      <p style="margin: 0 0 16px 0; color: #333; font-size: 16px; line-height: 1.5;">${postContent}</p>
                      
                      ${hasMedia ? `
                      <div style="margin-top: 16px;">
                        ${mediaType === 'image' ? `
                        <div style="text-align: center; margin: 16px 0;">
                          <img src="${mediaUrl}" alt="News image" style="max-width: 100%; height: auto; max-height: 400px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                        </div>
                        ` : `
                        <div style="padding: 12px; background-color: #f8f9fa; border-radius: 6px; border-left: 4px solid #2196f3;">
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 18px;">${mediaType === 'video' ? '🎥' : mediaType === 'audio' ? '🎵' : '📎'}</span>
                            <span style="color: #2196f3; font-weight: 500; font-size: 14px;">
                              ${mediaType === 'video' ? 'Video attached' : mediaType === 'audio' ? 'Audio attached' : 'Media attached'}
                            </span>
                          </div>
                        </div>
                        `}
                      </div>
                      ` : ''}
                    </div>
                    
                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/network/${notification.network_id}/news/${notification.related_item_id}" 
                         style="display: inline-block; background-color: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        View Full Post & Comments
                      </a>
                    </div>
                  </div>
                  
                  <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
                    <p style="margin: 0 0 8px 0;">You're receiving this because you're subscribed to news notifications for ${networkName}.</p>
                    <p style="margin: 0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit?tab=settings" 
                         style="color: #2196f3; text-decoration: none;">
                        Manage your notification preferences
                      </a>
                    </p>
                  </div>
                </div>
              `
            } else if (notification.notification_type === 'post') {
              // Fetch full portfolio post data with category
              const { data: portfolioPost, error: postError } = await supabase
                .from('portfolio_items')
                .select(`
                  id,
                  title,
                  description,
                  media_url,
                  media_type,
                  image_url,
                  profile_id,
                  profiles!portfolio_items_profile_id_fkey (
                    full_name
                  ),
                  network_categories (
                    name,
                    color
                  )
                `)
                .eq('id', notification.related_item_id)
                .single()

              if (postError) {
                console.error('📨 Error fetching portfolio post:', postError)
              }

              const postTitle = portfolioPost?.title || ''
              const postContent = portfolioPost?.description || content || 'Content not available'
              const hasMedia = !!(portfolioPost?.media_url || portfolioPost?.image_url)
              const mediaType = portfolioPost?.media_type || (portfolioPost?.image_url ? 'image' : '')
              const mediaUrl = portfolioPost?.media_url || portfolioPost?.image_url || ''
              const authorName = portfolioPost?.profiles?.full_name || inviterName
              const categoryName = portfolioPost?.network_categories?.name || null
              const categoryColor = portfolioPost?.network_categories?.color || '#673ab7'

              console.log('📨 Creating portfolio post notification email with:', {
                subject,
                postTitle,
                authorName,
                categoryName,
                categoryColor,
                networkName
              })
              emailSubject = `New post in ${networkName}${categoryName ? ` [${categoryName}]` : ''}${postTitle ? `: ${postTitle}` : ''}`
              emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                  <div style="background-color: #673ab7; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">📊 New Post in ${networkName}</h2>
                    <p style="margin: 0; color: #ede7f6; font-size: 14px;">Discover what your network members are sharing</p>
                  </div>

                  <div style="background-color: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; border-top: none;">
                    <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                      <p style="margin: 0; color: #666; font-size: 14px;">Shared by <strong>${authorName}</strong></p>
                      ${categoryName ? `
                      <span style="display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 16px; background-color: ${categoryColor}15; border: 1px solid ${categoryColor}40; font-size: 11px; font-weight: 600; color: ${categoryColor}; letter-spacing: 0.02em; white-space: nowrap;">#${categoryName}</span>
                      ` : ''}
                    </div>
                    
                    ${postTitle ? `
                    <div style="margin-bottom: 16px;">
                      <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px; font-weight: 600;">${postTitle}</h3>
                    </div>
                    ` : ''}
                    
                    <div style="margin-bottom: 20px;">
                      <p style="margin: 0 0 16px 0; color: #333; font-size: 16px; line-height: 1.5;">${postContent}</p>
                      
                      ${hasMedia ? `
                      <div style="margin-top: 16px;">
                        ${mediaType === 'image' ? `
                        <div style="text-align: center; margin: 16px 0;">
                          <img src="${mediaUrl}" alt="Post image" style="max-width: 100%; height: auto; max-height: 400px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                        </div>
                        ` : `
                        <div style="padding: 12px; background-color: #f8f9fa; border-radius: 6px; border-left: 4px solid #673ab7;">
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 18px;">${mediaType === 'video' ? '🎥' : mediaType === 'audio' ? '🎵' : '📎'}</span>
                            <span style="color: #673ab7; font-weight: 500; font-size: 14px;">
                              ${mediaType === 'video' ? 'Video attached' : mediaType === 'audio' ? 'Audio attached' : 'Media attached'}
                            </span>
                          </div>
                        </div>
                        `}
                      </div>
                      ` : ''}
                    </div>
                    
                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/post/${notification.related_item_id}" 
                         style="display: inline-block; background-color: #673ab7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        View Post & Connect
                      </a>
                    </div>
                  </div>
                  
                  <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
                    <p style="margin: 0 0 8px 0;">You're receiving this because you're subscribed to portfolio notifications for ${networkName}.</p>
                    <p style="margin: 0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit?tab=settings" 
                         style="color: #673ab7; text-decoration: none;">
                        Manage your notification preferences
                      </a>
                    </p>
                  </div>
                </div>
              `
            } else if (notification.notification_type === 'event') {
              // Fetch full event data with category
              const { data: eventData, error: eventError } = await supabase
                .from('network_events')
                .select(`
                  id,
                  title,
                  description,
                  date,
                  location,
                  cover_image_url,
                  created_by,
                  profiles!network_events_created_by_fkey (
                    full_name
                  ),
                  network_categories (
                    name,
                    color
                  )
                `)
                .eq('id', notification.related_item_id)
                .single()

              if (eventError) {
                console.error('📨 Error fetching event:', eventError)
              }

              const eventTitle = eventData?.title || ''
              const eventDescription = eventData?.description || content || 'Event description not available'
              const eventLocation = eventData?.location || metadata.eventLocation || ''
              const hasMedia = !!eventData?.cover_image_url
              const mediaType = hasMedia ? 'image' : ''
              const mediaUrl = eventData?.cover_image_url || ''
              const organizerName = eventData?.profiles?.full_name || inviterName
              const categoryName = eventData?.network_categories?.name || null
              const categoryColor = eventData?.network_categories?.color || '#ff9800'

              // Format event date
              let formattedDate = 'Date TBD'
              const eventDateValue = eventData?.date || metadata.eventDate
              if (eventDateValue) {
                try {
                  const date = new Date(eventDateValue)
                  formattedDate = date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                } catch (e) {
                  formattedDate = eventDateValue
                }
              }

              console.log('📨 Creating event notification email with:', {
                subject,
                eventTitle,
                organizerName,
                categoryName,
                categoryColor,
                formattedDate,
                eventLocation,
                networkName
              })
              emailSubject = `New event in ${networkName}${categoryName ? ` [${categoryName}]` : ''}: ${eventTitle}`
              emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                  <div style="background-color: #ff9800; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">📅 New Event in ${networkName}</h2>
                    <p style="margin: 0; color: #fff3e0; font-size: 14px;">Don't miss out on this event!</p>
                  </div>

                  <div style="background-color: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; border-top: none;">
                    <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                      <p style="margin: 0; color: #666; font-size: 14px;">Organized by <strong>${organizerName}</strong></p>
                      ${categoryName ? `
                      <span style="display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 16px; background-color: ${categoryColor}15; border: 1px solid ${categoryColor}40; font-size: 11px; font-weight: 600; color: ${categoryColor}; letter-spacing: 0.02em; white-space: nowrap;">#${categoryName}</span>
                      ` : ''}
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                      <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">${(subject || 'Event').replace(`New event in ${networkName}: `, '') || 'Event Details'}</h3>
                      <p style="margin: 0 0 16px 0; color: #333; font-size: 16px; line-height: 1.5;">${eventDescription}</p>
                      
                      ${hasMedia ? `
                      <div style="margin-top: 16px;">
                        ${mediaType === 'image' ? `
                        <div style="text-align: center; margin: 16px 0;">
                          <img src="${mediaUrl}" alt="Event cover image" style="max-width: 100%; height: auto; max-height: 400px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                        </div>
                        ` : `
                        <div style="padding: 12px; background-color: #fff3e0; border-radius: 6px; border-left: 4px solid #ff9800;">
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 18px;">${mediaType === 'video' ? '🎥' : mediaType === 'audio' ? '🎵' : '📎'}</span>
                            <span style="color: #ff9800; font-weight: 500; font-size: 14px;">
                              ${mediaType === 'video' ? 'Video attached' : mediaType === 'audio' ? 'Audio attached' : 'Media attached'}
                            </span>
                          </div>
                        </div>
                        `}
                      </div>
                      ` : ''}
                    </div>
                    
                    <div style="background-color: #fff3e0; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
                      <div style="margin-bottom: 8px;">
                        <span style="font-weight: 600; color: #e65100;">📅 When:</span>
                        <span style="color: #333; margin-left: 8px;">${formattedDate}</span>
                      </div>
                      ${eventLocation ? `
                      <div style="margin-bottom: 8px;">
                        <span style="font-weight: 600; color: #e65100;">📍 Where:</span>
                        <span style="color: #333; margin-left: 8px;">${eventLocation}</span>
                      </div>
                      ` : ''}
                    </div>
                    
                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}${metadata.networkId && metadata.eventId ? `/network/${metadata.networkId}/event/${metadata.eventId}` : '/dashboard'}" 
                         style="display: inline-block; background-color: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 12px;">
                        View Event Details & RSVP
                      </a>
                    </div>
                  </div>
                  
                  <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
                    <p style="margin: 0 0 8px 0;">You're receiving this because you're subscribed to event notifications for ${networkName}.</p>
                    <p style="margin: 0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit?tab=settings" 
                         style="color: #2196f3; text-decoration: none;">
                        Manage your notification preferences
                      </a>
                    </p>
                  </div>
                </div>
              `

              // Generate ICS attachment for events
              if (eventData) {
                try {
                  icsAttachment = createICSAttachment({
                    id: eventData.id,
                    title: eventData.title,
                    description: eventData.description || '',
                    startDate: eventData.date,
                    location: eventData.location || '',
                    organizer: eventData.profiles?.full_name || 'Event Organizer',
                    url: `${Deno.env.get('APP_URL') || 'https://conclav.network'}/network/${notification.network_id}/event/${notification.related_item_id}`
                  })
                  console.log('📨 Generated ICS attachment:', {
                    filename: icsAttachment.filename,
                    type: icsAttachment.type
                  })
                } catch (icsError) {
                  console.error('📨 Error generating ICS attachment:', icsError)
                  // Continue without ICS if generation fails
                }
              }
            } else if (notification.notification_type === 'mention') {
              console.log('📨 Creating mention notification email with:', {
                subject,
                content: content?.substring(0, 100) + '...',
                messageContext: metadata.messageContext,
                networkName
              })
              emailSubject = subject || `New post in ${networkName}`
              
              // Link to the network page with chat tab
              const chatUrl = `/network?tab=chat`
              
              emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                  <div style="background-color: #9c27b0; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">💬 You were mentioned in ${networkName}</h2>
                    <p style="margin: 0; color: #f3e5f5; font-size: 14px;">Someone wants your attention!</p>
                  </div>
                  
                  <div style="background-color: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; border-top: none;">
                    <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
                      <p style="margin: 0; color: #666; font-size: 14px;"><strong>${inviterName}</strong> mentioned you in the chat</p>
                    </div>
                    
                    <div style="background-color: #f3e5f5; padding: 16px; border-left: 4px solid #9c27b0; border-radius: 4px; margin-bottom: 20px;">
                      <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.5; font-style: italic;">"${content || 'Message content not available'}"</p>
                    </div>
                    
                    ${metadata.messageContext ? `
                    <div style="margin-bottom: 16px;">
                      <p style="margin: 0; color: #666; font-size: 14px;">In: ${metadata.messageContext}</p>
                    </div>
                    ` : ''}
                    
                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}${chatUrl}" 
                         style="display: inline-block; background-color: #9c27b0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        View Message & Reply
                      </a>
                    </div>
                  </div>
                  
                  <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
                    <p style="margin: 0 0 8px 0;">You're receiving this because you're subscribed to mention notifications for ${networkName}.</p>
                    <p style="margin: 0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit?tab=settings" 
                         style="color: #2196f3; text-decoration: none;">
                        Manage your notification preferences
                      </a>
                    </p>
                  </div>
                </div>
              `
            } else if (notification.notification_type === 'event_proposal') {
              console.log('📨 Creating event proposal notification email for admin')
              emailSubject = subject || `Event proposal requires your review in ${networkName}`
              emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                  <div style="background-color: #ff5722; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">📋 Event Proposal Needs Review</h2>
                    <p style="margin: 0; color: #ffccbc; font-size: 14px;">A member has proposed a new event in ${networkName}</p>
                  </div>
                  
                  <div style="background-color: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; border-top: none;">
                    <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
                      <p style="margin: 0; color: #666; font-size: 14px;">Proposed by <strong>${inviterName || 'A member'}</strong></p>
                    </div>
                    
                    <div style="background-color: #fff3e0; padding: 16px; border-left: 4px solid #ff5722; border-radius: 4px; margin-bottom: 20px;">
                      <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.5;">${content || 'Event proposal details not available'}</p>
                    </div>
                    
                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/admin?tab=events" 
                         style="display: inline-block; background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 12px;">
                        Review Event
                      </a>
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/dashboard" 
                         style="display: inline-block; background-color: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        View Dashboard
                      </a>
                    </div>
                  </div>
                  
                  <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
                    <p style="margin: 0 0 8px 0;">You're receiving this because you're an admin of ${networkName}.</p>
                    <p style="margin: 0;">Please review and approve/reject the event proposal promptly.</p>
                  </div>
                </div>
              `
            } else if (notification.notification_type === 'event_reminder') {
              console.log('📨 Creating event reminder notification email')
              emailSubject = subject || `Reminder: Event tomorrow in ${networkName}`
              
              // Format event date for the reminder
              let formattedDate = 'Tomorrow'
              if (metadata.eventDate) {
                try {
                  const date = new Date(metadata.eventDate)
                  formattedDate = date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                } catch (e) {
                  formattedDate = 'Tomorrow'
                }
              }
              
              emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                  <div style="background-color: #ff5722; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">⏰ Event Reminder</h2>
                    <p style="margin: 0; color: #ffccbc; font-size: 14px;">Don't forget about tomorrow's event!</p>
                  </div>
                  
                  <div style="background-color: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; border-top: none;">
                    <div style="margin-bottom: 20px;">
                      <h3 style="margin: 0 0 16px 0; color: #333; font-size: 20px; font-weight: 600;">
                        ${metadata.eventTitle || 'Event Tomorrow'}
                      </h3>
                      ${metadata.eventDescription ? `
                      <p style="margin: 0 0 16px 0; color: #666; font-size: 16px; line-height: 1.5;">
                        ${metadata.eventDescription}
                      </p>
                      ` : ''}
                    </div>
                    
                    <div style="background-color: #fff3e0; padding: 16px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #ff5722;">
                      <div style="margin-bottom: 8px;">
                        <span style="font-weight: 600; color: #e65100;">📅 When:</span>
                        <span style="color: #333; margin-left: 8px; font-weight: 500;">${formattedDate}</span>
                      </div>
                      ${metadata.eventLocation ? `
                      <div>
                        <span style="font-weight: 600; color: #e65100;">📍 Where:</span>
                        <span style="color: #333; margin-left: 8px;">${metadata.eventLocation}</span>
                      </div>
                      ` : ''}
                    </div>
                    
                    <div style="padding: 12px; background-color: #e8f5e9; border-radius: 6px; margin-bottom: 20px;">
                      <p style="margin: 0; color: #2e7d32; font-size: 14px; text-align: center;">
                        ✅ You're registered for this event
                      </p>
                    </div>
                    
                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}${metadata.networkId && metadata.eventId ? `/network/${metadata.networkId}/event/${metadata.eventId}` : '/dashboard'}" 
                         style="display: inline-block; background-color: #ff5722; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        View Event Details
                      </a>
                    </div>
                  </div>
                  
                  <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
                    <p style="margin: 0 0 8px 0;">This is a reminder for an event you're attending in ${networkName}.</p>
                    <p style="margin: 0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit?tab=settings" 
                         style="color: #2196f3; text-decoration: none;">
                        Manage your notification preferences
                      </a>
                    </p>
                  </div>
                </div>
              `
            } else if (notification.notification_type === 'comment') {
              console.log('📨 Creating comment notification email')
              console.log('📨 Comment metadata:', JSON.stringify(metadata))
              console.log('📨 Related item ID:', notification.related_item_id)
              console.log('📨 Network ID:', notification.network_id)

              emailSubject = subject || `New comment on your post in ${networkName}`

              // Build the correct URL based on item type
              let itemUrl = '/dashboard'
              if (notification.related_item_id) {
                if (metadata.itemType === 'event') {
                  // Events have dedicated pages
                  itemUrl = `/network/${notification.network_id}/event/${notification.related_item_id}`
                  console.log('📨 Event URL:', itemUrl)
                } else if (metadata.itemType === 'news') {
                  // News posts have dedicated pages
                  itemUrl = `/network/${notification.network_id}/news/${notification.related_item_id}`
                  console.log('📨 News URL:', itemUrl)
                } else if (metadata.itemType === 'post') {
                  // Portfolio posts have their own route (not network-specific)
                  itemUrl = `/post/${notification.related_item_id}`
                  console.log('📨 Post URL:', itemUrl)
                } else if (metadata.itemType === 'wiki' && metadata.pageSlug) {
                  // Wiki pages use slug-based URLs
                  itemUrl = `/network/${notification.network_id}/wiki/${metadata.pageSlug}`
                  console.log('📨 Wiki URL:', itemUrl)
                } else {
                  console.log('📨 No matching itemType or missing pageSlug. itemType:', metadata.itemType, 'pageSlug:', metadata.pageSlug)
                }
              } else {
                console.log('📨 No related_item_id found')
              }
              
              emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                  <div style="background-color: #3f51b5; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">💬 New Comment on Your Post</h2>
                    <p style="margin: 0; color: #c5cae9; font-size: 14px;">Someone commented on your content in ${networkName}</p>
                  </div>
                  
                  <div style="background-color: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; border-top: none;">
                    <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
                      <p style="margin: 0; color: #666; font-size: 14px;"><strong>${metadata.commenterName || 'Someone'}</strong> commented on your ${metadata.itemType === 'news' ? 'news post' : metadata.itemType === 'event' ? 'event' : metadata.itemType === 'wiki' ? 'wiki page' : 'portfolio post'}</p>
                      ${metadata.postTitle ? `<p style="margin: 4px 0 0 0; color: #999; font-size: 13px;">On: "${metadata.postTitle}"</p>` : ''}
                    </div>
                    
                    <div style="background-color: #f5f5f5; padding: 16px; border-left: 4px solid #3f51b5; border-radius: 4px; margin-bottom: 20px;">
                      <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.5;">"${content || 'Comment content not available'}"</p>
                    </div>
                    
                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}${itemUrl}" 
                         style="display: inline-block; background-color: #3f51b5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        View Comment & Reply
                      </a>
                    </div>
                  </div>
                  
                  <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
                    <p style="margin: 0 0 8px 0;">You're receiving this because someone commented on your content in ${networkName}.</p>
                    <p style="margin: 0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit?tab=settings" 
                         style="color: #2196f3; text-decoration: none;">
                        Manage your notification preferences
                      </a>
                    </p>
                  </div>
                </div>
              `
            } else if (notification.notification_type === 'comment_reply') {
              console.log('📨 Creating comment reply notification email')
              console.log('📨 Comment reply metadata:', JSON.stringify(metadata))
              console.log('📨 Related item ID:', notification.related_item_id)
              console.log('📨 Network ID:', notification.network_id)

              emailSubject = subject || `Reply to your comment in ${networkName}`

              // Build the correct URL based on item type
              let itemUrl = '/dashboard'
              if (notification.related_item_id) {
                if (metadata.itemType === 'event') {
                  // Events have dedicated pages
                  itemUrl = `/network/${notification.network_id}/event/${notification.related_item_id}`
                  console.log('📨 Event URL:', itemUrl)
                } else if (metadata.itemType === 'news') {
                  // News posts have dedicated pages
                  itemUrl = `/network/${notification.network_id}/news/${notification.related_item_id}`
                  console.log('📨 News URL:', itemUrl)
                } else if (metadata.itemType === 'post') {
                  // Portfolio posts have their own route (not network-specific)
                  itemUrl = `/post/${notification.related_item_id}`
                  console.log('📨 Post URL:', itemUrl)
                } else if (metadata.itemType === 'wiki' && metadata.pageSlug) {
                  // Wiki pages use slug-based URLs
                  itemUrl = `/network/${notification.network_id}/wiki/${metadata.pageSlug}`
                  console.log('📨 Wiki URL:', itemUrl)
                } else {
                  console.log('📨 No matching itemType or missing pageSlug. itemType:', metadata.itemType, 'pageSlug:', metadata.pageSlug)
                }
              } else {
                console.log('📨 No related_item_id found')
              }
              
              emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                  <div style="background-color: #009688; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">↩️ Reply to Your Comment</h2>
                    <p style="margin: 0; color: #b2dfdb; font-size: 14px;">Someone replied to your comment in ${networkName}</p>
                  </div>
                  
                  <div style="background-color: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; border-top: none;">
                    <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
                      <p style="margin: 0; color: #666; font-size: 14px;"><strong>${metadata.commenterName || 'Someone'}</strong> replied to your comment</p>
                      ${metadata.postTitle ? `<p style="margin: 4px 0 0 0; color: #999; font-size: 13px;">On post: "${metadata.postTitle}"</p>` : ''}
                    </div>
                    
                    <div style="background-color: #e0f2f1; padding: 16px; border-left: 4px solid #009688; border-radius: 4px; margin-bottom: 20px;">
                      <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.5;">"${content || 'Reply content not available'}"</p>
                    </div>
                    
                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}${itemUrl}" 
                         style="display: inline-block; background-color: #009688; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        View Reply & Continue Conversation
                      </a>
                    </div>
                  </div>
                  
                  <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
                    <p style="margin: 0 0 8px 0;">You're receiving this because someone replied to your comment in ${networkName}.</p>
                    <p style="margin: 0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit?tab=settings" 
                         style="color: #2196f3; text-decoration: none;">
                        Manage your notification preferences
                      </a>
                    </p>
                  </div>
                </div>
              `
            } else if (notification.notification_type === 'event_status') {
              console.log('📨 Creating event status notification email')
              emailSubject = subject || `Event status update in ${networkName}`
              // Parse content to determine if approved or rejected
              let isApproved = true
              try {
                // content_preview already contains the formatted message from the notification service
                if (content && content.includes('rejected')) {
                  isApproved = false
                }
              } catch (e) {
                console.log('Could not parse event status metadata, defaulting to approved')
              }
              emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                  <div style="background-color: ${isApproved ? '#4caf50' : '#f44336'}; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">
                      ${isApproved ? '✅ Event Approved!' : '❌ Event Not Approved'}
                    </h2>
                    <p style="margin: 0; color: ${isApproved ? '#c8e6c9' : '#ffcdd2'}; font-size: 14px;">
                      ${isApproved ? 'Your event is now live!' : 'Your event proposal was not approved'}
                    </p>
                  </div>
                  
                  <div style="background-color: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; border-top: none;">
                    <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
                      <p style="margin: 0; color: #666; font-size: 14px;">Network: <strong>${networkName}</strong></p>
                    </div>
                    
                    <div style="background-color: ${isApproved ? '#e8f5e8' : '#ffebee'}; padding: 16px; border-left: 4px solid ${isApproved ? '#4caf50' : '#f44336'}; border-radius: 4px; margin-bottom: 20px;">
                      <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.5;">${content || 'Event status update'}</p>
                    </div>
                    
                    ${isApproved ? `
                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}${notification.network_id && notification.related_item_id ? `/network/${notification.network_id}/event/${notification.related_item_id}` : '/dashboard'}" 
                         style="display: inline-block; background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        View Your Event
                      </a>
                    </div>
                    ` : `
                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
                      <p style="margin: 0 0 16px 0; color: #666; font-size: 14px;">
                        You can modify your event and resubmit it for review, or contact an admin for more information.
                      </p>
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/dashboard" 
                         style="display: inline-block; background-color: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        View Dashboard
                      </a>
                    </div>
                    `}
                  </div>
                  
                  <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
                    <p style="margin: 0 0 8px 0;">You're receiving this because you created an event in ${networkName}.</p>
                    <p style="margin: 0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit?tab=settings" 
                         style="color: #2196f3; text-decoration: none;">
                        Manage your notification preferences
                      </a>
                    </p>
                  </div>
                </div>
              `
            } else {
              // Handle unknown notification types
              console.warn('📨 Unknown notification type:', notification.notification_type)
              emailSubject = subject || `Notification from ${networkName}`
              emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #666; margin: 0 0 10px 0;">📬 Notification from ${networkName}</h2>
                    <p style="margin: 0; color: #666; font-size: 14px;">You have a new notification</p>
                  </div>
                  
                  <div style="background-color: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
                      <p style="margin: 0; color: #666; font-size: 14px;">From: <strong>${inviterName || 'Network Update'}</strong></p>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                      <p style="margin: 0 0 16px 0; color: #333; font-size: 16px; line-height: 1.5;">${content || 'Notification content not available'}</p>
                    </div>
                    
                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/dashboard" 
                         style="display: inline-block; background-color: #666; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        View Notification
                      </a>
                    </div>
                  </div>
                  
                  <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
                    <p style="margin: 0 0 8px 0;">You're receiving this notification from ${networkName}.</p>
                    <p style="margin: 0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit?tab=settings" 
                         style="color: #2196f3; text-decoration: none;">
                        Manage your notification preferences
                      </a>
                    </p>
                  </div>
                </div>
              `
            }
            
            // Send email directly via Resend API
            const emailPayload: any = {
              from: Deno.env.get('FROM_EMAIL') || 'noreply@your-domain.com',
              to: notification.profiles.contact_email,
              subject: emailSubject,
              html: emailHtml
            }
            
            // Add ICS attachment for event notifications (if generated)
            if (icsAttachment) {
              emailPayload.attachments = [icsAttachment]
              console.log('📨 Adding ICS attachment to email:', {
                filename: icsAttachment.filename,
                type: icsAttachment.type
              })
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
          }
        }
      } catch (error) {
        console.error(`Failed to process notification group ${groupKey}:`, error)
        
        // Mark all notifications in this group as failed
        const notificationIds = group.notifications.map((n: any) => n.id)
        await supabase
          .from('notification_queue')
          .update({ 
            error_message: error.message || 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .in('id', notificationIds)

        failed += notificationIds.length
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