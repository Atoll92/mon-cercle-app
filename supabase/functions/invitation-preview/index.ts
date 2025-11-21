// supabase/functions/invitation-preview/index.ts
/// <reference types="https://esm.sh/@types/node@18/index.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const APP_URL = Deno.env.get('APP_URL') || 'https://www.conclav.club';

const handler = async (request: Request): Promise<Response> => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract the invitation code from the URL path
    // Expected: /invitation-preview/CODE
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const code = pathParts[pathParts.length - 1];

    if (!code || code === 'invitation-preview') {
      return new Response('Invalid invitation code', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Fetch invitation and network details
    const { data: invitation, error } = await supabase
      .from('network_invitation_links')
      .select(`
        *,
        networks!inner(
          id,
          name,
          description,
          logo_url,
          background_image_url,
          privacy_level,
          created_at
        )
      `)
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !invitation) {
      console.error('Error fetching invitation:', error);
      return generateErrorHTML('Invitation not found or inactive');
    }

    const network = invitation.networks;

    // Generate dynamic HTML with Open Graph metadata
    const html = generateInvitationHTML(code, network, invitation);

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=600'
      }
    });
  } catch (error) {
    console.error('Error in invitation-preview:', error);
    return generateErrorHTML('Failed to load invitation');
  }
};

function generateInvitationHTML(code: string, network: any, invitation: any): string {
  const networkName = network?.name || 'Conclav Network';
  const networkDescription = network?.description || 'Join this network on Conclav';
  const networkLogoUrl = network?.logo_url || `${APP_URL}/logo.png`;
  const networkBackgroundUrl = network?.background_image_url || networkLogoUrl;
  const invitationUrl = `${APP_URL}/join/${code}`;

  // Clean description for meta tag (remove HTML, truncate)
  const cleanDescription = networkDescription
    .replace(/<[^>]*>/g, '')
    .replace(/\n/g, ' ')
    .substring(0, 160);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary Meta Tags -->
  <title>Join ${networkName} on Conclav</title>
  <meta name="title" content="Join ${networkName} on Conclav">
  <meta name="description" content="${cleanDescription}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${invitationUrl}">
  <meta property="og:title" content="Join ${networkName} on Conclav">
  <meta property="og:description" content="${cleanDescription}">
  <meta property="og:image" content="${networkBackgroundUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${networkName}">
  <meta property="og:site_name" content="Conclav">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${invitationUrl}">
  <meta property="twitter:title" content="Join ${networkName} on Conclav">
  <meta property="twitter:description" content="${cleanDescription}">
  <meta property="twitter:image" content="${networkBackgroundUrl}">

  <!-- Additional Meta -->
  <meta name="theme-color" content="#667eea">
  <link rel="icon" type="image/png" href="${networkLogoUrl}">

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .loader {
      text-align: center;
      color: white;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h1 { font-size: 24px; margin-bottom: 10px; }
    p { font-size: 16px; opacity: 0.9; }
  </style>

  <script>
    // Redirect to the React app immediately
    window.location.href = '${invitationUrl}';
  </script>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <h1>Loading ${networkName}...</h1>
    <p>You will be redirected shortly</p>
  </div>

  <noscript>
    <meta http-equiv="refresh" content="0; url=${invitationUrl}">
  </noscript>
</body>
</html>`;
}

function generateErrorHTML(message: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation Error - Conclav</title>
  <meta property="og:title" content="Conclav Networks">
  <meta property="og:description" content="Join professional networks on Conclav">
  <meta property="og:image" content="${APP_URL}/logo.png">
  <style>
    body {
      font-family: sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    h1 { margin-bottom: 10px; }
    a {
      color: white;
      text-decoration: underline;
      margin-top: 20px;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div>
    <h1>⚠️ ${message}</h1>
    <p>This invitation link may be invalid or expired.</p>
    <a href="${APP_URL}">Go to Conclav</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}

Deno.serve(handler);
