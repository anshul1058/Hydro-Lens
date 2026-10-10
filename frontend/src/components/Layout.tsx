<<<<<<< HEAD
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Microscope, Sliders, ShieldCheck, Activity, Sparkles, Waves } from 'lucide-react';
=======
import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Microscope,
  Sliders,
  Activity,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import logoImg from '../assets/logo.png';
>>>>>>> origin/main

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Get active page title
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/calibration':
        return 'Calibration Portal & Bead Validation';
      case '/diagnostics':
        return 'System Diagnostics & Model Metrics';
      default:
        return 'Microplastic Sample Analysis';
    }
  };

  const navItems = [
    {
      to: '/',
      label: 'Sample Analysis',
      icon: Microscope,
      end: true,
      badge: 'Live',
    },
    {
      to: '/calibration',
      label: 'Calibration Portal',
      icon: Sliders,
      badge: '7-Day',
    },
    {
      to: '/diagnostics',
      label: 'System Diagnostics',
      icon: Activity,
      badge: 'Model v1',
    },
  ];

  return (
<<<<<<< HEAD
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
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('hydrolens:replay-intro'))}
            className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-[#0284C7] hover:text-[#0369A1] border border-[#BBE4F2] text-[12px] font-semibold transition-all hover:shadow-xs cursor-pointer"
            title="Replay 3D Intro Animation"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Replay 3D Intro</span>
          </button>

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
=======
    <div className="min-h-screen flex bg-[#eff3ff] text-[#1E2A38] selection:bg-[#4a90d9]/20 selection:text-[#1E2A38]">
      
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Left Docked Sidebar (72px <-> 240px) ── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#9ecae1]/30 backdrop-blur-xl border-r border-[#9ecae1] transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[76px]' : 'w-[250px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Block */}
        <div className="h-[72px] px-4 flex items-center justify-between border-b border-[#9ecae1]">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-[#9ecae1] shadow-xs flex items-center justify-center shrink-0">
              <img src={logoImg} alt="Hydro Lens" className="w-full h-full object-contain" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-[16px] text-[#1E2A38] tracking-tight truncate">
                    Hydro Lens
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-[#4a90d9] text-white">
                    v1.0
                  </span>
                </div>
                <p className="text-[10px] text-[#4a90d9] font-semibold uppercase tracking-wider truncate">
                  AI Screening
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-6 h-6 rounded-lg bg-white/80 hover:bg-white text-[#1E2A38] border border-[#9ecae1] items-center justify-center transition-colors shadow-2xs"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-[#1E2A38] hover:bg-white/50 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center rounded-xl transition-all duration-200 ${
                    collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5 space-x-3'
                  } ${
                    isActive
                      ? 'bg-[#4a90d9] text-white font-semibold shadow-sm'
                      : 'text-[#1E2A38]/80 hover:bg-white/80 hover:text-[#1E2A38] font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active Left Accent Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-r-full" />
                    )}

                    <Icon
                      className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? 'text-white' : 'text-[#4a90d9]'
                      }`}
                    />

                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="text-[13px] truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-[#9ecae1]/40 text-[#1E2A38]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tooltip on collapsed */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#1E2A38] text-white text-[12px] font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                        {item.label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section: Calibration Quality Mini-Widget & Operator Profile */}
        <div className="p-3 border-t border-[#9ecae1] space-y-2.5 bg-white/40">
          
          {/* Calibration quality status mini-widget */}
          {!collapsed ? (
            <div className="p-2.5 rounded-xl bg-white/80 border border-[#9ecae1] shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#1E2A38]">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2ECC91] animate-pulse" />
                  <span>Optics Active</span>
                </span>
                <span className="text-[#4a90d9] font-mono">1.24 µm/px</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-[#6b7a90]">
                <span>Validity: 7-Day Rule</span>
                <span className="text-[#2ECC91] font-bold">Passed</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title="Optics Status: Calibrated (1.24 µm/px)">
              <div className="w-8 h-8 rounded-full bg-[#2ECC91]/15 border border-[#2ECC91]/40 flex items-center justify-center text-[#2ECC91]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Operator Chip + Logout */}
          <div
            className={`flex items-center rounded-xl p-2 bg-white/70 border border-[#9ecae1] ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
>>>>>>> origin/main
          >
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#4a90d9]/20 text-[#4a90d9] border border-[#4a90d9]/30 flex items-center justify-center font-bold text-[12px] shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[#1E2A38] truncate">
                    {user?.name || 'Primary Operator'}
                  </p>
                  <p className="text-[10px] text-[#6b7a90] truncate">
                    {user?.labCode || 'LAB-09'}
                  </p>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 text-[#6b7a90] hover:text-[#FF6B6B] hover:bg-white rounded-lg transition-colors"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {collapsed && (
            <button
              onClick={logout}
              title="Sign out"
              className="w-full py-1.5 flex items-center justify-center text-[#6b7a90] hover:text-[#FF6B6B] hover:bg-white rounded-lg transition-colors"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

        </div>
      </aside>

<<<<<<< HEAD
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
=======
      {/* ── Main Layout Wrapper ── */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-[250px]'
        }`}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-[64px] bg-[#eff3ff]/90 backdrop-blur-md border-b border-[#9ecae1] px-4 sm:px-6 flex items-center justify-between">
          
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white border border-[#9ecae1] text-[#1E2A38]"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-[16px] sm:text-[18px] font-bold text-[#1E2A38] tracking-tight">
                {getPageTitle()}
              </h1>
              <p className="text-[11px] text-[#6b7a90] font-medium hidden sm:block">
                On-device optical screening &amp; particle classification
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/80 text-[#1E2A38] border border-[#9ecae1] text-[12px] font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#2ECC91] animate-pulse" />
              <span>Pipeline Ready</span>
            </div>

            <NavLink
              to="/calibration"
              className="px-4 py-2 bg-[#4a90d9] hover:bg-[#3a7bc0] active:scale-95 text-white text-[13px] font-semibold rounded-full shadow-xs transition-all flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Calibration</span>
            </NavLink>
          </div>
        </header>

        {/* Dashboard Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto animate-in fade-in duration-200">
          <Outlet />
        </main>

        {/* Dashboard Footer */}
        <footer className="py-4 px-6 border-t border-[#9ecae1] bg-white/40 text-center text-[12px] text-[#6b7a90] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <img src={logoImg} alt="Hydro Lens" className="w-4 h-4 object-contain" />
            <span>Hydro Lens • Portable AI Microplastic Screening</span>
          </div>
          <span className="text-[11px] font-medium">HackMatrix 5.0 • Team Nishtha</span>
        </footer>
      </div>

>>>>>>> origin/main
    </div>
  );
};
export default Layout;
