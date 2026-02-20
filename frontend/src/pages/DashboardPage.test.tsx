import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { DashboardPage } from './DashboardPage';

vi.mock('@/stores/authStore', () => ({
  useAuth: () => ({
    user: {
      userId: 'u1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      role: 'ADMIN',
    },
  }),
}));

describe('DashboardPage', () => {
  it('renders welcome message with user name', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/dashboard.welcome John Doe/)).toBeInTheDocument();
  });

  it('renders Users and Documents links for ADMIN', () => {
    render(<DashboardPage />);
    expect(screen.getByRole('link', { name: /dashboard.users/i })).toHaveAttribute('href', '/users');
    expect(screen.getByRole('link', { name: /dashboard.documents/i })).toHaveAttribute('href', '/documents');
  });
});
