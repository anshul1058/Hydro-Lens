import React from 'react';

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  valueColor?: 'default' | 'accent' | 'ok' | 'warn' | 'err' | 'mint' | 'amber' | 'rose' | 'periwinkle';
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  valueColor = 'default',
  icon,
  badge
}) => {
  const colorMap: Record<string, string> = {
    default: 'text-ink',
    accent: 'text-accent',
    periwinkle: 'text-accent',
    ok: 'text-ok',
    mint: 'text-ok',
    warn: 'text-warn',
    amber: 'text-warn',
    err: 'text-err',
    rose: 'text-err'
  };

  return (
    <div className="bg-surface border border-line rounded-md p-4 flex flex-col justify-between shadow-2xs">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
          {label}
        </span>
        {icon && <span className="text-ink-3 shrink-0">{icon}</span>}
      </div>

      <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
        <span className={`text-[25px] font-bold font-mono tabular-nums leading-tight tracking-tight ${colorMap[valueColor] || 'text-ink'}`}>
          {value}
        </span>
        {badge}
      </div>

      {subtitle && (
        <p className="text-[11.5px] text-ink-3 leading-snug mt-1.5">{subtitle}</p>
      )}
    </div>
  );
};

export default MetricCard;
