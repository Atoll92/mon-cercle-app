// api/_og.js

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path'); // e.g., 'circles/some-circle-id'

  if (!path) {
    // Redirect to the homepage if no path is specified
    return fetch(new URL('/', request.url));
  }

//   // Example: Extract an ID from the path
//   const pathParts = path.split('/');
//   const id = pathParts[pathParts.length - 1];

  let title = 'Your Default App Title';
  let description = 'Your default description.';
  let imageUrl = 'your_default_image_url.jpg';

//   // Fetch dynamic data from Supabase based on the ID
//   // Make sure to handle the case where the item is not found
//   if (path.startsWith('circles/') && id) {
//     const { data: circle, error } = await supabase
//       .from('circles') // Your table name
//       .select('name, description, image_url')
//       .eq('id', id)
//       .single();

//     if (circle) {
//       title = circle.name;
//       description = circle.description;
//       imageUrl = circle.image_url;
//     }
//   }

  // 1. Fetch the index.html from your production deployment
  const response = await fetch(new URL('/', request.url));
  let html = await response.text();

  // 2. Replace placeholders with dynamic OG data
  html = html.replace(/<title>.*?<\/title>/, `<title>${title} [${path}]</title>`);
  html = html.replace(/<meta property="og:title" content=".*?"\/>/, `<meta property="og:title" content="${title}"/>`);
  html = html.replace(/<meta property="og:description" content=".*?"\/>/, `<meta property="og:description" content="${description}"/>`);
  html = html.replace(/<meta property="og:image" content=".*?"\/>/, `<meta property="og:image" content="${imageUrl}"/>`);
  // Add other tags like twitter:card, etc., as needed

  // 3. Return the modified HTML
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}