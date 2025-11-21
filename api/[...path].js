// api/og-handler/[...path].js
export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  const url = new URL(request.url)
  const originalPath = '/' + (url.pathname.split('/').slice(3).join('/') || '')
  
//   // Fetch OG tags from Supabase Edge Function
//   const ogResponse = await fetch(
//     `${process.env.SUPABASE_URL}/functions/v1/og-tags`,
//     {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         url: originalPath,
//         domain: url.origin
//       })
//     }
//   )
  
  // Get the original index.html
  const indexHtml = await fetch(`${url.origin}/index.html`).then(r => r.text())
  
//   if (!ogResponse.ok) {
//     // If Supabase function fails, return original HTML
//     return new Response(indexHtml, {
//       headers: { 'content-type': 'text/html' }
//     })
//   }
  
//   const ogTags = await ogResponse.text() // Assuming Supabase returns HTML string of meta tags
  
  // Inject OG tags into HTML
  const modifiedHtml = indexHtml.replace('</head>', `<meta-test>${originalPath}</meta-test></head>`)
  
  return new Response(modifiedHtml, {
    headers: { 'content-type': 'text/html' }
  })
}