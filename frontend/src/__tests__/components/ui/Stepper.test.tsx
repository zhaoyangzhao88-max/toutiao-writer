import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stepper } from '../../../components/ui/Stepper';

describe('Stepper', () => {
  it('renders nothing for empty steps array', () => {
    const { container } = render(<Stepper steps={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders all steps with their labels', () => {
    const steps = [
      { label: 'Step 1', status: 'completed' as const },
      { label: 'Step 2', status: 'active' as const },
      { label: 'Step 3', status: 'pending' as const },
    ];
    render(<Stepper steps={steps} />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('renders blue filled circle for completed step', () => {
    const steps = [{ label: 'Done', status: 'completed' as const }];
    const { container } = render(<Stepper steps={steps} />);
    const icon = container.querySelector('.bg-blue-600');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveTextContent('✓');
  });

  it('renders blue border circle for active step', () => {
    const steps = [{ label: 'Active', status: 'active' as const }];
    const { container } = render(<Stepper steps={steps} />);
    const icon = container.querySelector('.border-2.border-blue-600');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveTextContent('●');
  });

  it('renders gray border circle for pending step', () => {
    const steps = [{ label: 'Pending', status: 'pending' as const }];
    const { container } = render(<Stepper steps={steps} />);
    const icon = container.querySelector('.border-2.border-gray-300');
    expect(icon).toBeInTheDocument();
  });

  it('renders connector line between steps', () => {
    const steps = [
      { label: 'A', status: 'completed' as const },
      { label: 'B', status: 'pending' as const },
    ];
    const { container } = render(<Stepper steps={steps} />);
    const connectors = container.querySelectorAll('.h-0\\.5');
    expect(connectors.length).toBe(1);
  });

  it('uses blue text for active step label', () => {
    const steps = [{ label: 'Active', status: 'active' as const }];
    render(<Stepper steps={steps} />);
    expect(screen.getByText('Active')).toHaveClass('text-blue-600');
  });

  it('uses gray text for completed step label', () => {
    const steps = [{ label: 'Done', status: 'completed' as const }];
    render(<Stepper steps={steps} />);
    expect(screen.getByText('Done')).toHaveClass('text-gray-700');
  });
});
