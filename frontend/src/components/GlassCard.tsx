import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-light-surface/85 backdrop-blur-[20px] saturate-[1.3] border border-border-custom shadow-[0_8px_24px_rgba(30,42,56,0.07)] rounded-[18px] p-[20px] ${className}`}
    >
      {children}
    </div>
  );
};
