/**
 * Unit Tests for Message Encryption
 *
 * Tests the encryption/decryption functionality for direct messages
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  encryptMessage,
  decryptMessage,
  isEncrypted,
  encryptMetadata,
  decryptMetadata,
  batchDecryptMessages,
  getParticipantIds,
  TESTING
} from '../messageEncryption';

// Mock crypto if not available in test environment
beforeAll(() => {
  if (!globalThis.crypto) {
    const { webcrypto } = require('crypto');
    globalThis.crypto = webcrypto;
  }
});

describe('messageEncryption', () => {
  const testParticipants = [
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // UUID format
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
  ];

  describe('encryptMessage', () => {
    it('should encrypt a plaintext message', async () => {
      const plaintext = 'Hello, this is a secret message!';
      const encrypted = await encryptMessage(plaintext, testParticipants);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toEqual(plaintext);
      expect(encrypted).toContain('ENC:v1:');
    });

    it('should produce different ciphertext for same message (random IV)', async () => {
      const plaintext = 'Same message';
      const encrypted1 = await encryptMessage(plaintext, testParticipants);
      const encrypted2 = await encryptMessage(plaintext, testParticipants);

      expect(encrypted1).not.toEqual(encrypted2); // Different IVs
      expect(isEncrypted(encrypted1)).toBe(true);
      expect(isEncrypted(encrypted2)).toBe(true);
    });

    it('should throw error for invalid inputs', async () => {
      await expect(encryptMessage('', testParticipants)).rejects.toThrow();
      await expect(encryptMessage(null, testParticipants)).rejects.toThrow();
      await expect(encryptMessage('test', [])).rejects.toThrow();
      await expect(encryptMessage('test', ['only-one'])).rejects.toThrow();
    });

    it('should encrypt emoji and special characters', async () => {
      const plaintext = '🔐 Test émojis & spëcial chârs!';
      const encrypted = await encryptMessage(plaintext, testParticipants);

      expect(isEncrypted(encrypted)).toBe(true);
      const decrypted = await decryptMessage(encrypted, testParticipants);
      expect(decrypted).toEqual(plaintext);
    });

    it('should encrypt long messages', async () => {
      const plaintext = 'A'.repeat(10000); // 10KB message
      const encrypted = await encryptMessage(plaintext, testParticipants);

      expect(isEncrypted(encrypted)).toBe(true);
      const decrypted = await decryptMessage(encrypted, testParticipants);
      expect(decrypted).toEqual(plaintext);
    });
  });

  describe('decryptMessage', () => {
    it('should decrypt an encrypted message', async () => {
      const plaintext = 'Secret message for decryption test';
      const encrypted = await encryptMessage(plaintext, testParticipants);
      const decrypted = await decryptMessage(encrypted, testParticipants);

      expect(decrypted).toEqual(plaintext);
    });

    it('should return plaintext if message is not encrypted (backward compatibility)', async () => {
      const plaintext = 'This is not encrypted';
      const result = await decryptMessage(plaintext, testParticipants);

      expect(result).toEqual(plaintext);
    });

    it('should return error message for invalid encrypted format', async () => {
      const invalid = 'ENC:v1:invalid:format:extra';
      const result = await decryptMessage(invalid, testParticipants);

      expect(result).toContain('could not be decrypted');
    });

    it('should handle decryption errors gracefully', async () => {
      const invalidEncrypted = 'ENC:v1:aGVsbG8=:aW52YWxpZA==';
      const result = await decryptMessage(invalidEncrypted, testParticipants);

      expect(result).toContain('could not be decrypted');
    });

    it('should fail to decrypt with wrong participants', async () => {
      const plaintext = 'Secret';
      const encrypted = await encryptMessage(plaintext, testParticipants);

      const wrongParticipants = [
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'
      ];

      const result = await decryptMessage(encrypted, wrongParticipants);
      expect(result).toContain('could not be decrypted');
    });
  });

  describe('isEncrypted', () => {
    it('should detect encrypted messages', async () => {
      const encrypted = await encryptMessage('test', testParticipants);
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should detect plaintext messages', () => {
      expect(isEncrypted('Hello world')).toBe(false);
      expect(isEncrypted('ENC:wrong:format')).toBe(false);
      expect(isEncrypted('')).toBe(false);
      expect(isEncrypted(null)).toBe(false);
    });
  });

  describe('encryptMetadata and decryptMetadata', () => {
    it('should encrypt metadata fields', async () => {
      const metadata = {
        filename: 'secret-document.pdf',
        originalName: 'My Secret File.pdf',
        size: 1024
      };

      const encrypted = await encryptMetadata(metadata, testParticipants);

      expect(isEncrypted(encrypted.filename)).toBe(true);
      expect(isEncrypted(encrypted.originalName)).toBe(true);
      expect(encrypted.size).toBe(1024); // Non-string values not encrypted
    });

    it('should decrypt metadata fields', async () => {
      const metadata = {
        filename: 'secret.pdf',
        author: 'John Doe'
      };

      const encrypted = await encryptMetadata(metadata, testParticipants);
      const decrypted = await decryptMetadata(encrypted, testParticipants);

      expect(decrypted.filename).toEqual(metadata.filename);
      expect(decrypted.author).toEqual(metadata.author);
    });

    it('should handle empty metadata', async () => {
      const result1 = await encryptMetadata(null, testParticipants);
      const result2 = await encryptMetadata({}, testParticipants);

      expect(result1).toBeNull();
      expect(result2).toEqual({});
    });

    it('should preserve non-string metadata values', async () => {
      const metadata = {
        count: 42,
        enabled: true,
        items: [1, 2, 3],
        nested: { key: 'value' }
      };

      const encrypted = await encryptMetadata(metadata, testParticipants);
      expect(encrypted.count).toBe(42);
      expect(encrypted.enabled).toBe(true);
      expect(encrypted.items).toEqual([1, 2, 3]);
      expect(encrypted.nested).toEqual({ key: 'value' });
    });
  });

  describe('batchDecryptMessages', () => {
    it('should decrypt multiple messages', async () => {
      const messages = [
        {
          id: '1',
          content: await encryptMessage('Message 1', testParticipants),
          media_metadata: null
        },
        {
          id: '2',
          content: await encryptMessage('Message 2', testParticipants),
          media_metadata: null
        },
        {
          id: '3',
          content: await encryptMessage('Message 3', testParticipants),
          media_metadata: null
        }
      ];

      const decrypted = await batchDecryptMessages(messages, testParticipants);

      expect(decrypted).toHaveLength(3);
      expect(decrypted[0].content).toBe('Message 1');
      expect(decrypted[1].content).toBe('Message 2');
      expect(decrypted[2].content).toBe('Message 3');
    });

    it('should handle empty message array', async () => {
      const result = await batchDecryptMessages([], testParticipants);
      expect(result).toEqual([]);
    });

    it('should handle messages with metadata', async () => {
      const messages = [
        {
          id: '1',
          content: await encryptMessage('Test', testParticipants),
          media_metadata: await encryptMetadata(
            { filename: 'test.pdf' },
            testParticipants
          )
        }
      ];

      const decrypted = await batchDecryptMessages(messages, testParticipants);

      expect(decrypted[0].content).toBe('Test');
      expect(decrypted[0].media_metadata.filename).toBe('test.pdf');
    });
  });

  describe('getParticipantIds', () => {
    it('should extract participants from conversation object', () => {
      const conversation = {
        id: 'conv-1',
        participants: testParticipants
      };

      const result = getParticipantIds(conversation);
      expect(result).toEqual(testParticipants);
    });

    it('should handle array input directly', () => {
      const result = getParticipantIds(testParticipants);
      expect(result).toEqual(testParticipants);
    });

    it('should throw error for invalid input', () => {
      expect(() => getParticipantIds({})).toThrow();
      expect(() => getParticipantIds(null)).toThrow();
      expect(() => getParticipantIds('invalid')).toThrow();
    });
  });

  describe('key derivation', () => {
    it('should derive the same key from participants in any order', async () => {
      const participants1 = ['uuid-1', 'uuid-2'];
      const participants2 = ['uuid-2', 'uuid-1']; // Reversed

      const plaintext = 'Test message';

      // Encrypt with first order
      const encrypted = await encryptMessage(plaintext, participants1);

      // Decrypt with reversed order - should work
      const decrypted = await decryptMessage(encrypted, participants2);

      expect(decrypted).toEqual(plaintext);
    });

    it('should derive different keys for different participant pairs', async () => {
      const participants1 = ['uuid-1', 'uuid-2'];
      const participants2 = ['uuid-3', 'uuid-4'];

      const plaintext = 'Test';

      const encrypted1 = await encryptMessage(plaintext, participants1);
      const decrypted2 = await decryptMessage(encrypted1, participants2);

      // Should fail to decrypt with different participants
      expect(decrypted2).toContain('could not be decrypted');
    });
  });

  describe('encryption format', () => {
    it('should use correct prefix and version', async () => {
      const encrypted = await encryptMessage('test', testParticipants);
      expect(encrypted).toMatch(/^ENC:v1:/);
    });

    it('should have IV and ciphertext components', async () => {
      const encrypted = await encryptMessage('test', testParticipants);
      const parts = encrypted.replace('ENC:v1:', '').split(':');

      expect(parts).toHaveLength(2);
      expect(parts[0]).toBeTruthy(); // IV
      expect(parts[1]).toBeTruthy(); // Ciphertext
    });

    it('should use base64 encoding for IV and ciphertext', async () => {
      const encrypted = await encryptMessage('test', testParticipants);
      const parts = encrypted.replace('ENC:v1:', '').split(':');

      // Base64 regex: only alphanumeric, +, /, and =
      const base64Regex = /^[A-Za-z0-9+/=]+$/;

      expect(parts[0]).toMatch(base64Regex);
      expect(parts[1]).toMatch(base64Regex);
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace-only messages', async () => {
      const plaintext = '   ';
      const encrypted = await encryptMessage(plaintext, testParticipants);
      const decrypted = await decryptMessage(encrypted, testParticipants);

      expect(decrypted).toEqual(plaintext);
    });

    it('should handle newlines and special whitespace', async () => {
      const plaintext = 'Line 1\nLine 2\r\nLine 3\tTabbed';
      const encrypted = await encryptMessage(plaintext, testParticipants);
      const decrypted = await decryptMessage(encrypted, testParticipants);

      expect(decrypted).toEqual(plaintext);
    });

    it('should handle unicode characters', async () => {
      const plaintext = '你好世界 🌍 مرحبا العالم';
      const encrypted = await encryptMessage(plaintext, testParticipants);
      const decrypted = await decryptMessage(encrypted, testParticipants);

      expect(decrypted).toEqual(plaintext);
    });
  });
});
