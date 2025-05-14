// src/__mocks__/api/networks.jsx
import { vi } from 'vitest';

// Mock API functions
export const fetchNetworkDetails = vi.fn().mockResolvedValue({
  id: 'network1',
  name: 'Test Network',
  description: 'This is a test network'
});

export const fetchNetworkMembers = vi.fn().mockResolvedValue([
  { id: 'user1', full_name: 'Test User 1', role: 'admin' },
  { id: 'user2', full_name: 'Test User 2', role: 'member' }
]);

export const fetchNetworkEvents = vi.fn().mockResolvedValue([
  { id: 'event1', title: 'Test Event 1', date: new Date().toISOString() },
  { id: 'event2', title: 'Test Event 2', date: new Date().toISOString() }
]);

export const fetchNetworkNews = vi.fn().mockResolvedValue([
  { id: 'news1', title: 'Test News 1', content: '<p>Test content</p>' },
  { id: 'news2', title: 'Test News 2', content: '<p>More test content</p>' }
]);

export const createNewsPost = vi.fn().mockResolvedValue({
  success: true,
  post: { id: 'news3', title: 'New Test Post' },
  message: 'News post published successfully!'
});

export const deleteNewsPost = vi.fn().mockResolvedValue({
  success: true,
  message: 'News post deleted successfully'
});

export const getUserProfile = vi.fn().mockResolvedValue({
  id: 'user1',
  full_name: 'Test User',
  role: 'admin'
});

export const updateNetworkDetails = vi.fn().mockResolvedValue({
  success: true
});

export const inviteUserToNetwork = vi.fn().mockResolvedValue({
  success: true,
  message: 'User invited successfully'
});

export const toggleMemberAdmin = vi.fn().mockResolvedValue({
  success: true,
  message: 'User role updated',
  newRole: 'admin'
});

export const removeMemberFromNetwork = vi.fn().mockResolvedValue({
  success: true,
  message: 'Member removed from network'
});

export const uploadNetworkImage = vi.fn().mockResolvedValue({
  success: true,
  publicUrl: 'https://example.com/image.jpg',
  message: 'Image uploaded successfully'
});

export const removeNetworkImage = vi.fn().mockResolvedValue({
  success: true,
  message: 'Image removed successfully'
});

export const createEvent = vi.fn().mockResolvedValue({
  success: true,
  event: { id: 'event3', title: 'New Test Event' },
  message: 'Event created successfully!'
});

export const updateEvent = vi.fn().mockResolvedValue({
  success: true,
  event: { id: 'event1', title: 'Updated Test Event' },
  message: 'Event updated successfully!'
});

export const deleteEvent = vi.fn().mockResolvedValue({
  success: true,
  message: 'Event deleted successfully'
});

export const uploadEventImage = vi.fn().mockResolvedValue('https://example.com/event-image.jpg');

export const exportEventParticipantsList = vi.fn().mockResolvedValue({
  success: true,
  eventTitle: 'Test Event',
  csvContent: 'Name,Email,Status,Role\n"Test User","test@example.com","attending","member"'
});