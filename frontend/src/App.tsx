import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AnalyzePage } from './pages/Analyze';
import { CalibrationPage } from './pages/Calibration';
import { DiagnosticsPage } from './pages/Diagnostics';
import { TermsPage } from './pages/Terms';
import { PrivacyPage } from './pages/Privacy';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<AnalyzePage />} />
          <Route path="calibration" element={<CalibrationPage />} />
          <Route path="diagnostics" element={<DiagnosticsPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="*" element={<AnalyzePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
