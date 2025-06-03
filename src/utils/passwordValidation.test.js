import { describe, it, expect } from 'vitest';
import { validatePassword, getPasswordStrength } from './passwordValidation';

describe('Password Validation', () => {
  describe('validatePassword', () => {
    it('should validate a strong password', () => {
      const result = validatePassword('StrongP@ss123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Sh0rt!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase letter', () => {
      const result = validatePassword('weakpass123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase letter', () => {
      const result = validatePassword('STRONGPASS123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePassword('StrongPass!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = validatePassword('StrongPass123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should collect multiple validation errors', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });
  });

  describe('getPasswordStrength', () => {
    it('should return 0 for short passwords', () => {
      expect(getPasswordStrength('short')).toBe(0);
    });

    it('should return low score for simple passwords', () => {
      expect(getPasswordStrength('password123')).toBe(2);
    });

    it('should return medium score for moderate passwords', () => {
      expect(getPasswordStrength('Pass123!')).toBe(3);
    });

    it('should return high score for complex passwords', () => {
      expect(getPasswordStrength('C0mpl3xP@ssw0rd!')).toBe(5);
    });

    it('should return max score for very complex passwords', () => {
      expect(getPasswordStrength('V3ry$tr0ng&C0mpl3xP@ssw0rd#2024')).toBe(5);
    });

    it('should handle empty password', () => {
      expect(getPasswordStrength('')).toBe(0);
    });
  });
});