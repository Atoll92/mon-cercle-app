/**
 * Password strength validation utilities
 */

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

export const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {Object} - Validation result with isValid and errors array
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    return { isValid: false, errors: ['Password is required'] };
  }

  // Check minimum length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }

  // Check for uppercase letter
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letter
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for number
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special character
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a stronger password');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get password strength score (0-5)
 * @param {string} password - The password to evaluate
 * @returns {number} - Strength score from 0 (weakest) to 5 (strongest)
 */
export const getPasswordStrength = (password) => {
  if (!password) return 0;
  
  let strength = 0;
  
  // Length bonus
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (password.length >= 16) strength++;
  
  // Character variety bonus
  if (/[a-z]/.test(password)) strength += 0.5;
  if (/[A-Z]/.test(password)) strength += 0.5;
  if (/\d/.test(password)) strength += 0.5;
  if (/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) strength += 0.5;
  
  return Math.min(5, Math.floor(strength));
};

/**
 * Get password strength label
 * @param {number} strength - The strength score
 * @returns {Object} - Label and color for the strength
 */
export const getPasswordStrengthLabel = (strength) => {
  const labels = [
    { label: 'Very Weak', color: '#d32f2f' },
    { label: 'Weak', color: '#f57c00' },
    { label: 'Fair', color: '#fbc02d' },
    { label: 'Good', color: '#689f38' },
    { label: 'Strong', color: '#388e3c' },
    { label: 'Very Strong', color: '#1976d2' },
  ];
  
  return labels[strength] || labels[0];
};

/**
 * Generate password requirements text
 * @returns {string} - Human-readable password requirements
 */
export const getPasswordRequirementsText = () => {
  const requirements = [];
  
  requirements.push(`At least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  
  if (PASSWORD_REQUIREMENTS.requireUppercase) {
    requirements.push('One uppercase letter');
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase) {
    requirements.push('One lowercase letter');
  }
  
  if (PASSWORD_REQUIREMENTS.requireNumbers) {
    requirements.push('One number');
  }
  
  if (PASSWORD_REQUIREMENTS.requireSpecialChars) {
    requirements.push('One special character (!@#$%^&*...)');
  }
  
  return requirements.join(' • ');
};