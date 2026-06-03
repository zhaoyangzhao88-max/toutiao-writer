import React, { type FC } from 'react';
import AppShell from './components/layout/AppShell';
import Step1Material from './components/steps/Step1Material';
import Step2Guide from './components/steps/Step2Guide';
import Step3Extract from './components/steps/Step3Extract';
import Step4Deconstruct from './components/steps/Step4Deconstruct';
import Step5Titles from './components/steps/Step5Titles';
import Step6Editor from './components/steps/Step6Editor';
import Step7Diagnosis from './components/steps/Step7Diagnosis';
import Step8Hook from './components/steps/Step8Hook';
import Step9AiCheck from './components/steps/Step9AiCheck';
import Step10Images from './components/steps/Step10Images';
import Step11Export from './components/steps/Step11Export';
import Step12Preview from './components/steps/Step12Preview';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { useWorkflowStore } from './store/useWorkflowStore';
import { STEP_LABELS } from './lib/constants';
import type { StepNumber } from './types/workflow';

const PlaceholderStep: FC<{ step: StepNumber }> = ({ step }) => {
  const { goNext, goPrev } = useWorkflowStore();
  const info = STEP_LABELS[step];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="text-5xl mb-4">🚧</div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {info.label}
        </h2>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Badge variant="default">步骤 {step}</Badge>
          <Badge variant="info">{info.phase}</Badge>
        </div>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          {info.description}
        </p>
      </div>

      <Card padding="lg">
        <div className="text-center space-y-3">
          <p className="text-gray-600 text-sm">
            此步骤尚未实现，将在后续开发中完成
          </p>
          <p className="text-gray-400 text-xs">
            当前占位组件显示步骤信息，实际内容将在对应 Agent 任务中实现
          </p>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="md" onClick={goPrev}>
          上一步
        </Button>
        <Button variant="primary" size="md" onClick={goNext}>
          下一步
        </Button>
      </div>
    </div>
  );
};

const App: FC = () => {
  const { currentStep } = useWorkflowStore();

  const renderStep = (): React.ReactNode => {
    switch (currentStep) {
      case 1:
        return <Step1Material />;
      case 2:
        return <Step2Guide />;
      case 3:
        return <Step3Extract />;
      case 4:
        return <Step4Deconstruct />;
      case 5:
        return <Step5Titles />;
      case 6:
        return <Step6Editor />;
      case 7:
        return <Step7Diagnosis />;
      case 8:
        return <Step8Hook />;
      case 9:
        return <Step9AiCheck />;
      case 10:
        return <Step10Images />;
      case 11:
        return <Step11Export />;
      case 12:
        return <Step12Preview />;
      default:
        return <PlaceholderStep step={1} />;
    }
  };

  return (
    <AppShell>
      {renderStep()}
    </AppShell>
  );
};

export default App;
