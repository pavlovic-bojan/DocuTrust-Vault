import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/test-utils';
import { Input } from './input';

describe('Input', () => {
  it('renders with value', () => {
    render(<Input value="test" onChange={() => {}} readOnly />);
    expect(screen.getByDisplayValue('test')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'a');
    expect(handleChange).toHaveBeenCalled();
  });

  it('supports type password', () => {
    render(<Input type="password" data-testid="pwd" />);
    const input = screen.getByTestId('pwd');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('forwards ref', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
