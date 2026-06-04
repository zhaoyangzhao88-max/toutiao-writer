import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../../../components/ui/ProgressBar';

describe('ProgressBar', () => {
  it('renders with ARIA progressbar role', () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders correct ARIA attributes', () => {
    render(<ProgressBar value={50} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('clamps value at 0 for negative values', () => {
    render(<ProgressBar value={-10} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('clamps value at 100 for overflow values', () => {
    render(<ProgressBar value={150} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('shows percentage when showLabel is true', () => {
    render(<ProgressBar value={75} showLabel />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('does not show percentage when showLabel is false', () => {
    const { container } = render(<ProgressBar value={75} />);
    expect(container.querySelector('.text-sm.font-medium')).not.toBeInTheDocument();
  });

  it('shows custom label text', () => {
    render(<ProgressBar value={50} label="Progress" showLabel />);
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('rounds decimal percentage values', () => {
    render(<ProgressBar value={33.333} showLabel />);
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('applies default blue color', () => {
    const { container } = render(<ProgressBar value={50} />);
    const fill = container.querySelector('.bg-blue-600');
    expect(fill).toBeInTheDocument();
  });

  it('applies green color when specified', () => {
    const { container } = render(<ProgressBar value={50} color="green" />);
    expect(container.querySelector('.bg-green-600')).toBeInTheDocument();
  });
});
