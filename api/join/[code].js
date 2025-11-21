// Vercel Serverless Function for /join/:code routes
// Detects bots and injects OpenGraph meta tags for social media previews

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const APP_URL = process.env.VITE_APP_URL || 'https://www.conclav.club';

export default async function handler(req, res) {
  const { code } = req.query;
  const userAgent = req.headers['user-agent'] || '';

  // Check if it's a bot/crawler
  const isCrawler = /bot|crawler|spider|crawling|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Slackbot|Discordbot|Telegram|facebot|ia_archiver/i.test(userAgent);

  console.log(`[OG-JOIN] Code: ${code}, UserAgent: ${userAgent.substring(0, 50)}, isCrawler: ${isCrawler}`);

  // For regular users, redirect to the main app
  if (!isCrawler) {
    return res.redirect(307, `/?redirect=/join/${code}`);
  }

  // For crawlers, fetch network data and inject OG tags
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/network_invitation_links?code=eq.${code.toUpperCase()}&is_active=eq.true&select=*,networks!inner(id,name,description,logo_url,background_image_url)`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!data || data.length === 0) {
      console.log(`[OG-JOIN] Invitation not found: ${code}`);
      return res.status(404).send(generateErrorHTML('Invitation not found or inactive'));
    }

    const invitation = data[0];
    const network = invitation.networks;
    const networkName = network?.name || 'Conclav Network';
    const networkDescription = (network?.description || 'Join this network on Conclav')
      .replace(/<[^>]*>/g, '')
      .replace(/\n/g, ' ')
      .substring(0, 160);

    // Use logo for OG image (should be < 300KB for WhatsApp)
    const ogImageUrl = network?.logo_url || `${APP_URL}/logo.png`;
    const invitationUrl = `${APP_URL}/join/${code}`;

    console.log(`[OG-JOIN] Success for: ${networkName}, Image: ${ogImageUrl}`);

    // Return HTML with injected OG tags
    const html = generateInvitationHTML(code, networkName, networkDescription, ogImageUrl, invitationUrl);

    return res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(html);
  } catch (error) {
    console.error('[OG-JOIN] Error:', error);
    return res.status(500).send(generateErrorHTML('Failed to load invitation'));
  }
}

function generateInvitationHTML(code, networkName, networkDescription, ogImageUrl, invitationUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary Meta Tags - MUST come before style tags for WhatsApp -->
  <title>Join ${networkName} on Conclav</title>
  <meta name="title" content="Join ${networkName} on Conclav">
  <meta name="description" content="${networkDescription}">

  <!-- Open Graph / Facebook / WhatsApp - Image must be < 300KB -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${invitationUrl}">
  <meta property="og:title" content="Join ${networkName} on Conclav">
  <meta property="og:description" content="${networkDescription}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:secure_url" content="${ogImageUrl}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="300">
  <meta property="og:image:height" content="300">
  <meta property="og:image:alt" content="${networkName}">
  <meta property="og:site_name" content="Conclav">
  <meta property="og:locale" content="en_US">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary">
  <meta property="twitter:url" content="${invitationUrl}">
  <meta property="twitter:title" content="Join ${networkName} on Conclav">
  <meta property="twitter:description" content="${networkDescription}">
  <meta property="twitter:image" content="${ogImageUrl}">

  <!-- Additional Meta -->
  <meta name="theme-color" content="#667eea">
  <link rel="icon" type="image/png" href="${ogImageUrl}">

  <!-- Auto-redirect to actual app after crawlers have read the page -->
  <meta http-equiv="refresh" content="0;url=${invitationUrl}">

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
      text-align: center;
      color: white;
    }
    .card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
    }
    .logo {
      width: 100px;
      height: 100px;
      margin: 0 auto 20px;
      border-radius: 50%;
      object-fit: cover;
    }
    h1 {
      font-size: 32px;
      margin-bottom: 16px;
      font-weight: 600;
    }
    p {
      font-size: 18px;
      opacity: 0.9;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      background: white;
      color: #667eea;
      padding: 12px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: transform 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <div class="card">
    <img src="${ogImageUrl}" alt="${networkName}" class="logo" onerror="this.style.display='none'">
    <h1>Join ${networkName}</h1>
    <p>${networkDescription}</p>
    <a href="${invitationUrl}" class="btn">Join Network</a>
    <p style="margin-top: 20px; font-size: 14px; opacity: 0.7;">Redirecting...</p>
  </div>
</body>
</html>`;
}

function generateErrorHTML(message) {
  return `<!DOCTYPE html>
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
}
