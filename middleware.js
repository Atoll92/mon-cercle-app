import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
  matcher: [
    '/circles/:path*',
    '/events/:path*',
    '/dashboard',
    '/portfolio/:path*',
    '/profile/:path*'
  ]
};

// Initialize Supabase client for edge runtime
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

export default async function middleware(req) {

  console.log('Middleware triggered for:', req.url);

  const userAgent = req.headers.get('user-agent') || '';
  
  // Enhanced bot detection
  const isBot = /bot|crawler|spider|crawling|facebookexternalhit|slurp|mediapartners|whatsapp|telegram|twitter|pinterest|linkedin|slack|discord/i.test(userAgent);
  
  // Only process for bots
  if (!isBot) {
    console.log('Skipping middleware for non-bot user agent:', userAgent);
    return;
  }
  
  console.log('Processing middleware for bot user agent:', userAgent);
  
  const url = new URL(req.url);
  const pathname = url.pathname;

  try {
    // Fetch dynamic data based on route
    const data = await fetchDynamicData(pathname);
    
    // Generate optimized HTML for bots
    const html = generateBotHTML(data, pathname, url.origin);
    
    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'cache-control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, let the request continue normally
    return;
  }
}

async function fetchDynamicData(pathname) {
  const pathParts = pathname.split('/').filter(Boolean);
  const [resource, id] = pathParts;

  let data = {
    title: 'Conclav',
    description: 'Your private community platform',
    image: '/og-image.png',
    url: pathname
  };

  try {
    switch (resource) {
      case 'circles':
        if (id) {
          const { data: network, error } = await supabase
            .from('networks')
            .select('name, description, image_url')
            .eq('id', id)
            .single();

          if (network && !error) {
            data.title = `${network.name} - Conclav`;
            data.description = network.description || `Join ${network.name} on Conclav`;
            data.image = network.image_url || '/og-image.png';
          }
        }
        break;

      case 'events':
        if (id) {
          const { data: event, error } = await supabase
            .from('events')
            .select('title, description, image_url, start_date')
            .eq('id', id)
            .single();

          if (event && !error) {
            data.title = `${event.title} - Conclav`;
            data.description = event.description || `Event on ${new Date(event.start_date).toLocaleDateString()}`;
            data.image = event.image_url || '/og-image.png';
          }
        }
        break;

      case 'portfolio':
        if (id) {
          const { data: post, error } = await supabase
            .from('posts')
            .select('title, content, media_url')
            .eq('id', id)
            .eq('post_type', 'portfolio')
            .single();

          if (post && !error) {
            data.title = `${post.title} - Conclav`;
            data.description = post.content?.substring(0, 160) || 'Portfolio item on Conclav';
            data.image = post.media_url || '/og-image.png';
          }
        }
        break;

      case 'profile':
        if (id) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('display_name, bio, avatar_url')
            .eq('id', id)
            .single();

          if (profile && !error) {
            data.title = `${profile.display_name} - Conclav`;
            data.description = profile.bio || `${profile.display_name} on Conclav`;
            data.image = profile.avatar_url || '/og-image.png';
          }
        }
        break;

      case 'dashboard':
        data.title = 'Dashboard - Conclav';
        data.description = 'Manage your networks and connections on Conclav';
        break;
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  return data;
}

function generateBotHTML(data, pathname, origin) {
  const { title, description, image } = data;
  const fullUrl = `${origin}${pathname}`;
  const imageUrl = image.startsWith('http') ? image : `${origin}${image}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:url" content="${fullUrl}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Conclav">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${imageUrl}">
    
    <!-- Basic Meta Tags -->
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${fullUrl}">
    
    <!-- Preload app for faster user experience -->
    <link rel="preload" href="/assets/index.js" as="script" crossorigin>
    <link rel="preload" href="/assets/index.css" as="style">
    
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 20px;
        background: #f5f5f5;
        color: #333;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      h1 { margin-top: 0; }
      .loading {
        text-align: center;
        padding: 40px;
        color: #666;
      }
    </style>
</head>
<body>
    <div class="container">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
        <div class="loading">
            <p>Loading full experience...</p>
        </div>
    </div>
    
    <!-- Load the SPA for real users who have JS enabled -->
    <script>
      // Redirect to load the full SPA
      if (!window.location.hash && typeof window.history.replaceState === 'function') {
        // Add a small delay to ensure meta tags are parsed
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    </script>
</body>
</html>`;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}