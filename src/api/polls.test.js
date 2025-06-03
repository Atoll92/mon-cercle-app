import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as pollsApi from './polls';
import { supabase } from '../supabaseclient';

describe('Polls API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPoll', () => {
    it('should create a poll successfully', async () => {
      const mockPoll = {
        id: 'poll1',
        network_id: 'net1',
        created_by: 'user1',
        question: 'What is your favorite color?',
        options: ['Red', 'Blue', 'Green'],
        poll_type: 'multiple_choice',
        is_anonymous: false,
        ends_at: '2024-12-31'
      };

      supabase.from().insert().select().single().mockResolvedValue({
        data: mockPoll,
        error: null
      });

      const result = await pollsApi.createPoll({
        network_id: 'net1',
        created_by: 'user1',
        question: 'What is your favorite color?',
        options: ['Red', 'Blue', 'Green'],
        poll_type: 'multiple_choice',
        is_anonymous: false,
        ends_at: '2024-12-31'
      });

      expect(supabase.from).toHaveBeenCalledWith('network_polls');
      expect(result).toEqual({ data: mockPoll, error: null });
    });

    it('should handle create poll error', async () => {
      const mockError = { message: 'Failed to create poll' };

      supabase.from().insert().select().single().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await pollsApi.createPoll({
        network_id: 'net1',
        question: 'Test poll'
      });

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('fetchNetworkPolls', () => {
    it('should fetch polls with vote counts', async () => {
      const mockPolls = [
        {
          id: 'poll1',
          question: 'Favorite color?',
          options: ['Red', 'Blue'],
          created_at: '2024-01-01',
          ends_at: '2024-12-31',
          created_by: 'user1',
          creator: { full_name: 'John Doe' },
          votes: [
            { id: 'vote1', user_id: 'user1', selected_options: ['Red'] }
          ]
        }
      ];

      supabase.from().select().eq().order().mockResolvedValue({
        data: mockPolls,
        error: null
      });

      const result = await pollsApi.fetchNetworkPolls('net1');

      expect(supabase.from).toHaveBeenCalledWith('network_polls');
      expect(result).toEqual({ data: mockPolls, error: null });
    });

    it('should handle fetch error', async () => {
      const mockError = { message: 'Failed to fetch polls' };

      supabase.from().select().eq().order().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await pollsApi.fetchNetworkPolls('net1');

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('votePoll', () => {
    it('should submit vote successfully', async () => {
      const mockVote = {
        id: 'vote1',
        poll_id: 'poll1',
        user_id: 'user1',
        selected_options: ['Blue']
      };

      supabase.from().insert().select().single().mockResolvedValue({
        data: mockVote,
        error: null
      });

      const result = await pollsApi.votePoll('poll1', 'user1', ['Blue']);

      expect(supabase.from).toHaveBeenCalledWith('network_poll_votes');
      expect(result).toEqual({ data: mockVote, error: null });
    });

    it('should handle voting error', async () => {
      const mockError = { message: 'Already voted' };

      supabase.from().insert().select().single().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await pollsApi.votePoll('poll1', 'user1', ['Blue']);

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('updateVote', () => {
    it('should update vote successfully', async () => {
      const mockUpdatedVote = {
        id: 'vote1',
        poll_id: 'poll1',
        user_id: 'user1',
        selected_options: ['Green']
      };

      supabase.from().update().eq().eq().select().single().mockResolvedValue({
        data: mockUpdatedVote,
        error: null
      });

      const result = await pollsApi.updateVote('poll1', 'user1', ['Green']);

      expect(supabase.from).toHaveBeenCalledWith('network_poll_votes');
      expect(result).toEqual({ data: mockUpdatedVote, error: null });
    });

    it('should handle update error', async () => {
      const mockError = { message: 'Failed to update vote' };

      supabase.from().update().eq().eq().select().single().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await pollsApi.updateVote('poll1', 'user1', ['Red']);

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('deletePoll', () => {
    it('should delete poll successfully', async () => {
      supabase.from().delete().eq().mockResolvedValue({
        data: null,
        error: null
      });

      const result = await pollsApi.deletePoll('poll1');

      expect(supabase.from).toHaveBeenCalledWith('network_polls');
      expect(result).toEqual({ error: null });
    });

    it('should handle delete error', async () => {
      const mockError = { message: 'Unauthorized to delete' };

      supabase.from().delete().eq().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await pollsApi.deletePoll('poll1');

      expect(result).toEqual({ error: mockError });
    });
  });

  describe('getPollResults', () => {
    it('should calculate poll results correctly', async () => {
      const mockPoll = {
        id: 'poll1',
        question: 'Favorite color?',
        options: ['Red', 'Blue', 'Green'],
        poll_type: 'multiple_choice',
        votes: [
          { selected_options: ['Red'] },
          { selected_options: ['Red'] },
          { selected_options: ['Blue'] },
          { selected_options: ['Green'] }
        ]
      };

      supabase.from().select().eq().single().mockResolvedValue({
        data: mockPoll,
        error: null
      });

      const result = await pollsApi.getPollResults('poll1');

      expect(result.data.results).toEqual({
        'Red': 2,
        'Blue': 1,
        'Green': 1
      });
      expect(result.data.totalVotes).toBe(4);
    });

    it('should handle yes/no poll results', async () => {
      const mockPoll = {
        id: 'poll2',
        question: 'Do you agree?',
        poll_type: 'yes_no',
        votes: [
          { selected_options: ['yes'] },
          { selected_options: ['yes'] },
          { selected_options: ['no'] }
        ]
      };

      supabase.from().select().eq().single().mockResolvedValue({
        data: mockPoll,
        error: null
      });

      const result = await pollsApi.getPollResults('poll2');

      expect(result.data.results).toEqual({
        'yes': 2,
        'no': 1
      });
      expect(result.data.totalVotes).toBe(3);
    });

    it('should handle date picker poll results', async () => {
      const mockPoll = {
        id: 'poll3',
        question: 'When should we meet?',
        poll_type: 'date_picker',
        votes: [
          { selected_options: ['2024-01-01'] },
          { selected_options: ['2024-01-01'] },
          { selected_options: ['2024-01-02'] }
        ]
      };

      supabase.from().select().eq().single().mockResolvedValue({
        data: mockPoll,
        error: null
      });

      const result = await pollsApi.getPollResults('poll3');

      expect(result.data.results).toEqual({
        '2024-01-01': 2,
        '2024-01-02': 1
      });
    });

    it('should handle fetch error', async () => {
      const mockError = { message: 'Poll not found' };

      supabase.from().select().eq().single().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await pollsApi.getPollResults('poll1');

      expect(result).toEqual({ data: null, error: mockError });
    });
  });
});