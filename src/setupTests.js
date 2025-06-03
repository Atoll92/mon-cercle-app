// src/setupTests.js
import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Mock modules that cause issues in tests
vi.mock('./services/emailNotificationService');
vi.mock('./supabaseclient.jsx');

// Setup MSW server before all tests
beforeAll(() => {
  // Start the MSW server
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});