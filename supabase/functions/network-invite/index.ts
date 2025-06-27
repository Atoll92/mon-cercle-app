// supabase/functions/network-invite/index.ts

/// <reference types="https://esm.sh/@types/node@18/index.d.ts" />

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface InviteData {
  toEmail: string;
  networkName: string;
  inviterName: string;
  type: 'existing_user' | 'new_user' | 'news' | 'event' | 'mention' | 'direct_message' | 'post';
  inviteLink?: string;
  subject?: string;
  content?: string;
  relatedItemId?: string;
  eventDate?: string;
  eventLocation?: string;
  messageContext?: string;
}

const handler = async (request: Request): Promise<Response> => {
  // Set CORS headers for browser clients
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('🚀 [EDGE FUNCTION DEBUG] Request received:', {
    method: request.method,
    headers: Object.fromEntries(request.headers.entries())
  });

  try {
    // Validate request
    if (!request.body) {
      return new Response(
        JSON.stringify({ error: 'Request body is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const requestBody = await request.json() as InviteData;
    const { toEmail, networkName, inviterName, type, inviteLink, subject, content, relatedItemId, eventDate, eventLocation, messageContext } = requestBody;
    
    console.log('🚀 [EDGE FUNCTION DEBUG] Parsed request body:', {
      toEmail,
      networkName,
      inviterName,
      type,
      hasInviteLink: !!inviteLink,
      hasSubject: !!subject,
      hasContent: !!content,
      relatedItemId,
      eventDate,
      eventLocation,
      hasMessageContext: !!messageContext
    });

    // Validate required fields
    if (!toEmail || !networkName || !inviterName || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For new users, inviteLink is required
    if (type === 'new_user' && !inviteLink) {
      return new Response(
        JSON.stringify({ error: 'Invite link is required for new users' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For content notifications, subject and content are required
    if ((type === 'news' || type === 'event' || type === 'mention' || type === 'direct_message' || type === 'post') && (!subject || !content)) {
      return new Response(
        JSON.stringify({ error: 'Subject and content are required for content notifications' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare email content based on invitation type
    console.log('🚀 [EDGE FUNCTION DEBUG] Preparing email content for type:', type);
    let emailSubject = '';
    let html = '';

    if (type === 'existing_user') {
      emailSubject = `You've been added to the ${networkName} network`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${networkName}</h2>
          <p>Hello,</p>
          <p>${inviterName} has added you to their network: <strong>${networkName}</strong>.</p>
          <p>You can now collaborate with all members of this network.</p>
          <p>Login to your account to get started!</p>
          <p>
            <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/login" 
               style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
              Login Now
            </a>
          </p>
          <p>Best regards,<br>The Team</p>
        </div>
      `;
    } else if (type === 'new_user') {
      emailSubject = `You're invited to join ${networkName}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You're invited to join ${networkName}</h2>
          <p>Hello,</p>
          <p>${inviterName} has invited you to join their network: <strong>${networkName}</strong>.</p>
          <p>To accept this invitation, please create an account using the link below:</p>
          <p>
            <a href="${inviteLink}" 
               style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
              Accept Invitation
            </a>
          </p>
          <p>This invitation will expire in 7 days.</p>
          <p>Best regards,<br>The Team</p>
        </div>
      `;
    } else if (type === 'news') {
      console.log('🚀 [EDGE FUNCTION DEBUG] Creating news notification email with:', {
        subject,
        content: content?.substring(0, 100) + '...',
        networkName
      });
      emailSubject = subject || `New post in ${networkName}`;
      
      // Parse content to extract title if it's a portfolio post
      let postTitle = '';
      let postContent = content || 'Content not available';
      
      // Check if this is a portfolio post by looking for the pattern "shared a new post: Title. Description"
      const portfolioMatch = content?.match(/shared a new post: ([^.]+)\.\s*(.*)$/);
      if (portfolioMatch) {
        postTitle = portfolioMatch[1];
        postContent = portfolioMatch[2] || 'No description provided';
      }
      
      html = `
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
      `;
    } else if (type === 'post') {
      console.log('🚀 [EDGE FUNCTION DEBUG] Creating portfolio post notification email with:', {
        subject,
        content: content?.substring(0, 100) + '...',
        networkName
      });
      emailSubject = subject || `New post in ${networkName}`;
      
      // Parse content to extract title, description, and media for portfolio posts
      let postTitle = '';
      let postContent = content || 'Content not available';
      let hasMedia = false;
      let mediaType = '';
      let mediaUrl = '';
      
      // Check if this is a portfolio post by looking for the pattern "shared a new post: Title. Description [MediaType:URL]"
      const portfolioMatch = content?.match(/shared a new post: ([^.]+)\.\s*([^\[]*?)(\[([^:]+):([^\]]+)\])?\s*$/);
      if (portfolioMatch) {
        postTitle = portfolioMatch[1];
        postContent = portfolioMatch[2]?.trim() || 'No description provided';
        if (portfolioMatch[4] && portfolioMatch[5]) {
          hasMedia = true;
          mediaType = portfolioMatch[4];
          mediaUrl = portfolioMatch[5];
        }
      }
      
      html = `
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
                      ${mediaType === 'video' ? 'Video attached' : 
                        mediaType === 'audio' ? 'Audio attached' : 
                        'Media attached'}
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
      `;
    } else if (type === 'event') {
      console.log('🚀 [EDGE FUNCTION DEBUG] Creating event notification email with:', {
        subject,
        content: content?.substring(0, 100) + '...',
        eventDate,
        eventLocation,
        networkName
      });
      emailSubject = subject || `New post in ${networkName}`;
      
      // Format event date if provided
      let formattedDate = 'Date TBD';
      if (eventDate) {
        try {
          const date = new Date(eventDate);
          formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (e) {
          formattedDate = eventDate;
        }
      }
      
      html = `
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
              <p style="margin: 0 0 16px 0; color: #333; font-size: 16px; line-height: 1.5;">${content || 'Event description not available'}</p>
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
              <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/dashboard" 
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
      `;
    } else if (type === 'mention') {
      console.log('🚀 [EDGE FUNCTION DEBUG] Creating mention notification email with:', {
        subject,
        content: content?.substring(0, 100) + '...',
        messageContext,
        networkName
      });
      emailSubject = subject || `New post in ${networkName}`;
      html = `
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
            
            ${messageContext ? `
            <div style="margin-bottom: 16px;">
              <p style="margin: 0; color: #666; font-size: 14px;">In: ${messageContext}</p>
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
      `;
    } else if (type === 'direct_message') {
      console.log('🚀 [EDGE FUNCTION DEBUG] Creating direct message notification email with:', {
        subject,
        content: content?.substring(0, 100) + '...',
        networkName
      });
      emailSubject = subject || `New post in ${networkName}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <div style="background-color: #4caf50; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">💌 New Direct Message</h2>
            <p style="margin: 0; color: #e8f5e9; font-size: 14px;">You have a private message waiting</p>
          </div>
          
          <div style="background-color: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; border-top: none;">
            <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
              <p style="margin: 0; color: #666; font-size: 14px;">From: <strong>${inviterName}</strong></p>
              ${networkName ? `<p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">Network: ${networkName}</p>` : ''}
            </div>
            
            <div style="background-color: #e8f5e8; padding: 16px; border-left: 4px solid #4caf50; border-radius: 4px; margin-bottom: 20px;">
              <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.5;">${content || 'Message content not available'}</p>
            </div>
            
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
              <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/direct-messages" 
                 style="display: inline-block; background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Read & Reply to Message
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
      `;
    } else {
      // Handle unknown notification types
      console.warn('🚀 [EDGE FUNCTION DEBUG] Unknown notification type:', type);
      emailSubject = subject || `Notification from ${networkName}`;
      html = `
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
      `;
    }

    // Send email using Resend API
    const emailPayload = {
      from: Deno.env.get('FROM_EMAIL') || 'noreply@your-domain.com',
      to: toEmail,
      subject: emailSubject,
      html: html,
    };
    
    console.log('🚀 [EDGE FUNCTION DEBUG] Sending email to Resend:', {
      to: emailPayload.to,
      from: emailPayload.from,
      subject: emailPayload.subject,
      htmlPreview: emailPayload.html.substring(0, 200) + '...'
    });
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const resendData = await resendResponse.json();

    // Check if Resend returned an error
    if (resendResponse.status >= 400) {
      console.error('Resend API error:', resendData);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: resendData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({ success: true, data: resendData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing invitation:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

Deno.serve(handler);