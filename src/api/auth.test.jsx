import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authApi from './auth';
import { supabase } from '../supabaseclient';

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      supabase.auth.signUp = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await authApi.signUp('test@example.com', 'password123', 'Test User');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: { full_name: 'Test User' }
        }
      });
      expect(result).toEqual({ user: mockUser, error: null });
    });

    it('should handle signup errors', async () => {
      const mockError = { message: 'User already exists' };
      supabase.auth.signUp = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await authApi.signUp('test@example.com', 'password123', 'Test User');

      expect(result).toEqual({ user: null, error: mockError });
    });
  });

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      supabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await authApi.signIn('test@example.com', 'password123');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(result).toEqual({ user: mockUser, error: null });
    });

    it('should handle signin errors', async () => {
      const mockError = { message: 'Invalid credentials' };
      supabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await authApi.signIn('test@example.com', 'wrongpassword');

      expect(result).toEqual({ user: null, error: mockError });
    });
  });

  describe('signOut', () => {
    it('should successfully sign out a user', async () => {
      supabase.auth.signOut = vi.fn().mockResolvedValue({ error: null });

      const result = await authApi.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(result).toEqual({ error: null });
    });

    it('should handle signout errors', async () => {
      const mockError = { message: 'Failed to sign out' };
      supabase.auth.signOut = vi.fn().mockResolvedValue({ error: mockError });

      const result = await authApi.signOut();

      expect(result).toEqual({ error: mockError });
    });
  });

  describe('resetPassword', () => {
    it('should successfully send password reset email', async () => {
      supabase.auth.resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });

      const result = await authApi.resetPassword('test@example.com');

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: `${window.location.origin}/password-update`
      });
      expect(result).toEqual({ error: null });
    });

    it('should handle password reset errors', async () => {
      const mockError = { message: 'User not found' };
      supabase.auth.resetPasswordForEmail = vi.fn().mockResolvedValue({ error: mockError });

      const result = await authApi.resetPassword('test@example.com');

      expect(result).toEqual({ error: mockError });
    });
  });

  describe('updatePassword', () => {
    it('should successfully update password', async () => {
      supabase.auth.updateUser = vi.fn().mockResolvedValue({ error: null });

      const result = await authApi.updatePassword('newPassword123');

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newPassword123'
      });
      expect(result).toEqual({ error: null });
    });

    it('should handle password update errors', async () => {
      const mockError = { message: 'Password too weak' };
      supabase.auth.updateUser = vi.fn().mockResolvedValue({ error: mockError });

      const result = await authApi.updatePassword('weak');

      expect(result).toEqual({ error: mockError });
    });
  });

  describe('getUser', () => {
    it('should return current user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      supabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await authApi.getUser();

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(result).toEqual({ user: mockUser, error: null });
    });

    it('should handle get user errors', async () => {
      const mockError = { message: 'Not authenticated' };
      supabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: mockError
      });

      const result = await authApi.getUser();

      expect(result).toEqual({ user: null, error: mockError });
    });
  });
});