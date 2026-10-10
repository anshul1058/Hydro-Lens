import React from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import type { PipelineStep } from '../hooks/useAnalysis';

interface StepperProps {
  currentStep: PipelineStep;
}

<<<<<<< HEAD
const steps: { id: PipelineStep; label: string; desc: string }[] = [
  { id: 'preprocessing', label: 'Preprocessing', desc: 'Median + CLAHE' },
  { id: 'inference', label: 'Inference', desc: 'YOLOv8 Detection' },
  { id: 'sizing', label: 'Sizing', desc: 'Feret + ECD µm' },
  { id: 'confidence', label: 'Confidence', desc: 'Safety Scoring' }
=======
const steps: { id: PipelineStep; label: string }[] = [
  { id: 'preprocessing', label: 'Preprocessing' },
  { id: 'inference', label: 'Inference' },
  { id: 'sizing', label: 'Sizing' },
  { id: 'confidence', label: 'Confidence' },
>>>>>>> origin/main
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
<<<<<<< HEAD
    <div className="w-full bg-white/95 backdrop-blur-[20px] rounded-[18px] border border-[#BBE4F2] p-5 shadow-[0_4px_20px_rgba(8,145,178,0.08)] mb-6 transition-all">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center space-x-2 text-[12px] font-bold uppercase tracking-wider text-[#0891B2]">
          <Sparkles className="w-4 h-4 animate-spin text-[#06B6D4]" style={{ animationDuration: '4s' }} />
          <span>AI Computer-Vision Screening Pipeline Active</span>
        </div>
        <span className="text-[12px] font-mono text-[#4A7F96]">
          Step {Math.min(currentIndex + 1, 4)} of 4
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
=======
    <div className="w-full bg-white rounded-2xl border border-[#9ecae1] p-4 shadow-[0_4px_20px_rgba(74,144,217,0.06)] mb-6">
      <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
>>>>>>> origin/main
        {steps.map((step, idx) => {
          const isDone = currentIndex > idx || currentStep === 'complete';
          const isCurrent = currentIndex === idx;

          return (
            <div
              key={step.id}
              className={`p-3 rounded-xl border transition-all ${
                isDone
                  ? 'bg-[#E6FBF2]/60 border-[#10B981]/30 text-[#059669]'
                  : isCurrent
                  ? 'bg-gradient-to-br from-[#EAF7FC] to-[#F0FAFE] border-[#0891B2] shadow-[0_0_16px_rgba(6,182,212,0.2)] text-[#0284C7]'
                  : 'bg-slate-50/50 border-slate-200/60 text-[#56889E] opacity-60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div
<<<<<<< HEAD
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-all ${
                    isDone
                      ? 'bg-[#10B981] text-white shadow-xs'
                      : isCurrent
                      ? 'bg-gradient-to-br from-[#0284C7] to-[#0891B2] text-white shadow-sm shadow-cyan-500/30'
                      : 'bg-[#BBE4F2]/50 text-[#56889E]'
=======
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all ${
                    isDone
                      ? 'bg-[#2ECC91] text-white'
                      : isCurrent
                      ? 'bg-[#4a90d9] text-white shadow-xs animate-pulse'
                      : 'bg-[#eff3ff] text-[#6b7a90] border border-[#D0DCE8]'
>>>>>>> origin/main
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
<<<<<<< HEAD
                <div className="truncate">
                  <p className={`text-[12.5px] font-bold truncate ${isDone || isCurrent ? 'text-[#0A2540]' : 'text-[#56889E]'}`}>
                    {step.label}
                  </p>
                  <p className="text-[10.5px] font-mono text-[#4A7F96] truncate">
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
=======
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
>>>>>>> origin/main
          );
        })}
      </div>
    </div>
  );
};
