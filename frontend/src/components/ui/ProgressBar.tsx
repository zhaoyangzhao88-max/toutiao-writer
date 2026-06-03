import React, { type FC } from 'react';

type ProgressColor = 'blue' | 'green' | 'yellow';

interface ProgressBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
  color?: ProgressColor;
}

const colorClasses: Record<ProgressColor, string> = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  yellow: 'bg-yellow-500',
};

const labelColorClasses: Record<ProgressColor, string> = {
  blue: 'text-blue-700',
  green: 'text-green-700',
  yellow: 'text-yellow-700',
};

export const ProgressBar: FC<ProgressBarProps> = ({
  value,
  className = '',
  showLabel = false,
  label,
  color = 'blue',
}) => {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="mb-1 flex items-center justify-between">
          {label && (
            <span className={`text-sm font-medium ${labelColorClasses[color]}`}>
              {label}
            </span>
          )}
          {showLabel && (
            <span className={`text-sm font-medium ${labelColorClasses[color]}`}>
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-in-out ${colorClasses[color]}`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};
