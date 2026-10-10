import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Microscope, Sliders, Activity, Sparkles, User, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { HydroLensLogo } from './HydroLensLogo';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    {
      to: '/',
      label: 'Sample Analysis',
      icon: Microscope,
      end: true
    },
    {
      to: '/calibration',
      label: 'Calibration Portal',
      icon: Sliders,
      end: false
    },
    {
      to: '/diagnostics',
      label: 'System Diagnostics',
      icon: Activity,
      end: false
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#EBF7FC] text-[#0F334A] relative overflow-x-hidden hex-grid-pattern">
      {/* Ambient Scientific Lighting Orbs in Background */}
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

      {/* Fixed 72px Modern Scientific Header */}
      <header className="fixed top-0 left-0 right-0 h-[72px] bg-white/92 backdrop-blur-[24px] border-b border-[#BBE4F2] shadow-[0_4px_24px_rgba(8,145,178,0.06)] z-50 px-4 sm:px-6 flex items-center justify-between transition-all">
        {/* TOP-LEFT CORNER: SVG Logo */}
        <div className="flex items-center space-x-3 shrink-0">
          <NavLink to="/" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] rounded-xl" title="Hydro-Lens Home">
            <HydroLensLogo size="md" showText={true} />
          </NavLink>
        </div>

        {/* TOP-CENTER: The Three Navigation Buttons with Premium Glassmorphism */}
        <nav 
          aria-label="Main Navigation"
          className="hidden md:flex items-center space-x-1.5 p-1.5 rounded-2xl glass-nav-group transition-all"
        >
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `group relative px-3.5 sm:px-4 py-2 rounded-xl text-[13px] font-semibold flex items-center space-x-2 select-none cursor-pointer glass-nav-btn ${
                    isActive ? 'active' : ''
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                        isActive ? 'text-[#0284C7]' : 'text-[#0891B2]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] shadow-[0_0_6px_rgba(2,132,199,0.7)] ml-0.5" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* TOP-RIGHT CORNER: Replay Intro, Profile, Log Out & Mobile Menu */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('hydrolens:replay-intro'))}
            className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/70 hover:bg-white text-[#0284C7] hover:text-[#0369A1] border border-[#BBE4F2] text-[12px] font-semibold transition-all hover:shadow-xs cursor-pointer"
            title="Replay 3D Intro Animation"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Replay 3D Intro</span>
          </button>

          {/* Profile & Log Out Controls */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/80 hover:bg-white border border-[#BBE4F2] transition-all cursor-pointer text-left shadow-2xs hover:shadow-xs"
                title="Active Operator Session"
                aria-label="Operator menu"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#0284C7] to-[#0891B2] text-white flex items-center justify-center text-[11px] font-bold shadow-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block leading-tight">
                  <p className="text-[11.5px] font-bold text-[#0A2540] truncate max-w-[110px]">
                    {user.name}
                  </p>
                  <p className="text-[9.5px] text-[#56889E] font-mono">
                    {user.labCode || 'LAB-09'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#56889E]" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-[#BBE4F2] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-2.5 border-b border-[#EAF7FC]">
                    <p className="text-[12.5px] font-bold text-[#0A2540] truncate">{user.name}</p>
                    <p className="text-[10px] text-[#56889E] font-mono truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-bold bg-[#EAF7FC] text-[#0284C7] px-2 py-0.5 rounded-full">
                      {user.role || 'Metrology Specialist'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full px-3.5 py-2 text-left text-[12px] font-semibold text-[#DC2626] hover:bg-[#FEECEB] flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <NavLink
              to="/login"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-[#0284C7] hover:text-[#0369A1] border border-[#BBE4F2] text-[12px] font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95"
              title="Operator / Laboratory Login"
            >
              <User className="w-3.5 h-3.5 text-[#0891B2]" />
              <span>Log In</span>
            </NavLink>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/80 hover:bg-white text-[#0A2540] border border-[#BBE4F2] transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Glassmorphism Dropdown Menu (on screens < md) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[72px] left-0 right-0 z-40 bg-white/95 backdrop-blur-[24px] border-b border-[#BBE4F2] shadow-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <p className="text-[11px] uppercase tracking-wider font-bold text-[#56889E] px-2">
            Navigation
          </p>
          <div className="space-y-1.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#0B2545] via-[#0284C7] to-[#0891B2] text-white shadow-sm'
                        : 'bg-white/60 text-[#2C637A] hover:bg-white hover:text-[#0A2540] border border-[#BBE4F2]/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Mobile Profile & Session Options */}
          <div className="pt-3 border-t border-[#BBE4F2]/50">
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between px-2 pt-1">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0284C7] to-[#0891B2] text-white flex items-center justify-center text-[11px] font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-[#0A2540]">{user.name}</p>
                    <p className="text-[10px] text-[#56889E] font-mono">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#DC2626] bg-[#FEECEB] hover:bg-[#FDD8D8] flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#0284C7] text-white text-[13px] font-bold"
              >
                <User className="w-4 h-4" />
                <span>Operator Log In</span>
              </NavLink>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area: Centered, Clean, Full Width (No Left Sidebar!) */}
      <main className="flex-1 pt-[88px] pb-16 lg:pb-12 px-4 sm:px-6 max-w-[1260px] w-full mx-auto">
        <Outlet />
      </main>

      {/* Clean, Minimal, Professional Scientific Footer */}
      <footer className="py-8 border-t border-[#BBE4F2] bg-white/85 backdrop-blur-md text-[#4A7F96] text-[12px] font-medium transition-colors">
        <div className="max-w-[1260px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#EAF7FC]">
            {/* Left: Brand Identity */}
            <div className="flex items-center space-x-3">
              <HydroLensLogo size="sm" showText={true} />
            </div>

            {/* Center: Navigation Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-[13px] font-semibold text-[#2C637A]">
              <NavLink to="/" className="hover:text-[#0284C7] transition-colors">
                Sample Analysis
              </NavLink>
              <NavLink to="/calibration" className="hover:text-[#0284C7] transition-colors">
                Calibration Portal
              </NavLink>
              <NavLink to="/diagnostics" className="hover:text-[#0284C7] transition-colors">
                System Diagnostics
              </NavLink>
              <NavLink to="/login" className="hover:text-[#0284C7] transition-colors">
                Operator Portal
              </NavLink>
            </div>

            {/* Right: Scientific Compliance Badges */}
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-full bg-[#EAF7FC] border border-[#BBE4F2] text-[11px] font-bold text-[#0284C7]">
                ISO/TR 21960
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#E6FBF2] border border-[#10B981]/30 text-[11px] font-bold text-[#059669]">
                ASTM D8332
              </span>
            </div>
          </div>

          {/* Bottom Copyright & Protocol Metadata */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#56889E]">
            <p>
              © 2026 Hydro-Lens Research Platform • Optical Field Microplastic Screening System.
            </p>
            <p className="flex items-center gap-2">
              <span>NIST Standard Traceability</span>
              <span>•</span>
              <span>YOLOv8 Morphology Inference</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
