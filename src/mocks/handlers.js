// src/mocks/handlers.js
import { http, HttpResponse } from 'msw';

// Sample network data
const mockNetworkData = {
  id: 'network1',
  name: 'Test Network',
  description: 'This is a test network',
};

// Sample users data
const mockUsers = [
  { id: 'user1', full_name: 'Test User 1', role: 'admin' },
  { id: 'user2', full_name: 'Test User 2', role: 'member' },
];

// Mock handlers for API requests
export const handlers = [
  // Network data
  http.get('/networks/:networkId', ({ params }) => {
    return HttpResponse.json({
      ...mockNetworkData,
      id: params.networkId,
    });
  }),

  // Network members
  http.get('/networks/:networkId/members', () => {
    return HttpResponse.json(mockUsers);
  }),

  // Network news
  http.get('/networks/:networkId/news', () => {
    return HttpResponse.json([
      {
        id: 'news1',
        title: 'Test News 1',
        content: '<p>Test content 1</p>',
        created_at: new Date().toISOString(),
        created_by: 'user1',
      },
      {
        id: 'news2',
        title: 'Test News 2',
        content: '<p>Test content 2</p>',
        created_at: new Date().toISOString(),
        created_by: 'user2',
        image_url: 'https://example.com/test-image.jpg',
        image_caption: 'Test image caption',
      },
    ]);
  }),

  // Create news post
  http.post('/networks/:networkId/news', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({
      id: 'news3',
      ...data,
      created_at: new Date().toISOString(),
    });
  }),

  // Network events
  http.get('/networks/:networkId/events', () => {
    return HttpResponse.json([
      {
        id: 'event1',
        title: 'Test Event 1',
        date: new Date().toISOString(),
        location: 'Test Location 1',
        created_by: 'user1',
      },
      {
        id: 'event2',
        title: 'Test Event 2',
        date: new Date().toISOString(),
        location: 'Test Location 2',
        created_by: 'user2',
      },
    ]);
  }),

  // Auth handlers
  http.post('/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    
    if (email === 'test@example.com' && password === 'password') {
      return HttpResponse.json({
        user: { id: 'user1', email: 'test@example.com' },
        session: { access_token: 'test-token' },
      });
    }
    
    return new HttpResponse(
      JSON.stringify({ message: 'Invalid credentials' }), 
      { status: 401 }
    );
  }),
];