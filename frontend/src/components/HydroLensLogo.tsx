import React from 'react';

interface HydroLensLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const HydroLensLogo: React.FC<HydroLensLogoProps> = ({
  size = 'md',
  showText = true,
  className = ''
}) => {
  const iconDimensions = {
    sm: { width: 32, height: 32, iconSize: 'w-8 h-8', textSize: 'text-[15px]', subSize: 'text-[9.5px]' },
    md: { width: 42, height: 42, iconSize: 'w-[42px] h-[42px]', textSize: 'text-[18px]', subSize: 'text-[10px]' },
    lg: { width: 56, height: 56, iconSize: 'w-14 h-14', textSize: 'text-[22px]', subSize: 'text-[11.5px]' }
  }[size];

  return (
    <div className={`flex items-center space-x-3 select-none group ${className}`}>
      {/* Precision Vector SVG Optical Droplet & Reticle Icon */}
      <div className={`relative ${iconDimensions.iconSize} shrink-0`}>
        <svg
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(2,132,199,0.25)] transition-transform duration-300 group-hover:scale-105"
          aria-label="HydroLens Optical Reticle & Droplet Logo"
        >
          <defs>
            {/* Deep Water to Aqua Gradient */}
            <linearGradient id="hl-drop-gradient" x1="22" y1="6" x2="22" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="42%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0B2545" />
            </linearGradient>

            {/* Aperture Ring Teal Accent */}
            <linearGradient id="hl-ring-gradient" x1="3" y1="3" x2="41" y2="41" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="50%" stopColor="#0891B2" />
              <stop offset="100%" stopColor="#0D9488" />
            </linearGradient>

            {/* Specular Glint */}
            <linearGradient id="hl-glint" x1="16" y1="12" x2="20" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            {/* Microplastic Glow */}
            <filter id="hl-glow" x="18" y="21" width="8" height="9" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Outer Microscope Optical Focusing Ring with Precision Vernier Ticks */}
          <circle
            cx="22"
            cy="22"
            r="19"
            stroke="url(#hl-ring-gradient)"
            strokeWidth="1.5"
            strokeOpacity="0.45"
            strokeDasharray="3 1.5"
          />

          {/* Optical Axis Vernier Tick Marks (0°, 90°, 180°, 270°) */}
          <line x1="22" y1="1.5" x2="22" y2="4.5" stroke="#0891B2" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="22" y1="39.5" x2="22" y2="42.5" stroke="#0891B2" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="1.5" y1="22" x2="4.5" y2="22" stroke="#0891B2" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="39.5" y1="22" x2="42.5" y2="22" stroke="#0891B2" strokeWidth="1.8" strokeLinecap="round" />

          {/* Secondary 45° Metrology Tick Marks */}
          <line x1="7.5" y1="7.5" x2="9.8" y2="9.8" stroke="#06B6D4" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />
          <line x1="36.5" y1="7.5" x2="34.2" y2="9.8" stroke="#06B6D4" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />
          <line x1="7.5" y1="36.5" x2="9.8" y2="34.2" stroke="#06B6D4" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />
          <line x1="36.5" y1="36.5" x2="34.2" y2="34.2" stroke="#06B6D4" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />

          {/* 2. Crystalline Hydro Water Droplet Core */}
          <path
            d="M 22 7 C 22 7 32.5 18.2 32.5 25.5 A 10.5 10.5 0 0 1 11.5 25.5 C 11.5 18.2 22 7 22 7 Z"
            fill="url(#hl-drop-gradient)"
            stroke="#FFFFFF"
            strokeWidth="0.8"
            strokeOpacity="0.6"
          />

          {/* 3. Droplet Specular Reflection Curve */}
          <path
            d="M 16.5 21 C 15.8 19 17.5 15.5 20.5 11.5"
            stroke="url(#hl-glint)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />

          {/* 4. Precision Microscope Reticle / Optical Crosshairs */}
          <line
            x1="14"
            y1="25.5"
            x2="30"
            y2="25.5"
            stroke="#FFFFFF"
            strokeWidth="0.9"
            strokeDasharray="1.5 1.5"
            strokeOpacity="0.85"
          />
          <line
            x1="22"
            y1="17.5"
            x2="22"
            y2="33.5"
            stroke="#FFFFFF"
            strokeWidth="0.9"
            strokeDasharray="1.5 1.5"
            strokeOpacity="0.85"
          />

          {/* Central Calibrated Detection Ring */}
          <circle
            cx="22"
            cy="25.5"
            r="3.2"
            stroke="#FFFFFF"
            strokeWidth="1.1"
            strokeOpacity="0.9"
            fill="none"
          />

          {/* 5. Detected Microplastic Particle Candidates Inside Objective */}
          {/* Central Target Particle */}
          <circle cx="22" cy="25.5" r="1.3" fill="#22D3EE" filter="url(#hl-glow)" />

          {/* Detected Synthetic Fiber Strand Candidate */}
          <path
            d="M 18.2 22 L 20.8 24.2"
            stroke="#67E8F9"
            strokeWidth="1.1"
            strokeLinecap="round"
          />

          {/* Microplastic Fragment Polygon Candidate */}
          <polygon
            points="25.2,23 26.5,23.8 25.8,24.8 24.6,24.2"
            fill="#F43F5E"
            fillOpacity="0.9"
          />

          {/* Tiny Floating Micro-Bead Candidate */}
          <circle cx="24.2" cy="28.4" r="0.8" fill="#FBBF24" />
        </svg>

        {/* Live Active Metrology Pulse Indicator */}
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] border-[1.5px] border-white shadow-xs"
          title="Optical System Calibrated"
        />
      </div>

      {/* Professional Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className={`font-extrabold ${iconDimensions.textSize} text-[#0A2540] tracking-tight group-hover:text-[#0284C7] transition-colors leading-none`}>
              Hydro<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] to-[#0891B2]">Lens</span>
            </span>
            <span className="px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-[#EAF7FC] text-[#0284C7] border border-[#BBE4F2] rounded-full leading-none">
              v1.0
            </span>
          </div>
          <div className={`text-[#56889E] font-bold tracking-[0.08em] uppercase ${iconDimensions.subSize} hidden sm:flex items-center gap-1.5 mt-0.5`}>
            <span>Microplastic Optical Screening</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HydroLensLogo;
