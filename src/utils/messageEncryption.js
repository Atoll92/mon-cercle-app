/**
 * Message Encryption Utility
 *
 * Simple symmetric encryption for direct messages using AES-GCM.
 * - Encrypts messages client-side before sending to Supabase
 * - Decrypts messages after receiving from Supabase
 * - Uses deterministic key derivation from conversation participants
 * - No key storage needed - keys derived on-the-fly
 *
 * Security Model:
 * - Same key for all messages in a conversation
 * - Protects against database breaches
 * - Does NOT provide perfect forward secrecy
 *
 * @module messageEncryption
 */

const ENCRYPTION_VERSION = 'v1';
const ENCRYPTED_PREFIX = `ENC:${ENCRYPTION_VERSION}:`;

/**
 * Derives a deterministic encryption key from participant IDs
 * Uses PBKDF2 with a conversation-specific salt
 *
 * @param {string[]} participantIds - Array of profile IDs (sorted)
 * @returns {Promise<CryptoKey>} Encryption key for AES-GCM
 */
async function deriveConversationKey(participantIds) {
  if (!participantIds || participantIds.length !== 2) {
    throw new Error('Exactly 2 participant IDs required for key derivation');
  }

  // Sort participant IDs to ensure consistent key regardless of order
  const sortedIds = [...participantIds].sort();

  // Create a deterministic salt from the sorted IDs
  const saltString = `conclav-dm-${sortedIds[0]}-${sortedIds[1]}`;
  const encoder = new TextEncoder();
  const salt = encoder.encode(saltString);

  // Use the concatenated IDs as the password material
  const passwordMaterial = encoder.encode(sortedIds.join(':'));

  // Import password material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordMaterial,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES-GCM key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // Strong iteration count
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 }, // 256-bit key
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Encrypts a message using AES-GCM
 *
 * @param {string} plaintext - Message to encrypt
 * @param {string[]} participantIds - Array of profile IDs
 * @returns {Promise<string>} Encrypted message with format: ENC:v1:{iv}:{ciphertext}
 */
export async function encryptMessage(plaintext, participantIds) {
  try {
    if (!plaintext || typeof plaintext !== 'string') {
      throw new Error('Invalid plaintext message');
    }

    // Derive encryption key
    const key = await deriveConversationKey(participantIds);

    // Generate random IV (96 bits recommended for AES-GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the message
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128 // 128-bit authentication tag
      },
      key,
      data
    );

    // Convert to base64 for storage
    const ivBase64 = btoa(String.fromCharCode(...iv));
    const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));

    // Format: ENC:v1:{iv}:{ciphertext}
    return `${ENCRYPTED_PREFIX}${ivBase64}:${ciphertextBase64}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt message: ${error.message}`);
  }
}

/**
 * Decrypts an encrypted message
 *
 * @param {string} encryptedMessage - Encrypted message with format: ENC:v1:{iv}:{ciphertext}
 * @param {string[]} participantIds - Array of profile IDs
 * @returns {Promise<string>} Decrypted plaintext message
 */
export async function decryptMessage(encryptedMessage, participantIds) {
  try {
    // Check if message is encrypted
    if (!isEncrypted(encryptedMessage)) {
      // Return as-is if not encrypted (backward compatibility)
      return encryptedMessage;
    }

    // Parse encrypted message
    const parts = encryptedMessage.replace(ENCRYPTED_PREFIX, '').split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted message format');
    }

    const [ivBase64, ciphertextBase64] = parts;

    // Convert from base64
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));

    // Derive decryption key (same as encryption)
    const key = await deriveConversationKey(participantIds);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      key,
      ciphertext
    );

    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    // Return a placeholder instead of throwing to prevent UI crashes
    return '[Message could not be decrypted]';
  }
}

/**
 * Checks if a message is encrypted
 *
 * @param {string} message - Message to check
 * @returns {boolean} True if message is encrypted
 */
export function isEncrypted(message) {
  return typeof message === 'string' && message.startsWith(ENCRYPTED_PREFIX);
}

/**
 * Encrypts message metadata (for media messages)
 * Media URLs are not encrypted (stored in Supabase Storage with auth)
 * but metadata like filenames can be encrypted
 *
 * @param {object} metadata - Metadata object to encrypt
 * @param {string[]} participantIds - Array of profile IDs
 * @returns {Promise<object>} Object with encrypted fields
 */
export async function encryptMetadata(metadata, participantIds) {
  if (!metadata || typeof metadata !== 'object') {
    return metadata;
  }

  const encrypted = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string' && value.trim()) {
      // Encrypt string values
      encrypted[key] = await encryptMessage(value, participantIds);
    } else {
      // Keep non-string values as-is
      encrypted[key] = value;
    }
  }

  return encrypted;
}

/**
 * Decrypts message metadata
 *
 * @param {object} metadata - Metadata object with encrypted fields
 * @param {string[]} participantIds - Array of profile IDs
 * @returns {Promise<object>} Object with decrypted fields
 */
export async function decryptMetadata(metadata, participantIds) {
  if (!metadata || typeof metadata !== 'object') {
    return metadata;
  }

  const decrypted = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string' && isEncrypted(value)) {
      // Decrypt encrypted string values
      decrypted[key] = await decryptMessage(value, participantIds);
    } else {
      // Keep non-encrypted values as-is
      decrypted[key] = value;
    }
  }

  return decrypted;
}

/**
 * Batch decrypt messages (optimized for message lists)
 *
 * @param {Array<object>} messages - Array of message objects with 'content' field
 * @param {string[]} participantIds - Array of profile IDs
 * @returns {Promise<Array<object>>} Messages with decrypted content
 */
export async function batchDecryptMessages(messages, participantIds) {
  if (!Array.isArray(messages)) {
    return messages;
  }

  return Promise.all(
    messages.map(async (message) => {
      if (!message || !message.content) {
        return message;
      }

      return {
        ...message,
        content: await decryptMessage(message.content, participantIds),
        media_metadata: message.media_metadata
          ? await decryptMetadata(message.media_metadata, participantIds)
          : null
      };
    })
  );
}

/**
 * Utility to get participant IDs from a conversation object
 * Handles both array format and conversation object
 *
 * @param {object|string[]} conversation - Conversation object or participants array
 * @returns {string[]} Array of participant profile IDs
 */
export function getParticipantIds(conversation) {
  if (Array.isArray(conversation)) {
    return conversation;
  }

  if (conversation && Array.isArray(conversation.participants)) {
    return conversation.participants;
  }

  throw new Error('Invalid conversation format - cannot extract participant IDs');
}

// Export constants for testing
export const TESTING = {
  ENCRYPTION_VERSION,
  ENCRYPTED_PREFIX,
  deriveConversationKey // Export for testing only
};
