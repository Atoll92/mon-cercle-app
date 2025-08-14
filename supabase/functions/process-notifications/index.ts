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
        
        // For direct messages, group multiple messages together
        if (type === 'direct_message' && groupNotifications.length > 1) {
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
                    <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit" 
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
          // For other notification types or single messages, process individually
          for (const notification of groupNotifications) {
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
            
            // Generate email HTML based on notification type
            let emailSubject = notification.subject_line || `Notification from ${notification.networks?.name || 'Network'}`
            let emailHtml = ''
            
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
              console.log('📨 Creating news notification email with:', {
                subject,
                content: content?.substring(0, 100) + '...',
                networkName
              })
              emailSubject = subject || `New post in ${networkName}`
              // Parse content to extract title, description, and media for news posts
              let postTitle = ''
              let postContent = content || 'Content not available'
              let hasMedia = false
              let mediaType = ''
              let mediaUrl = ''
              // Check for news post with media by looking for the pattern "shared: content [MediaType:URL]"
              const newsMatch = content?.match(/shared: ([^\[]*?)([\[])([^:]+):([^\]]+)\]\s*$/)
              if (newsMatch) {
                postContent = newsMatch[1]?.trim() || 'No description provided'
                if (newsMatch[3] && newsMatch[4]) {
                  hasMedia = true
                  mediaType = newsMatch[3]
                  mediaUrl = newsMatch[4]
                }
              }
              emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                  <div style="background-color: #2196f3; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">📰 New Post in ${networkName}</h2>
                    <p style="margin: 0; color: #e3f2fd; font-size: 14px;">Stay connected with your network</p>
                  </div>
                  
                  <div style="background-color: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; border-top: none;">
                    <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
                      <p style="margin: 0; color: #666; font-size: 14px;">Posted by <strong>${inviterName || 'Someone'}</strong></p>
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
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/dashboard" 
                         style="display: inline-block; background-color: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        View Full Post & Comments
                      </a>
                    </div>
                  </div>
                  
                  <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
                    <p style="margin: 0 0 8px 0;">You're receiving this because you're subscribed to news notifications for ${networkName}.</p>
                    <p style="margin: 0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit" 
                         style="color: #2196f3; text-decoration: none;">
                        Manage your notification preferences
                      </a>
                    </p>
                  </div>
                </div>
              `
            } else if (notification.notification_type === 'post') {
              console.log('📨 Creating portfolio post notification email with:', {
                subject,
                content: content?.substring(0, 100) + '...',
                networkName
              })
              emailSubject = subject || `New post in ${networkName}`
              // Parse content to extract title, description, and media for portfolio posts
              let postTitle = ''
              let postContent = content || 'Content not available'
              let hasMedia = false
              let mediaType = ''
              let mediaUrl = ''
              // Check if this is a portfolio post by looking for the pattern "shared a new post: Title. Description [MediaType:URL]"
              const portfolioMatch = content?.match(/shared a new post: ([^.]+)\.\s*([^\[]*?)(\[([^:]+):([^\]]+)\])?\s*$/)
              if (portfolioMatch) {
                postTitle = portfolioMatch[1]
                postContent = portfolioMatch[2]?.trim() || 'No description provided'
                if (portfolioMatch[4] && portfolioMatch[5]) {
                  hasMedia = true
                  mediaType = portfolioMatch[4]
                  mediaUrl = portfolioMatch[5]
                }
              }
              emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                  <div style="background-color: #673ab7; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">📊 New Post in ${networkName}</h2>
                    <p style="margin: 0; color: #ede7f6; font-size: 14px;">Discover what your network members are sharing</p>
                  </div>
                  
                  <div style="background-color: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; border-top: none;">
                    <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
                      <p style="margin: 0; color: #666; font-size: 14px;">Shared by <strong>${inviterName || 'Someone'}</strong></p>
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
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/dashboard" 
                         style="display: inline-block; background-color: #673ab7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        View Post & Connect
                      </a>
                    </div>
                  </div>
                  
                  <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
                    <p style="margin: 0 0 8px 0;">You're receiving this because you're subscribed to portfolio notifications for ${networkName}.</p>
                    <p style="margin: 0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit" 
                         style="color: #673ab7; text-decoration: none;">
                        Manage your notification preferences
                      </a>
                    </p>
                  </div>
                </div>
              `
            } else if (notification.notification_type === 'event') {
              console.log('📨 Creating event notification email with:', {
                subject,
                content: content?.substring(0, 100) + '...',
                eventDate: metadata.eventDate,
                eventLocation: metadata.eventLocation,
                networkName
              })
              emailSubject = subject || `New post in ${networkName}`
              // Parse content for media in events
              let eventDescription = content || 'Event description not available'
              let hasMedia = false
              let mediaType = ''
              let mediaUrl = ''
              // Check for event with media by looking for the pattern "Someone created an event: Title on Date. Description [image:URL]"
              const eventMatch = content?.match(/created an event: ([^.]+)\.\s*([^\[]*?)(\[([^:]+):([^\]]+)\])?\s*$/)
              if (eventMatch) {
                // eventMatch[1] contains "Title on Date"
                // eventMatch[2] contains the description
                // eventMatch[4] and eventMatch[5] contain media type and URL
                eventDescription = eventMatch[2]?.trim() || 'Event description not available'
                if (eventMatch[4] && eventMatch[5]) {
                  hasMedia = true
                  mediaType = eventMatch[4]
                  mediaUrl = eventMatch[5]
                }
              } else {
                // If no media pattern found, just clean up the description by removing the prefix
                eventDescription = content?.replace(/^[^:]*created an event: /, '') || 'Event description not available'
              }
              // Debug logging for event media parsing
              console.log('📨 Event content parsing result:', {
                originalContent: content,
                eventDescription,
                hasMedia,
                mediaType,
                mediaUrl,
                eventMatchFound: !!eventMatch
              })
              // Format event date if provided
              let formattedDate = 'Date TBD'
              const eventDateValue = metadata.eventDate
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
              emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                  <div style="background-color: #ff9800; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">📅 New Event in ${networkName}</h2>
                    <p style="margin: 0; color: #fff3e0; font-size: 14px;">Don't miss out on this event!</p>
                  </div>
                  
                  <div style="background-color: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; border-top: none;">
                    <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
                      <p style="margin: 0; color: #666; font-size: 14px;">Organized by <strong>${inviterName}</strong></p>
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
                      ${metadata.eventLocation ? `
                      <div style="margin-bottom: 8px;">
                        <span style="font-weight: 600; color: #e65100;">📍 Where:</span>
                        <span style="color: #333; margin-left: 8px;">${metadata.eventLocation}</span>
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
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit" 
                         style="color: #2196f3; text-decoration: none;">
                        Manage your notification preferences
                      </a>
                    </p>
                  </div>
                </div>
              `
            } else if (notification.notification_type === 'mention') {
              console.log('📨 Creating mention notification email with:', {
                subject,
                content: content?.substring(0, 100) + '...',
                messageContext: metadata.messageContext,
                networkName
              })
              emailSubject = subject || `New post in ${networkName}`
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
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/dashboard" 
                         style="display: inline-block; background-color: #9c27b0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        View Message & Reply
                      </a>
                    </div>
                  </div>
                  
                  <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
                    <p style="margin: 0 0 8px 0;">You're receiving this because you're subscribed to mention notifications for ${networkName}.</p>
                    <p style="margin: 0;">
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit" 
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
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/admin/events" 
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
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/dashboard" 
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
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit" 
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
                      <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/profile/edit" 
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
            
            // Add ICS attachment for event notifications
            if (notification.notification_type === 'event' && metadata.icsAttachment) {
              emailPayload.attachments = [metadata.icsAttachment]
              console.log('📨 Adding ICS attachment:', {
                filename: metadata.icsAttachment.filename,
                type: metadata.icsAttachment.type,
                contentLength: metadata.icsAttachment.content.length
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