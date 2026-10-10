/**
 * HydroLens — Microscope Image Quality Assessment Engine
 * 
 * Provides automated, client-side optical image quality evaluation for microscope
 * and microplastic screening micrographs using HTML5 Canvas pixel analytics.
 * 
 * SCIENTIFIC HEURISTICS AND LIMITATIONS:
 * 1. These indicators (Laplacian focus variance, luminance distribution, contrast standard
 *    deviation, regional illumination grids, and high-frequency noise residual) are preliminary
 *    optical heuristics, NOT a validated microplastic detector.
 * 2. Ordinary browser-side statistics cannot determine whether a particle is polymer vs organic
 *    debris or detect particle-background overlap when optical contrast is insufficient.
 * 3. Thresholds are configurable below.
 */

export type QualityCondition =
  | 'BLURRED'
  | 'OVEREXPOSED'
  | 'UNDEREXPOSED'
  | 'LOW_CONTRAST'
  | 'UNEVEN_ILLUMINATION'
  | 'NOISY'
  | 'ACCEPTABLE'
  | 'UNABLE_TO_ASSESS';

export type QualitySeverity = 'CRITICAL' | 'WARNING' | 'ACCEPTABLE' | 'UNKNOWN';

export interface QualityMetrics {
  width: number;
  height: number;
  aspectRatio: number;
  meanBrightness: number;        // 0 - 255
  clippedBrightPct: number;      // Fraction of pixels >= 248 (0.0 - 1.0)
  clippedDarkPct: number;        // Fraction of pixels <= 12 (0.0 - 1.0)
  contrastStdDev: number;        // Standard deviation of luminance
  blurScore: number;             // Variance of discrete 2D Laplacian operator
  unevenIlluminationRatio: number;// Max-to-min regional disparity ratio
  noiseScore: number;            // High-frequency noise standard deviation
  processingTimeMs: number;
}

export interface QualityAssessmentResult {
  condition: QualityCondition;
  severity: QualitySeverity;
  title: string;
  message: string;
  recommendedAction: string;
  metrics: QualityMetrics;
  canProceed: boolean;           // False if severe issue blocks standard screening
  isSevere: boolean;
  timestamp: string;
}

export interface QualityThresholds {
  blurCritical: number;          // Below this: severe blur (< 42)
  blurWarning: number;           // Below this: moderate blur (< 75)
  brightnessOverexposedCritical: number; // > 230 or > 35% clipped
  brightnessOverexposedWarning: number;  // > 212 or > 20% clipped
  brightnessUnderexposedCritical: number;// < 28 or > 40% clipped
  brightnessUnderexposedWarning: number; // < 45 or > 25% clipped
  contrastLowCritical: number;   // < 14
  contrastLowWarning: number;    // < 22
  unevenIlluminationWarning: number; // > 0.45 relative disparity
  noiseScoreWarning: number;     // > 14.5
}

export const DEFAULT_QUALITY_THRESHOLDS: QualityThresholds = {
  blurCritical: 42.0,
  blurWarning: 75.0,
  brightnessOverexposedCritical: 230.0,
  brightnessOverexposedWarning: 212.0,
  brightnessUnderexposedCritical: 28.0,
  brightnessUnderexposedWarning: 45.0,
  contrastLowCritical: 14.0,
  contrastLowWarning: 22.0,
  unevenIlluminationWarning: 0.48,
  noiseScoreWarning: 14.5
};

export const QUALITY_MESSAGES: Record<QualityCondition, { title: string; message: string; action: string }> = {
  BLURRED: {
    title: 'Image Out of Focus / Blurred',
    message: 'Your image appears blurred. Please upload a sharper microscope image with particles clearly in focus.',
    action: 'Refocus the microscope objective and capture a sharper field of view before screening.'
  },
  OVEREXPOSED: {
    title: 'Excessive Illumination / Overexposed',
    message: 'Your image appears too bright or overexposed. Please reduce the illumination or exposure and capture the image again.',
    action: 'Lower the light source intensity or shorten camera exposure time to prevent sensor clipping.'
  },
  UNDEREXPOSED: {
    title: 'Insufficient Illumination / Underexposed',
    message: 'Your image appears too dark. Please increase illumination or exposure slightly and capture the image again.',
    action: 'Increase condenser illumination or adjust camera exposure time to improve particle contrast.'
  },
  LOW_CONTRAST: {
    title: 'Low Particle-to-Background Contrast',
    message: 'Microplastic particles may be blending into the background. Please adjust the microscope focus and lighting to improve particle visibility.',
    action: 'Adjust darkfield / polarized illumination, diaphragm aperture, or filter background to improve particle edge definition.'
  },
  UNEVEN_ILLUMINATION: {
    title: 'Uneven Field Illumination',
    message: 'The image has uneven lighting. Please adjust the microscope illumination to achieve more uniform brightness.',
    action: 'Center and align the microscope condenser (Köhler illumination) to achieve homogeneous field lighting.'
  },
  NOISY: {
    title: 'Excessive Sensor Noise / Grain',
    message: 'The image contains noticeable noise or grain. Please check the image acquisition settings and capture a clearer image.',
    action: 'Lower digital sensor gain / ISO and use adequate illumination to prevent noisy artifacts.'
  },
  ACCEPTABLE: {
    title: 'Quality Acceptable for Screening',
    message: 'The image passed the available quality checks. You can proceed with analysis, although image quality checks do not guarantee accurate particle detection.',
    action: 'Optical quality is sufficient for morphological candidate screening.'
  },
  UNABLE_TO_ASSESS: {
    title: 'Unable to Assess Image Quality',
    message: 'We could not reliably assess this image. Please try another supported microscope image or continue only if the application permits.',
    action: 'Verify that the file is an undamaged image format (PNG, JPG, TIFF) and try again.'
  }
};

/**
 * Loads an HTMLImageElement safely from a File object or URL
 */
function loadImageSource(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl: string | null = null;
    if (source instanceof File) {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    } else {
      img.src = source;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to decode image: ${err}`));
    };
  });
}

/**
 * Evaluates image quality by analyzing pixel luminance, gradients, and distribution
 */
export async function assessImageQuality(
  source: File | string,
  thresholds: QualityThresholds = DEFAULT_QUALITY_THRESHOLDS
): Promise<QualityAssessmentResult> {
  const startTime = performance.now();

  let img: HTMLImageElement;
  try {
    img = await loadImageSource(source);
  } catch (error) {
    console.warn('Image quality assessment decoding failure:', error);
    return {
      condition: 'UNABLE_TO_ASSESS',
      severity: 'UNKNOWN',
      title: QUALITY_MESSAGES.UNABLE_TO_ASSESS.title,
      message: QUALITY_MESSAGES.UNABLE_TO_ASSESS.message,
      recommendedAction: QUALITY_MESSAGES.UNABLE_TO_ASSESS.action,
      metrics: {
        width: 0,
        height: 0,
        aspectRatio: 1,
        meanBrightness: 0,
        clippedBrightPct: 0,
        clippedDarkPct: 0,
        contrastStdDev: 0,
        blurScore: 0,
        unevenIlluminationRatio: 0,
        noiseScore: 0,
        processingTimeMs: Math.round(performance.now() - startTime)
      },
      canProceed: true, // Allow user override if check is unavailable
      isSevere: false,
      timestamp: new Date().toISOString()
    };
  }

  const rawWidth = img.naturalWidth || img.width;
  const rawHeight = img.naturalHeight || img.height;

  if (rawWidth === 0 || rawHeight === 0) {
    return {
      condition: 'UNABLE_TO_ASSESS',
      severity: 'UNKNOWN',
      title: QUALITY_MESSAGES.UNABLE_TO_ASSESS.title,
      message: QUALITY_MESSAGES.UNABLE_TO_ASSESS.message,
      recommendedAction: QUALITY_MESSAGES.UNABLE_TO_ASSESS.action,
      metrics: {
        width: rawWidth,
        height: rawHeight,
        aspectRatio: 1,
        meanBrightness: 0,
        clippedBrightPct: 0,
        clippedDarkPct: 0,
        contrastStdDev: 0,
        blurScore: 0,
        unevenIlluminationRatio: 0,
        noiseScore: 0,
        processingTimeMs: Math.round(performance.now() - startTime)
      },
      canProceed: true,
      isSevere: false,
      timestamp: new Date().toISOString()
    };
  }

  // Target normalized analysis size (max 512px on longer dimension for 60fps fast non-blocking evaluation)
  const maxDim = 512;
  const scale = Math.min(1.0, maxDim / Math.max(rawWidth, rawHeight));
  const targetW = Math.max(32, Math.round(rawWidth * scale));
  const targetH = Math.max(32, Math.round(rawHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    return {
      condition: 'UNABLE_TO_ASSESS',
      severity: 'UNKNOWN',
      title: QUALITY_MESSAGES.UNABLE_TO_ASSESS.title,
      message: QUALITY_MESSAGES.UNABLE_TO_ASSESS.message,
      recommendedAction: QUALITY_MESSAGES.UNABLE_TO_ASSESS.action,
      metrics: {
        width: rawWidth,
        height: rawHeight,
        aspectRatio: rawWidth / rawHeight,
        meanBrightness: 0,
        clippedBrightPct: 0,
        clippedDarkPct: 0,
        contrastStdDev: 0,
        blurScore: 0,
        unevenIlluminationRatio: 0,
        noiseScore: 0,
        processingTimeMs: Math.round(performance.now() - startTime)
      },
      canProceed: true,
      isSevere: false,
      timestamp: new Date().toISOString()
    };
  }

  ctx.drawImage(img, 0, 0, targetW, targetH);
  const imgData = ctx.getImageData(0, 0, targetW, targetH);
  const data = imgData.data;
  const numPixels = targetW * targetH;

  // 1. Grayscale luminance buffer
  const gray = new Float32Array(numPixels);
  let luminanceSum = 0;
  let clippedBrightCount = 0;
  let clippedDarkCount = 0;

  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    // Standard perceptual luminance ITU-R BT.601
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[i] = lum;
    luminanceSum += lum;

    if (lum >= 248) clippedBrightCount++;
    if (lum <= 12) clippedDarkCount++;
  }

  const meanBrightness = luminanceSum / numPixels;
  const clippedBrightPct = clippedBrightCount / numPixels;
  const clippedDarkPct = clippedDarkCount / numPixels;

  // 2. Contrast: Standard deviation of luminance
  let varianceSum = 0;
  for (let i = 0; i < numPixels; i++) {
    const diff = gray[i] - meanBrightness;
    varianceSum += diff * diff;
  }
  const contrastStdDev = Math.sqrt(varianceSum / numPixels);

  // 3. Blur / Focus measure: Discrete 2D Laplacian operator variance
  // Kernel: [ 0,  1,  0 ]
  //         [ 1, -4,  1 ]
  //         [ 0,  1,  0 ]
  let laplacianSum = 0;
  let laplacianSqSum = 0;
  let laplacianCount = 0;

  for (let y = 1; y < targetH - 1; y++) {
    const rowOffset = y * targetW;
    const prevRow = (y - 1) * targetW;
    const nextRow = (y + 1) * targetW;

    for (let x = 1; x < targetW - 1; x++) {
      const center = gray[rowOffset + x];
      const lap =
        gray[prevRow + x] +
        gray[nextRow + x] +
        gray[rowOffset + x - 1] +
        gray[rowOffset + x + 1] -
        4.0 * center;

      laplacianSum += lap;
      laplacianSqSum += lap * lap;
      laplacianCount++;
    }
  }

  const meanLap = laplacianCount > 0 ? laplacianSum / laplacianCount : 0;
  const blurScore =
    laplacianCount > 0 ? Math.max(0, laplacianSqSum / laplacianCount - meanLap * meanLap) : 0;

  // 4. Uneven illumination: 3x3 Regional Grid luminance analysis
  const gridRows = 3;
  const gridCols = 3;
  const regionalMeans: number[] = [];

  const cellW = Math.floor(targetW / gridCols);
  const cellH = Math.floor(targetH / gridRows);

  for (let gy = 0; gy < gridRows; gy++) {
    for (let gx = 0; gx < gridCols; gx++) {
      let regSum = 0;
      let regCount = 0;
      const startX = gx * cellW;
      const endX = gx === gridCols - 1 ? targetW : (gx + 1) * cellW;
      const startY = gy * cellH;
      const endY = gy === gridRows - 1 ? targetH : (gy + 1) * cellH;

      for (let y = startY; y < endY; y++) {
        const row = y * targetW;
        for (let x = startX; x < endX; x++) {
          regSum += gray[row + x];
          regCount++;
        }
      }
      regionalMeans.push(regCount > 0 ? regSum / regCount : meanBrightness);
    }
  }

  const minRegion = Math.min(...regionalMeans);
  const maxRegion = Math.max(...regionalMeans);
  const unevenIlluminationRatio =
    (maxRegion - minRegion) / Math.max(meanBrightness, 15.0);

  // 5. Image Noise score: Local residual variance from 3x3 mean
  let residualSqSum = 0;
  let residualCount = 0;

  for (let y = 1; y < targetH - 1; y += 2) {
    const rO = y * targetW;
    const rP = (y - 1) * targetW;
    const rN = (y + 1) * targetW;

    for (let x = 1; x < targetW - 1; x += 2) {
      const localAvg =
        (gray[rP + x - 1] + gray[rP + x] + gray[rP + x + 1] +
         gray[rO + x - 1] + gray[rO + x] + gray[rO + x + 1] +
         gray[rN + x - 1] + gray[rN + x] + gray[rN + x + 1]) / 9.0;
      const res = gray[rO + x] - localAvg;
      residualSqSum += res * res;
      residualCount++;
    }
  }
  const noiseScore = residualCount > 0 ? Math.sqrt(residualSqSum / residualCount) : 0;

  const processingTimeMs = Math.round(performance.now() - startTime);

  const metrics: QualityMetrics = {
    width: rawWidth,
    height: rawHeight,
    aspectRatio: Number((rawWidth / Math.max(rawHeight, 1)).toFixed(2)),
    meanBrightness: Number(meanBrightness.toFixed(1)),
    clippedBrightPct: Number((clippedBrightPct * 100).toFixed(1)),
    clippedDarkPct: Number((clippedDarkPct * 100).toFixed(1)),
    contrastStdDev: Number(contrastStdDev.toFixed(1)),
    blurScore: Number(blurScore.toFixed(1)),
    unevenIlluminationRatio: Number(unevenIlluminationRatio.toFixed(2)),
    noiseScore: Number(noiseScore.toFixed(1)),
    processingTimeMs
  };

  // Condition evaluation hierarchy (Most critical optical defect takes precedence)
  let condition: QualityCondition = 'ACCEPTABLE';
  let severity: QualitySeverity = 'ACCEPTABLE';
  let canProceed = true;
  let isSevere = false;

  // 1. Extreme overexposure / clipping (prevents particle detection completely)
  if (
    meanBrightness > thresholds.brightnessOverexposedCritical ||
    clippedBrightPct > 0.35
  ) {
    condition = 'OVEREXPOSED';
    severity = 'CRITICAL';
    isSevere = true;
    canProceed = false;
  }
  // 2. Extreme underexposure / total dark
  else if (
    meanBrightness < thresholds.brightnessUnderexposedCritical ||
    clippedDarkPct > 0.45
  ) {
    condition = 'UNDEREXPOSED';
    severity = 'CRITICAL';
    isSevere = true;
    canProceed = false;
  }
  // 3. Severe blur / out of focus
  else if (blurScore < thresholds.blurCritical) {
    condition = 'BLURRED';
    severity = 'CRITICAL';
    isSevere = true;
    canProceed = false;
  }
  // 4. Moderate overexposure
  else if (
    meanBrightness > thresholds.brightnessOverexposedWarning ||
    clippedBrightPct > 0.20
  ) {
    condition = 'OVEREXPOSED';
    severity = 'WARNING';
    canProceed = true; // Advisory warning, does not strictly block
  }
  // 5. Moderate underexposure
  else if (
    meanBrightness < thresholds.brightnessUnderexposedWarning ||
    clippedDarkPct > 0.25
  ) {
    condition = 'UNDEREXPOSED';
    severity = 'WARNING';
    canProceed = true;
  }
  // 6. Moderate blur
  else if (blurScore < thresholds.blurWarning) {
    condition = 'BLURRED';
    severity = 'WARNING';
    canProceed = true;
  }
  // 7. Low contrast (particles blend into background)
  else if (contrastStdDev < thresholds.contrastLowCritical) {
    condition = 'LOW_CONTRAST';
    severity = 'CRITICAL';
    isSevere = true;
    canProceed = false;
  } else if (contrastStdDev < thresholds.contrastLowWarning) {
    condition = 'LOW_CONTRAST';
    severity = 'WARNING';
    canProceed = true;
  }
  // 8. Uneven illumination
  else if (unevenIlluminationRatio > thresholds.unevenIlluminationWarning) {
    condition = 'UNEVEN_ILLUMINATION';
    severity = 'WARNING';
    canProceed = true;
  }
  // 9. Excessive noise
  else if (noiseScore > thresholds.noiseScoreWarning && contrastStdDev < 35.0) {
    condition = 'NOISY';
    severity = 'WARNING';
    canProceed = true;
  }

  const { title, message, action } = QUALITY_MESSAGES[condition];

  return {
    condition,
    severity,
    title,
    message,
    recommendedAction: action,
    metrics,
    canProceed,
    isSevere,
    timestamp: new Date().toISOString()
  };
}
