import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Microscope, Sliders, ShieldCheck, Activity, Sparkles, Waves } from 'lucide-react';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#EBF7FC] text-[#0F334A] relative overflow-x-hidden hex-grid-pattern">
      {/* Decorative ambient scientific lighting orbs in background */}
      <div 
        className="fixed top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-400/15 blur-[120px] pointer-events-none -z-10" 
        aria-hidden="true" 
      />
      <div 
        className="fixed bottom-10 right-10 w-[600px] h-[600px] rounded-full bg-teal-400/12 blur-[140px] pointer-events-none -z-10" 
        aria-hidden="true" 
      />
      <div 
        className="fixed top-1/2 left-0 w-80 h-80 rounded-full bg-blue-500/10 blur-[110px] pointer-events-none -z-10" 
        aria-hidden="true" 
      />

      {/* Fixed 72px Premium Header */}
      <header className="fixed top-0 left-0 right-0 h-[72px] bg-white/92 backdrop-blur-[24px] border-b border-[#BBE4F2] shadow-[0_4px_24px_rgba(8,145,178,0.08)] z-50 px-4 sm:px-6 flex items-center justify-between transition-all">
        {/* Left Logo + Title */}
        <NavLink to="/" className="flex items-center space-x-3.5 group focus:outline-none">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0B2545] via-[#0891B2] to-[#0D9488] p-[1.5px] shadow-sm group-hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all duration-300">
            <div className="w-full h-full bg-[#07172B] rounded-[14px] flex items-center justify-center text-[#20B8D8] group-hover:scale-95 transition-transform duration-300">
              <Microscope className="w-5 h-5 text-[#20B8D8]" />
            </div>
            {/* Subtle optical reticle dot */}
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#06B6D4] border-2 border-white shadow-xs animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-[18px] text-[#0A2540] tracking-tight group-hover:text-[#0284C7] transition-colors">
                Hydro Lens
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#0284C7]/15 to-[#0891B2]/15 text-[#0284C7] border border-[#0891B2]/25 rounded-full">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-[#4A7F96] uppercase tracking-[0.09em] font-bold flex items-center gap-1">
              <Waves className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Microplastic Screening</span>
            </p>
          </div>
        </NavLink>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1.5 bg-[#F0F9FD] p-1.5 rounded-full border border-[#BBE4F2] shadow-inner backdrop-blur-md">
          <NavLink
            to="/"
            end
            className={({ isActive }: { isActive: boolean }) =>
              `px-4 py-2 rounded-full text-[13px] font-semibold transition-all flex items-center space-x-2 ${
                isActive
                  ? 'bg-gradient-to-r from-[#0B2545] via-[#0284C7] to-[#0891B2] text-white shadow-sm shadow-cyan-500/25'
                  : 'text-[#2C637A] hover:text-[#0A2540] hover:bg-white/80'
              }`
            }
          >
            <Microscope className="w-4 h-4" />
            <span>Sample Analysis</span>
          </NavLink>

          <NavLink
            to="/calibration"
            className={({ isActive }: { isActive: boolean }) =>
              `px-4 py-2 rounded-full text-[13px] font-semibold transition-all flex items-center space-x-2 ${
                isActive
                  ? 'bg-gradient-to-r from-[#0B2545] via-[#0284C7] to-[#0891B2] text-white shadow-sm shadow-cyan-500/25'
                  : 'text-[#2C637A] hover:text-[#0A2540] hover:bg-white/80'
              }`
            }
          >
            <Sliders className="w-4 h-4" />
            <span>Calibration Portal</span>
          </NavLink>

          <NavLink
            to="/diagnostics"
            className={({ isActive }: { isActive: boolean }) =>
              `px-4 py-2 rounded-full text-[13px] font-semibold transition-all flex items-center space-x-2 ${
                isActive
                  ? 'bg-gradient-to-r from-[#0B2545] via-[#0284C7] to-[#0891B2] text-white shadow-sm shadow-cyan-500/25'
                  : 'text-[#2C637A] hover:text-[#0A2540] hover:bg-white/80'
              }`
            }
          >
            <Activity className="w-4 h-4" />
            <span>System Diagnostics</span>
          </NavLink>
        </nav>

        {/* Right Side Status & Quick Calibration Button */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#E6FBF2] text-[#059669] border border-[#10B981]/35 text-[12px] font-bold shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]"></span>
            </span>
            <span>Pipeline Ready</span>
          </div>

          <NavLink
            to="/calibration"
            className="px-4 py-2 bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] text-white text-[13px] font-semibold rounded-full shadow-sm shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all flex items-center space-x-1.5 hover:-translate-y-0.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Calibration</span>
          </NavLink>
        </div>
      </header>

      {/* Mobile Navigation Bar (visible on small screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-[20px] border-t border-[#BBE4F2] px-3 py-2 flex items-center justify-around shadow-lg">
        <NavLink
          to="/"
          end
          className={({ isActive }: { isActive: boolean }) =>
            `flex flex-col items-center py-1 px-2 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-[#0284C7]' : 'text-[#4A7F96]'
            }`
          }
        >
          <Microscope className="w-5 h-5 mb-0.5" />
          <span>Analysis</span>
        </NavLink>
        <NavLink
          to="/calibration"
          className={({ isActive }: { isActive: boolean }) =>
            `flex flex-col items-center py-1 px-2 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-[#0284C7]' : 'text-[#4A7F96]'
            }`
          }
        >
          <Sliders className="w-5 h-5 mb-0.5" />
          <span>Calibration</span>
        </NavLink>
        <NavLink
          to="/diagnostics"
          className={({ isActive }: { isActive: boolean }) =>
            `flex flex-col items-center py-1 px-2 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-[#0284C7]' : 'text-[#4A7F96]'
            }`
          }
        >
          <Activity className="w-5 h-5 mb-0.5" />
          <span>Diagnostics</span>
        </NavLink>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 pt-[92px] pb-16 md:pb-12 px-4 sm:px-6 max-w-[1260px] w-full mx-auto">
        <Outlet />
      </main>

      {/* Professional Laboratory Footer */}
      <footer className="py-6 border-t border-[#BBE4F2] bg-white/80 backdrop-blur-md text-center text-[12px] text-[#4A7F96] font-medium transition-colors">
        <div className="max-w-[1260px] mx-auto px-4 space-y-2">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <div className="flex items-center space-x-1.5 text-[#0A2540] font-bold">
              <Sparkles className="w-4 h-4 text-[#06B6D4]" />
              <span>Hydro Lens</span>
            </div>
            <span className="hidden sm:inline text-[#BBE4F2]">•</span>
            <span className="font-semibold text-[#2C637A]">Portable Optical Microplastic Screening</span>
            <span className="hidden sm:inline text-[#BBE4F2]">•</span>
            <span className="text-[#0284C7] font-bold">HackMatrix 5.0 Team Nishtha</span>
          </div>
          <div className="text-[11px] text-[#56889E]">
            Optical Field Screening Protocol • ISO/TR 21960 Particle Classification & ASTM D8332 Compliant Workflow
          </div>
        </div>
      </footer>
    </div>
  );
};
export default Layout;
