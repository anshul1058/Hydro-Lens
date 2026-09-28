import React from 'react';
import { Check, SpinnerGap } from '@phosphor-icons/react';
import type { PipelineStep } from '../hooks/useAnalysis';

interface StepperProps {
  currentStep: PipelineStep;
}

const steps: { id: PipelineStep; label: string; desc: string }[] = [
  { id: 'preprocessing', label: '1. Preprocessing', desc: 'Median blur + CLAHE' },
  { id: 'inference', label: '2. Inference', desc: 'YOLOv8n candidate boxes' },
  { id: 'sizing', label: '3. Sizing', desc: 'Feret + ECD (µm)' },
  { id: 'confidence', label: '4. Confidence', desc: 'Sample score + safety flags' }
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
    <section
      aria-label="Analysis Pipeline Execution"
      className="w-full bg-surface border border-line rounded-md p-4 mb-6 shadow-xs"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" aria-hidden="true" />
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-accent">
            Inference Pipeline Running
          </p>
        </div>
        <span className="text-[12px] font-mono text-ink-3">
          Stage {Math.min(currentIndex + 1, 4)} of 4
        </span>
      </div>

      <ol className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {steps.map((step, idx) => {
          const isDone = currentIndex > idx || currentStep === 'complete';
          const isCurrent = currentIndex === idx;

          return (
            <li
              key={step.id}
              className={`p-3 rounded-sm border transition-colors duration-150 ${
                isDone
                  ? 'bg-ok-tint border-ok-border'
                  : isCurrent
                  ? 'bg-accent-tint border-accent'
                  : 'bg-sunken border-line'
              }`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-5 h-5 rounded-sm flex items-center justify-center text-[10.5px] font-mono font-semibold shrink-0 ${
                    isDone
                      ? 'bg-ok text-white'
                      : isCurrent
                      ? 'bg-accent text-white'
                      : 'bg-line-strong text-white'
                  }`}
                >
                  {isDone ? (
                    <Check size={12} weight="bold" />
                  ) : isCurrent ? (
                    <SpinnerGap size={12} className="animate-spin" />
                  ) : (
                    idx + 1
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-[12.5px] font-semibold truncate ${
                      isDone || isCurrent ? 'text-ink' : 'text-ink-3'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[11px] font-mono text-ink-3 truncate">{step.desc}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default Stepper;
