import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dmApi from './directMessages';
import { supabase } from '../supabaseclient';

describe('Direct Messages API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchConversations', () => {
    it('should fetch conversations with last message', async () => {
      const mockConversations = [
        {
          id: '1',
          participant_one_id: 'user1',
          participant_two_id: 'user2',
          last_message_at: '2024-01-01',
          last_message: { id: 'msg1', content: 'Hello' },
          participant_one: { id: 'user1', full_name: 'User One' },
          participant_two: { id: 'user2', full_name: 'User Two' }
        }
      ];

      supabase.from().select().order().mockResolvedValue({
        data: mockConversations,
        error: null
      });

      const result = await dmApi.fetchConversations('user1');

      expect(supabase.from).toHaveBeenCalledWith('direct_conversations');
      expect(result).toEqual({ data: mockConversations, error: null });
    });

    it('should handle fetch conversations error', async () => {
      const mockError = { message: 'Failed to fetch conversations' };

      supabase.from().select().order().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await dmApi.fetchConversations('user1');

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('fetchMessages', () => {
    it('should fetch messages for a conversation', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          content: 'Hello',
          sender_id: 'user1',
          created_at: '2024-01-01T10:00:00',
          sender: { id: 'user1', full_name: 'User One' }
        },
        {
          id: 'msg2',
          content: 'Hi there',
          sender_id: 'user2',
          created_at: '2024-01-01T10:01:00',
          sender: { id: 'user2', full_name: 'User Two' }
        }
      ];

      supabase.from().select().eq().order().mockResolvedValue({
        data: mockMessages,
        error: null
      });

      const result = await dmApi.fetchMessages('conv1');

      expect(supabase.from).toHaveBeenCalledWith('direct_messages');
      expect(result).toEqual({ data: mockMessages, error: null });
    });

    it('should handle fetch messages error', async () => {
      const mockError = { message: 'Failed to fetch messages' };

      supabase.from().select().eq().order().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await dmApi.fetchMessages('conv1');

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const mockMessage = {
        id: 'msg1',
        conversation_id: 'conv1',
        sender_id: 'user1',
        content: 'Hello world',
        created_at: '2024-01-01T10:00:00'
      };

      supabase.from().insert().select().single().mockResolvedValue({
        data: mockMessage,
        error: null
      });

      const result = await dmApi.sendMessage('conv1', 'user1', 'Hello world');

      expect(supabase.from).toHaveBeenCalledWith('direct_messages');
      expect(result).toEqual({ data: mockMessage, error: null });
    });

    it('should send a message with media', async () => {
      const mockMessage = {
        id: 'msg1',
        conversation_id: 'conv1',
        sender_id: 'user1',
        content: 'Check this out',
        media_url: 'https://example.com/image.jpg',
        media_type: 'image',
        created_at: '2024-01-01T10:00:00'
      };

      supabase.from().insert().select().single().mockResolvedValue({
        data: mockMessage,
        error: null
      });

      const result = await dmApi.sendMessage('conv1', 'user1', 'Check this out', 'https://example.com/image.jpg', 'image');

      expect(result).toEqual({ data: mockMessage, error: null });
    });

    it('should handle send message error', async () => {
      const mockError = { message: 'Failed to send message' };

      supabase.from().insert().select().single().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await dmApi.sendMessage('conv1', 'user1', 'Hello');

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('createOrGetConversation', () => {
    it('should get existing conversation', async () => {
      const mockConversation = {
        id: 'conv1',
        participant_one_id: 'user1',
        participant_two_id: 'user2'
      };

      supabase.from().select().eq().eq().single().mockResolvedValue({
        data: mockConversation,
        error: null
      });

      const result = await dmApi.createOrGetConversation('user1', 'user2');

      expect(result).toEqual({ data: mockConversation, error: null });
    });

    it('should create new conversation if none exists', async () => {
      const mockError = { code: 'PGRST116' }; // No rows found
      const newConversation = {
        id: 'conv1',
        participant_one_id: 'user1',
        participant_two_id: 'user2'
      };

      // First query returns no results
      supabase.from().select().eq().eq().single().mockResolvedValueOnce({
        data: null,
        error: mockError
      });

      // Second query after checking reverse order also returns no results
      supabase.from().select().eq().eq().single().mockResolvedValueOnce({
        data: null,
        error: mockError
      });

      // Insert creates new conversation
      supabase.from().insert().select().single().mockResolvedValueOnce({
        data: newConversation,
        error: null
      });

      const result = await dmApi.createOrGetConversation('user1', 'user2');

      expect(result).toEqual({ data: newConversation, error: null });
    });
  });

  describe('markMessagesAsRead', () => {
    it('should mark messages as read', async () => {
      supabase.from().update().eq().eq().mockResolvedValue({
        data: null,
        error: null
      });

      const result = await dmApi.markMessagesAsRead('conv1', 'user1');

      expect(supabase.from).toHaveBeenCalledWith('direct_messages');
      expect(result).toEqual({ error: null });
    });

    it('should handle mark as read error', async () => {
      const mockError = { message: 'Failed to update messages' };

      supabase.from().update().eq().eq().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await dmApi.markMessagesAsRead('conv1', 'user1');

      expect(result).toEqual({ error: mockError });
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread message count', async () => {
      const mockData = [
        { unread_count: 5 }
      ];

      supabase.from().select().eq().eq().single().mockResolvedValue({
        data: mockData[0],
        error: null
      });

      const result = await dmApi.getUnreadCount('user1');

      expect(result).toEqual({ count: 5, error: null });
    });

    it('should return 0 when no unread messages', async () => {
      supabase.from().select().eq().eq().single().mockResolvedValue({
        data: { unread_count: 0 },
        error: null
      });

      const result = await dmApi.getUnreadCount('user1');

      expect(result).toEqual({ count: 0, error: null });
    });

    it('should handle error and return 0', async () => {
      const mockError = { message: 'Failed to get count' };

      supabase.from().select().eq().eq().single().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await dmApi.getUnreadCount('user1');

      expect(result).toEqual({ count: 0, error: mockError });
    });
  });

  describe('searchUsers', () => {
    it('should search users by name', async () => {
      const mockUsers = [
        { id: 'user1', full_name: 'John Doe', avatar_url: null },
        { id: 'user2', full_name: 'John Smith', avatar_url: null }
      ];

      supabase.from().select().ilike().limit().mockResolvedValue({
        data: mockUsers,
        error: null
      });

      const result = await dmApi.searchUsers('john');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(result).toEqual({ data: mockUsers, error: null });
    });

    it('should handle search error', async () => {
      const mockError = { message: 'Search failed' };

      supabase.from().select().ilike().limit().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await dmApi.searchUsers('john');

      expect(result).toEqual({ data: null, error: mockError });
    });
  });
});