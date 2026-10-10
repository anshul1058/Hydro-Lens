import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  FileImage
} from 'lucide-react';
import type { QualityAssessmentResult } from '../utils/imageQuality';

interface ImageQualityAssessmentProps {
  assessment: QualityAssessmentResult | null;
  loading: boolean;
  filename: string;
  fileSizeText?: string;
  onReplaceImage?: () => void;
  onRecheck?: () => void;
  allowSevereOverride: boolean;
  onToggleOverride?: (val: boolean) => void;
}

export const ImageQualityAssessment: React.FC<ImageQualityAssessmentProps> = ({
  assessment,
  loading,
  filename,
  fileSizeText,
  onReplaceImage,
  onRecheck,
  allowSevereOverride,
  onToggleOverride
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // 1. Loading State
  if (loading) {
    return (
      <div className="p-4 rounded-[18px] bg-gradient-to-r from-white/95 via-[#EAF7FC]/80 to-white/95 border border-[#BBE4F2] shadow-xs space-y-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <RefreshCw className="w-4 h-4 text-[#0891B2] animate-spin" />
            <span className="text-[13px] font-bold text-[#0A2540]">
              Assessing Microscope Image Quality...
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#0891B2] font-semibold bg-[#EAF7FC] px-2.5 py-0.5 rounded-full border border-[#0891B2]/20">
            Real-time Heuristics
          </span>
        </div>
        <p className="text-[11.5px] text-[#4A7F96]">
          Calculating focus energy (Laplacian variance), luminance distribution, contrast dynamic range, and field uniformity...
        </p>
      </div>
    );
  }

  // 2. No assessment yet
  if (!assessment) {
    return null;
  }

  const { condition, severity, title, message, recommendedAction, metrics, isSevere } = assessment;

  // Visual Theme mapping based on severity
  let bannerBg = 'bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90';
  let bannerBorder = 'border-emerald-300';
  let bannerText = 'text-emerald-950';
  let badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let iconComponent = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />;

  if (severity === 'CRITICAL') {
    bannerBg = 'bg-gradient-to-r from-rose-50/95 via-red-50/75 to-rose-50/95';
    bannerBorder = 'border-rose-300';
    bannerText = 'text-rose-950';
    badgeBg = 'bg-rose-100 text-rose-800 border-rose-300';
    iconComponent = <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />;
  } else if (severity === 'WARNING') {
    bannerBg = 'bg-gradient-to-r from-amber-50/95 via-orange-50/75 to-amber-50/95';
    bannerBorder = 'border-amber-300';
    bannerText = 'text-amber-950';
    badgeBg = 'bg-amber-100 text-amber-800 border-amber-300';
    iconComponent = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />;
  } else if (condition === 'UNABLE_TO_ASSESS') {
    bannerBg = 'bg-gradient-to-r from-slate-50 via-slate-100/60 to-slate-50';
    bannerBorder = 'border-slate-300';
    bannerText = 'text-slate-900';
    badgeBg = 'bg-slate-200 text-slate-700 border-slate-300';
    iconComponent = <HelpCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />;
  }

  return (
    <div className={`p-4 rounded-[18px] border-2 ${bannerBorder} ${bannerBg} shadow-xs space-y-3.5 transition-all`}>
      {/* Header bar with Status Badge and Diagnostics Trigger */}
      <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-2.5">
        <div className="flex items-center space-x-2">
          {iconComponent}
          <div>
            <h4 className={`text-[13.5px] font-extrabold ${bannerText} leading-snug`}>
              {title}
            </h4>
            <span className="text-[10px] font-mono text-[#56889E] flex items-center gap-1.5">
              <span>Evaluated in {metrics.processingTimeMs} ms</span>
              <span>•</span>
              <span>ISO/TR 21960 Field Screening Advisory</span>
            </span>
          </div>
        </div>

        <span className={`text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0 ${badgeBg}`}>
          {severity === 'ACCEPTABLE'
            ? 'Optimal'
            : severity === 'CRITICAL'
            ? 'Severe Issue'
            : severity === 'WARNING'
            ? 'Advisory'
            : 'Unavailable'}
        </span>
      </div>

      {/* Actionable Message (Exact prompt specification) */}
      <div className="space-y-1.5">
        <p className={`text-[12.5px] font-medium leading-relaxed ${bannerText}`}>
          {message}
        </p>

        {recommendedAction && (
          <div className="flex items-start space-x-1.5 text-[11.5px] text-[#2C637A] bg-white/75 p-2 rounded-xl border border-black/5">
            <span className="font-bold text-[#0891B2] shrink-0">Recommendation:</span>
            <span>{recommendedAction}</span>
          </div>
        )}
      </div>

      {/* Metadata Strip: Dimensions, Aspect Ratio, Sharpness, Brightness, File Size */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono text-[#335C6E] bg-white/60 p-2 rounded-xl border border-black/5">
        <div>
          <span className="text-[#6494A8] block text-[9.5px] uppercase font-sans font-bold">Resolution</span>
          <span className="font-bold text-[#0A2540]">
            {metrics.width > 0 ? `${metrics.width} × ${metrics.height} px` : '—'}
          </span>
        </div>
        <div>
          <span className="text-[#6494A8] block text-[9.5px] uppercase font-sans font-bold">Aspect Ratio</span>
          <span className="font-bold text-[#0A2540]">{metrics.aspectRatio}:1</span>
        </div>
        <div>
          <span className="text-[#6494A8] block text-[9.5px] uppercase font-sans font-bold">Sharpness</span>
          <span className="font-bold text-[#0A2540]">{metrics.blurScore.toFixed(0)}</span>
        </div>
        <div>
          <span className="text-[#6494A8] block text-[9.5px] uppercase font-sans font-bold">Brightness</span>
          <span className="font-bold text-[#0A2540]">{metrics.meanBrightness.toFixed(0)} / 255</span>
        </div>
        <div>
          <span className="text-[#6494A8] block text-[9.5px] uppercase font-sans font-bold">File Size</span>
          <span className="font-bold text-[#0A2540]">{fileSizeText || '—'}</span>
        </div>
      </div>

      {/* Severe Quality Gating Warning & Override Control */}
      {isSevere && (
        <div className="p-3 rounded-xl bg-rose-100/80 border border-rose-300 text-rose-950 space-y-2">
          <div className="flex items-center space-x-1.5 text-[12px] font-bold text-rose-900">
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Analysis Gated to Prevent Inaccurate Detection</span>
          </div>
          <p className="text-[11px] text-rose-800 leading-normal">
            Due to the severe optical condition above, automated particle segmentation may generate high false-positive or false-negative counts. Please replace the micrograph with a focused, properly illuminated image.
          </p>

          <label className="flex items-center space-x-2 text-[11px] font-semibold text-rose-900 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={allowSevereOverride}
              onChange={(e) => onToggleOverride && onToggleOverride(e.target.checked)}
              className="rounded border-rose-400 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
            />
            <span>Acknowledge optical risk and unlock screening anyway</span>
          </label>
        </div>
      )}

      {/* Accordion toggle for detailed optical metric breakdown */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-[11.5px] font-semibold text-[#0891B2] hover:text-[#06738D] flex items-center space-x-1 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{showDetails ? 'Hide Optical Diagnostics' : 'View Optical Diagnostics & Metrics'}</span>
          {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showDetails && (
          <div className="mt-2.5 p-3 rounded-xl bg-white/85 border border-[#BBE4F2] space-y-2.5 text-[11px] text-[#2C637A]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono">
              <div className="p-2 rounded-lg bg-[#F0F9FD] border border-[#BBE4F2]/50">
                <span className="font-bold text-[#0A2540] block font-sans">Focus Energy (Laplacian)</span>
                <span>Score: {metrics.blurScore.toFixed(1)}</span>
                <span className="text-[#6494A8] block text-[10px]">
                  {metrics.blurScore >= 75 ? 'Optimal focus' : metrics.blurScore >= 42 ? 'Moderate softness' : 'Severe blur'}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[#F0F9FD] border border-[#BBE4F2]/50">
                <span className="font-bold text-[#0A2540] block font-sans">Sensor Clipping</span>
                <span>Over: {metrics.clippedBrightPct}% | Under: {metrics.clippedDarkPct}%</span>
                <span className="text-[#6494A8] block text-[10px]">
                  Clipped saturation limit: &lt; 20%
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[#F0F9FD] border border-[#BBE4F2]/50">
                <span className="font-bold text-[#0A2540] block font-sans">Luminance Contrast</span>
                <span>Std Dev: {metrics.contrastStdDev.toFixed(1)}</span>
                <span className="text-[#6494A8] block text-[10px]">
                  {metrics.contrastStdDev >= 22 ? 'Good particle dynamic range' : 'Low background contrast'}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[#F0F9FD] border border-[#BBE4F2]/50">
                <span className="font-bold text-[#0A2540] block font-sans">Illumination Uniformity</span>
                <span>Disparity Ratio: {metrics.unevenIlluminationRatio.toFixed(2)}</span>
                <span className="text-[#6494A8] block text-[10px]">
                  3×3 field quadrant variance (&lt; 0.48 acceptable)
                </span>
              </div>
            </div>

            {/* Scientific Disclosure Note */}
            <div className="pt-2 border-t border-[#BBE4F2]/50 flex items-start space-x-1.5 text-[10.5px] text-[#56889E] font-sans">
              <Info className="w-3.5 h-3.5 text-[#0891B2] shrink-0 mt-0.5" />
              <span>
                <strong>Scientific Heuristic Disclaimer:</strong> Browser-side canvas statistics assess technical image focus, exposure, and noise, but cannot establish polymer identity or identify microplastic-background overlap under low contrast. Validated spectroscopy (FTIR/Raman) is required for certified material confirmation.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons: Replace Image & Re-run Quality Check */}
      <div className="flex items-center justify-between pt-1 border-t border-black/5 text-[11.5px]">
        <div className="flex items-center space-x-2">
          {onReplaceImage && (
            <button
              type="button"
              onClick={onReplaceImage}
              className="px-3 py-1 rounded-full bg-white hover:bg-slate-50 text-[#0891B2] border border-[#BBE4F2] font-semibold transition-all hover:shadow-2xs cursor-pointer flex items-center space-x-1"
            >
              <FileImage className="w-3 h-3" />
              <span>Replace Image</span>
            </button>
          )}

          {onRecheck && (
            <button
              type="button"
              onClick={onRecheck}
              className="px-3 py-1 rounded-full bg-white hover:bg-slate-50 text-[#4A7F96] hover:text-[#0891B2] border border-[#BBE4F2] font-semibold transition-all hover:shadow-2xs cursor-pointer flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Re-check Quality</span>
            </button>
          )}
        </div>

        <span className="text-[10px] text-[#6494A8] font-mono truncate max-w-[150px]" title={filename}>
          {filename}
        </span>
      </div>
    </div>
  );
};

export default ImageQualityAssessment;
