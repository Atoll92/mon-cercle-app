// src/services/opengraphService.js
import { supabase } from '../supabaseclient';

/**
 * Enhanced fetch OpenGraph data for a URL with better fallbacks
 * @param {string} url - The URL to fetch OpenGraph data for
 * @returns {Promise<object>} The OpenGraph data
 */
// export const fetchOpenGraphData = async (url) => {
//   try {
//     console.log('OpenGraph Service: Fetching data for URL:', url);
    
//     // Ensure URL has http/https prefix
//     let formattedUrl = url;
//     if (!url.startsWith('http://') && !url.startsWith('https://')) {
//       formattedUrl = 'https://' + url;
//     }

//     // Check if it's a YouTube URL - use direct API for better data
//     const ytVideoId = extractYouTubeVideoId(formattedUrl);
//     if (ytVideoId) {
//       try {
//         const ytData = await fetchYouTubeData(ytVideoId);
//         if (ytData) {
//           console.log('OpenGraph Service: Using YouTube API data:', ytData);
//           return ytData;
//         }
//       } catch (ytError) {
//         console.error('OpenGraph Service: YouTube API error:', ytError);
//         // Continue with normal fetch if YouTube API fails
//       }
//     }
    
//     // Using a proxy to avoid CORS issues
//     const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(formattedUrl)}`;
//     console.log('OpenGraph Service: Using proxy URL:', proxyUrl);
    
//     const response = await fetch(proxyUrl);
    
//     if (!response.ok) {
//       throw new Error(`Network response error: ${response.status} ${response.statusText}`);
//     }
    
//     const data = await response.json();
    
//     if (!data.contents) {
//       console.warn('OpenGraph Service: No contents in response for URL:', formattedUrl);
//       return createFallbackData(formattedUrl);
//     }
    
//     // Parse HTML
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(data.contents, 'text/html');
    
//     // Extract OG data with enhanced fallbacks
//     const og = {
//       url: formattedUrl,
//       title: getMetaTag(doc, 'og:title') || getMetaTag(doc, 'title') || doc.title || getDomainName(formattedUrl),
//       description: getMetaTag(doc, 'og:description') || getMetaTag(doc, 'description') || getDefaultDescription(formattedUrl),
//       image: getMetaTag(doc, 'og:image') || findFirstImage(doc) || getFallbackImage(formattedUrl),
//       siteName: getMetaTag(doc, 'og:site_name') || getDomainName(formattedUrl),
//       favicon: getFavicon(doc, formattedUrl)
//     };
    
//     console.log('OpenGraph Service: Successfully extracted data:', og);
//     return og;
//   } catch (error) {
//     console.error('OpenGraph Service: Error fetching data:', error);
//     // Return a fallback object
//     return createFallbackData(url);
//   }
// };

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
// Update the getOpenGraphData function to handle isFacebookEvent flags
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
          const parsedData = JSON.parse(cachedData.data);
          // Check if this is fallback data - if so, refetch
          if (parsedData.title === getDomainName(parsedData.url) && 
              parsedData.description === `Visit ${getDomainName(parsedData.url)} for more information.` &&
              parsedData.image?.includes('placeholder')) {
            console.log('OpenGraph Service: Cached data is fallback, refetching...');
            // Continue to fetch new data
          } else {
            return parsedData;
          }
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
function findFirstImage(doc, baseUrl) {
  try {
    // Try to find images in various ways
    const selectors = [
      'article img',
      'main img',
      '.content img',
      '#content img',
      'img[src*="logo"]',
      'img[src*="banner"]',
      'img'
    ];
    
    for (const selector of selectors) {
      const images = doc.querySelectorAll(selector);
      for (const img of images) {
        const src = img.getAttribute('src') || img.getAttribute('data-src');
        const width = parseInt(img.getAttribute('width') || '0');
        const height = parseInt(img.getAttribute('height') || '0');
        
        // Skip tiny images, icons, or spacers
        if (src && !src.includes('pixel') && !src.includes('spacer') && 
            (width > 50 || height > 50 || (!width && !height))) {
          
          // Skip data URLs for now
          if (src.startsWith('data:')) continue;
          
          // Convert relative URLs to absolute
          try {
            if (!src.startsWith('http')) {
              return new URL(src, baseUrl).href;
            }
            return src;
          } catch (e) {
            console.error('Failed to create absolute URL for image:', e);
            continue;
          }
        }
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
    // Try multiple favicon selectors
    const faviconSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]'
    ];
    
    for (const selector of faviconSelectors) {
      const faviconLink = doc.querySelector(selector);
      if (faviconLink) {
        const href = faviconLink.getAttribute('href');
        if (href) {
          // Convert relative URLs to absolute
          try {
            if (!href.startsWith('http')) {
              return new URL(href, url).href;
            }
            return href;
          } catch (e) {
            console.error('Failed to create absolute favicon URL:', e);
            continue;
          }
        }
      }
    }
    
    // Use Google's favicon service as fallback
    return `https://www.google.com/s2/favicons?domain=${getDomainName(url)}&sz=64`;
  } catch (error) {
    console.error('Error getting favicon:', error);
    return `https://www.google.com/s2/favicons?domain=${getDomainName(url)}&sz=64`;
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
 * Get first paragraph from document
 */
function getFirstParagraph(doc) {
  try {
    const paragraphs = doc.querySelectorAll('p');
    for (const p of paragraphs) {
      const text = p.textContent.trim();
      if (text && text.length > 20 && text.length < 500) {
        return text.substring(0, 200) + (text.length > 200 ? '...' : '');
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting first paragraph:', error);
    return null;
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

// Add these functions to your opengraphService.js file

/**
 * Check if a URL is a Facebook URL
 */
function isFacebookUrl(url) {
    return url.includes('facebook.com') || 
           url.includes('fb.com') || 
           url.includes('fb.me');
  }
  
  /**
   * Check if a URL is a Facebook event URL
   */
  function isFacebookEventUrl(url) {
    return (url.includes('facebook.com/events/') || 
           url.includes('fb.me/e/'));
  }
  
  /**
   * Enhanced fetch OpenGraph data with special handling for Facebook URLs
   */
  export const fetchOpenGraphData = async (url) => {
    try {
      console.log('OpenGraph Service: Fetching data for URL:', url);
      
      // Ensure URL has http/https prefix
      let formattedUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        formattedUrl = 'https://' + url;
      }
  
      // Special handling for Facebook URLs
      if (isFacebookUrl(formattedUrl)) {
        return await fetchFacebookData(formattedUrl);
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
      
      // Try multiple proxy services
      const proxies = [
        {
          name: 'corsproxy.io',
          getUrl: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
          parseResponse: async (response) => {
            const text = await response.text();
            return { contents: text };
          }
        },
        {
          name: 'allorigins',
          getUrl: (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
          parseResponse: async (response) => {
            const data = await response.json();
            return data;
          }
        }
      ];
      
      let data = null;
      let lastError = null;
      
      // Try each proxy until one works
      for (const proxy of proxies) {
        try {
          console.log(`OpenGraph Service: Trying ${proxy.name} proxy...`);
          const proxyUrl = proxy.getUrl(formattedUrl);
          
          const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'text/html,application/xhtml+xml'
            }
          });
          
          if (!response.ok) {
            throw new Error(`${proxy.name} proxy error: ${response.status}`);
          }
          
          data = await proxy.parseResponse(response);
          
          if (data && data.contents) {
            console.log(`OpenGraph Service: Successfully fetched with ${proxy.name}`);
            break;
          }
        } catch (error) {
          console.error(`OpenGraph Service: ${proxy.name} proxy failed:`, error);
          lastError = error;
          continue;
        }
      }
      
      if (!data || !data.contents) {
        console.warn('OpenGraph Service: All proxies failed for URL:', formattedUrl);
        if (lastError) throw lastError;
        return createFallbackData(formattedUrl);
      }
      
      // Parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');
      
      // Extract OG data with enhanced fallbacks
      const ogImage = getMetaTag(doc, 'og:image') || 
                      getMetaTag(doc, 'og:image:url') ||
                      getMetaTag(doc, 'og:image:secure_url') ||
                      getMetaTag(doc, 'twitter:image') ||
                      getMetaTag(doc, 'twitter:image:src');
      
      // Ensure image URL is absolute
      let absoluteImage = ogImage;
      if (ogImage && !ogImage.startsWith('http') && !ogImage.startsWith('data:')) {
        try {
          absoluteImage = new URL(ogImage, formattedUrl).href;
        } catch (e) {
          console.error('Failed to create absolute image URL:', e);
          absoluteImage = null;
        }
      }
      
      const og = {
        url: formattedUrl,
        title: getMetaTag(doc, 'og:title') || 
               getMetaTag(doc, 'twitter:title') || 
               getMetaTag(doc, 'title') || 
               doc.title || 
               getDomainName(formattedUrl),
        description: getMetaTag(doc, 'og:description') || 
                    getMetaTag(doc, 'twitter:description') || 
                    getMetaTag(doc, 'description') || 
                    getFirstParagraph(doc) ||
                    getDefaultDescription(formattedUrl),
        image: absoluteImage || findFirstImage(doc, formattedUrl),
        thumbnail: absoluteImage,
        siteName: getMetaTag(doc, 'og:site_name') || 
                 getMetaTag(doc, 'application-name') || 
                 getDomainName(formattedUrl),
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
   * Specialized function to handle Facebook URLs
   */
  async function fetchFacebookData(url) {
    try {
      console.log('OpenGraph Service: Using specialized Facebook handler for:', url);
      
      // Attempt to expand shortened fb.me URLs
      let expandedUrl = url;
      if (url.includes('fb.me')) {
        try {
          expandedUrl = await expandFbMeUrl(url);
        } catch (err) {
          console.warn('Failed to expand fb.me URL:', err);
        }
      }
      
      // Try to extract event ID from URL
      const eventId = extractFacebookEventId(expandedUrl);
      
      // If it's an event URL, create a special event preview
      if (eventId) {
        console.log('OpenGraph Service: Detected Facebook event ID:', eventId);
        
        // This is a preferable approach as it doesn't rely on proxies or external requests
        // that might get blocked by Facebook's strict security policies
        return {
          url: url,
          title: `Facebook Event${eventId ? ` (ID: ${eventId})` : ''}`,
          description: "View details, RSVP, and join this event on Facebook",
          // Use a data URL for the Facebook event image - this is always reliable
          image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NDggNTEyIj48cGF0aCBmaWxsPSIjMTg3N0YyIiBkPSJNMTI4IDBoMTkydjMySDEyOFYwek0zMiA0NjRWMTI4aDM4NHYzMzZjMCAyNi41LTIxLjUgNDgtNDggNDhINDhjLTI2LjUgMC00OC0yMS41LTQ4LTQ4ek00MDAgMTkySDQ4djQ4aDM1MnYtNDh6bS0xNDQgNDhINzcuMyA3Ni41Yy0yLjIgMC00IDEuOC00IDR2NTZjMCAyLjIgMS44IDQgNCA0aDQ4LjVjMi4yIDAgNC0xLjggNC00di0xNi41LTQzLjVjMC0yLjItMS44LTQtNC00em0xNDQgNDhIMjU2djQ4aDE0NHYtNDh6Ii8+PC9zdmc+',
          siteName: "Facebook",
          // Use a data URL for the favicon too
          favicon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjMTg3N0YyIiBkPSJNNTA0IDI1NkM1MDQgMTE5IDM5MyA4IDI1NiA4UzggMTE5IDggMjU2YzAgMTIzLjc4IDkwLjY5IDIyNi4zOCAyMDkuMjUgMjQ1VjMyNy42OWgtNjMuVjI1Nmg2My4wOVYyMDhjMC02Mi4xNSAzNy05Ni40OCA5My42Ny05Ni40OCAyNy4xNCAwIDU1LjUyIDQuODQgNTUuNTIgNC44NHY2MS4wNWgtMzEuMjhjLTMwLjggMC00MC40MSAxOS4xMi00MC40MSAzOC43M1YyNTZoNjguNzhsLTExIDcxLjY5aC01Ny43OFY1MDFDNDEzLjMxIDQ4Mi4zOCA1MDQgMzc5Ljc4IDUwNCAyNTZ6Ii8+PC9zdmc+',
          isFacebookEvent: true
        };
      }
      
      // For other Facebook URLs, use a generic Facebook preview
      return {
        url: url,
        title: "Facebook Link",
        description: "View this content on Facebook",
        // Use a data URL for the Facebook logo
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjMTg3N0YyIiBkPSJNNTA0IDI1NkM1MDQgMTE5IDM5MyA4IDI1NiA4UzggMTE5IDggMjU2YzAgMTIzLjc4IDkwLjY5IDIyNi4zOCAyMDkuMjUgMjQ1VjMyNy42OWgtNjMuVjI1Nmg2My4wOVYyMDhjMC02Mi4xNSAzNy05Ni40OCA5My42Ny05Ni40OCAyNy4xNCAwIDU1LjUyIDQuODQgNTUuNTIgNC44NHY2MS4wNWgtMzEuMjhjLTMwLjggMC00MC40MSAxOS4xMi00MC40MSAzOC43M1YyNTZoNjguNzhsLTExIDcxLjY5aC01Ny43OFY1MDFDNDEzLjMxIDQ4Mi4zOCA1MDQgMzc5Ljc4IDUwNCAyNTZ6Ii8+PC9zdmc+',
        siteName: "Facebook",
        favicon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjMTg3N0YyIiBkPSJNNTA0IDI1NkM1MDQgMTE5IDM5MyA4IDI1NiA4UzggMTE5IDggMjU2YzAgMTIzLjc4IDkwLjY5IDIyNi4zOCAyMDkuMjUgMjQ1VjMyNy42OWgtNjMuVjI1Nmg2My4wOVYyMDhjMC02Mi4xNSAzNy05Ni40OCA5My42Ny05Ni40OCAyNy4xNCAwIDU1LjUyIDQuODQgNTUuNTIgNC44NHY2MS4wNWgtMzEuMjhjLTMwLjggMC00MC40MSAxOS4xMi00MC40MSAzOC43M1YyNTZoNjguNzhsLTExIDcxLjY5aC01Ny43OFY1MDFDNDEzLjMxIDQ4Mi4zOCA1MDQgMzc5Ljc4IDUwNCAyNTZ6Ii8+PC9zdmc+',
        isFacebook: true
      };
    } catch (error) {
      console.error('OpenGraph Service: Error fetching Facebook data:', error);
      return createFallbackData(url);
    }
  }
  
  /**
   * Try to expand a fb.me URL to get the full URL
   */
  async function expandFbMeUrl(shortUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(shortUrl, {
        method: 'HEAD',
        redirect: 'manual',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Check for redirect header
      const location = response.headers.get('location');
      if (location) {
        return location;
      }
      
      return shortUrl;
    } catch (error) {
      console.error('Error expanding fb.me URL:', error);
      return shortUrl;
    }
  }
  
  /**
   * Extract Facebook event ID from a URL
   */
  function extractFacebookEventId(url) {
    try {
      if (!url) return null;
      
      // Try to match event ID patterns
      let match;
      
      // Match fb.me/e/XXXXX pattern
      if (url.includes('fb.me/e/')) {
        match = url.match(/fb\.me\/e\/([a-zA-Z0-9]+)/);
        if (match) return match[1];
      }
      
      // Match facebook.com/events/XXXXX pattern
      if (url.includes('facebook.com/events/')) {
        match = url.match(/facebook\.com\/events\/([0-9]+)/);
        if (match) return match[1];
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting Facebook event ID:', error);
      return null;
    }
  }
  
  