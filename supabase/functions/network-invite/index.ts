// supabase/functions/network-invite/index.ts
/// <reference types="https://esm.sh/@types/node@18/index.d.ts" />
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const handler = async (request)=>{
  // Set CORS headers for browser clients
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  console.log('🚀 [EDGE FUNCTION DEBUG] Request received:', {
    method: request.method,
    headers: Object.fromEntries(request.headers.entries())
  });
  try {
    // Validate request
    if (!request.body) {
      return new Response(JSON.stringify({
        error: 'Request body is required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Parse the request body
    const requestBody = await request.json();
    const { toEmail, networkName, inviterName, type, inviteLink } = requestBody;
    console.log('🚀 [EDGE FUNCTION DEBUG] Parsed request body:', {
      toEmail,
      networkName,
      inviterName,
      type,
      hasInviteLink: !!inviteLink
    });
    // Validate required fields
    if (!toEmail || !networkName || !inviterName || !type) {
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // For new users, inviteLink is required
    if (type === 'new_user' && !inviteLink) {
      return new Response(JSON.stringify({
        error: 'Invite link is required for new users'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // For network invitations, only new_user and existing_user types are supported
    if (type !== 'new_user' && type !== 'existing_user') {
      return new Response(JSON.stringify({
        error: 'Only new_user and existing_user invitation types are supported'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
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
    }
    // Send email using Resend API
    const emailPayload = {
      from: Deno.env.get('FROM_EMAIL') || 'noreply@your-domain.com',
      to: toEmail,
      subject: emailSubject,
      html: html
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
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify(emailPayload)
    });
    const resendData = await resendResponse.json();
    // Check if Resend returned an error
    if (resendResponse.status >= 400) {
      console.error('Resend API error:', resendData);
      return new Response(JSON.stringify({
        error: 'Failed to send email',
        details: resendData
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Return success response
    return new Response(JSON.stringify({
      success: true,
      data: resendData
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error processing invitation:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
};
Deno.serve(handler);
