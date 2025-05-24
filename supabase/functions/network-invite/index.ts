// supabase/functions/network-invite/index.ts

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface InviteData {
  toEmail: string;
  networkName: string;
  inviterName: string;
  type: 'existing_user' | 'new_user' | 'news_notification';
  inviteLink?: string;
  subject?: string;
  content?: string;
  relatedItemId?: string;
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

  try {
    // Validate request
    if (!request.body) {
      return new Response(
        JSON.stringify({ error: 'Request body is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const { toEmail, networkName, inviterName, type, inviteLink, subject, content, relatedItemId } = await request.json() as InviteData;

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

    // For news notifications, subject and content are required
    if (type === 'news_notification' && (!subject || !content)) {
      return new Response(
        JSON.stringify({ error: 'Subject and content are required for news notifications' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare email content based on invitation type
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
    } else if (type === 'news_notification') {
      emailSubject = subject;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #2196f3; margin: 0 0 10px 0;">📰 New Post in ${networkName}</h2>
            <p style="margin: 0; color: #666; font-size: 14px;">Stay connected with your network</p>
          </div>
          
          <div style="background-color: white; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <p style="margin: 0 0 16px 0; color: #333;">${content}</p>
            
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
              <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/dashboard" 
                 style="display: inline-block; background-color: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                View Full Post
              </a>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
            <p style="margin: 0 0 8px 0;">You're receiving this because you're subscribed to notifications for ${networkName}.</p>
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
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: Deno.env.get('FROM_EMAIL') || 'noreply@your-domain.com',
        to: toEmail,
        subject: emailSubject,
        html: html,
      }),
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