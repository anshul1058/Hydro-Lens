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
  badge
}) => {
  const colorMap = {
    default: 'text-[#397C91]',
    mint: 'text-[#65C99A]',
    amber: 'text-[#F5C75A]',
    rose: 'text-[#F28B8B]',
    periwinkle: 'text-[#6BBFD8]'
  };

  return (
    <div className="bg-[#E8F8FC]/85 backdrop-blur-[20px] border border-[#B9DFEA] shadow-[0_8px_24px_rgba(57,124,145,0.08)] rounded-[18px] p-[20px] flex flex-col justify-between transition-all hover:shadow-[0_10px_28px_rgba(57,124,145,0.12)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#5294A8]">
          {label}
        </span>
        {icon && <div className="text-[#5294A8]">{icon}</div>}
      </div>

      <div className="flex items-baseline space-x-2 my-1">
        <span className={`text-[24px] font-semibold tabular-nums leading-tight ${colorMap[valueColor]}`}>
          {value}
        </span>
        {badge}
      </div>

      {subtitle && (
        <p className="text-[12px] text-[#5294A8] font-normal mt-1 leading-tight">
          {subtitle}
        </p>
      )}
    </div>
  );
};
