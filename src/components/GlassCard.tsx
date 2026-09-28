import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white/95 backdrop-blur-[20px] border border-[#BBE4F2] shadow-[0_4px_20px_rgba(8,145,178,0.06)] rounded-[20px] p-[20px] transition-all hover:shadow-[0_8px_28px_rgba(8,145,178,0.1)] hover:border-[#0891B2]/40 ${className}`}
    >
      {children}
    </div>
  );
};
