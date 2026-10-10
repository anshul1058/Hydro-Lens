import React, { useState, useEffect } from 'react';
import { Sliders, ShieldCheck, Cpu, Clock, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useCalibration } from '../hooks/useCalibration';
import { computeFactorFft, computeFactorManual, saveCalibration } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { BeadChart } from '../components/BeadChart';

export const CalibrationPage: React.FC = () => {
  const { calibrationStatus, loading: calLoading, refetch } = useCalibration();

  // Wizard state
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [computedFactor, setComputedFactor] = useState<number>(0.417);
  const [knownSpacingUm, setKnownSpacingUm] = useState<number>(10.0);
  const [fftFile, setFftFile] = useState<File | null>(null);
  const [fftLoading, setFftLoading] = useState<boolean>(false);

  // Manual entry state
  const [pixelDistance, setPixelDistance] = useState<number>(24);
  const [numDivisions, setNumDivisions] = useState<number>(1);
  const [manualLoading, setManualLoading] = useState<boolean>(false);

  // Validation bead inputs (Step 2)
  const [bead10, setBead10] = useState<number>(11.2);
  const [bead50, setBead50] = useState<number>(48.5);
  const [bead100, setBead100] = useState<number>(97.1);
  const [magnification, setMagnification] = useState<string>('200x');
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (calibrationStatus?.record) {
      if (calibrationStatus.record.factor_um_per_px) {
        setComputedFactor(calibrationStatus.record.factor_um_per_px);
      }
      if (calibrationStatus.record.magnification) {
        setMagnification(calibrationStatus.record.magnification);
      }
      if (calibrationStatus.record.validation) {
        const val = calibrationStatus.record.validation;
        if (val.bead_10um?.measured) setBead10(val.bead_10um.measured);
        if (val.bead_50um?.measured) setBead50(val.bead_50um.measured);
        if (val.bead_100um?.measured) setBead100(val.bead_100um.measured);
      }
    }
  }, [calibrationStatus]);

  const handleCalculateFFT = async () => {
    if (!fftFile) {
      setMessage({ type: 'error', text: 'Please upload a stage micrometer scale image for FFT calculation.' });
      return;
    }
    setFftLoading(true);
    setMessage(null);
    try {
      const res = await computeFactorFft(fftFile, knownSpacingUm);
      setComputedFactor(res.factor_um_per_px);
      setActiveStep(2);
      setMessage({ type: 'success', text: `FFT Factor calculated: ${res.factor_um_per_px} µm/px. Step 1 Complete!` });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'FFT computation failed.' });
    } finally {
      setFftLoading(false);
    }
  };

  const handleCalculateManual = async () => {
    setManualLoading(true);
    setMessage(null);
    try {
      const res = await computeFactorManual({
        pixel_distance: pixelDistance,
        num_divisions: numDivisions,
        known_spacing_um: knownSpacingUm
      });
      setComputedFactor(res.factor_um_per_px);
      setActiveStep(2);
      setMessage({ type: 'success', text: `Manual Factor calculated: ${res.factor_um_per_px} µm/px. Flowing into Step 2!` });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Manual factor calculation failed.' });
    } finally {
      setManualLoading(false);
    }
  };

  const handleSaveCalibration = async () => {
    setSaveLoading(true);
    setMessage(null);
    try {
      await saveCalibration({
        factor_um_per_px: computedFactor,
        magnification: magnification,
        camera: '1920x1080 USB3 Sensor',
        microscope: 'USB Microscope',
        measured_beads: [bead10, bead50, bead100]
      });
      setMessage({ type: 'success', text: 'Calibration record saved and activated successfully!' });
      await refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save calibration.' });
    } finally {
      setSaveLoading(false);
    }
  };

  const record = calibrationStatus?.record;
  const quality = calibrationStatus?.quality ?? 0.0;

  return (
    <div className="space-y-6">
      {/* Top Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title">Calibration Portal</h1>
          <p className="text-body text-[#5294A8]">
            Configure micrometer scale factors and validate reference microsphere bead measurements.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 bg-white/70 hover:bg-white text-[#5294A8] hover:text-[#397C91] rounded-full border border-[#B9DFEA] shadow-xs transition-all"
          title="Refresh Calibration Status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Row of 4 Glass Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Scale Factor"
          value={`${computedFactor.toFixed(3)}`}
          subtitle="µm / pixel"
          valueColor="periwinkle"
          icon={<Sliders className="w-4 h-4" />}
        />

        <MetricCard
          label="Magnification"
          value={magnification}
          subtitle="Objective Optical Zoom"
          valueColor="default"
          icon={<Cpu className="w-4 h-4" />}
        />

        <MetricCard
          label="Status"
          value={
            calLoading ? (
              'Loading...'
            ) : quality === 1.0 ? (
              <span className="text-[14px] font-bold text-[#65C99A]">VALID &amp; ACTIVE</span>
            ) : quality === 0.5 ? (
              <span className="text-[14px] font-bold text-[#F5C75A]">STALE (&gt;7d)</span>
            ) : (
              <span className="text-[14px] font-bold text-[#F28B8B]">REQUIRED</span>
            )
          }
          subtitle={calibrationStatus?.reason ?? 'Check System Status'}
          valueColor={quality === 1.0 ? 'mint' : quality === 0.5 ? 'amber' : 'rose'}
          icon={<ShieldCheck className="w-4 h-4" />}
        />

        <MetricCard
          label="Expires"
          value={record?.expires ? record.expires.substring(0, 10) : 'N/A'}
          subtitle="7-Day Safety Rule"
          valueColor="default"
          icon={<Clock className="w-4 h-4" />}
        />
      </div>

      {/* Notification Toast/Message */}
      {message && (
        <div
          className={`p-4 rounded-[14px] border text-[13px] flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-[#65C99A]/20 border-[#65C99A]/40 text-[#397C91]'
              : 'bg-[#F28B8B]/20 border-[#F28B8B]/40 text-[#397C91]'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#65C99A] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#F28B8B] shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-[11px] font-semibold uppercase opacity-70">
            Dismiss
          </button>
        </div>
      )}

      {/* Two Columns: LEFT Calibration Wizard | RIGHT Reference Beads Validation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Calibration Wizard (2-Step Vertical Stepper) */}
        <div className="lg:col-span-6 bg-[#E8F8FC]/85 backdrop-blur-[20px] rounded-[18px] border border-[#B9DFEA] p-6 shadow-[0_8px_24px_rgba(57,124,145,0.08)] space-y-6">
          <h2 className="text-section-title">Calibration Wizard</h2>

          {/* Stepper Header */}
          <div className="flex items-center space-x-4 border-b border-[#B9DFEA] pb-3">
            <button
              onClick={() => setActiveStep(1)}
              className={`flex items-center space-x-2 text-[13px] font-semibold px-3 py-1.5 rounded-full transition-all ${
                activeStep === 1 ? 'bg-[#6BBFD8] text-white shadow-xs' : 'bg-white/70 text-[#5294A8]'
              }`}
            >
              <span>1. Scale Factor Calculation</span>
            </button>
            <ArrowRight className="w-4 h-4 text-[#5294A8]" />
            <button
              onClick={() => setActiveStep(2)}
              className={`flex items-center space-x-2 text-[13px] font-semibold px-3 py-1.5 rounded-full transition-all ${
                activeStep === 2 ? 'bg-[#6BBFD8] text-white shadow-xs' : 'bg-white/70 text-[#5294A8]'
              }`}
            >
              <span>2. Reference Bead Validation</span>
            </button>
          </div>

          {/* STEP 1: FFT & Manual Scale Calculation */}
          {activeStep === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-caption">Option A: Stage Micrometer FFT</span>
                <span className="text-[12px] font-medium text-[#3FA7C4]">Automated</span>
              </div>

              {/* Micrometer Thumbnail Upload */}
              <div className="p-3 border border-dashed border-[#6BBFD8]/40 rounded-[14px] bg-white/60 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src="/api/references/file/stage_micrometer_scale.png"
                    alt="Micrometer scale"
                    className="w-12 h-12 rounded-lg object-cover border border-[#B9DFEA]"
                  />
                  <div>
                    <p className="text-[13px] font-semibold text-[#397C91]">Stage Micrometer Image</p>
                    <p className="text-[11px] text-[#5294A8]">Upload or use default reference scale</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && setFftFile(e.target.files[0])}
                  className="text-[12px] text-[#5294A8] max-w-[140px]"
                />
              </div>

              {/* Known Line Spacing Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-caption">Known Line Spacing</label>
                  <span className="text-[13px] font-semibold text-[#397C91] tabular-nums">
                    {knownSpacingUm} µm
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={knownSpacingUm}
                  onChange={(e) => setKnownSpacingUm(Number(e.target.value))}
                  className="w-full accent-[#6BBFD8]"
                />
              </div>

              <button
                onClick={handleCalculateFFT}
                disabled={fftLoading}
                className="w-full py-2.5 bg-[#6BBFD8] hover:bg-[#5AAEC7] text-white text-[13px] font-semibold rounded-full shadow-xs transition-all flex items-center justify-center space-x-2"
              >
                <span>{fftLoading ? 'Processing FFT...' : 'Calculate via FFT'}</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#B9DFEA]" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-[#5294A8] bg-[#E8F8FC] px-3 rounded-full w-max mx-auto">
                  Option B: Manual Entry
                </div>
              </div>

              {/* Manual Entry Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-caption block mb-1">Pixel Distance</label>
                  <input
                    type="number"
                    value={pixelDistance}
                    onChange={(e) => setPixelDistance(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-[#B9DFEA] rounded-xl text-[13px] font-semibold text-[#397C91] tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-caption block mb-1">Num Divisions</label>
                  <input
                    type="number"
                    value={numDivisions}
                    onChange={(e) => setNumDivisions(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-[#B9DFEA] rounded-xl text-[13px] font-semibold text-[#397C91] tabular-nums"
                  />
                </div>
              </div>

              <button
                onClick={handleCalculateManual}
                disabled={manualLoading}
                className="w-full py-2 bg-white hover:bg-white/90 text-[#397C91] border border-[#6BBFD8]/40 text-[13px] font-semibold rounded-full transition-all"
              >
                <span>{manualLoading ? 'Calculating...' : 'Set Factor Manually'}</span>
              </button>
            </div>
          )}

          {/* STEP 2: Configure Magnification & Verification target */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-[#6BBFD8]/15 border border-[#6BBFD8]/35 rounded-[14px]">
                <p className="text-[12px] text-[#5294A8] uppercase tracking-wider">Active Computed Factor</p>
                <p className="text-[24px] font-bold text-[#397C91] tabular-nums my-0.5">
                  {computedFactor.toFixed(4)} <span className="text-[14px] font-normal text-[#5294A8]">µm/px</span>
                </p>
                <p className="text-[12px] text-[#5294A8]">
                  Factor carried into Step 2 verification target automatically.
                </p>
              </div>

              <div>
                <label className="text-caption block mb-1">Lens Magnification Tag</label>
                <select
                  value={magnification}
                  onChange={(e) => setMagnification(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#B9DFEA] rounded-xl text-[13px] font-semibold text-[#397C91]"
                >
                  <option value="100x">100x Optical</option>
                  <option value="200x">200x Optical (Default)</option>
                  <option value="400x">400x Optical</option>
                  <option value="1000x">1000x Oil Immersion</option>
                </select>
              </div>

              <button
                onClick={() => setActiveStep(1)}
                className="text-[12px] text-[#3FA7C4] hover:underline font-medium"
              >
                ← Back to recalculate factor in Step 1
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Validate Reference Beads (Chart + Inputs + Save) */}
        <div className="lg:col-span-6 bg-[#E8F8FC]/85 backdrop-blur-[20px] rounded-[18px] border border-[#B9DFEA] p-6 shadow-[0_8px_24px_rgba(57,124,145,0.08)] space-y-5">
          <div>
            <h2 className="text-section-title">Validate Reference Beads</h2>
            <p className="text-caption mt-0.5">
              Monodisperse polystyrene microsphere bead targets (10, 50, 100 µm)
            </p>
          </div>

          {/* Grouped Bar Chart */}
          <BeadChart
            beads={[
              { nominal: 10, measured: bead10 },
              { nominal: 50, measured: bead50 },
              { nominal: 100, measured: bead100 }
            ]}
          />

          {/* 3 Number Inputs beneath chart */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-caption block mb-1">10 µm Bead (µm)</label>
              <input
                type="number"
                step="0.1"
                value={bead10}
                onChange={(e) => setBead10(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-[#B9DFEA] rounded-xl text-[13px] font-semibold text-[#397C91] tabular-nums"
              />
            </div>

            <div>
              <label className="text-caption block mb-1">50 µm Bead (µm)</label>
              <input
                type="number"
                step="0.1"
                value={bead50}
                onChange={(e) => setBead50(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-[#B9DFEA] rounded-xl text-[13px] font-semibold text-[#397C91] tabular-nums"
              />
            </div>

            <div>
              <label className="text-caption block mb-1">100 µm Bead (µm)</label>
              <input
                type="number"
                step="0.1"
                value={bead100}
                onChange={(e) => setBead100(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-[#B9DFEA] rounded-xl text-[13px] font-semibold text-[#397C91] tabular-nums"
              />
            </div>
          </div>

          {/* Save & Activate Primary Button */}
          <button
            onClick={handleSaveCalibration}
            disabled={saveLoading}
            className="w-full py-3 bg-[#6BBFD8] hover:bg-[#5AAEC7] text-white text-[14px] font-semibold rounded-full shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{saveLoading ? 'Saving & Validating...' : 'Save & Activate Calibration'}</span>
          </button>
        </div>
      </div>

      {/* Footer Note explaining 7-day expiry rule */}
      <p className="text-[12px] text-[#5294A8] text-center pt-2 border-t border-[#B9DFEA]">
        System Expiry Rule: Calibration records expire exactly 7 days after timestamp creation to prevent optical drift degradation. Stale calibrations automatically reduce quantitative sample confidence scores to 0.5.
      </p>
    </div>
  );
};
