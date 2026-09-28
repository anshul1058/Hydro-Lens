import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, Warning } from '@phosphor-icons/react';
import type { CalibrationStatusResponse } from '../api/types';

interface StatusStripProps {
  calibrationStatus: CalibrationStatusResponse | null;
  loading?: boolean;
}

const bannerTone = {
  ok: {
    box: 'bg-ok-tint border-ok-border',
    icon: 'text-ok',
    badge: 'bg-surface border-ok-border text-ok',
    Icon: ShieldCheck
  },
  warn: {
    box: 'bg-warn-tint border-warn-border',
    icon: 'text-warn',
    badge: 'bg-surface border-warn-border text-warn',
    Icon: Clock
  },
  err: {
    box: 'bg-err-tint border-err-border',
    icon: 'text-err',
    badge: 'bg-surface border-err-border text-err',
    Icon: Warning
  }
};

export const StatusStrip: React.FC<StatusStripProps> = ({ calibrationStatus, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="w-full mb-6 rounded-md border border-line bg-surface p-4 flex items-center gap-3" aria-hidden="true">
        <div className="skeleton w-5 h-5 shrink-0 rounded-sm" />
        <div className="skeleton h-4 w-72 max-w-full" />
      </div>
    );
  }

  const quality = calibrationStatus?.quality ?? 0.0;
  const record = calibrationStatus?.record;
  const factor = record?.factor_um_per_px ?? 0.417;
  const mag = record?.magnification ?? '200x';
  const expires = record?.expires ? record.expires.substring(0, 10) : 'active';

  if (quality === 1.0) {
    const { box, icon, badge, Icon } = bannerTone.ok;
    return (
      <div
        role="status"
        className={`w-full mb-6 rounded-md border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${box}`}
      >
        <div className="flex items-start gap-3">
          <Icon size={20} className={`shrink-0 mt-0.5 ${icon}`} weight="bold" />
          <div>
            <p className="text-[13.5px] font-semibold text-ink">
              Calibration Active:
              <span className="font-mono text-ink-2 ml-1 text-[13px]">
                {factor} µm/px · {mag} · Valid until {expires}
              </span>
            </p>
            <p className="text-[12.5px] text-ink-2 mt-0.5">
              Quantitative micron sizing and volumetric extrapolation are active.
            </p>
          </div>
        </div>
        <span className={`self-start sm:self-auto px-2.5 py-1 rounded-sm text-[11px] font-mono font-semibold border ${badge}`}>
          Quality {quality.toFixed(1)}
        </span>
      </div>
    );
  }

  if (quality === 0.5) {
    const { box, icon, Icon } = bannerTone.warn;
    return (
      <div
        role="status"
        className={`w-full mb-6 rounded-md border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${box}`}
      >
        <div className="flex items-start gap-3">
          <Icon size={20} className={`shrink-0 mt-0.5 ${icon}`} weight="bold" />
          <div>
            <p className="text-[13.5px] font-semibold text-ink">Calibration Stale: Older than 7 Days</p>
            <p className="text-[12.5px] text-ink-2 mt-0.5">
              Screening results carry a 0.5 quality factor until scale recalibration is completed.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/calibration')}
          className="btn-secondary self-start sm:self-auto px-3.5 py-1.5 text-[12.5px] cursor-pointer"
        >
          Recalibrate Scale
        </button>
      </div>
    );
  }

  const { box, icon, Icon } = bannerTone.err;
  return (
    <div
      role="alert"
      className={`w-full mb-6 rounded-md border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${box}`}
    >
      <div className="flex items-start gap-3">
        <Icon size={20} className={`shrink-0 mt-0.5 ${icon}`} weight="bold" />
        <div>
          <p className="text-[13.5px] font-semibold text-ink">Scale Calibration Required</p>
          <p className="text-[12.5px] text-ink-2 mt-0.5">
            Quantitative physical sizing (Feret/ECD) is blocked until a valid scale calibration is stored.
          </p>
        </div>
      </div>
      <button
        onClick={() => navigate('/calibration')}
        className="btn-primary self-start sm:self-auto px-4 py-2 text-[12.5px] cursor-pointer"
      >
        Open Calibration Portal
      </button>
    </div>
  );
};

export default StatusStrip;
