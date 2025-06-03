import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as badgesApi from './badges';
import { supabase } from '../supabaseclient';

describe('Badges API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchNetworkBadges', () => {
    it('should fetch network badges', async () => {
      const mockBadges = [
        {
          id: 'badge1',
          name: 'Active Member',
          description: 'Awarded for active participation',
          icon: '🌟',
          color: '#FFD700',
          network_id: 'net1'
        },
        {
          id: 'badge2',
          name: 'Event Organizer',
          description: 'Organized 5+ events',
          icon: '🎉',
          color: '#FF6B6B',
          network_id: 'net1'
        }
      ];

      supabase.from().select().eq().mockResolvedValue({
        data: mockBadges,
        error: null
      });

      const result = await badgesApi.fetchNetworkBadges('net1');

      expect(supabase.from).toHaveBeenCalledWith('network_badges');
      expect(result).toEqual({ data: mockBadges, error: null });
    });

    it('should handle fetch error', async () => {
      const mockError = { message: 'Failed to fetch badges' };

      supabase.from().select().eq().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await badgesApi.fetchNetworkBadges('net1');

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('createBadge', () => {
    it('should create a badge successfully', async () => {
      const newBadge = {
        name: 'Top Contributor',
        description: 'Most helpful member',
        icon: '👑',
        color: '#9B59B6',
        network_id: 'net1'
      };

      const mockCreatedBadge = { id: 'badge3', ...newBadge };

      supabase.from().insert().select().single().mockResolvedValue({
        data: mockCreatedBadge,
        error: null
      });

      const result = await badgesApi.createBadge(newBadge);

      expect(supabase.from).toHaveBeenCalledWith('network_badges');
      expect(result).toEqual({ data: mockCreatedBadge, error: null });
    });

    it('should handle create error', async () => {
      const mockError = { message: 'Badge name already exists' };

      supabase.from().insert().select().single().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await badgesApi.createBadge({ name: 'Duplicate Badge' });

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('awardBadge', () => {
    it('should award badge to user', async () => {
      const mockUserBadge = {
        id: 'ub1',
        user_id: 'user1',
        badge_id: 'badge1',
        awarded_at: '2024-01-01T10:00:00',
        awarded_by: 'admin1'
      };

      supabase.from().insert().select().single().mockResolvedValue({
        data: mockUserBadge,
        error: null
      });

      const result = await badgesApi.awardBadge('user1', 'badge1', 'admin1');

      expect(supabase.from).toHaveBeenCalledWith('user_badges');
      expect(result).toEqual({ data: mockUserBadge, error: null });
    });

    it('should handle award error', async () => {
      const mockError = { message: 'Badge already awarded' };

      supabase.from().insert().select().single().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await badgesApi.awardBadge('user1', 'badge1', 'admin1');

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('fetchUserBadges', () => {
    it('should fetch badges for a user', async () => {
      const mockUserBadges = [
        {
          id: 'ub1',
          user_id: 'user1',
          badge_id: 'badge1',
          awarded_at: '2024-01-01',
          badge: {
            id: 'badge1',
            name: 'Active Member',
            icon: '🌟',
            color: '#FFD700'
          }
        }
      ];

      supabase.from().select().eq().mockResolvedValue({
        data: mockUserBadges,
        error: null
      });

      const result = await badgesApi.fetchUserBadges('user1');

      expect(supabase.from).toHaveBeenCalledWith('user_badges');
      expect(result).toEqual({ data: mockUserBadges, error: null });
    });

    it('should handle fetch user badges error', async () => {
      const mockError = { message: 'Failed to fetch user badges' };

      supabase.from().select().eq().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await badgesApi.fetchUserBadges('user1');

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('updateBadge', () => {
    it('should update badge details', async () => {
      const updates = {
        name: 'Super Active Member',
        description: 'Updated description'
      };

      const mockUpdatedBadge = {
        id: 'badge1',
        name: 'Super Active Member',
        description: 'Updated description',
        icon: '🌟',
        color: '#FFD700'
      };

      supabase.from().update().eq().select().single().mockResolvedValue({
        data: mockUpdatedBadge,
        error: null
      });

      const result = await badgesApi.updateBadge('badge1', updates);

      expect(supabase.from).toHaveBeenCalledWith('network_badges');
      expect(result).toEqual({ data: mockUpdatedBadge, error: null });
    });

    it('should handle update error', async () => {
      const mockError = { message: 'Unauthorized to update' };

      supabase.from().update().eq().select().single().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await badgesApi.updateBadge('badge1', { name: 'New Name' });

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('deleteBadge', () => {
    it('should delete badge', async () => {
      supabase.from().delete().eq().mockResolvedValue({
        data: null,
        error: null
      });

      const result = await badgesApi.deleteBadge('badge1');

      expect(supabase.from).toHaveBeenCalledWith('network_badges');
      expect(result).toEqual({ error: null });
    });

    it('should handle delete error', async () => {
      const mockError = { message: 'Cannot delete badge with active assignments' };

      supabase.from().delete().eq().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await badgesApi.deleteBadge('badge1');

      expect(result).toEqual({ error: mockError });
    });
  });

  describe('getMemberActivityStats', () => {
    it('should calculate member activity stats', async () => {
      // Mock messages count
      supabase.from().select().eq().eq().mockResolvedValueOnce({
        data: [{ count: 25 }],
        error: null
      });

      // Mock events attended
      supabase.from().select().eq().mockResolvedValueOnce({
        data: [{ count: 5 }],
        error: null
      });

      // Mock news posts
      supabase.from().select().eq().eq().mockResolvedValueOnce({
        data: [{ count: 3 }],
        error: null
      });

      const result = await badgesApi.getMemberActivityStats('user1', 'net1');

      expect(result).toEqual({
        data: {
          messagesCount: 25,
          eventsAttended: 5,
          postsCreated: 3,
          totalActivity: 33
        },
        error: null
      });
    });

    it('should handle stats error', async () => {
      const mockError = { message: 'Failed to fetch stats' };

      supabase.from().select().eq().eq().mockResolvedValueOnce({
        data: null,
        error: mockError
      });

      const result = await badgesApi.getMemberActivityStats('user1', 'net1');

      expect(result.error).toBeTruthy();
    });
  });
});