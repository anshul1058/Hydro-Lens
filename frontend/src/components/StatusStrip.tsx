import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import type { CalibrationStatusResponse } from '../api/types';

interface StatusStripProps {
  calibrationStatus: CalibrationStatusResponse | null;
  loading?: boolean;
}

export const StatusStrip: React.FC<StatusStripProps> = ({ calibrationStatus, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="w-full h-14 bg-white rounded-2xl border border-[#9ecae1]/50 animate-pulse mb-6 flex items-center px-5">
        <div className="w-4 h-4 bg-[#4a90d9]/40 rounded-full mr-3" />
        <div className="w-64 h-4 bg-[#4a90d9]/20 rounded" />
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
      </div>
    );
  }

  if (quality === 0.5) {
    return (
      <div className="w-full bg-[#F5B942]/15 rounded-2xl border border-[#F5B942]/40 p-4 mb-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#F5B942]/25 flex items-center justify-center text-[#1E2A38]">
            <Clock className="w-5 h-5 text-[#F5B942]" />
          </div>
          <div>
            <span className="text-[14px] font-bold text-[#1E2A38]">Calibration stale (&gt;7 days)</span>
            <span className="text-[13px] text-[#6b7a90] ml-2">
              · results marked 0.5 quality factor
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate('/calibration')}
          className="px-4 py-1.5 rounded-full text-[12px] font-bold bg-white hover:bg-[#eff3ff] text-[#1E2A38] border border-[#F5B942]/60 flex items-center space-x-1.5 transition-all"
        >
          <span>Recalibrate</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // 0.0 quality (missing or invalid)
  return (
    <div className="w-full bg-[#FF6B6B]/15 rounded-2xl border border-[#FF6B6B]/35 p-4 mb-6 flex items-center justify-between shadow-xs">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-[#FF6B6B]/25 flex items-center justify-center text-[#FF6B6B]">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[14px] font-bold text-[#1E2A38]">Calibration required</span>
          <span className="text-[13px] text-[#6b7a90] ml-2">
            — quantitative sizing and particle count distributions are blocked
          </span>
        </div>
      </div>
      <button
        onClick={() => navigate('/calibration')}
        className="px-4 py-1.5 rounded-full text-[12px] font-bold bg-[#4a90d9] hover:bg-[#3a7bc0] active:scale-95 text-white shadow-xs flex items-center space-x-1.5 transition-all"
      >
        <span>Open calibration</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
