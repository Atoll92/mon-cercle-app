// src/context/networkContext.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, renderHook, act, waitFor } from '@testing-library/react';
import { NetworkProvider, useNetwork } from './networkContext';
import { useAuth } from './authcontext';
import { supabase } from '../supabaseclient';
import React from 'react';

// Mock dependencies
vi.mock('./authcontext', () => ({
  useAuth: vi.fn(),
}));

// Use the mock defined in __mocks__
vi.mock('../supabaseclient');

// Use mock API functions
vi.mock('../api/networks.jsx', () => require('../__mocks__/api/networks.jsx'));

const mockUser = { id: 'user1' };
const mockNetworkId = 'network1';

// Wrapper component for testing hooks
const TestComponent = ({ children }) => {
  return (
    <NetworkProvider networkId={mockNetworkId}>
      {children}
    </NetworkProvider>
  );
};

describe('NetworkContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default auth mock implementation
    useAuth.mockReturnValue({
      user: mockUser,
    });
    
    // Import mocks from our __mocks__ folder
    const { supabase } = require('../__mocks__/supabaseclient.jsx');
    const { fetchNetworkDetails, fetchNetworkMembers, fetchNetworkEvents, fetchNetworkNews } = require('../__mocks__/api/networks.jsx');
    fetchNetworkDetails.mockResolvedValue({ id: mockNetworkId, name: 'Test Network' });
    fetchNetworkMembers.mockResolvedValue([
      { id: 'user1', full_name: 'Test User 1', role: 'admin' },
      { id: 'user2', full_name: 'Test User 2', role: 'member' },
    ]);
    fetchNetworkEvents.mockResolvedValue([
      { id: 'event1', title: 'Test Event 1' },
      { id: 'event2', title: 'Test Event 2' },
    ]);
    fetchNetworkNews.mockResolvedValue([
      { id: 'news1', title: 'Test News 1' },
      { id: 'news2', title: 'Test News 2' },
    ]);
  });

  it('should provide network context with initial loading state', () => {
    // Use renderHook to test the hook in isolation
    const { result } = renderHook(() => useNetwork(), {
      wrapper: TestComponent,
    });
    
    // Check initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.network).toBeNull();
    expect(result.current.members).toEqual([]);
    expect(result.current.events).toEqual([]);
    expect(result.current.news).toEqual([]);
    expect(result.current.files).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should load network data when mounted', async () => {
    // Use renderHook to test the hook in isolation
    const { result } = renderHook(() => useNetwork(), {
      wrapper: TestComponent,
    });
    
    // Wait for the data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Check the loaded data
    expect(result.current.network).toEqual({ id: mockNetworkId, name: 'Test Network' });
    expect(result.current.members).toHaveLength(2);
    expect(result.current.events).toHaveLength(2);
    expect(result.current.news).toHaveLength(2);
    expect(result.current.userRole).toBe('admin');
    expect(result.current.isAdmin).toBe(true);
  });

  it('should handle errors during data loading', async () => {
    // Mock an error in one of the API calls
    const { fetchNetworkDetails } = require('../__mocks__/api/networks.jsx');
    fetchNetworkDetails.mockRejectedValue(new Error('Failed to load network'));
    
    // Use renderHook to test the hook in isolation
    const { result } = renderHook(() => useNetwork(), {
      wrapper: TestComponent,
    });
    
    // Wait for the loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Check that the error was set
    expect(result.current.error).toBe('Failed to load network data');
  });

  it('should determine user role correctly when user is a member', async () => {
    // Override the API mock to make the user a regular member
    const { fetchNetworkMembers } = require('../__mocks__/api/networks.jsx');
    fetchNetworkMembers.mockResolvedValue([
      { id: 'user1', full_name: 'Test User 1', role: 'member' },
      { id: 'user2', full_name: 'Test User 2', role: 'admin' },
    ]);
    
    // Use renderHook to test the hook in isolation
    const { result } = renderHook(() => useNetwork(), {
      wrapper: TestComponent,
    });
    
    // Wait for the data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Check the user role
    expect(result.current.userRole).toBe('member');
    expect(result.current.isAdmin).toBe(false);
  });

  it('should provide refresh functions for data', async () => {
    // Use renderHook to test the hook in isolation
    const { result } = renderHook(() => useNetwork(), {
      wrapper: TestComponent,
    });
    
    // Wait for the data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Check that refresh functions exist
    expect(result.current.refreshMembers).toBeInstanceOf(Function);
    expect(result.current.refreshEvents).toBeInstanceOf(Function);
    expect(result.current.refreshNews).toBeInstanceOf(Function);
    expect(result.current.refreshFiles).toBeInstanceOf(Function);
    
    // Mock the API call again for the refresh function
    const { fetchNetworkNews } = require('../__mocks__/api/networks.jsx');
    fetchNetworkNews.mockClear(); // Clear previous calls
    fetchNetworkNews.mockResolvedValue([
      { id: 'news3', title: 'New Test News' },
    ]);
    
    // Call the refresh function
    await act(async () => {
      await result.current.refreshNews();
    });
    
    // Check that the API function was called again
    expect(fetchNetworkNews).toHaveBeenCalledWith(mockNetworkId);
  });
});