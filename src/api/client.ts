import type {
  CalibrationStatusResponse,
  ReferenceItem,
  AnalyzeResponse,
  FactorFftResponse,
  FactorManualRequest,
  FactorManualResponse,
  CalibrationSaveRequest,
  DiagnosticsResponse,
  ConcentrationRequest,
  ConcentrationResponse,
  ApiErrorPayload
} from './types';

const BASE_URL = ''; // Uses Vite proxy when empty or '/api'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorPayload: ApiErrorPayload;
    try {
      errorPayload = await res.json();
    } catch {
      errorPayload = {
        error: {
          code: `HTTP_${res.status}`,
          message: res.statusText || 'An unexpected error occurred on the server.'
        }
      };
    }
    const message = errorPayload.error?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function getHealth(): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/api/health`);
  return handleResponse<{ status: string }>(res);
}

export async function getCalibration(): Promise<CalibrationStatusResponse> {
  const res = await fetch(`${BASE_URL}/api/calibration`);
  return handleResponse<CalibrationStatusResponse>(res);
}

export async function getReferences(): Promise<ReferenceItem[]> {
  const res = await fetch(`${BASE_URL}/api/references`);
  return handleResponse<ReferenceItem[]>(res);
}

export async function analyzeSample(
  file?: File | null,
  referenceId?: string | null
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  if (referenceId) {
    formData.append('reference_id', referenceId);
  }

  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    body: formData
  });
  return handleResponse<AnalyzeResponse>(res);
}

export async function computeFactorFft(
  file: File,
  knownSpacingUm: number = 10.0
): Promise<FactorFftResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('known_spacing_um', knownSpacingUm.toString());

  const res = await fetch(`${BASE_URL}/api/calibration/factor-fft`, {
    method: 'POST',
    body: formData
  });
  return handleResponse<FactorFftResponse>(res);
}

export async function computeFactorManual(
  payload: FactorManualRequest
): Promise<FactorManualResponse> {
  const res = await fetch(`${BASE_URL}/api/calibration/factor-manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse<FactorManualResponse>(res);
}

export async function saveCalibration(
  payload: CalibrationSaveRequest
): Promise<CalibrationStatusResponse> {
  const res = await fetch(`${BASE_URL}/api/calibration/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse<CalibrationStatusResponse>(res);
}

export async function getDiagnostics(): Promise<DiagnosticsResponse> {
  const res = await fetch(`${BASE_URL}/api/diagnostics`);
  return handleResponse<DiagnosticsResponse>(res);
}

export async function calculateConcentration(
  payload: ConcentrationRequest
): Promise<ConcentrationResponse> {
  const res = await fetch(`${BASE_URL}/api/concentration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse<ConcentrationResponse>(res);
}
