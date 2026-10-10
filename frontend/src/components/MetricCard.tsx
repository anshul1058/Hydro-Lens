import React from 'react';

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  valueColor?: 'default' | 'mint' | 'amber' | 'rose' | 'periwinkle' | 'rust';
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  index?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  valueColor = 'default',
  icon,
  badge,
  index = 0
}) => {
  // Real water bubble palette: Deep Navy Ink (#0A2540), Mint (#059669), Amber (#D97706), Sky/Ocean (#0284C7)
  const colorMap = {
    default: 'text-[#0A2540]',
    mint: 'text-[#059669]',
    amber: 'text-[#D97706]',
    rose: 'text-[#E11D48]',
    rust: 'text-[#DC2626]',
    periwinkle: 'text-[#0284C7]'
  };

  const tintMap = {
    default: '',
    mint: 'bubble-tint-mint',
    amber: 'bubble-tint-amber',
    rose: 'bubble-tint-rust',
    rust: 'bubble-tint-rust',
    periwinkle: 'bubble-tint-periwinkle'
  };

  const floatDelayClass = `bubble-float-${(index ?? 0) % 5}`;

  return (
    <div
      className={`group relative bubble-3d-metric ${floatDelayClass} ${tintMap[valueColor]} cursor-default`}
      role="region"
      aria-label={`${label}: ${typeof value === 'string' || typeof value === 'number' ? value : ''} ${subtitle ?? ''}`}
    >
      {/* Specular curved light highlight on top-left (overhead sunlight bounce on water surface) */}
      <div className="bubble-highlight-primary" aria-hidden="true" />

      {/* Secondary ground ambient reflection / rim light at bottom-right */}
      <div className="bubble-reflection-secondary" aria-hidden="true" />

      {/* Bubble Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full px-3 py-3 select-none">
        {/* Metric Icon Chip */}
        {icon && (
          <div className="w-6 h-6 rounded-full mb-1 flex items-center justify-center bg-white/85 shadow-2xs border border-[#BAE6FD] text-[#0284C7] transition-transform duration-300 group-hover:scale-110">
            {icon}
          </div>
        )}

        {/* Metric Label */}
        <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.08em] text-[#0369A1] group-hover:text-[#0A2540] transition-colors leading-tight px-1">
          {label}
        </span>

        {/* Prominent Value */}
        <div className="my-1 flex items-baseline justify-center gap-1 max-w-[92%] px-1">
          <span className={`text-[21px] sm:text-[24px] font-extrabold tabular-nums tracking-tight leading-none truncate ${colorMap[valueColor]}`}>
            {value}
          </span>
          {badge}
        </div>

        {/* Subtitle / Unit / Descriptor */}
        {subtitle && (
          <span className="text-[11px] font-medium text-[#4A7F96] group-hover:text-[#0C2B42] transition-colors leading-tight truncate max-w-[90%] px-1">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
