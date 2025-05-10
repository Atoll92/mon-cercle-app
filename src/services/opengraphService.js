// src/services/opengraphService.js
import { supabase } from '../supabaseclient';

/**
 * Improved fetch OpenGraph data for a URL
 * @param {string} url - The URL to fetch OpenGraph data for
 * @returns {Promise<object>} The OpenGraph data
 */
export const fetchOpenGraphData = async (url) => {
  try {
    console.log('OpenGraph Service: Fetching data for URL:', url);
    
    // Simple URL validation
    if (!url || !url.trim() || !url.startsWith('http')) {
      console.error('OpenGraph Service: Invalid URL format:', url);
      return { title: url || 'Invalid URL', url: url || '#' };
    }
    
    // Using a proxy to avoid CORS issues
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    console.log('OpenGraph Service: Using proxy URL:', proxyUrl);
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Network response error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.contents) {
      console.warn('OpenGraph Service: No contents in response for URL:', url);
      return { title: url, url };
    }
    
    // Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, 'text/html');
    
    // Extract OG data
    const og = {
      url: url,
      title: getMetaTag(doc, 'og:title') || getMetaTag(doc, 'title') || doc.title || url,
      description: getMetaTag(doc, 'og:description') || getMetaTag(doc, 'description') || '',
      image: getMetaTag(doc, 'og:image') || '',
      siteName: getMetaTag(doc, 'og:site_name') || ''
    };
    
    console.log('OpenGraph Service: Successfully extracted data:', og);
    return og;
  } catch (error) {
    console.error('OpenGraph Service: Error fetching data:', error);
    // Return a minimal object instead of throwing
    return { 
      title: url || 'Error loading URL',
      url: url || '#',
      error: error.message
    };
  }
};

/**
 * Fetch OpenGraph data from our Supabase cache or fetch it remotely
 * @param {string} url - The URL to fetch OpenGraph data for 
 * @returns {Promise<object>} The OpenGraph data
 */
export const getOpenGraphData = async (url) => {
  try {
    if (!url) {
      console.error('OpenGraph Service: No URL provided to getOpenGraphData');
      return { title: 'No URL provided', url: '#' };
    }
    
    console.log('OpenGraph Service: Getting data for URL:', url);
    
    // Check if we have cached data
    const { data: cachedData, error } = await supabase
      .from('opengraph_cache')
      .select('*')
      .eq('url', url)
      .maybeSingle();
    
    // If we have fresh cached data (less than 7 days old), use it
    if (cachedData && !error && new Date(cachedData.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      console.log('OpenGraph Service: Using cached data for URL:', url);
      try {
        return JSON.parse(cachedData.data);
      } catch (parseError) {
        console.error('OpenGraph Service: Error parsing cached data:', parseError);
        // If JSON parsing fails, continue to fetch new data
      }
    }
    
    // Otherwise fetch new data
    console.log('OpenGraph Service: Fetching fresh data for URL:', url);
    const ogData = await fetchOpenGraphData(url);
    
    // Cache the data if we got valid results
    if (ogData && ogData.title) {
      try {
        if (cachedData) {
          // Update existing cache
          console.log('OpenGraph Service: Updating cache for URL:', url);
          await supabase
            .from('opengraph_cache')
            .update({
              data: JSON.stringify(ogData),
              updated_at: new Date()
            })
            .eq('url', url);
        } else {
          // Create new cache entry
          console.log('OpenGraph Service: Creating new cache for URL:', url);
          await supabase
            .from('opengraph_cache')
            .insert([{
              url,
              data: JSON.stringify(ogData),
              created_at: new Date(),
              updated_at: new Date()
            }]);
        }
      } catch (cacheError) {
        console.error('OpenGraph Service: Error updating cache:', cacheError);
        // Don't fail if caching fails
      }
    }
    
    return ogData;
  } catch (error) {
    console.error('OpenGraph Service: Error getting OpenGraph data:', error);
    return { 
      title: url || 'Error loading URL', 
      url: url || '#',
      error: error.message
    };
  }
};

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