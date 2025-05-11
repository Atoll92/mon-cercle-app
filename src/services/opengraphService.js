// src/services/opengraphService.js
import { supabase } from '../supabaseclient';

/**
 * Enhanced fetch OpenGraph data for a URL with better fallbacks
 * @param {string} url - The URL to fetch OpenGraph data for
 * @returns {Promise<object>} The OpenGraph data
 */
export const fetchOpenGraphData = async (url) => {
  try {
    console.log('OpenGraph Service: Fetching data for URL:', url);
    
    // Ensure URL has http/https prefix
    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = 'https://' + url;
    }

    // Check if it's a YouTube URL - use direct API for better data
    const ytVideoId = extractYouTubeVideoId(formattedUrl);
    if (ytVideoId) {
      try {
        const ytData = await fetchYouTubeData(ytVideoId);
        if (ytData) {
          console.log('OpenGraph Service: Using YouTube API data:', ytData);
          return ytData;
        }
      } catch (ytError) {
        console.error('OpenGraph Service: YouTube API error:', ytError);
        // Continue with normal fetch if YouTube API fails
      }
    }
    
    // Using a proxy to avoid CORS issues
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(formattedUrl)}`;
    console.log('OpenGraph Service: Using proxy URL:', proxyUrl);
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Network response error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.contents) {
      console.warn('OpenGraph Service: No contents in response for URL:', formattedUrl);
      return createFallbackData(formattedUrl);
    }
    
    // Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, 'text/html');
    
    // Extract OG data with enhanced fallbacks
    const og = {
      url: formattedUrl,
      title: getMetaTag(doc, 'og:title') || getMetaTag(doc, 'title') || doc.title || getDomainName(formattedUrl),
      description: getMetaTag(doc, 'og:description') || getMetaTag(doc, 'description') || getDefaultDescription(formattedUrl),
      image: getMetaTag(doc, 'og:image') || findFirstImage(doc) || getFallbackImage(formattedUrl),
      siteName: getMetaTag(doc, 'og:site_name') || getDomainName(formattedUrl),
      favicon: getFavicon(doc, formattedUrl)
    };
    
    console.log('OpenGraph Service: Successfully extracted data:', og);
    return og;
  } catch (error) {
    console.error('OpenGraph Service: Error fetching data:', error);
    // Return a fallback object
    return createFallbackData(url);
  }
};

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeVideoId(url) {
  try {
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(ytRegex);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting YouTube ID:', error);
    return null;
  }
}

/**
 * Fetch YouTube video data using their oEmbed API
 */
async function fetchYouTubeData(videoId) {
  try {
    // YouTube oEmbed API doesn't require API key for basic info
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: data.title || 'YouTube Video',
      description: data.author_name ? `Video by ${data.author_name}` : 'Watch this video on YouTube',
      image: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      siteName: 'YouTube',
      favicon: 'https://www.youtube.com/s2/favicons?domain=youtube.com',
      videoId: videoId
    };
  } catch (error) {
    console.error('YouTube API fetch error:', error);
    return null;
  }
}

/**
 * Fetch OpenGraph data from our Supabase cache or fetch it remotely
 * @param {string} url - The URL to fetch OpenGraph data for 
 * @returns {Promise<object>} The OpenGraph data
 */
export const getOpenGraphData = async (url) => {
  try {
    if (!url) {
      console.error('OpenGraph Service: No URL provided to getOpenGraphData');
      return createFallbackData('#');
    }
    
    console.log('OpenGraph Service: Getting data for URL:', url);
    
    // Normalize URL for caching
    let normalizedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      normalizedUrl = 'https://' + url;
    }
    
    // Clean URL for caching (remove tracking parameters)
    const cleanUrl = cleanUrlForCaching(normalizedUrl);
    
    // Check if we have cached data
    const { data: cachedData, error } = await supabase
      .from('opengraph_cache')
      .select('*')
      .eq('url', cleanUrl)
      .maybeSingle();
    
    // If we have fresh cached data (less than 7 days old), use it
    if (cachedData && !error && new Date(cachedData.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      console.log('OpenGraph Service: Using cached data for URL:', cleanUrl);
      try {
        return JSON.parse(cachedData.data);
      } catch (parseError) {
        console.error('OpenGraph Service: Error parsing cached data:', parseError);
        // If JSON parsing fails, continue to fetch new data
      }
    }
    
    // Otherwise fetch new data
    console.log('OpenGraph Service: Fetching fresh data for URL:', normalizedUrl);
    const ogData = await fetchOpenGraphData(normalizedUrl);
    
    // Cache the data if we got valid results
    if (ogData && ogData.title) {
      try {
        if (cachedData) {
          // Update existing cache
          console.log('OpenGraph Service: Updating cache for URL:', cleanUrl);
          await supabase
            .from('opengraph_cache')
            .update({
              data: JSON.stringify(ogData),
              updated_at: new Date().toISOString()
            })
            .eq('url', cleanUrl);
        } else {
          // Create new cache entry with a unique URL to avoid conflicts
          console.log('OpenGraph Service: Creating new cache for URL:', cleanUrl);
          
          // Use upsert instead of insert to handle potential conflicts
          await supabase
            .from('opengraph_cache')
            .upsert([{
              url: cleanUrl,
              data: JSON.stringify(ogData),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }], { 
              onConflict: 'url' 
            });
        }
      } catch (cacheError) {
        console.error('OpenGraph Service: Error updating cache:', cacheError);
        // Don't fail if caching fails
      }
    }
    
    return ogData;
  } catch (error) {
    console.error('OpenGraph Service: Error getting OpenGraph data:', error);
    return createFallbackData(url);
  }
};

/**
 * Clean URL by removing tracking parameters for better caching
 */
function cleanUrlForCaching(url) {
  try {
    const urlObj = new URL(url);
    
    // Remove common tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ab_channel'];
    
    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    return urlObj.toString();
  } catch (error) {
    console.error('Error cleaning URL:', error);
    return url;
  }
}

/**
 * Helper function to get meta tag content
 */
function getMetaTag(doc, tagName) {
  try {
    const metaTag = doc.querySelector(`meta[property="${tagName}"], meta[name="${tagName}"]`);
    return metaTag ? metaTag.getAttribute('content') : null;
  } catch (error) {
    console.error('OpenGraph Service: Error getting meta tag:', tagName, error);
    return null;
  }
}

/**
 * Find the first suitable image in the document
 */
function findFirstImage(doc) {
  try {
    // Find the first image with reasonable dimensions
    const images = doc.querySelectorAll('img');
    for (const img of images) {
      const src = img.getAttribute('src');
      const width = parseInt(img.getAttribute('width') || '0');
      const height = parseInt(img.getAttribute('height') || '0');
      
      // Skip tiny images, icons, or spacers
      if (src && (width > 100 || height > 100 || (!width && !height))) {
        // Convert relative URLs to absolute
        if (src.startsWith('/')) {
          // Skip data URLs
          if (src.startsWith('data:')) continue;
          
          // Find the base URL
          const baseElement = doc.querySelector('base');
          const baseUrl = baseElement ? baseElement.getAttribute('href') : null;
          
          if (baseUrl) {
            return new URL(src, baseUrl).href;
          }
        } else if (!src.startsWith('http')) {
          // Skip relative paths if we can't resolve them
          continue;
        }
        
        return src;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding first image:', error);
    return null;
  }
}

/**
 * Get favicon from the document
 */
function getFavicon(doc, url) {
  try {
    // Try to find favicon link
    const faviconLink = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (faviconLink) {
      const href = faviconLink.getAttribute('href');
      if (href) {
        // Convert relative URLs to absolute
        if (href.startsWith('/')) {
          return new URL(href, url).href;
        }
        return href;
      }
    }
    
    // Fallback to the default favicon location
    return new URL('/favicon.ico', url).href;
  } catch (error) {
    console.error('Error getting favicon:', error);
    return null;
  }
}

/**
 * Extract domain name from URL
 */
function getDomainName(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    return url;
  }
}

/**
 * Create a default description
 */
function getDefaultDescription(url) {
  const domain = getDomainName(url);
  return `Visit ${domain} for more information.`;
}

/**
 * Get a fallback image based on the domain
 */
function getFallbackImage(url) {
  try {
    const domain = getDomainName(url);
    
    // Special cases for common sites
    if (domain.includes('google.com')) {
      return 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png';
    }
    
    if (domain.includes('github.com')) {
      return 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
    }
    
    if (domain.includes('youtube.com')) {
      return 'https://www.youtube.com/img/desktop/yt_1200.png';
    }
    
    if (domain.includes('spotify.com')) {
      return 'https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png';
    }
    
    // Generate a placeholder with the domain name
    return `https://via.placeholder.com/1200x630/e3f2fd/2196f3?text=${encodeURIComponent(domain)}`;
  } catch (error) {
    console.error('Error getting fallback image:', error);
    return 'https://via.placeholder.com/1200x630/e3f2fd/2196f3?text=Website+Preview';
  }
}

/**
 * Create fallback data for a URL
 */
function createFallbackData(url) {
  const domain = getDomainName(url);
  
  return {
    url: url,
    title: domain,
    description: `Visit ${domain} for more information.`,
    image: getFallbackImage(url),
    siteName: domain,
    favicon: `https://www.google.com/s2/favicons?domain=${domain}`
  };
}