import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { PipelineStep } from '../hooks/useAnalysis';

interface StepperProps {
  currentStep: PipelineStep;
}

const steps: { id: PipelineStep; label: string }[] = [
  { id: 'preprocessing', label: 'Preprocessing' },
  { id: 'inference', label: 'Inference' },
  { id: 'sizing', label: 'Sizing' },
  { id: 'confidence', label: 'Confidence' },
];

export const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  const getStepIndex = (step: PipelineStep): number => {
    switch (step) {
      case 'preprocessing':
        return 0;
      case 'inference':
        return 1;
      case 'sizing':
        return 2;
      case 'confidence':
        return 3;
      case 'complete':
        return 4;
      default:
        return -1;
    }
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="w-full bg-white rounded-2xl border border-[#9ecae1] p-4 shadow-[0_4px_20px_rgba(74,144,217,0.06)] mb-6">
      <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
        {steps.map((step, idx) => {
          const isDone = currentIndex > idx || currentStep === 'complete';
          const isCurrent = currentIndex === idx;

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all ${
                    isDone
                      ? 'bg-[#2ECC91] text-white'
                      : isCurrent
                      ? 'bg-[#4a90d9] text-white shadow-xs animate-pulse'
                      : 'bg-[#eff3ff] text-[#6b7a90] border border-[#D0DCE8]'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`text-[13px] font-semibold ${
                    isDone || isCurrent ? 'text-[#1E2A38]' : 'text-[#6b7a90]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 transition-all ${
                    currentIndex > idx ? 'bg-[#2ECC91]' : 'bg-[#D0DCE8]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
