// Vercel Serverless Function for dynamic OG meta tags
// api/invitation/[code].js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const APP_URL = process.env.VITE_APP_URL || 'https://www.conclav.club';

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Invalid invitation code');
  }

  try {
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
      return generateErrorHTML(res);
    }

    const network = invitation.networks;
    const html = generateInvitationHTML(code, network);

    // Set headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error in invitation handler:', error);
    return generateErrorHTML(res);
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

function generateErrorHTML(res) {
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
    <h1>⚠️ Invitation not found</h1>
    <p>This invitation link may be invalid or expired.</p>
    <a href="${APP_URL}">Go to Conclav</a>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.status(404).send(html);
}
