import React, { type FC, type ReactNode } from 'react';
import StepNav from './StepNav';
import { Badge } from '../ui/Badge';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { STEP_LABELS } from '../../lib/constants';
import type { StepNumber } from '../../types/workflow';

interface AppShellProps {
  children: ReactNode;
}

const PHASE_COLORS: Record<string, string> = {
  '分析与增补': 'info',
  '写作': 'default',
  '暂停诊断': 'warning',
  '优化': 'default',
  '交付': 'success',
} as const;

const AppShell: FC<AppShellProps> = ({ children }) => {
  const { currentStep, stepStatus } = useWorkflowStore();

  const completedCount = Object.values(stepStatus).filter(
    (s) => s === 'completed'
  ).length;
  const progressPct = Math.round((completedCount / 12) * 100);
  const stepInfo = STEP_LABELS[currentStep as StepNumber];

  const phaseBadgeVariant =
    (PHASE_COLORS[stepInfo?.phase || ''] as
      | 'info'
      | 'default'
      | 'warning'
      | 'success'
      | 'danger') || 'default';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Left sidebar */}
      <StepNav />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                步骤 {currentStep} / 12
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-sm font-semibold text-gray-900">
                {stepInfo?.label || ''}
              </span>
            </div>
            <Badge variant={phaseBadgeVariant}>
              {stepInfo?.phase || ''}
            </Badge>
          </div>

          {/* Right side: overall progress */}
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                总进度 {completedCount}/12
              </span>
              <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
