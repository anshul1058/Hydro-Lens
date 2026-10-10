import { useState, useEffect, useCallback, useRef } from 'react';
import './IntroAnimation.css';

/** Session key used to suppress replay within the same browser session. */
const SESSION_KEY = 'hydrolens-intro-seen';

/** Total duration (ms) before auto-dismissing the intro. */
const INTRO_DURATION_MS = 3500;

/** Duration (ms) for the exit fade-out transition. */
const EXIT_TRANSITION_MS = 700;

/* ──────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────── */

function wasIntroSeen(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    // Storage unavailable (private mode, disabled, etc.) — treat as unseen.
    return false;
  }
}

function markIntroSeen(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // Silently ignore — user will simply see the intro again on next visit.
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ──────────────────────────────────────────────────────────────
   IntroAnimation Component
   ────────────────────────────────────────────────────────────── */

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'playing' | 'exiting' | 'done'>('playing');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Begin the exit transition, then signal completion. */
  const beginExit = useCallback(() => {
    if (phase !== 'playing') return;
    setPhase('exiting');

    timerRef.current = setTimeout(() => {
      markIntroSeen();
      setPhase('done');
      onComplete();
    }, EXIT_TRANSITION_MS);
  }, [phase, onComplete]);

  /* Auto-dismiss after INTRO_DURATION_MS. */
  useEffect(() => {
    /* If the user prefers reduced motion, use a shorter intro. */
    const duration = prefersReducedMotion() ? 1500 : INTRO_DURATION_MS;
    const id = setTimeout(beginExit, duration);
    return () => clearTimeout(id);
  }, [beginExit]);

  /* Cleanup on unmount. */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /* Don't render anything once the intro is completely finished. */
  if (phase === 'done') return null;

  const letters = ['H', 'y', 'd', 'r', 'o', 'L', 'e', 'n', 's'];

  return (
    <div
      className={`intro-overlay ${phase === 'exiting' ? 'intro-exiting' : ''}`}
      aria-hidden="true"
      role="presentation"
    >
      {/* ── Scientific Grid (SVG) ──────────────────────────── */}
      <div className="intro-grid">
        <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <pattern id="intro-grid-sm" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(107,191,216,0.06)" strokeWidth="0.5" />
            </pattern>
            <pattern id="intro-grid-lg" width="200" height="200" patternUnits="userSpaceOnUse">
              <rect width="200" height="200" fill="url(#intro-grid-sm)" />
              <path d="M 200 0 L 0 0 0 200" fill="none" stroke="rgba(107,191,216,0.1)" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#intro-grid-lg)" />
        </svg>
      </div>

      {/* ── Floating Microplastic Particles ────────────────── */}
      <div className="intro-particles">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="intro-particle" />
        ))}
      </div>

      {/* ── Lens / Scanner Ring ─────────────────────────────── */}
      <div className="intro-lens" />

      {/* ── Central Glow ───────────────────────────────────── */}
      <div className="intro-glow" />

      {/* ── Scan Beam ──────────────────────────────────────── */}
      <div className="intro-scan-beam" />

      {/* ── Corner Crosshairs ──────────────────────────────── */}
      {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
        <svg key={pos} className={`intro-crosshair intro-crosshair--${pos}`} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="0" x2="16" y2="0" stroke="rgba(107,191,216,0.5)" strokeWidth="1" />
          <line x1="0" y1="0" x2="0" y2="16" stroke="rgba(107,191,216,0.5)" strokeWidth="1" />
          <circle cx="0" cy="0" r="2" fill="rgba(107,191,216,0.4)" />
        </svg>
      ))}

      {/* ── Brand Reveal ───────────────────────────────────── */}
      <div className="intro-brand">
        {/* HydroLens Real Logo */}
        <div className="intro-icon-container">
          <img
            src="/logo.png"
            alt="HydroLens Logo"
            className="intro-logo-img"
          />
        </div>

        {/* Wordmark */}
        <div className="intro-wordmark">
          {letters.map((char, i) => (
            <span key={i} className="intro-letter">{char}</span>
          ))}
        </div>

        {/* Horizontal line divider */}
        <div className="intro-line" />

        {/* Subtitle */}
        <span className="intro-subtitle">Microplastic Screening System</span>
      </div>

      {/* ── Progress Bar ───────────────────────────────────── */}
      <div className="intro-progress" />

      {/* ── Skip Button ────────────────────────────────────── */}
      <button
        className="intro-skip"
        onClick={beginExit}
        type="button"
        aria-label="Skip intro animation"
      >
        Skip Intro
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="13 17 18 12 13 7" />
          <polyline points="6 17 11 12 6 7" />
        </svg>
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Wrapper: Only mounts IntroAnimation when needed.
   Usage:  <IntroGuard>  <App /> </IntroGuard>
   ────────────────────────────────────────────────────────────── */

export function IntroGuard({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(() => !wasIntroSeen());

  const handleComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  return (
    <>
      {showIntro && <IntroAnimation onComplete={handleComplete} />}
      {/* Always render children underneath so the homepage is ready behind the overlay */}
      <div style={{ visibility: showIntro ? 'hidden' : 'visible' }}>
        {children}
      </div>
    </>
  );
}
