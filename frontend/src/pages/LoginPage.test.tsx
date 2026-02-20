import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/test-utils';
import { LoginPage } from './LoginPage';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/stores/authStore', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/login.email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/login.password/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login.signIn/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login.forgotPassword/ })).toBeInTheDocument();
  });

  it('submits with email and password', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ role: 'ADMIN' });

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/login.email/), 'admin@test.com');
    await user.type(screen.getByLabelText(/login.password/), 'Password123!');
    await user.click(screen.getByRole('button', { name: /login.signIn/ }));

    expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'Password123!');
  });

  it('navigates to / after login as ADMIN', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ role: 'ADMIN' });

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/login.email/), 'admin@test.com');
    await user.type(screen.getByLabelText(/login.password/), 'pass');
    await user.click(screen.getByRole('button', { name: /login.signIn/ }));

    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('navigates to /documents after login as USER', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ role: 'USER' });

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/login.email/), 'user@test.com');
    await user.type(screen.getByLabelText(/login.password/), 'pass');
    await user.click(screen.getByRole('button', { name: /login.signIn/ }));

    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/documents');
    });
  });

  it('shows error when login fails', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Invalid'));

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/login.email/), 'bad@test.com');
    await user.type(screen.getByLabelText(/login.password/), 'wrong');
    await user.click(screen.getByRole('button', { name: /login.signIn/ }));

    await vi.waitFor(() => {
      expect(screen.getByText(/login\.invalidCredentials|Invalid|Something/i)).toBeInTheDocument();
    });
  });
});
