// Vercel Serverless Function for dynamic OG meta tags
// api/invitation/[code].js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const APP_URL = process.env.VITE_APP_URL || 'https://www.conclav.club';

export default async function handler(req, res) {
  const startTime = Date.now();
  console.log('[OG-META] Function invoked at:', new Date().toISOString());
  console.log('[OG-META] Request method:', req.method);
  console.log('[OG-META] Request URL:', req.url);
  console.log('[OG-META] Request headers:', JSON.stringify(req.headers, null, 2));

  const { code } = req.query;
  console.log('[OG-META] Invitation code:', code);

  if (!code) {
    console.error('[OG-META] No invitation code provided');
    return res.status(400).send('Invalid invitation code');
  }

  // Check environment variables
  console.log('[OG-META] Environment check:');
  console.log('[OG-META] - SUPABASE_URL exists:', !!SUPABASE_URL);
  console.log('[OG-META] - SUPABASE_ANON_KEY exists:', !!SUPABASE_ANON_KEY);
  console.log('[OG-META] - APP_URL:', APP_URL);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[OG-META] Missing Supabase credentials');
    return generateErrorHTML(res, 'Configuration error');
  }

  try {
    // Create Supabase client
    console.log('[OG-META] Creating Supabase client...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Fetch invitation and network details
    console.log('[OG-META] Fetching invitation for code:', code.toUpperCase());
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

    if (error) {
      console.error('[OG-META] Supabase error:', error);
      return generateErrorHTML(res, 'Database error');
    }

    if (!invitation) {
      console.error('[OG-META] No invitation found for code:', code);
      return generateErrorHTML(res, 'Invitation not found');
    }

    console.log('[OG-META] Invitation found:', {
      id: invitation.id,
      network_id: invitation.network_id,
      hasNetwork: !!invitation.networks
    });

    const network = invitation.networks;
    console.log('[OG-META] Network details:', {
      id: network?.id,
      name: network?.name,
      hasBackgroundImage: !!network?.background_image_url,
      hasLogo: !!network?.logo_url
    });

    const html = generateInvitationHTML(code, network);

    const duration = Date.now() - startTime;
    console.log('[OG-META] Success! Generated HTML in', duration, 'ms');
    console.log('[OG-META] HTML preview (first 500 chars):', html.substring(0, 500));

    // Set headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
    res.setHeader('X-OG-Function', 'invitation-preview');
    res.setHeader('X-OG-Duration', duration.toString());
    res.status(200).send(html);
  } catch (error) {
    console.error('[OG-META] Unexpected error:', error);
    console.error('[OG-META] Error stack:', error.stack);
    return generateErrorHTML(res, 'Internal error');
  }
}

function generateInvitationHTML(code, network) {
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
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap">

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
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
    h1 {
      font-size: 24px;
      margin-bottom: 10px;
      font-weight: 500;
    }
    p {
      font-size: 16px;
      opacity: 0.9;
      font-weight: 300;
    }
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

function generateErrorHTML(res, reason = 'Unknown error') {
  console.log('[OG-META] Generating error HTML. Reason:', reason);

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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
    p { margin: 10px 0; }
    a {
      color: white;
      text-decoration: underline;
      margin-top: 20px;
      display: inline-block;
    }
    .debug { font-size: 12px; opacity: 0.7; margin-top: 20px; }
  </style>
</head>
<body>
  <div>
    <h1>⚠️ Invitation not found</h1>
    <p>This invitation link may be invalid or expired.</p>
    <div class="debug">Error: ${reason}</div>
    <a href="${APP_URL}">Go to Conclav</a>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-OG-Error', reason);
  res.status(404).send(html);
}
