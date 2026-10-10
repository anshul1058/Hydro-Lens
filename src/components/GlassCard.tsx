import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-[#E8F8FC]/85 backdrop-blur-[20px] saturate-[1.3] border border-[#B9DFEA] shadow-[0_8px_24px_rgba(57,124,145,0.08)] rounded-[18px] p-[20px] ${className}`}
    >
      {children}
    </div>
  );
};
