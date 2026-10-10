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
<<<<<<< HEAD
    default: 'text-[#0A2540]',
    mint: 'text-[#059669]',
    amber: 'text-[#D97706]',
    rose: 'text-[#DC2626]',
    periwinkle: 'text-[#0284C7]'
  };

  const bgTintMap = {
    default: 'group-hover:bg-[#EAF7FD]/50',
    mint: 'group-hover:bg-[#E6FBF2]/40',
    amber: 'group-hover:bg-[#FEF6E7]/40',
    rose: 'group-hover:bg-[#FEECEB]/40',
    periwinkle: 'group-hover:bg-[#EAF7FD]/60'
  };

  return (
    <div className={`group relative bg-white/95 backdrop-blur-[20px] border border-[#BBE4F2] shadow-[0_4px_16px_rgba(8,145,178,0.06)] rounded-[18px] p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(8,145,178,0.12)] hover:border-[#0891B2]/50 overflow-hidden ${bgTintMap[valueColor]}`}>
      {/* Subtle scientific top accent highlight */}
      <div className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-[#06B6D4]/30 to-transparent group-hover:via-[#0891B2]/70 transition-all duration-300" />
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#4A7F96] group-hover:text-[#0C2B42] transition-colors">
          {label}
        </span>
        {icon && (
          <div className="w-7 h-7 rounded-lg bg-[#EAF7FC] border border-[#BBE4F2] flex items-center justify-center text-[#0891B2] group-hover:scale-110 group-hover:bg-[#0891B2] group-hover:text-white transition-all duration-200">
=======
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
>>>>>>> origin/main
            {icon}
          </div>
        )}
      </div>

<<<<<<< HEAD
      <div className="flex items-baseline space-x-2 my-1.5">
        <span className={`text-[26px] font-bold tabular-nums leading-tight tracking-tight ${colorMap[valueColor]}`}>
=======
      <div className="flex items-baseline space-x-2 my-1">
        <span className={`text-[24px] font-bold tabular-nums leading-tight tracking-tight ${colorMap[valueColor]}`}>
>>>>>>> origin/main
          {value}
        </span>
        {badge}
      </div>

      {subtitle && (
<<<<<<< HEAD
        <p className="text-[12px] text-[#4A7F96] font-medium leading-tight mt-0.5">
=======
        <p className="text-[12px] text-[#6b7a90] font-medium mt-1 leading-snug">
>>>>>>> origin/main
          {subtitle}
        </p>
      )}
    </div>
  );
};
