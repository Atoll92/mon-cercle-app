import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MetadataResponse {
  success: boolean
  title?: string
  description?: string
  image?: string
  url: string
  error?: string
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Fetch YouTube video metadata using oEmbed API
 */
async function fetchYouTubeMetadata(videoId: string, originalUrl: string): Promise<MetadataResponse> {
  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`

    const response = await fetch(oEmbedUrl)

    if (!response.ok) {
      throw new Error(`YouTube oEmbed API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      success: true,
      title: data.title || 'YouTube Video',
      description: data.author_name ? `By ${data.author_name}` : '',
      image: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      url: originalUrl
    }
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error)
    throw error
  }
}

/**
 * Check if URL is from a known video platform and extract video ID
 */
function getVideoPlatformInfo(url: string): { platform: string; videoId: string } | null {
  // YouTube
  const youtubeId = extractYouTubeVideoId(url)
  if (youtubeId) {
    return { platform: 'youtube', videoId: youtubeId }
  }

  // Add other platforms here if needed (Vimeo, Dailymotion, etc.)

  return null
}

/**
 * Parse HTML content to extract metadata
 */
function parseHtmlMetadata(html: string): { title: string; description: string; image: string } {
  const metadata = {
    title: '',
    description: '',
    image: ''
  }

  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    if (!doc) return metadata

    // Extract title from Open Graph or Twitter meta tags first, then fall back to <title>
    const ogTitle = doc.querySelector('meta[property="og:title"]')
    const twitterTitle = doc.querySelector('meta[name="twitter:title"]')
    const titleTag = doc.querySelector('title')

    if (ogTitle) {
      metadata.title = ogTitle.getAttribute('content') || ''
    } else if (twitterTitle) {
      metadata.title = twitterTitle.getAttribute('content') || ''
    } else if (titleTag) {
      metadata.title = titleTag.textContent || ''
    }

    // Extract description
    const ogDescription = doc.querySelector('meta[property="og:description"]')
    const twitterDescription = doc.querySelector('meta[name="twitter:description"]')
    const metaDescription = doc.querySelector('meta[name="description"]')

    if (ogDescription) {
      metadata.description = ogDescription.getAttribute('content') || ''
    } else if (twitterDescription) {
      metadata.description = twitterDescription.getAttribute('content') || ''
    } else if (metaDescription) {
      metadata.description = metaDescription.getAttribute('content') || ''
    }

    // Extract image
    const ogImage = doc.querySelector('meta[property="og:image"]')
    const twitterImage = doc.querySelector('meta[name="twitter:image"]')

    if (ogImage) {
      metadata.image = ogImage.getAttribute('content') || ''
    } else if (twitterImage) {
      metadata.image = twitterImage.getAttribute('content') || ''
    }
  } catch (error) {
    console.error('Error parsing HTML:', error)
  }

  return metadata
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    // Validate URL
    if (!url) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'URL is required',
          url: url || ''
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate URL format
    let urlObj: URL
    try {
      urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid URL protocol')
      }
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid URL format',
          url: url
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if this is a known video platform (YouTube, etc.)
    const videoPlatform = getVideoPlatformInfo(url)

    if (videoPlatform) {
      try {
        let result: MetadataResponse | null = null

        if (videoPlatform.platform === 'youtube') {
          result = await fetchYouTubeMetadata(videoPlatform.videoId, url)
        }

        if (result) {
          return new Response(
            JSON.stringify(result),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
      } catch (error) {
        console.error(`Error fetching ${videoPlatform.platform} metadata, falling back to HTML parsing:`, error)
        // Fall through to regular HTML fetching
      }
    }

    // Fetch the URL (for non-video platforms or as fallback)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Conclav/1.0; +https://conclav.club)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      // Set a timeout
      signal: AbortSignal.timeout(10000), // 10 seconds timeout
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          title: urlObj.hostname,
          description: '',
          image: '',
          url: url,
          error: `HTTP error! status: ${response.status}`
        }),
        {
          status: 200, // Return 200 so client can still use fallback data
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get HTML content
    const html = await response.text()

    // Parse metadata
    const metadata = parseHtmlMetadata(html)

    // Return metadata
    const result: MetadataResponse = {
      success: true,
      title: metadata.title || urlObj.hostname,
      description: metadata.description || '',
      image: metadata.image || '',
      url: url
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error fetching URL metadata:', error)

    return new Response(
      JSON.stringify({
        success: false,
        title: '',
        description: '',
        image: '',
        url: '',
        error: error.message || 'Failed to fetch URL metadata'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
