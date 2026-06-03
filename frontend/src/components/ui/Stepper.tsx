import React, { type FC } from 'react';

type StepStatus = 'completed' | 'active' | 'pending' | 'skipped';

interface Step {
  label: string;
  status: StepStatus;
}

interface StepperProps {
  steps: Step[];
  className?: string;
}

const StepIcon: FC<{ status: StepStatus }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
          &#x2713;
        </span>
      );
    case 'active':
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-600 bg-white text-blue-600 text-xs font-bold">
          &#x25CF;
        </span>
      );
    case 'pending':
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 bg-white text-gray-300 text-xs">
          &#x25CB;
        </span>
      );
    case 'skipped':
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 bg-white text-gray-400 text-xs">
          &#x2014;
        </span>
      );
    default:
      return null;
  }
};

export const Stepper: FC<StepperProps> = ({ steps, className = '' }) => {
  if (steps.length === 0) return null;

  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          {/* Step */}
          <div className="flex flex-col items-center">
            <StepIcon status={step.status} />
            <span
              className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
                step.status === 'active'
                  ? 'text-blue-600'
                  : step.status === 'completed'
                  ? 'text-gray-700'
                  : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div className="mx-2 mb-5 h-0.5 flex-1 bg-gray-200">
              <div
                className={`h-full transition-[width] duration-500 ${
                  step.status === 'completed' ? 'w-full bg-blue-600' : 'w-0'
                }`}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
