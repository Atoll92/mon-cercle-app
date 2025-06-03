import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Chat from './Chat';
import { AuthContext } from '../context/authcontext';
import { NetworkContext } from '../context/networkContext';
import * as networkApi from '../api/networks';

// Mock APIs
vi.mock('../api/networks');

// Mock components that might cause issues
vi.mock('./MediaUpload', () => ({
  default: ({ onUpload }) => (
    <button onClick={() => onUpload([{ url: 'test.jpg' }])}>Upload Media</button>
  )
}));

vi.mock('./MediaPlayer', () => ({
  default: ({ src }) => <div>Media Player: {src}</div>
}));

// Mock user and network context values
const mockUser = { id: 'user1', email: 'test@example.com' };
const mockNetworkMembers = [
  { user_id: 'user1', profile: { full_name: 'Test User' } },
  { user_id: 'user2', profile: { full_name: 'Other User' } }
];

const AuthWrapper = ({ children }) => (
  <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
    {children}
  </AuthContext.Provider>
);

const NetworkWrapper = ({ children }) => (
  <NetworkContext.Provider value={{ members: mockNetworkMembers }}>
    {children}
  </NetworkContext.Provider>
);

describe('Chat Component', () => {
  const mockNetworkId = 'net1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render chat interface', async () => {
    const mockMessages = [
      {
        id: 'msg1',
        user_id: 'user1',
        content: 'Hello world',
        created_at: '2024-01-01T10:00:00',
        sender: { full_name: 'Test User' }
      }
    ];

    networkApi.fetchNetworkMessages.mockResolvedValue({
      data: mockMessages,
      error: null
    });

    render(
      <AuthWrapper>
        <NetworkWrapper>
          <Chat networkId={mockNetworkId} />
        </NetworkWrapper>
      </AuthWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Hello world')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    });
  });

  it('should send a text message', async () => {
    const user = userEvent.setup();
    
    networkApi.fetchNetworkMessages.mockResolvedValue({ data: [], error: null });
    networkApi.sendNetworkMessage.mockResolvedValue({
      data: {
        id: 'msg2',
        content: 'New message',
        user_id: 'user1',
        created_at: new Date().toISOString()
      },
      error: null
    });

    render(
      <AuthWrapper>
        <NetworkWrapper>
          <Chat networkId={mockNetworkId} />
        </NetworkWrapper>
      </AuthWrapper>
    );

    const input = screen.getByPlaceholderText(/type a message/i);
    await user.type(input, 'New message');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(networkApi.sendNetworkMessage).toHaveBeenCalledWith(
        mockNetworkId,
        'user1',
        'New message',
        null,
        null,
        null
      );
    });
  });

  it('should handle message with mention', async () => {
    const user = userEvent.setup();
    
    networkApi.fetchNetworkMessages.mockResolvedValue({ data: [], error: null });

    render(
      <AuthWrapper>
        <NetworkWrapper>
          <Chat networkId={mockNetworkId} />
        </NetworkWrapper>
      </AuthWrapper>
    );

    const input = screen.getByPlaceholderText(/type a message/i);
    await user.type(input, 'Hello @');

    // Should show mention suggestions
    await waitFor(() => {
      expect(screen.getByText('Other User')).toBeInTheDocument();
    });
  });

  it('should handle reply to message', async () => {
    const mockMessages = [
      {
        id: 'msg1',
        user_id: 'user2',
        content: 'Original message',
        created_at: '2024-01-01T10:00:00',
        sender: { full_name: 'Other User' }
      }
    ];

    networkApi.fetchNetworkMessages.mockResolvedValue({
      data: mockMessages,
      error: null
    });

    render(
      <AuthWrapper>
        <NetworkWrapper>
          <Chat networkId={mockNetworkId} />
        </NetworkWrapper>
      </AuthWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Original message')).toBeInTheDocument();
    });

    // Click reply button
    const replyButton = screen.getByRole('button', { name: /reply/i });
    await userEvent.click(replyButton);

    expect(screen.getByText(/replying to/i)).toBeInTheDocument();
  });

  it('should handle media upload', async () => {
    const user = userEvent.setup();
    
    networkApi.fetchNetworkMessages.mockResolvedValue({ data: [], error: null });
    networkApi.sendNetworkMessage.mockResolvedValue({
      data: {
        id: 'msg3',
        content: '',
        media_url: 'test.jpg',
        media_type: 'image'
      },
      error: null
    });

    render(
      <AuthWrapper>
        <NetworkWrapper>
          <Chat networkId={mockNetworkId} />
        </NetworkWrapper>
      </AuthWrapper>
    );

    const uploadButton = screen.getByText('Upload Media');
    await user.click(uploadButton);

    await waitFor(() => {
      expect(networkApi.sendNetworkMessage).toHaveBeenCalledWith(
        mockNetworkId,
        'user1',
        '',
        'test.jpg',
        'image',
        null
      );
    });
  });

  it('should show loading state', () => {
    networkApi.fetchNetworkMessages.mockReturnValue(new Promise(() => {}));

    render(
      <AuthWrapper>
        <NetworkWrapper>
          <Chat networkId={mockNetworkId} />
        </NetworkWrapper>
      </AuthWrapper>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle errors', async () => {
    networkApi.fetchNetworkMessages.mockResolvedValue({
      data: null,
      error: { message: 'Failed to load messages' }
    });

    render(
      <AuthWrapper>
        <NetworkWrapper>
          <Chat networkId={mockNetworkId} />
        </NetworkWrapper>
      </AuthWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load messages/i)).toBeInTheDocument();
    });
  });

  it('should delete own message', async () => {
    const user = userEvent.setup();
    const mockMessages = [
      {
        id: 'msg1',
        user_id: 'user1',
        content: 'My message',
        created_at: '2024-01-01T10:00:00',
        sender: { full_name: 'Test User' }
      }
    ];

    networkApi.fetchNetworkMessages.mockResolvedValue({
      data: mockMessages,
      error: null
    });

    networkApi.deleteMessage.mockResolvedValue({ error: null });

    render(
      <AuthWrapper>
        <NetworkWrapper>
          <Chat networkId={mockNetworkId} />
        </NetworkWrapper>
      </AuthWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('My message')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(networkApi.deleteMessage).toHaveBeenCalledWith('msg1');
  });

  it('should auto-scroll to bottom on new messages', async () => {
    const mockMessages = Array.from({ length: 20 }, (_, i) => ({
      id: `msg${i}`,
      user_id: 'user1',
      content: `Message ${i}`,
      created_at: new Date(2024, 0, 1, 10, i).toISOString(),
      sender: { full_name: 'Test User' }
    }));

    networkApi.fetchNetworkMessages.mockResolvedValue({
      data: mockMessages,
      error: null
    });

    const { container } = render(
      <AuthWrapper>
        <NetworkWrapper>
          <Chat networkId={mockNetworkId} />
        </NetworkWrapper>
      </AuthWrapper>
    );

    await waitFor(() => {
      const chatContainer = container.querySelector('.chat-messages');
      expect(chatContainer.scrollTop).toBe(chatContainer.scrollHeight);
    });
  });

  it('should format message timestamps', async () => {
    const mockMessages = [
      {
        id: 'msg1',
        user_id: 'user1',
        content: 'Hello',
        created_at: new Date().toISOString(),
        sender: { full_name: 'Test User' }
      }
    ];

    networkApi.fetchNetworkMessages.mockResolvedValue({
      data: mockMessages,
      error: null
    });

    render(
      <AuthWrapper>
        <NetworkWrapper>
          <Chat networkId={mockNetworkId} />
        </NetworkWrapper>
      </AuthWrapper>
    );

    await waitFor(() => {
      // Should show relative time like "just now" or time format
      expect(screen.getByText(/now|ago|[0-9]+:[0-9]+/i)).toBeInTheDocument();
    });
  });
});