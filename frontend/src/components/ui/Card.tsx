import React, { type FC, type ReactNode } from 'react';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: CardPadding;
}

const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
}) => {
  const base = 'bg-white rounded-xl border border-gray-100 shadow-sm';

  const hoverEffect = hover
    ? 'hover:shadow-md hover:border-gray-200 transition-shadow transition-colors duration-200'
    : '';

  const merged = [base, hoverEffect, paddingClasses[padding], className]
    .filter(Boolean)
    .join(' ');

  return <div className={merged}>{children}</div>;
};
