import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth } from './components/RequireAuth';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/Login';
import { AnalyzePage } from './pages/Analyze';
import { CalibrationPage } from './pages/Calibration';
import { DiagnosticsPage } from './pages/Diagnostics';
import { IntroGuard } from './components/IntroAnimation';

export function App() {
  return (
    <AuthProvider>
      <IntroGuard>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route rendered OUTSIDE Layout */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Application Routes wrapped in Layout + RequireAuth */}
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<AnalyzePage />} />
              <Route path="calibration" element={<CalibrationPage />} />
              <Route path="diagnostics" element={<DiagnosticsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </IntroGuard>
    </AuthProvider>
  );
}

export default App;
