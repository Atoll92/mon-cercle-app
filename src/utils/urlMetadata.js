/**
 * Utility functions for fetching URL metadata
 */

import { supabase } from '../supabaseclient';

/**
 * Fetch metadata (title, description, image) from a URL using Supabase Edge Function
 * Falls back to CORS proxy if Edge Function is unavailable
 * @param {string} url - The URL to fetch metadata from
 * @returns {Promise<Object>} - Object containing title, description, and image
 */
export const fetchUrlMetadata = async (url) => {
  try {
    // Validate URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid URL protocol');
    }

    // Try to use Supabase Edge Function first (best approach, avoids CORS, faster)
    try {
      const { data, error } = await supabase.functions.invoke('fetch-url-metadata', {
        body: { url }
      });

      if (!error && data && data.success) {
        console.log('✓ Fetched metadata using Edge Function');
        return data;
      }

      // If Edge Function returns an error or unsuccessful result, fall through to proxy
      if (error) {
        console.log('Edge function error, falling back to CORS proxy:', error.message);
      }
    } catch {
      console.log('Edge function not available, using CORS proxy fallback');
    }

    // Fallback: Use AllOrigins CORS proxy service
    console.log('Using AllOrigins CORS proxy fallback');
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const html = result.contents;

    // Parse HTML to extract metadata
    const metadata = parseHtmlMetadataSimple(html);

    return {
      success: true,
      title: metadata.title || urlObj.hostname,
      description: metadata.description || '',
      image: metadata.image || '',
      url: url
    };
  } catch (error) {
    console.error('Error fetching URL metadata:', error);

    // Return basic info if fetch fails
    try {
      const urlObj = new URL(url);
      return {
        success: false,
        title: urlObj.hostname,
        description: '',
        image: '',
        url: url,
        error: error.message
      };
    } catch {
      return {
        success: false,
        title: '',
        description: '',
        image: '',
        url: url,
        error: 'Invalid URL'
      };
    }
  }
};

/**
 * Simple HTML parsing to extract metadata using regex (lighter than DOMParser)
 * @param {string} html - HTML content
 * @returns {Object} - Extracted metadata
 */
const parseHtmlMetadataSimple = (html) => {
  const metadata = {
    title: '',
    description: '',
    image: ''
  };

  try {
    // Extract title (priority: og:title > twitter:title > <title>)
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    const twitterTitleMatch = html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    if (ogTitleMatch) {
      metadata.title = ogTitleMatch[1];
    } else if (twitterTitleMatch) {
      metadata.title = twitterTitleMatch[1];
    } else if (titleMatch) {
      metadata.title = titleMatch[1];
    }

    // Extract description (priority: og:description > twitter:description > meta description)
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    const twitterDescMatch = html.match(/<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i);
    const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);

    if (ogDescMatch) {
      metadata.description = ogDescMatch[1];
    } else if (twitterDescMatch) {
      metadata.description = twitterDescMatch[1];
    } else if (metaDescMatch) {
      metadata.description = metaDescMatch[1];
    }

    // Extract image (priority: og:image > twitter:image)
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);

    if (ogImageMatch) {
      metadata.image = ogImageMatch[1];
    } else if (twitterImageMatch) {
      metadata.image = twitterImageMatch[1];
    }
  } catch (error) {
    console.error('Error parsing HTML metadata:', error);
  }

  return metadata;
};

/**
 * Check if a string is a valid URL
 * @param {string} string - String to check
 * @returns {boolean} - True if valid URL
 */
export const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

/**
 * Extract domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string} - Domain name or empty string
 */
export const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
};
