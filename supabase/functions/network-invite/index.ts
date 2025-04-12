// supabase/functions/network-invite/index.ts

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface InviteData {
  toEmail: string;
  networkName: string;
  inviterName: string;
  type: 'existing_user' | 'new_user';
  inviteLink?: string;
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
    const { toEmail, networkName, inviterName, type, inviteLink } = await request.json() as InviteData;

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

    // Prepare email content based on invitation type
    let subject = '';
    let html = '';

    if (type === 'existing_user') {
      subject = `You've been added to the ${networkName} network`;
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
    } else {
      subject = `You're invited to join ${networkName}`;
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
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: Deno.env.get('FROM_EMAIL') || 'noreply@your-domain.com',
        to: toEmail,
        subject: subject,
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