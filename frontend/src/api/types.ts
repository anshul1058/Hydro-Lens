export interface SizePx {
  feret_max: number;
  feret_min: number;
  ecd: number;
  area: number;
  aspect_ratio: number;
}

export interface SizeUm {
  feret_max: number | null;
  feret_min: number | null;
  ecd: number | null;
  aspect_ratio: number;
}

export interface Detection {
  id: number;
  bbox_px: [number, number, number, number];
  bbox_xyxy: [number, number, number, number];
  confidence: number;
  class_id: number;
  class_name: string;
  size_px?: SizePx;
  size_um?: SizeUm;
  needs_lab_confirmation?: boolean;
  lab_confirmation_reasons?: string[];
}

export interface CalibrationValidationItem {
  nominal: number;
  measured: number | null;
  error_pct: number;
  status: 'PASS' | 'WARN' | 'FAIL';
}

export interface CalibrationRecord {
  version?: string;
  timestamp?: string;
  expires?: string;
  microscope?: string;
  camera?: string;
  magnification?: string;
  factor_um_per_px?: number;
  validation?: Record<string, CalibrationValidationItem>;
  valid?: boolean;
  quality_score?: number;
}

export interface CalibrationStatusResponse {
  record: CalibrationRecord | null;
  is_valid: boolean;
  reason: string;
  quality: number; // 1.0 valid / 0.5 stale / 0.0 missing
}

export interface ReferenceItem {
  id: string;
  label: string;
  url: string;
}

export interface FlagItem {
  type: string;
  message: string;
  particle_ids?: number[];
  classes?: string[];
}

export interface Breakdown {
  mean_detection_confidence: number;
  calibration_quality: number;
  coverage_factor: number;
  imaged_area_mm2: number;
}

export interface ReportJson {
  schema_version: string;
  sample_id: string;
  timestamp: string;
  calibration: {
    factor_um_per_px: number | null;
    valid: boolean;
    date: string;
  };
  image_meta: {
    original_shape: [number, number];
  };
  detections: Array<{
    id: number;
    class: string;
    confidence: number;
    bbox_px: [number, number, number, number];
    size_um?: SizeUm;
    needs_lab_confirmation: boolean;
  }>;
  summary: {
    total_count: number;
    sample_confidence: number;
    flag_lab_confirmation: boolean;
    size_distribution: Record<string, number>;
    imaged_area_mm2: number;
  };
}

export interface AnalyzeImages {
  original: string;
  preprocessed: string;
  annotated: string;
}

export interface AnalyzeResponse {
  sample_id: string;
  latency_sec: number;
  total_count: number;
  sample_confidence: number;
  flag_lab_confirmation: boolean;
  size_distribution_um: Record<string, number>;
  imaged_area_mm2: number;
  flags: FlagItem[];
  breakdown: Breakdown;
  detections: Detection[];
  report: ReportJson;
  images: AnalyzeImages;
  detector_fallback: boolean;
  detector_load_error: string | null;
}

export interface FactorFftResponse {
  factor_um_per_px: number;
}

export interface FactorManualRequest {
  pixel_distance: number;
  num_divisions: number;
  known_spacing_um: number;
}

export interface FactorManualResponse {
  factor_um_per_px: number;
}

export interface CalibrationSaveRequest {
  factor_um_per_px: number;
  magnification?: string;
  camera?: string;
  microscope?: string;
  measured_beads: [number, number, number];
}

export interface DiagnosticsClassItem {
  name: string;
  description: string;
  count: number;
}

export interface DiagnosticsLimitationItem {
  id: number;
  title: string;
  detail: string;
}

export interface DiagnosticsModelInfo {
  name: string;
  version: string;
  architecture: string;
  framework: string;
  parameters: string;
  model_size: string;
  input_resolution: string;
  latency: string;
  status: string;
}

export interface DiagnosticsResponse {
  model_info: DiagnosticsModelInfo;
  classes: DiagnosticsClassItem[];
  limitations: DiagnosticsLimitationItem[];
}

export interface ConcentrationRequest {
  total_count: number;
  imaged_area_mm2: number;
  sample_volume_ml: number;
  dilution_factor: number;
}

export interface ConcentrationResponse {
  concentration: number | null;
  blocked: boolean;
  message: string;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    detail?: unknown;
  };
}
