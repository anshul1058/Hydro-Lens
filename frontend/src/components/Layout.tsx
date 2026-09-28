import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Microscope, Sliders, ShieldCheck, Activity } from 'lucide-react';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#D8F3FA]">
      {/* Fixed 64px Header */}
      <header className="fixed top-0 left-0 right-0 h-[64px] bg-[#E8F8FC]/85 backdrop-blur-[20px] border-b border-[#B9DFEA] shadow-[0_4px_16px_rgba(57,124,145,0.06)] z-50 px-6 flex items-center justify-between">
        {/* Left Logo + Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#6BBFD8]/20 flex items-center justify-center text-[#3FA7C4] border border-[#6BBFD8]/30">
            <Microscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-[17px] text-[#397C91] tracking-tight">Hydro Lens</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#6BBFD8]/20 text-[#397C91] rounded-full">v1.0</span>
            </div>
            <p className="text-[11px] text-[#5294A8] uppercase tracking-[0.06em] font-medium">Microplastic Screening</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-white/70 p-1 rounded-full border border-[#B9DFEA] shadow-xs">
          <NavLink
            to="/"
            end
            className={({ isActive }: { isActive: boolean }) =>
              `px-4 py-1.5 rounded-full text-[13px] font-medium transition-all flex items-center space-x-2 ${
                isActive
                  ? 'bg-[#6BBFD8] text-white shadow-xs font-semibold'
                  : 'text-[#5294A8] hover:text-[#397C91] hover:bg-white/80'
              }`
            }
          >
            <Microscope className="w-4 h-4" />
            <span>Sample Analysis</span>
          </NavLink>

          <NavLink
            to="/calibration"
            className={({ isActive }: { isActive: boolean }) =>
              `px-4 py-1.5 rounded-full text-[13px] font-medium transition-all flex items-center space-x-2 ${
                isActive
                  ? 'bg-[#6BBFD8] text-white shadow-xs font-semibold'
                  : 'text-[#5294A8] hover:text-[#397C91] hover:bg-white/80'
              }`
            }
          >
            <Sliders className="w-4 h-4" />
            <span>Calibration Portal</span>
          </NavLink>

          <NavLink
            to="/diagnostics"
            className={({ isActive }: { isActive: boolean }) =>
              `px-4 py-1.5 rounded-full text-[13px] font-medium transition-all flex items-center space-x-2 ${
                isActive
                  ? 'bg-[#6BBFD8] text-white shadow-xs font-semibold'
                  : 'text-[#5294A8] hover:text-[#397C91] hover:bg-white/80'
              }`
            }
          >
            <Activity className="w-4 h-4" />
            <span>System Diagnostics</span>
          </NavLink>
        </nav>

        {/* Right Side Pill Button */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#65C99A]/15 text-[#397C91] border border-[#65C99A]/30 text-[12px] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#65C99A] animate-pulse"></span>
            <span>Pipeline Ready</span>
          </div>
          <NavLink
            to="/calibration"
            className="px-4 py-2 bg-[#6BBFD8] hover:bg-[#5AAEC7] text-white text-[13px] font-medium rounded-full shadow-sm transition-all flex items-center space-x-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Calibration</span>
          </NavLink>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-[88px] pb-12 px-4 sm:px-6 max-w-[1200px] w-full mx-auto">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-[#B9DFEA] bg-[#E8F8FC]/50 backdrop-blur-xs text-center text-[12px] text-[#5294A8]">
        Hydro Lens • Portable Optical Microplastic Screening • HackMatrix 5.0 Team Nishtha
      </footer>
    </div>
  );
};
