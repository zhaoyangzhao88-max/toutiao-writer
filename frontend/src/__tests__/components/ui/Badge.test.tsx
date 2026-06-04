import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../../../components/ui/Badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Success</Badge>);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('applies default variant (default) class', () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toHaveClass('bg-gray-100');
  });

  it('applies variant=success class', () => {
    const { container } = render(<Badge variant="success">Good</Badge>);
    expect(container.firstChild).toHaveClass('bg-green-100');
  });

  it('applies variant=danger class', () => {
    const { container } = render(<Badge variant="danger">Bad</Badge>);
    expect(container.firstChild).toHaveClass('bg-red-100');
  });

  it('applies variant=warning class', () => {
    const { container } = render(<Badge variant="warning">Warn</Badge>);
    expect(container.firstChild).toHaveClass('bg-yellow-100');
  });

  it('applies variant=info class', () => {
    const { container } = render(<Badge variant="info">Info</Badge>);
    expect(container.firstChild).toHaveClass('bg-blue-100');
  });
});
