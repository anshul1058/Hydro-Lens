import React from 'react';

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  valueColor?: 'default' | 'mint' | 'amber' | 'rose' | 'periwinkle';
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  valueColor = 'default',
  icon,
  badge,
}) => {
  const colorMap = {
    default: 'text-[#1E2A38]',
    mint: 'text-[#2ECC91]',
    amber: 'text-[#F5B942]',
    rose: 'text-[#FF6B6B]',
    periwinkle: 'text-[#4a90d9]',
  };

  return (
    <div className="dashboard-card bg-white border border-[#9ecae1]/70 hover:border-[#4a90d9] shadow-[0_4px_16px_rgba(74,144,217,0.06)] rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(74,144,217,0.12)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7a90]">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-[#eff3ff] border border-[#9ecae1]/50 flex items-center justify-center text-[#4a90d9]">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2 my-1">
        <span className={`text-[24px] font-bold tabular-nums leading-tight tracking-tight ${colorMap[valueColor]}`}>
          {value}
        </span>
        {badge}
      </div>

      {subtitle && (
        <p className="text-[12px] text-[#6b7a90] font-medium mt-1 leading-snug">
          {subtitle}
        </p>
      )}
    </div>
  );
};
