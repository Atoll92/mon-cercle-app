// Edge middleware to inject OG tags for invitation links
export const config = {
  matcher: '/join/:code*',
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const APP_URL = process.env.VITE_APP_URL || 'https://www.conclav.club';

export default async function middleware(request) {
  const { pathname } = new URL(request.url);

  // Only handle /join/:code routes
  const joinMatch = pathname.match(/^\/join\/([^\/]+)$/);
  if (!joinMatch) {
    return; // Continue to next middleware/handler
  }

  const code = joinMatch[1];
  const userAgent = request.headers.get('user-agent') || '';

  // Check if it's a bot/crawler
  const isCrawler = /bot|crawler|spider|crawling|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Slackbot|Discordbot|Telegram/i.test(userAgent);

  if (!isCrawler) {
    return; // Let React app handle it for regular users
  }

  // For crawlers, fetch network data and inject OG tags
  try {
    // Use Supabase REST API directly
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
      return; // Fallback to React app
    }

    const invitation = data[0];
    const network = invitation.networks;
    const networkName = network?.name || 'Conclav Network';
    const networkDescription = (network?.description || 'Join this network on Conclav')
      .replace(/<[^>]*>/g, '')
      .replace(/\n/g, ' ')
      .substring(0, 160);
    const networkBackgroundUrl = network?.background_image_url || network?.logo_url || `${APP_URL}/logo.png`;
    const invitationUrl = `${APP_URL}/join/${code}`;

    // Return HTML with injected OG tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Join ${networkName} on Conclav</title>
  <meta name="title" content="Join ${networkName} on Conclav">
  <meta name="description" content="${networkDescription}">

  <meta property="og:type" content="website">
  <meta property="og:url" content="${invitationUrl}">
  <meta property="og:title" content="Join ${networkName} on Conclav">
  <meta property="og:description" content="${networkDescription}">
  <meta property="og:image" content="${networkBackgroundUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Conclav">

  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${invitationUrl}">
  <meta property="twitter:title" content="Join ${networkName} on Conclav">
  <meta property="twitter:description" content="${networkDescription}">
  <meta property="twitter:image" content="${networkBackgroundUrl}">
</head>
<body>
  <h1>Join ${networkName}</h1>
  <p>${networkDescription}</p>
  <a href="${invitationUrl}">Join Network</a>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    });
  } catch (error) {
    console.error('[OG-MIDDLEWARE] Error:', error);
    return undefined; // Fallback to React app
  }
}
