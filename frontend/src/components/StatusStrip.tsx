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
<<<<<<< HEAD
      <div className="w-full h-16 bg-white/70 backdrop-blur-[20px] rounded-[18px] border border-[#BBE4F2] animate-pulse mb-6 flex items-center px-6 shadow-xs">
        <div className="w-8 h-8 bg-[#0284C7]/20 rounded-full mr-3.5"></div>
        <div className="h-4 w-72 bg-[#0284C7]/20 rounded-md"></div>
=======
      <div className="w-full h-14 bg-white rounded-2xl border border-[#9ecae1]/50 animate-pulse mb-6 flex items-center px-5">
        <div className="w-4 h-4 bg-[#4a90d9]/40 rounded-full mr-3" />
        <div className="w-64 h-4 bg-[#4a90d9]/20 rounded" />
>>>>>>> origin/main
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
<<<<<<< HEAD
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
=======
      <div className="w-full bg-[#2ECC91]/10 rounded-2xl border border-[#2ECC91]/30 p-4 mb-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#2ECC91]/20 flex items-center justify-center text-[#2ECC91]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[14px] font-bold text-[#1E2A38]">Calibration active</span>
            <span className="text-[13px] text-[#6b7a90] ml-2">
              · {factor} µm/px · {mag} · valid until {expires}
            </span>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[12px] font-bold bg-[#2ECC91]/20 text-[#2ECC91] border border-[#2ECC91]/30">
          1.0 Quality
        </span>
>>>>>>> origin/main
      </div>
    );
  }

  if (quality === 0.5) {
    return (
<<<<<<< HEAD
      <div className="w-full bg-gradient-to-r from-white/95 via-[#FEF6E7]/80 to-white/95 backdrop-blur-[20px] rounded-[18px] border border-[#F59E0B]/50 p-4 sm:px-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_4px_20px_rgba(245,158,11,0.1)] transition-all">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white shadow-xs shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[14px] font-bold text-[#0A2540]">Calibration stale (&gt;7 days)</span>
            <span className="text-[13.5px] text-[#2C637A] ml-2">
=======
      <div className="w-full bg-[#F5B942]/15 rounded-2xl border border-[#F5B942]/40 p-4 mb-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#F5B942]/25 flex items-center justify-center text-[#1E2A38]">
            <Clock className="w-5 h-5 text-[#F5B942]" />
          </div>
          <div>
            <span className="text-[14px] font-bold text-[#1E2A38]">Calibration stale (&gt;7 days)</span>
            <span className="text-[13px] text-[#6b7a90] ml-2">
>>>>>>> origin/main
              · results marked 0.5 quality factor
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate('/calibration')}
<<<<<<< HEAD
          className="self-end sm:self-auto px-4 py-2 rounded-full text-[12.5px] font-bold bg-white hover:bg-[#FEF6E7] text-[#D97706] border border-[#F59E0B]/50 hover:border-[#D97706] flex items-center space-x-1.5 transition-all shadow-xs hover:-translate-y-0.5 cursor-pointer"
=======
          className="px-4 py-1.5 rounded-full text-[12px] font-bold bg-white hover:bg-[#eff3ff] text-[#1E2A38] border border-[#F5B942]/60 flex items-center space-x-1.5 transition-all"
>>>>>>> origin/main
        >
          <span>Recalibrate</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // 0.0 quality (missing or invalid)
  return (
<<<<<<< HEAD
    <div className="w-full bg-gradient-to-r from-white/95 via-[#FEECEB]/80 to-white/95 backdrop-blur-[20px] rounded-[18px] border border-[#EF4444]/45 p-4 sm:px-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_4px_20px_rgba(239,68,68,0.1)] transition-all">
      <div className="flex items-center space-x-3.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center text-white shadow-xs shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[14px] font-bold text-[#0A2540]">Calibration required</span>
          <span className="text-[13.5px] text-[#2C637A] ml-2">
=======
    <div className="w-full bg-[#FF6B6B]/15 rounded-2xl border border-[#FF6B6B]/35 p-4 mb-6 flex items-center justify-between shadow-xs">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-[#FF6B6B]/25 flex items-center justify-center text-[#FF6B6B]">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[14px] font-bold text-[#1E2A38]">Calibration required</span>
          <span className="text-[13px] text-[#6b7a90] ml-2">
>>>>>>> origin/main
            — quantitative sizing and particle count distributions are blocked
          </span>
        </div>
      </div>
      <button
        onClick={() => navigate('/calibration')}
<<<<<<< HEAD
        className="self-end sm:self-auto px-4 py-2 rounded-full text-[12.5px] font-bold bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] text-white shadow-sm shadow-cyan-500/20 hover:shadow-cyan-500/30 flex items-center space-x-1.5 transition-all hover:-translate-y-0.5 cursor-pointer"
=======
        className="px-4 py-1.5 rounded-full text-[12px] font-bold bg-[#4a90d9] hover:bg-[#3a7bc0] active:scale-95 text-white shadow-xs flex items-center space-x-1.5 transition-all"
>>>>>>> origin/main
      >
        <span>Open calibration</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
