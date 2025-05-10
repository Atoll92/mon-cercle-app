// src/services/opengraphService.js
import { supabase } from '../supabaseclient';

/**
 * Fetch OpenGraph data for a URL
 * @param {string} url - The URL to fetch OpenGraph data for
 * @returns {Promise<object>} The OpenGraph data
 */
export const fetchOpenGraphData = async (url) => {
  try {
    // You might need a server/function for this in production
    // Using a proxy to avoid CORS issues
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (!data.contents) {
      return { title: url, url };
    }
    
    // Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, 'text/html');
    
    // Extract OG data
    const og = {
      url: url,
      title: getMetaTag(doc, 'og:title') || getMetaTag(doc, 'title') || url,
      description: getMetaTag(doc, 'og:description') || getMetaTag(doc, 'description') || '',
      image: getMetaTag(doc, 'og:image') || '',
      siteName: getMetaTag(doc, 'og:site_name') || ''
    };
    
    return og;
  } catch (error) {
    console.error('Error fetching OpenGraph data:', error);
    return { title: url, url };
  }
};

/**
 * Fetch OpenGraph data from our Supabase cache or fetch it remotely
 * @param {string} url - The URL to fetch OpenGraph data for 
 * @returns {Promise<object>} The OpenGraph data
 */
export const getOpenGraphData = async (url) => {
  try {
    // Check if we have cached data
    const { data: cachedData, error } = await supabase
      .from('opengraph_cache')
      .select('*')
      .eq('url', url)
      .maybeSingle();
    
    // If we have fresh cached data (less than 7 days old), use it
    if (cachedData && !error && new Date(cachedData.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      return JSON.parse(cachedData.data);
    }
    
    // Otherwise fetch new data
    const ogData = await fetchOpenGraphData(url);
    
    // Cache the data
    if (ogData) {
      if (cachedData) {
        // Update existing cache
        await supabase
          .from('opengraph_cache')
          .update({
            data: JSON.stringify(ogData),
            updated_at: new Date()
          })
          .eq('url', url);
      } else {
        // Create new cache entry
        await supabase
          .from('opengraph_cache')
          .insert([{
            url,
            data: JSON.stringify(ogData),
            created_at: new Date(),
            updated_at: new Date()
          }]);
      }
    }
    
    return ogData;
  } catch (error) {
    console.error('Error getting OpenGraph data:', error);
    return { title: url, url };
  }
};

/**
 * Helper function to get meta tag content
 */
function getMetaTag(doc, tagName) {
  const metaTag = doc.querySelector(`meta[property="${tagName}"], meta[name="${tagName}"]`);
  return metaTag ? metaTag.getAttribute('content') : null;
}