import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/test-utils';
import { Drawer } from './drawer';

describe('Drawer', () => {
  it('renders nothing when closed', () => {
    render(<Drawer open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title and content when open', () => {
    render(
      <Drawer open onClose={vi.fn()} title="Test Drawer">
        <p>Drawer content</p>
      </Drawer>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Drawer')).toBeInTheDocument();
    expect(screen.getByText('Drawer content')).toBeInTheDocument();
  });

  it('calls onClose when overlay clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Drawer open onClose={onClose} title="Test">
        <p>Content</p>
      </Drawer>
    );
    const overlay = document.querySelector('[aria-hidden="true"]');
    if (overlay) await user.click(overlay as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });
});
