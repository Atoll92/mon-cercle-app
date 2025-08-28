import { createTicket } from '../api/tickets';
import { supabase } from '../supabaseclient';

// Store for tracking reported missing translations to avoid duplicates
const reportedMissingTranslations = new Set();

// Batch missing translations to avoid creating too many tickets
let missingTranslationsBatch = new Set();
let batchTimer = null;

// Store hashes of recently created tickets to prevent duplicates across sessions
const recentTicketHashes = new Map(); // hash -> timestamp
const HASH_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Create a hash of missing translation keys for deduplication
 */
const createTranslationHash = (missingList) => {
  const sorted = [...missingList].sort();
  return sorted.join('|');
};

/**
 * Track a missing translation key
 * @param {string} key - The translation key that was not found
 * @param {string} language - The language where the translation is missing
 */
export const trackMissingTranslation = (key, language) => {
  // Skip in development mode to avoid noise
  if (import.meta.env.MODE === 'development') {
    console.warn(`Missing translation: ${key} (${language})`);
    return;
  }

  const translationId = `${language}:${key}`;
  
  // Skip if already reported
  if (reportedMissingTranslations.has(translationId)) {
    return;
  }

  // Add to batch
  missingTranslationsBatch.add(translationId);
  
  // Clear existing timer
  if (batchTimer) {
    clearTimeout(batchTimer);
  }
  
  // Set timer to report batch after 5 seconds of no new missing translations
  batchTimer = setTimeout(() => {
    reportMissingTranslationsBatch();
  }, 5000);
};

/**
 * Check if a similar translation ticket already exists
 */
const checkForDuplicateTranslationTicket = async (missingList) => {
  try {
    // Create hash of current missing translations
    const currentHash = createTranslationHash(missingList);
    
    // Check local cache first (for very recent duplicates)
    const cachedTimestamp = recentTicketHashes.get(currentHash);
    if (cachedTimestamp && (Date.now() - cachedTimestamp < HASH_EXPIRY_MS)) {
      console.log('Duplicate translation ticket detected in cache, skipping');
      return { isDuplicate: true };
    }
    
    // Clean up expired hashes
    for (const [hash, timestamp] of recentTicketHashes.entries()) {
      if (Date.now() - timestamp > HASH_EXPIRY_MS) {
        recentTicketHashes.delete(hash);
      }
    }
    
    // Try to check database for existing tickets with same title pattern
    // We'll search for recent tickets with the same number of missing keys
    const titlePattern = `[SYSTEM] Missing translations detected (${missingList.length} keys)`;
    
    const { data: existingTickets, error } = await supabase
      .from('support_tickets')
      .select('id, title, created_at')
      .eq('category', 'feature_request')
      .eq('title', titlePattern)
      .gte('created_at', new Date(Date.now() - HASH_EXPIRY_MS).toISOString())
      .limit(1);
    
    if (!error && existingTickets && existingTickets.length > 0) {
      console.log('Similar translation ticket found in database, skipping');
      return { isDuplicate: true, existingTicketId: existingTickets[0].id };
    }
    
    return { isDuplicate: false };
  } catch (error) {
    // If we can't check for duplicates, proceed with creation
    console.warn('Could not check for duplicate translation tickets:', error);
    return { isDuplicate: false };
  }
};

/**
 * Report a batch of missing translations as a single ticket
 */
const reportMissingTranslationsBatch = async () => {
  if (missingTranslationsBatch.size === 0) {
    return;
  }

  const missingList = Array.from(missingTranslationsBatch);
  
  // Mark all as reported to avoid duplicates
  missingList.forEach(id => reportedMissingTranslations.add(id));
  
  // Clear the batch
  missingTranslationsBatch.clear();
  batchTimer = null;

  try {
    // Check for duplicates first
    const duplicateCheck = await checkForDuplicateTranslationTicket(missingList);
    if (duplicateCheck.isDuplicate) {
      console.log('Duplicate translation ticket found, skipping creation');
      return;
    }
    
    // Get current user if available
    const { data: { user } } = await supabase.auth.getUser();
    
    // Group by language
    const byLanguage = {};
    missingList.forEach(item => {
      const [lang, key] = item.split(':');
      if (!byLanguage[lang]) {
        byLanguage[lang] = [];
      }
      byLanguage[lang].push(key);
    });

    // Create a formatted description
    const description = `The following translation keys are missing and need to be added:

${Object.entries(byLanguage).map(([lang, keys]) => `
**Language: ${lang.toUpperCase()}**
${keys.map(key => `- ${key}`).join('\n')}
`).join('\n')}

**Environment:**
- URL: ${window.location.href}
- User Agent: ${navigator.userAgent}
- Timestamp: ${new Date().toISOString()}
- Total missing: ${missingList.length}

This ticket was automatically created by the translation monitoring system.`;

    const ticketData = {
      network_id: null, // System-wide issue, not network-specific
      submitted_by: user?.id || null,
      title: `[SYSTEM] Missing translations detected (${missingList.length} keys)`,
      description,
      category: 'feature_request', // Could also be 'bug' but feature_request seems more appropriate
      priority: 'low', // Missing translations are usually not critical
      status: 'open'
    };

    const { error } = await createTicket(ticketData);
    
    if (error) {
      console.error('Failed to create missing translation ticket:', error);
    } else {
      console.log('Missing translation ticket created successfully');
      // Store hash to prevent duplicates
      const ticketHash = createTranslationHash(missingList);
      recentTicketHashes.set(ticketHash, Date.now());
    }
  } catch (error) {
    console.error('Error reporting missing translations:', error);
  }
};

/**
 * Check if we should track missing translations
 * Returns false in development mode
 */
export const shouldTrackMissingTranslations = () => {
  return import.meta.env.MODE === 'production';
};

/**
 * Manually trigger reporting of current batch (useful for testing)
 */
export const reportMissingTranslationsNow = () => {
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
  reportMissingTranslationsBatch();
};

/**
 * Clear the cache of reported missing translations
 * Useful if you want to re-report previously reported translations
 */
export const clearReportedTranslationsCache = () => {
  reportedMissingTranslations.clear();
};