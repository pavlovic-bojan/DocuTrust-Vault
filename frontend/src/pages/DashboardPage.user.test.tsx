import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { DashboardPage } from './DashboardPage';

vi.mock('@/stores/authStore', () => ({
  useAuth: () => ({
    user: {
      userId: 'u1',
      firstName: 'Jane',
      lastName: 'User',
      email: 'jane@test.com',
      role: 'USER',
    },
  }),
}));

describe('DashboardPage (USER role)', () => {
  it('does not show Users link for USER', () => {
    render(<DashboardPage />);
    expect(screen.queryByRole('link', { name: /dashboard.users/i })).not.toBeInTheDocument();
  });

  it('shows Documents link', () => {
    render(<DashboardPage />);
    expect(screen.getByRole('link', { name: /dashboard.documents/i })).toBeInTheDocument();
  });
});
