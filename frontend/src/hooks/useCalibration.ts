import { useState, useEffect, useCallback } from 'react';
import { getCalibration } from '../api/client';
import type { CalibrationStatusResponse } from '../api/types';

export function useCalibration() {
  const [calibrationStatus, setCalibrationStatus] = useState<CalibrationStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalibration = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCalibration();
      setCalibrationStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calibration status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalibration();
  }, [fetchCalibration]);

  return {
    calibrationStatus,
    loading,
    error,
    refetch: fetchCalibration
  };
}
