import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/test-utils';
import { ForgotPasswordPage } from './ForgotPasswordPage';

vi.mock('@/api/auth.api', () => ({
  authApi: {
    forgotPassword: vi.fn().mockResolvedValue({ ok: true }),
  },
}));

describe('ForgotPasswordPage', () => {
  it('renders form with email input', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByLabelText(/forgotPassword.email/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /forgotPassword.sendResetLink/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /forgotPassword.backToLogin/ })).toBeInTheDocument();
  });

  it('submits email on button click', async () => {
    const user = userEvent.setup();
    const { authApi } = await import('@/api/auth.api');

    render(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText(/forgotPassword.email/), 'user@test.com');
    await user.click(screen.getByRole('button', { name: /forgotPassword.sendResetLink/ }));

    expect(authApi.forgotPassword).toHaveBeenCalledWith('user@test.com');
  });
});
