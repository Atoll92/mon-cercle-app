import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { AuthContext } from '../context/authcontext';
import * as authApi from '../api/auth';

// Mock auth API
vi.mock('../api/auth');

// Mock navigate
const mockNavigate = vi.fn();
const mockLocation = { state: null };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation
  };
});

const renderLoginPage = (authValue = {}) => {
  const defaultAuth = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  };

  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ ...defaultAuth, ...authValue }}>
        <LoginPage />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('should redirect if already authenticated', () => {
    renderLoginPage({ isAuthenticated: true, user: { id: '123' } });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();
    const mockUser = { id: '123', email: 'test@example.com' };

    authApi.signIn.mockResolvedValue({
      user: mockUser,
      error: null
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authApi.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show error on failed login', async () => {
    const user = userEvent.setup();

    authApi.signIn.mockResolvedValue({
      user: null,
      error: { message: 'Invalid credentials' }
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    expect(authApi.signIn).not.toHaveBeenCalled();
  });

  it('should require password', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(authApi.signIn).not.toHaveBeenCalled();
  });

  it('should show loading state during login', async () => {
    const user = userEvent.setup();
    
    authApi.signIn.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ user: null, error: null }), 100))
    );

    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
  });

  it('should navigate to signup page', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const signupLink = screen.getByText(/sign up/i);
    await user.click(signupLink);

    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  it('should navigate to password reset', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const forgotLink = screen.getByText(/forgot password/i);
    await user.click(forgotLink);

    expect(mockNavigate).toHaveBeenCalledWith('/password-reset');
  });

  it('should redirect to intended location after login', async () => {
    const user = userEvent.setup();
    
    // Update mock location state with redirect path
    mockLocation.state = { from: '/profile' };

    authApi.signIn.mockResolvedValue({
      user: { id: '123' },
      error: null
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: /show password/i });
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});