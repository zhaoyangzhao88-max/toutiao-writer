import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusIcon } from '../../../components/ui/StatusIcon';

describe('StatusIcon', () => {
  it('renders with role="img"', () => {
    render(<StatusIcon status="pass" />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders checkmark for pass status', () => {
    render(<StatusIcon status="pass" />);
    const span = screen.getByRole('img');
    expect(span).toHaveAttribute('aria-label', 'Pass');
    expect(span).toHaveTextContent('✅');
  });

  it('renders warning icon for warn status', () => {
    render(<StatusIcon status="warn" />);
    expect(screen.getByRole('img')).toHaveTextContent('⚠️');
  });

  it('renders X icon for fail status', () => {
    render(<StatusIcon status="fail" />);
    expect(screen.getByRole('img')).toHaveTextContent('❌');
  });

  it('renders hollow circle for pending status', () => {
    render(<StatusIcon status="pending" />);
    expect(screen.getByRole('img')).toHaveTextContent('⚪');
  });

  it('renders dash for skipped status', () => {
    render(<StatusIcon status="skipped" />);
    expect(screen.getByRole('img')).toHaveTextContent('➖');
  });

  it('renders checkmark for completed status', () => {
    render(<StatusIcon status="completed" />);
    expect(screen.getByRole('img')).toHaveTextContent('✅');
  });

  it('renders blue circle for active status', () => {
    render(<StatusIcon status="active" />);
    const span = screen.getByRole('img');
    expect(span).toHaveAttribute('aria-label', 'Active');
  });
});
