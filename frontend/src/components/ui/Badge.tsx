import React, { type FC, type ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

export const Badge: FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

  const merged = [base, variantClasses[variant], className]
    .filter(Boolean)
    .join(' ');

  return <span className={merged}>{children}</span>;
};
