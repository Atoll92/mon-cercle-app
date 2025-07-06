export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // For static assets, don't process - let Vercel serve them directly
  if (
    path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|txt|xml)$/) ||
    path.startsWith('/_next/') ||
    path.startsWith('/api/') ||
    path.startsWith('/assets/')
  ) {
    // Return undefined to let Vercel handle static files
    return;
  }

  // For HTML routes, we want to potentially modify OG tags
  // For now, just serve the index.html without modification to test
  
  // In production, you would fetch from your deployed URL
  // For local dev, this won't work perfectly
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : request.url.origin;
    
  try {
    // Fetch the built index.html
    const response = await fetch(`${baseUrl}/index.html`);
    
    if (!response.ok) {
      // If we can't fetch index.html, return undefined to let Vercel handle it
      return;
    }
    
    let html = await response.text();
    
    // For testing, let's modify the title to show it's working
    html = html.replace(
      /<title>(.*?)<\/title>/,
      `<title>$1 - Edge Function Active [${path}]</title>`
    );
    
    // TODO: Add your dynamic OG tag logic here
    // Example:
    // if (path.startsWith('/circles/')) {
    //   const circleId = path.split('/')[2];
    //   // Fetch circle data and update OG tags
    // }
    
    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    // Return undefined to let Vercel handle the request normally
    return;
  }
}