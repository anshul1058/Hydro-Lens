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
      <div className="w-full h-14 bg-[#E8F8FC]/60 backdrop-blur-[20px] rounded-[18px] border border-[#B9DFEA] animate-pulse mb-6 flex items-center px-5">
        <div className="w-4 h-4 bg-[#6BBFD8]/40 rounded-full mr-3"></div>
        <div className="w-64 h-4 bg-[#6BBFD8]/40 rounded"></div>
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
      <div className="w-full bg-[#65C99A]/15 backdrop-blur-[20px] rounded-[18px] border border-[#65C99A]/40 p-4 mb-6 flex items-center justify-between shadow-[0_4px_20px_rgba(101,201,154,0.08)]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#65C99A]/25 flex items-center justify-center text-[#65C99A]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[14px] font-semibold text-[#397C91]">Calibration active</span>
            <span className="text-[14px] text-[#5294A8] ml-2">
              · {factor} µm/px · {mag} · valid until {expires}
            </span>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#65C99A]/25 text-[#397C91]">
          1.0 Quality
        </span>
      </div>
    );
  }

  if (quality === 0.5) {
    return (
      <div className="w-full bg-[#F5C75A]/20 backdrop-blur-[20px] rounded-[18px] border border-[#F5C75A]/45 p-4 mb-6 flex items-center justify-between shadow-[0_4px_20px_rgba(245,199,90,0.08)]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#F5C75A]/30 flex items-center justify-center text-[#397C91]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[14px] font-semibold text-[#397C91]">Calibration stale (&gt;7 days)</span>
            <span className="text-[14px] text-[#5294A8] ml-2">
              · results marked 0.5 quality factor
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate('/calibration')}
          className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-white/80 hover:bg-white text-[#397C91] border border-[#F5C75A]/60 flex items-center space-x-1 transition-all"
        >
          <span>Recalibrate</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // 0.0 quality (missing or invalid)
  return (
    <div className="w-full bg-[#F28B8B]/20 backdrop-blur-[20px] rounded-[18px] border border-[#F28B8B]/45 p-4 mb-6 flex items-center justify-between shadow-[0_4px_20px_rgba(242,139,139,0.08)]">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-[#F28B8B]/30 flex items-center justify-center text-[#397C91]">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[14px] font-semibold text-[#397C91]">Calibration required</span>
          <span className="text-[14px] text-[#5294A8] ml-2">
            — quantitative sizing and particle count distributions are blocked
          </span>
        </div>
      </div>
      <button
        onClick={() => navigate('/calibration')}
        className="px-4 py-1.5 rounded-full text-[12px] font-semibold bg-[#6BBFD8] hover:bg-[#5AAEC7] text-white shadow-xs flex items-center space-x-1.5 transition-all"
      >
        <span>Open calibration</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
