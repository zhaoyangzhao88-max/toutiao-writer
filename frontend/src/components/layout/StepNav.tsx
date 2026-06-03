import React, { type FC } from 'react';
import { StatusIcon } from '../ui/StatusIcon';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { STEP_LABELS, PHASES } from '../../lib/constants';
import type { StepNumber, StepStatus } from '../../types/workflow';

const StepNav: FC = () => {
  const { currentStep, stepStatus, setCurrentStep } = useWorkflowStore();

  const getStatus = (step: number): StepStatus => {
    if (step === currentStep) return 'active';
    return (stepStatus[step] as StepStatus) || 'pending';
  };

  const completedCount = Object.values(stepStatus).filter(
    (s) => s === 'completed'
  ).length;

  const progressPct = Math.round((completedCount / 12) * 100);

  const stepButtonClass = (step: number): string => {
    const status = getStatus(step);
    const base =
      'flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200';

    if (status === 'active') {
      return base + ' bg-blue-50 text-blue-700 font-semibold shadow-sm';
    }
    if (status === 'completed') {
      return base + ' text-green-700 hover:bg-green-50';
    }
    if (status === 'skipped') {
      return base + ' text-gray-400 hover:bg-gray-50 line-through';
    }
    return base + ' text-gray-500 hover:bg-gray-100 hover:text-gray-700';
  };

  const stepNumberStyle = (step: number): string => {
    const status = getStatus(step);
    const base =
      'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold';

    if (status === 'active') return base + ' bg-blue-600 text-white';
    if (status === 'completed') return base + ' bg-green-500 text-white';
    if (status === 'skipped') return base + ' bg-gray-200 text-gray-400';
    return base + ' bg-gray-200 text-gray-400';
  };

  return (
    <nav className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
      {/* App title */}
      <div className="px-5 py-5 border-b border-gray-100">
        <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <span>✍️</span>
          <span>头条写作助手</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">12步结构化写作流程</p>
      </div>

      {/* Step list grouped by phase */}
      <div className="flex-1 px-3 py-4 space-y-5">
        {PHASES.map((phase) => (
          <div key={phase.name}>
            <div className="flex items-center gap-2 mb-2 px-3">
              <span
                className={'w-2 h-2 rounded-full ' + phase.color}
              />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {phase.name}
              </span>
            </div>
            <div className="space-y-0.5">
              {phase.steps.map((s) => {
                const label = STEP_LABELS[s as StepNumber];
                if (!label) return null;
                const status = getStatus(s);

                return (
                  <button
                    key={s}
                    type="button"
                    className={stepButtonClass(s)}
                    onClick={() => setCurrentStep(s as StepNumber)}
                  >
                    <span className={stepNumberStyle(s)}>
                      {s}
                    </span>
                    <span className="flex-1 truncate">
                      {label.label}
                    </span>
                    <StatusIcon
                      status={
                        status === 'active'
                          ? 'active'
                          : status === 'completed'
                            ? 'completed'
                            : status === 'skipped'
                              ? 'skipped'
                              : 'pending'
                      }
                      className="text-xs flex-shrink-0"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom progress bar */}
      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>完成进度</span>
          <span>
            {completedCount} / 12
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </nav>
  );
};

export default StepNav;
