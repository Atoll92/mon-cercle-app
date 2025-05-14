// src/test-utils.jsx
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Import the mock supabase client
import { supabase } from './__mocks__/supabaseclient.jsx';

// Define mocks before they are used
const mockAuth = {
  getUser: vi.fn().mockReturnValue({ user: null }),
  user: null,
  session: null,
  isLoading: false,
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
  updateProfile: vi.fn(),
};

// Mock the Supabase client
vi.mock('./supabaseclient', () => ({
  supabase,
}));

// Mock auth context
vi.mock('./context/authcontext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }) => children,
}));

// Mock DirectMessagesProvider
vi.mock('./context/directMessagesContext', () => ({
  useDirectMessages: vi.fn(),
  DirectMessagesProvider: ({ children }) => children,
}));

// Mock ThemeProvider
vi.mock('./components/ThemeProvider', () => ({
  default: ({ children }) => children,
}));

// All providers wrapper for testing
const AllTheProviders = ({ children }) => {
  return (
    <MemoryRouter>
      {children}
    </MemoryRouter>
  );
};

// Custom render with providers
const customRender = (ui, options) => render(ui, { wrapper: AllTheProviders, ...options });

// Export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };