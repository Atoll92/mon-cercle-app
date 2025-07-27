// Utility to wrap lazy loading with error handling
// Catches chunk loading errors and reloads the page to get fresh chunks

import { lazy } from 'react';

export const lazyWithRetry = (componentImport) => {
  return lazy(async () => {
    try {
      const component = await componentImport();
      return component;
    } catch (error) {
      // Check if this is a chunk loading error
      if (
        error.message.includes('Failed to fetch dynamically imported module') ||
        error.message.includes('error loading dynamically imported module') ||
        error.message.includes('Importing a module script failed') ||
        error.name === 'ChunkLoadError'
      ) {
        // Log the error for monitoring
        console.error('Chunk loading error detected:', error);
        
        // Reload the page to get fresh chunks
        // Using location.reload(true) to force reload from server
        window.location.reload(true);
        
        // Return a dummy component while reloading
        return { default: () => null };
      }
      
      // Re-throw other errors
      throw error;
    }
  });
};