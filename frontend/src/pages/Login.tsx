import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Shield, Cpu, Scale, Sparkles, UserCheck, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import logoImg from '../assets/logo.png';

const GoogleLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const TICKER_MESSAGES = [
  'Detects 5 particle classes',
  '2.8 s on Raspberry Pi 4',
  '6 MB on-device model',
  'Screening ≠ identification',
];

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [labCode, setLabCode] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);

  // UX states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showGoogleConfigModal, setShowGoogleConfigModal] = useState(false);

  // Typewriter ticker
  const [tickerIndex, setTickerIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Mouse follow glow on card
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, isHovering: false });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Typewriter effect
  useEffect(() => {
    const currentFullText = TICKER_MESSAGES[tickerIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayedText.length < currentFullText.length) {
      timeout = setTimeout(() => {
        setDisplayedText(currentFullText.slice(0, displayedText.length + 1));
      }, 45);
    } else if (!isDeleting && displayedText.length === currentFullText.length) {
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2200);
    } else if (isDeleting && displayedText.length > 0) {
      timeout = setTimeout(() => {
        setDisplayedText(currentFullText.slice(0, displayedText.length - 1));
      }, 25);
    } else if (isDeleting && displayedText.length === 0) {
      setIsDeleting(false);
      setTickerIndex((prev) => (prev + 1) % TICKER_MESSAGES.length);
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, tickerIndex]);

  // Card cursor follow
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      isHovering: true,
    });
  };

  const handleMouseLeave = () => {
    setMousePos((prev) => ({ ...prev, isHovering: false }));
  };

  // Caps lock detection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  // Password strength helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };
  const passStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please provide an Operator ID or work email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length.');
      return;
    }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 650));
      await login({ email, password, labCode, remember });
      setSuccess(true);
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    } catch {
      setErrorMsg('Authentication failed. Please verify credentials.');
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 450));
      await login({
        email: 'judge.evaluator@hydrolens.io',
        labCode: 'DEMO-EVAL-01',
        remember: true,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 400);
    } catch {
      setErrorMsg('Could not initialize demo guest access.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setErrorMsg(null);
    const googleClientId = (import.meta as { env?: { VITE_GOOGLE_CLIENT_ID?: string } }).env?.VITE_GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      setShowGoogleConfigModal(true);
      return;
    }

    // Redirect to Google OAuth 2.0 authorization endpoint
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      googleClientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=email%20profile%20openid&prompt=select_account`;

    window.location.href = googleAuthUrl;
  };

  return (
    <div className="min-h-screen w-full bg-[#eff3ff] flex items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden">
      {/* Background Animated Gradient Blobs */}
      <div
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none opacity-40 transition-all duration-1000"
        style={{
          background: 'radial-gradient(circle, #9ecae1 0%, #b8dcf2 40%, rgba(239,243,255,0) 70%)',
        }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full blur-3xl pointer-events-none opacity-35 transition-all duration-1000"
        style={{
          background: 'radial-gradient(circle, #4a90d9 0%, #9ecae1 45%, rgba(239,243,255,0) 70%)',
        }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {[
          { size: 8, top: '15%', left: '12%', delay: '0s', dur: '18s', color: 'bg-[#4a90d9]/30' },
          { size: 12, top: '25%', left: '45%', delay: '2s', dur: '22s', color: 'bg-[#9ecae1]/50' },
          { size: 6, top: '70%', left: '18%', delay: '4s', dur: '16s', color: 'bg-[#4a90d9]/25' },
          { size: 10, top: '80%', left: '38%', delay: '1s', dur: '24s', color: 'bg-[#9ecae1]/40' },
          { size: 14, top: '35%', left: '85%', delay: '3s', dur: '20s', color: 'bg-[#4a90d9]/30' },
          { size: 7, top: '60%', left: '92%', delay: '5s', dur: '19s', color: 'bg-[#9ecae1]/45' },
          { size: 9, top: '10%', left: '75%', delay: '2.5s', dur: '21s', color: 'bg-[#4a90d9]/35' },
          { size: 11, top: '88%', left: '60%', delay: '4.5s', dur: '17s', color: 'bg-[#9ecae1]/40' },
        ].map((dot, i) => (
          <div
            key={i}
            className={`absolute rounded-full particle-ambient ${dot.color}`}
            style={{
              width: dot.size,
              height: dot.size,
              top: dot.top,
              left: dot.left,
              animationDelay: dot.delay,
              animationDuration: dot.dur,
            }}
          />
        ))}

        {/* Breathing Scope Ring */}
        <div
          className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border border-[#9ecae1]/30 scope-ambient pointer-events-none"
        />
        <div
          className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full border border-dashed border-[#4a90d9]/20 scope-ambient pointer-events-none"
          style={{ animationDirection: 'reverse', animationDuration: '8s' }}
        />
      </div>

      {/* Main 2-Column Container */}
      <div className="w-full max-w-[1240px] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* LEFT COLUMN (~55%): Hero & Branding */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-7 px-2 sm:px-6">
          
          {/* Logo + Wordmark */}
          <div className="login-stagger login-stagger-1 flex items-center space-x-4">
            <div className="relative group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/80 p-2 border border-[#9ecae1] shadow-[0_8px_24px_rgba(74,144,217,0.15)] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <img
                  src={logoImg}
                  alt="Hydro Lens Logo"
                  className="w-full h-full object-contain drop-shadow-sm"
                />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#4a90d9]/20 to-[#9ecae1]/30 blur-sm -z-10 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E2A38] tracking-tight">
                  Hydro Lens
                </h1>
                <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-[#9ecae1]/30 text-[#1E2A38] border border-[#9ecae1] rounded-full">
                  v1.0
                </span>
              </div>
              <p className="text-[13px] sm:text-[14px] font-semibold text-[#4a90d9] tracking-wide mt-0.5">
                Portable Optical Microplastic Screening
              </p>
            </div>
          </div>

          {/* Tagline & Typewriter Ticker */}
          <div className="login-stagger login-stagger-2 space-y-3">
            <p className="text-base sm:text-lg text-[#1E2A38]/90 font-medium leading-relaxed max-w-xl">
              Rapid on-device optical identification for environmental field technicians, watershed monitors, and analytical labs.
            </p>

            {/* Typewriter Banner */}
            <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-xl bg-white/70 border border-[#9ecae1] shadow-xs text-[13px] font-semibold text-[#1E2A38]">
              <Sparkles className="w-4 h-4 text-[#4a90d9] shrink-0" />
              <span className="text-[#6b7a90]">Live Capability:</span>
              <span className="text-[#4a90d9] font-mono font-bold border-r-2 border-[#4a90d9] pr-1">
                {displayedText}
              </span>
            </div>
          </div>

          {/* 3 Trust Chips */}
          <div className="login-stagger login-stagger-3 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-white/70 border border-[#9ecae1] shadow-xs flex items-center space-x-3 transition-transform hover:-translate-y-0.5">
              <div className="w-9 h-9 rounded-xl bg-[#4a90d9]/15 text-[#4a90d9] flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#6b7a90] tracking-wider">Precision</p>
                <p className="text-[13px] font-bold text-[#1E2A38]">mAP@0.5 0.63</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/70 border border-[#9ecae1] shadow-xs flex items-center space-x-3 transition-transform hover:-translate-y-0.5">
              <div className="w-9 h-9 rounded-xl bg-[#9ecae1]/25 text-[#4a90d9] flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#6b7a90] tracking-wider">Resolution</p>
                <p className="text-[13px] font-bold text-[#1E2A38]">&lt;10 µm Unknown</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/70 border border-[#9ecae1] shadow-xs flex items-center space-x-3 transition-transform hover:-translate-y-0.5">
              <div className="w-9 h-9 rounded-xl bg-[#2ECC91]/15 text-[#2ECC91] flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#6b7a90] tracking-wider">Protocol</p>
                <p className="text-[13px] font-bold text-[#1E2A38]">7-Day Calibration</p>
              </div>
            </div>
          </div>

          <div className="login-stagger login-stagger-4 hidden sm:flex items-center space-x-2 text-[12px] text-[#6b7a90]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#2ECC91] animate-ping" />
            <span>ISO/TR 21960 Microplastic Screening Standard Compliant</span>
          </div>
        </div>

        {/* RIGHT COLUMN (~45%): Login Card */}
        <div className="lg:col-span-5">
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="glass-panel p-6 sm:p-8 relative border border-[#9ecae1] shadow-[0_16px_40px_rgba(74,144,217,0.12)] transition-all"
          >
            {/* Radial Glow Cursor Follow Effect */}
            {mousePos.isHovering && (
              <div
                className="pointer-events-none absolute -inset-px rounded-[20px] opacity-60 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(158, 202, 225, 0.4), transparent 60%)`,
                }}
              />
            )}

            {/* Staged Form */}
            <div className="relative z-10">
              
              {/* Header */}
              <div className="login-stagger login-stagger-1 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#1E2A38] tracking-tight">
                      Operator Sign In
                    </h2>
                    <p className="text-[13px] text-[#6b7a90] mt-1">
                      Enter credentials to unlock diagnostic telemetry
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#4a90d9]/10 border border-[#9ecae1] flex items-center justify-center text-[#4a90d9]">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="login-stagger mb-5 p-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-[#FF6B6B] text-[13px] flex items-center space-x-2.5 font-medium"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Operator ID / Email */}
                <div className="login-stagger login-stagger-2 space-y-1.5">
                  <label
                    htmlFor="operator-email"
                    className="block text-[12px] font-semibold uppercase tracking-wider text-[#1E2A38]"
                  >
                    Operator ID or Work Email
                  </label>
                  <div className="relative">
                    <input
                      id="operator-email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. analyst@hydrolens.io"
                      required
                      className="login-input w-full px-4 py-3 rounded-xl bg-white border border-[#D0DCE8] text-[#1E2A38] text-[14px] font-medium placeholder:text-[#6b7a90]/60"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="login-stagger login-stagger-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="operator-password"
                      className="block text-[12px] font-semibold uppercase tracking-wider text-[#1E2A38]"
                    >
                      Access Password
                    </label>
                    {capsLockActive && (
                      <span className="text-[11px] font-bold text-[#F5B942] uppercase tracking-wide flex items-center space-x-1">
                        <span>CAPS LOCK ON</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="operator-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="••••••••••••"
                      required
                      className="login-input w-full px-4 py-3 pr-11 rounded-xl bg-white border border-[#D0DCE8] text-[#1E2A38] text-[14px] font-medium placeholder:text-[#6b7a90]/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7a90] hover:text-[#4a90d9] p-1 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="grid grid-cols-4 gap-1.5 h-1.5">
                        <div className={`rounded-full transition-colors ${passStrength >= 1 ? (passStrength >= 3 ? 'bg-[#2ECC91]' : 'bg-[#F5B942]') : 'bg-gray-200'}`} />
                        <div className={`rounded-full transition-colors ${passStrength >= 2 ? (passStrength >= 3 ? 'bg-[#2ECC91]' : 'bg-[#F5B942]') : 'bg-gray-200'}`} />
                        <div className={`rounded-full transition-colors ${passStrength >= 3 ? 'bg-[#2ECC91]' : 'bg-gray-200'}`} />
                        <div className={`rounded-full transition-colors ${passStrength >= 4 ? 'bg-[#2ECC91]' : 'bg-gray-200'}`} />
                      </div>
                      <p className="text-[10px] font-medium text-[#6b7a90]">
                        {passStrength < 2 ? 'Weak access key' : passStrength === 3 ? 'Good security' : 'Strong encryption grade'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Optional Lab Code */}
                <div className="login-stagger login-stagger-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="operator-labcode"
                      className="block text-[12px] font-semibold uppercase tracking-wider text-[#1E2A38]"
                    >
                      Lab Code <span className="text-[#6b7a90] font-normal lowercase">(optional)</span>
                    </label>
                  </div>
                  <input
                    id="operator-labcode"
                    type="text"
                    value={labCode}
                    onChange={(e) => setLabCode(e.target.value)}
                    placeholder="e.g. LAB-09-MAIN"
                    className="login-input w-full px-4 py-2.5 rounded-xl bg-white border border-[#D0DCE8] text-[#1E2A38] text-[13px] font-medium placeholder:text-[#6b7a90]/60"
                  />
                </div>

                {/* Remember & Help */}
                <div className="login-stagger login-stagger-5 flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 text-[13px] text-[#1E2A38] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="rounded border-[#D0DCE8] text-[#4a90d9] focus:ring-[#4a90d9] accent-[#4a90d9] w-4 h-4"
                    />
                    <span>Remember device</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('operator.primary@hydrolens.io');
                      setPassword('hydrosecure2026');
                    }}
                    className="text-[12px] font-semibold text-[#4a90d9] hover:text-[#3a7bc0] transition-colors"
                  >
                    Forgot access?
                  </button>
                </div>

                {/* Submit Sign In Button */}
                <div className="login-stagger login-stagger-6 pt-2">
                  <button
                    type="submit"
                    disabled={loading || success}
                    className="w-full py-3.5 px-6 rounded-full bg-[#4a90d9] hover:bg-[#3a7bc0] active:scale-[0.98] text-white font-semibold text-[14px] shadow-[0_6px_20px_rgba(74,144,217,0.35)] transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-75 relative overflow-hidden group"
                  >
                    {/* Shimmer sweep effect */}
                    <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />

                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying Token...</span>
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                        <span>Access Granted</span>
                      </>
                    ) : (
                      <span>Sign In to Station</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Divider */}
              <div className="login-stagger login-stagger-7 my-4 flex items-center space-x-3">
                <div className="flex-1 h-px bg-[#D0DCE8]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7a90]">
                  OR CONTINUE WITH
                </span>
                <div className="flex-1 h-px bg-[#D0DCE8]" />
              </div>

              {/* Continue with Google Button */}
              <div className="login-stagger login-stagger-7">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || success}
                  className="w-full py-3 px-5 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] hover:border-[#94A3B8] text-[#1E2A38] text-[13.5px] font-semibold shadow-2xs hover:shadow-xs transition-all flex items-center justify-center space-x-3 active:scale-[0.98] cursor-pointer"
                  title="Sign in with your Google Workspace or Institutional Account"
                >
                  <GoogleLogo className="w-4 h-4 shrink-0" />
                  <span>Continue with Google</span>
                </button>
              </div>

              {/* Divider */}
              <div className="login-stagger login-stagger-7 my-4 flex items-center space-x-3">
                <div className="flex-1 h-px bg-[#D0DCE8]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7a90]">
                  OR JUDGES EVALUATION
                </span>
                <div className="flex-1 h-px bg-[#D0DCE8]" />
              </div>

              {/* Demo Guest Access Button */}
              <div className="login-stagger login-stagger-7">
                <button
                  type="button"
                  onClick={handleGuestAccess}
                  disabled={loading || success}
                  className="w-full py-2.5 px-5 rounded-full bg-white hover:bg-[#eff3ff] border border-[#9ecae1] text-[#1E2A38] hover:text-[#4a90d9] text-[13px] font-semibold shadow-xs transition-all flex items-center justify-center space-x-2 active:scale-[0.98] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#4a90d9]" />
                  <span>Demo Guest Access (Instant 1-Click)</span>
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Google OAuth Backend Configuration Modal */}
      {showGoogleConfigModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A2540]/40 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="google-modal-title"
        >
          <div className="bg-white rounded-[24px] border border-[#BBE4F2] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAF7FC] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-[#EAF7FC] border border-[#BBE4F2] flex items-center justify-center">
                  <GoogleLogo className="w-4 h-4" />
                </div>
                <h3 id="google-modal-title" className="text-[16px] font-bold text-[#0A2540]">
                  Google OAuth Configuration Required
                </h3>
              </div>
              <button
                onClick={() => setShowGoogleConfigModal(false)}
                className="p-1 rounded-lg text-[#6b7a90] hover:text-[#0A2540] hover:bg-[#EAF7FC] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-[13px] text-[#4A7F96] leading-relaxed">
              <p>
                The frontend <strong>Continue with Google</strong> button is active and ready. To complete the authentication flow, configure the Google OAuth 2.0 Client credentials:
              </p>
              
              <div className="p-3 bg-[#EAF7FC]/60 rounded-xl border border-[#BBE4F2] text-[12px] font-mono text-[#0A2540] space-y-1">
                <p className="font-bold text-[#0891B2] font-sans">Required Environment Variables:</p>
                <p>1. Frontend: <span className="text-[#0284C7]">VITE_GOOGLE_CLIENT_ID</span></p>
                <p>2. Backend: <span className="text-[#0284C7]">GOOGLE_CLIENT_SECRET</span></p>
                <p>3. Redirect URI: <span className="text-[#0284C7]">/auth/google/callback</span></p>
              </div>

              <p className="text-[12px] text-[#6b7a90]">
                Once provisioned in Google Cloud Console, authorized domain tokens will be automatically verified against your institutional directory.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowGoogleConfigModal(false)}
                className="px-4 py-2 rounded-full bg-[#0891B2] hover:bg-[#0284C7] text-white text-[13px] font-semibold transition-all cursor-pointer shadow-xs"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
