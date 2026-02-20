import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Status</Badge>);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    render(<Badge variant="VALID">Valid</Badge>);
    const el = screen.getByText('Valid');
    expect(el).toHaveClass('bg-green-100');
  });

  it('uses default variant when unknown', () => {
    render(<Badge variant="UNKNOWN">X</Badge>);
    const el = screen.getByText('X');
    expect(el).toHaveClass('bg-slate-100');
  });

  it('accepts className', () => {
    render(<Badge className="custom-class">Badge</Badge>);
    expect(screen.getByText('Badge')).toHaveClass('custom-class');
  });
});
