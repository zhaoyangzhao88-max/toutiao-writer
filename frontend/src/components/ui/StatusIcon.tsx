import React, { type FC } from 'react';

type Status =
  | 'pass'
  | 'warn'
  | 'fail'
  | 'pending'
  | 'active'
  | 'completed'
  | 'skipped';

interface StatusIconProps {
  status: Status;
  className?: string;
}

const statusMap: Record<Status, { emoji: string; label: string }> = {
  pass: { emoji: '✅', label: 'Pass' },
  warn: { emoji: '⚠️', label: 'Warning' },
  fail: { emoji: '❌', label: 'Fail' },
  pending: { emoji: '⚪', label: 'Pending' },
  active: { emoji: '\u{1F535}', label: 'Active' },
  completed: { emoji: '✅', label: 'Completed' },
  skipped: { emoji: '➖', label: 'Skipped' },
};

export const StatusIcon: FC<StatusIconProps> = ({ status, className = '' }) => {
  const { emoji, label } = statusMap[status];

  return (
    <span
      className={className}
      role="img"
      aria-label={label}
      title={label}
    >
      {emoji}
    </span>
  );
};
