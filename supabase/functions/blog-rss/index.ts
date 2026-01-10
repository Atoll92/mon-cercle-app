// Blog RSS Feed Edge Function
// Generates an RSS 2.0 feed for blog-type networks

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Escape XML special characters
function escapeXml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Strip HTML tags for description
function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

// Format date for RSS (RFC 822)
function formatRssDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toUTCString()
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get subdomain from URL path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const subdomain = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2]

    if (!subdomain) {
      return new Response('Subdomain required', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch blog by subdomain
    const { data: blog, error: blogError } = await supabase
      .from('networks')
      .select('id, name, description, subdomain, custom_domain, theme_color, logo_url, blog_settings, seo_settings')
      .eq('subdomain', subdomain.toLowerCase())
      .eq('network_type', 'blog')
      .single()

    if (blogError || !blog) {
      return new Response('Blog not found', {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      })
    }

    // Check if RSS is enabled
    const blogSettings = blog.blog_settings || {}
    if (blogSettings.rss_enabled === false) {
      return new Response('RSS feed is disabled for this blog', {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      })
    }

    // Fetch published posts
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        content,
        media_url,
        media_type,
        published_at,
        created_at,
        created_by_profile:profiles!blog_posts_created_by_fkey (
          full_name
        )
      `)
      .eq('network_id', blog.id)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(50)

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return new Response('Error fetching posts', {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      })
    }

    // Build blog URL
    const blogUrl = blog.custom_domain
      ? `https://${blog.custom_domain}`
      : `https://${blog.subdomain}.conclav.club`

    // SEO settings
    const seoSettings = blog.seo_settings || {}
    const blogTitle = seoSettings.meta_title || blog.name || 'Blog'
    const blogDescription = seoSettings.meta_description || blog.description || ''

    // Build RSS feed
    const rssItems = (posts || []).map(post => {
      const postUrl = `${blogUrl}/post/${post.id}`
      const title = post.title || 'Untitled'
      const description = stripHtml(post.content || '').substring(0, 500)
      const pubDate = formatRssDate(post.published_at || post.created_at)
      const author = post.created_by_profile?.full_name || 'Anonymous'

      let itemXml = `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${escapeXml(author)}</dc:creator>
      <description>${escapeXml(description)}</description>`

      // Add media enclosure if present
      if (post.media_url && post.media_type === 'image') {
        itemXml += `
      <enclosure url="${escapeXml(post.media_url)}" type="image/jpeg" />`
      }

      itemXml += `
    </item>`

      return itemXml
    }).join('')

    const lastBuildDate = posts && posts.length > 0
      ? formatRssDate(posts[0].published_at || posts[0].created_at)
      : formatRssDate(new Date().toISOString())

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(blogTitle)}</title>
    <link>${blogUrl}</link>
    <description>${escapeXml(blogDescription)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${blogUrl}/api/blog/${blog.subdomain}/rss" rel="self" type="application/rss+xml" />
    ${blog.logo_url ? `<image>
      <url>${escapeXml(blog.logo_url)}</url>
      <title>${escapeXml(blogTitle)}</title>
      <link>${blogUrl}</link>
    </image>` : ''}${rssItems}
  </channel>
</rss>`

    return new Response(rssFeed, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    })

  } catch (error) {
    console.error('RSS feed error:', error)
    return new Response('Internal server error', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    })
  }
})
