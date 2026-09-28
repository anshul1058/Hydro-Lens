import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import type { CalibrationStatusResponse } from '../api/types';

interface StatusStripProps {
  calibrationStatus: CalibrationStatusResponse | null;
  loading?: boolean;
}

export const StatusStrip: React.FC<StatusStripProps> = ({ calibrationStatus, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="w-full h-16 bg-white/70 backdrop-blur-[20px] rounded-[18px] border border-[#BBE4F2] animate-pulse mb-6 flex items-center px-6 shadow-xs">
        <div className="w-8 h-8 bg-[#0284C7]/20 rounded-full mr-3.5"></div>
        <div className="h-4 w-72 bg-[#0284C7]/20 rounded-md"></div>
      </div>
    );
  }

  const quality = calibrationStatus?.quality ?? 0.0;
  const record = calibrationStatus?.record;
  const factor = record?.factor_um_per_px ?? 0.417;
  const mag = record?.magnification ?? '200x';
  const expires = record?.expires ? record.expires.substring(0, 10) : 'Active';

  if (quality === 1.0) {
    return (
      <div className="w-full bg-gradient-to-r from-white/95 via-[#E6FBF2]/80 to-white/95 backdrop-blur-[20px] rounded-[18px] border border-[#10B981]/40 p-4 sm:px-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_4px_20px_rgba(16,185,129,0.1)] transition-all">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white shadow-xs shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[14px] font-bold text-[#0A2540]">Calibration active</span>
              <span className="text-[13.5px] text-[#2C637A]">
                · {factor} µm/px · {mag} · valid until {expires}
              </span>
            </div>
            <p className="text-[11.5px] text-[#059669] font-medium flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-[#10B981]" />
              <span>Full quantitative optical sizing active</span>
            </p>
          </div>
        </div>
        <div className="flex items-center self-end sm:self-auto space-x-2">
          <span className="px-3 py-1 rounded-full text-[12px] font-bold bg-[#E6FBF2] text-[#059669] border border-[#10B981]/30 shadow-xs flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>1.0 Quality</span>
          </span>
        </div>
      </div>
    );
  }

  if (quality === 0.5) {
    return (
      <div className="w-full bg-gradient-to-r from-white/95 via-[#FEF6E7]/80 to-white/95 backdrop-blur-[20px] rounded-[18px] border border-[#F59E0B]/50 p-4 sm:px-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_4px_20px_rgba(245,158,11,0.1)] transition-all">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white shadow-xs shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[14px] font-bold text-[#0A2540]">Calibration stale (&gt;7 days)</span>
            <span className="text-[13.5px] text-[#2C637A] ml-2">
              · results marked 0.5 quality factor
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate('/calibration')}
          className="self-end sm:self-auto px-4 py-2 rounded-full text-[12.5px] font-bold bg-white hover:bg-[#FEF6E7] text-[#D97706] border border-[#F59E0B]/50 hover:border-[#D97706] flex items-center space-x-1.5 transition-all shadow-xs hover:-translate-y-0.5 cursor-pointer"
        >
          <span>Recalibrate</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // 0.0 quality (missing or invalid)
  return (
    <div className="w-full bg-gradient-to-r from-white/95 via-[#FEECEB]/80 to-white/95 backdrop-blur-[20px] rounded-[18px] border border-[#EF4444]/45 p-4 sm:px-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_4px_20px_rgba(239,68,68,0.1)] transition-all">
      <div className="flex items-center space-x-3.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center text-white shadow-xs shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[14px] font-bold text-[#0A2540]">Calibration required</span>
          <span className="text-[13.5px] text-[#2C637A] ml-2">
            — quantitative sizing and particle count distributions are blocked
          </span>
        </div>
      </div>
      <button
        onClick={() => navigate('/calibration')}
        className="self-end sm:self-auto px-4 py-2 rounded-full text-[12.5px] font-bold bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] text-white shadow-sm shadow-cyan-500/20 hover:shadow-cyan-500/30 flex items-center space-x-1.5 transition-all hover:-translate-y-0.5 cursor-pointer"
      >
        <span>Open calibration</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
