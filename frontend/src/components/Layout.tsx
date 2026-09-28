import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Microscope, SlidersHorizontal, Pulse } from '@phosphor-icons/react';

interface LayoutProps {
  children?: React.ReactNode;
}

const navItems = [
  { to: '/', label: 'Screening Analysis', icon: Microscope, end: true },
  { to: '/calibration', label: 'Scale Calibration', icon: SlidersHorizontal, end: false },
  { to: '/diagnostics', label: 'System Diagnostics', icon: Pulse, end: false }
];

export const Layout: React.FC<LayoutProps> = () => {
  return (
    <div className="min-h-screen flex flex-col bg-page text-ink-2 selection:bg-accent-tint selection:text-accent">
      {/* Top Header Chrome */}
      <header className="sticky top-0 z-50 bg-surface border-b border-line elev-1">
        <div className="max-w-[1240px] mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          <NavLink
            to="/"
            className="flex items-center gap-3 shrink-0 focus-visible:outline-accent"
            aria-label="Hydro Lens Home"
          >
            <span className="w-8 h-8 rounded-sm bg-accent flex items-center justify-center text-white shadow-xs">
              <Microscope size={18} weight="bold" />
            </span>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[15px] text-ink tracking-tight font-sans">Hydro Lens</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sm bg-sunken text-ink-3 border border-line">
                  v1.0
                </span>
              </div>
              <span className="block text-[11px] uppercase tracking-[0.06em] font-medium text-ink-3">
                Optical Microplastic Screening
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Primary Navigation">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }: { isActive: boolean }) =>
                  `px-3.5 py-1.5 text-[13px] font-medium flex items-center gap-2 rounded-md transition-colors duration-150 ${
                    isActive
                      ? 'bg-accent-tint text-accent font-semibold border border-accent-border'
                      : 'text-ink-2 hover:text-ink hover:bg-sunken border border-transparent'
                  }`
                }
              >
                <Icon size={16} weight="regular" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Instrument Readiness Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-sm bg-ok-tint border border-ok-border text-[12px] font-medium text-ok">
            <span className="w-2 h-2 rounded-full bg-ok" aria-hidden="true" />
            <span>Detector Ready</span>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-line flex items-stretch shadow-lg"
        aria-label="Primary Mobile Navigation"
      >
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }: { isActive: boolean }) =>
              `flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-accent font-semibold bg-accent-tint/50' : 'text-ink-3'
              }`
            }
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <Icon size={20} weight={isActive ? 'bold' : 'regular'} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-12">
        <Outlet />
      </main>

      {/* Laboratory Institutional Footer */}
      <footer className="border-t border-line bg-surface mt-auto">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[12.5px] text-ink-3">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="font-semibold text-ink">Hydro Lens</span>
            <span aria-hidden="true" className="text-line-strong">·</span>
            <span>Portable Optical Screening Platform</span>
            <span aria-hidden="true" className="text-line-strong">·</span>
            <span>Team Nishtha</span>
          </div>
          <nav className="flex items-center gap-5 text-[12px]" aria-label="Institutional Links">
            <NavLink to="/terms" className="hover:text-accent transition-colors underline-offset-4 hover:underline">
              Terms of Service
            </NavLink>
            <NavLink to="/privacy" className="hover:text-accent transition-colors underline-offset-4 hover:underline">
              Privacy Policy
            </NavLink>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
