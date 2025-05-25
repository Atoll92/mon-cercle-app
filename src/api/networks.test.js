// src/api/networks.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '../supabaseclient';
import { createNewsPost, fetchNetworkMembers, fetchNetworkDetails } from './networks.jsx';

// Mock the supabase client
vi.mock('../supabaseclient', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}));

describe('Network API Functions', () => {
  // Mock data for tests
  const mockNetworkId = '123';
  const mockUserId = 'user123';
  const mockTitle = 'Test News';
  const mockContent = '<p>Test content</p>';
  const mockImageUrl = 'https://example.com/image.jpg';
  const mockImageCaption = 'Test caption';

  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('createNewsPost', () => {
    it('should create a news post successfully', async () => {
      // Setup the mock response
      const mockInsertResponse = {
        data: [{ id: 'post123', title: mockTitle, content: mockContent }],
        error: null,
      };

      // Setup the supabase mock to return the expected values
      const mockSelect = vi.fn().mockResolvedValue(mockInsertResponse);
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      
      supabase.from.mockReturnValue({
        insert: mockInsert,
      });

      // Call the function
      const result = await createNewsPost(
        mockNetworkId,
        mockUserId,
        mockTitle,
        mockContent,
        mockImageUrl,
        mockImageCaption
      );

      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('network_news');
      expect(mockInsert).toHaveBeenCalledWith([{
        title: mockTitle,
        content: mockContent,
        network_id: mockNetworkId,
        created_by: mockUserId,
        image_url: mockImageUrl,
        image_caption: mockImageCaption,
      }]);
      expect(result).toEqual({
        success: true,
        post: mockInsertResponse.data[0],
        message: 'News post published successfully!',
      });
    });

    it('should handle errors when creating a news post', async () => {
      // Setup the mock error response
      const mockError = new Error('Database error');
      
      supabase.from.mockReturnValue({
        insert: vi.fn().mockImplementation(() => {
          throw mockError;
        }),
      });

      // Call the function
      const result = await createNewsPost(
        mockNetworkId,
        mockUserId,
        mockTitle,
        mockContent
      );

      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to publish news post',
      });
    });
  });

  describe('fetchNetworkMembers', () => {
    it('should fetch network members successfully', async () => {
      // Setup mock data
      const mockMembers = [
        { id: 'user1', full_name: 'User One' },
        { id: 'user2', full_name: 'User Two' },
      ];

      // Setup the supabase mock with pagination support
      const mockResponse = { data: mockMembers, error: null, count: 2 };
      const mockRange = vi.fn().mockResolvedValue(mockResponse);
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      supabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Call the function
      const result = await fetchNetworkMembers(mockNetworkId);

      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('id, full_name, contact_email, role, profile_picture_url', { count: 'exact' });
      expect(mockEq).toHaveBeenCalledWith('network_id', mockNetworkId);
      expect(mockOrder).toHaveBeenCalledWith('full_name', { ascending: true });
      expect(mockRange).toHaveBeenCalledWith(0, 49); // Default page size is 50
      expect(result).toEqual({
        members: mockMembers,
        totalCount: 2,
        currentPage: 1,
        totalPages: 1,
        hasMore: false
      });
    });

    it('should handle errors when fetching network members', async () => {
      // Setup the mock error response
      const mockError = { message: 'Database error' };
      const mockRange = vi.fn().mockResolvedValue({ data: null, error: mockError, count: 0 });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      supabase.from.mockReturnValue({
        select: mockSelect,
      });

      // We need to console.error to be mocked
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Call the function
      const result = await fetchNetworkMembers(mockNetworkId);

      // Assertions
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result).toEqual({
        members: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
        hasMore: false
      });
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('fetchNetworkDetails', () => {
    it('should fetch network details successfully', async () => {
      // Setup mock data
      const mockNetworkDetails = {
        id: mockNetworkId,
        name: 'Test Network',
        description: 'Test description',
      };

      // Setup the supabase mock
      const mockResponse = { data: mockNetworkDetails, error: null };
      const mockSingle = vi.fn().mockResolvedValue(mockResponse);
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      supabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Call the function
      const result = await fetchNetworkDetails(mockNetworkId);

      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('networks');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', mockNetworkId);
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockNetworkDetails);
    });

    it('should handle errors when fetching network details', async () => {
      // Setup the mock error response
      const mockError = { message: 'Database error' };
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      supabase.from.mockReturnValue({
        select: mockSelect,
      });

      // We need to console.error to be mocked
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Call the function
      const result = await fetchNetworkDetails(mockNetworkId);

      // Assertions
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result).toBeNull();
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});