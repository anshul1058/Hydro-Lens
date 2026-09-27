import { useState, useCallback } from 'react';
import { analyzeSample } from '../api/client';
import type { AnalyzeResponse } from '../api/types';

export type PipelineStep = 'idle' | 'preprocessing' | 'inference' | 'sizing' | 'confidence' | 'complete';

export function useAnalysis() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<PipelineStep>('idle');
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async (file?: File | null, referenceId?: string | null) => {
    if (!file && !referenceId) {
      setError('Please select an image file or a demo reference sample.');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('preprocessing');

    // Simulate smooth pipeline stepper progression while waiting for API response
    const stepperTimer1 = setTimeout(() => setStep('inference'), 300);
    const stepperTimer2 = setTimeout(() => setStep('sizing'), 800);
    const stepperTimer3 = setTimeout(() => setStep('confidence'), 1200);

    try {
      const data = await analyzeSample(file, referenceId);
      setResult(data);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sample analysis failed.');
      setStep('idle');
    } finally {
      clearTimeout(stepperTimer1);
      clearTimeout(stepperTimer2);
      clearTimeout(stepperTimer3);
      setLoading(false);
    }
  }, []);

  return {
    result,
    loading,
    step,
    error,
    runAnalysis,
    resetAnalysis: () => {
      setResult(null);
      setError(null);
      setStep('idle');
    }
  };
}
