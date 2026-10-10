import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { AnalyzePage } from './pages/Analyze';
import { CalibrationPage } from './pages/Calibration';
import { DiagnosticsPage } from './pages/Diagnostics';
import { LoginPage } from './pages/Login';
import { IntroAnimation } from './components/IntroAnimation';

const STORAGE_KEY = 'hydrolens_intro_shown';

function shouldPlayIntro(): boolean {
  try {
    if (typeof window === 'undefined') return false;

    // Check query params for forced replay or bypass
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('intro') === '0' || urlParams.get('skip') === '1') {
      return false;
    }
    if (urlParams.get('intro') === '1' || urlParams.get('replay') === 'true') {
      return true;
    }

    // Check user preference for reduced motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }

    // Check sessionStorage
    const hasSeen = sessionStorage.getItem(STORAGE_KEY);
    return hasSeen !== 'true';
  } catch {
    // Fallback if storage is blocked or restricted
    return true;
  }
}

export function App() {
  const [showIntro, setShowIntro] = useState<boolean>(() => shouldPlayIntro());

  const handleIntroComplete = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Graceful fallback for restricted environments
    }
    setShowIntro(false);
  }, []);

  // Listen for custom trigger to replay the cinematic intro anytime
  useEffect(() => {
    const handleReplayIntro = () => {
      setShowIntro(true);
    };
    window.addEventListener('hydrolens:replay-intro', handleReplayIntro);
    return () => window.removeEventListener('hydrolens:replay-intro', handleReplayIntro);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Real-time 3D Cinematic Opening Animation */}
        {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<AnalyzePage />} />
            <Route path="calibration" element={<CalibrationPage />} />
            <Route path="diagnostics" element={<DiagnosticsPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="*" element={<AnalyzePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
