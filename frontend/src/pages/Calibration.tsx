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
        known_spacing_um: knownSpacingUm,
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
        measured_beads: [bead10, bead50, bead100],
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
          <h1 className="text-[20px] sm:text-[24px] font-bold text-[#1E2A38] tracking-tight">
            Calibration Portal &amp; Optics Scaling
          </h1>
          <p className="text-[13px] text-[#6b7a90] font-medium mt-0.5">
            Configure micrometer scale factors and validate reference microsphere bead measurements.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 bg-white hover:bg-[#eff3ff] text-[#1E2A38] hover:text-[#4a90d9] rounded-full border border-[#9ecae1] shadow-2xs transition-all"
          title="Refresh Calibration Status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Row of 4 Metric Cards */}
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
              <span className="text-[13px] font-extrabold text-[#2ECC91]">VALID &amp; ACTIVE</span>
            ) : quality === 0.5 ? (
              <span className="text-[13px] font-extrabold text-[#F5B942]">STALE (&gt;7d)</span>
            ) : (
              <span className="text-[13px] font-extrabold text-[#FF6B6B]">REQUIRED</span>
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
          className={`p-4 rounded-2xl border text-[13px] flex items-center justify-between font-medium ${
            message.type === 'success'
              ? 'bg-[#2ECC91]/15 border-[#2ECC91]/30 text-[#1E2A38]'
              : 'bg-[#FF6B6B]/15 border-[#FF6B6B]/30 text-[#FF6B6B]'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#2ECC91] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#FF6B6B] shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-[11px] font-bold uppercase tracking-wider opacity-75 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Two Columns: LEFT Calibration Wizard | RIGHT Reference Beads Validation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: Calibration Wizard (2-Step Vertical Stepper) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#9ecae1] p-6 shadow-[0_4px_20px_rgba(74,144,217,0.06)] space-y-6">
          <h2 className="text-[16px] font-bold text-[#1E2A38]">Calibration Wizard</h2>

          {/* Stepper Header */}
          <div className="flex items-center space-x-2 border-b border-[#9ecae1] pb-3">
            <button
              onClick={() => setActiveStep(1)}
              className={`flex items-center space-x-2 text-[12px] font-bold px-3 py-1.5 rounded-full transition-all ${
                activeStep === 1 ? 'bg-[#4a90d9] text-white shadow-xs' : 'bg-[#eff3ff] text-[#6b7a90] hover:text-[#1E2A38]'
              }`}
            >
              <span>1. Scale Factor</span>
            </button>
            <ArrowRight className="w-3.5 h-3.5 text-[#6b7a90]" />
            <button
              onClick={() => setActiveStep(2)}
              className={`flex items-center space-x-2 text-[12px] font-bold px-3 py-1.5 rounded-full transition-all ${
                activeStep === 2 ? 'bg-[#4a90d9] text-white shadow-xs' : 'bg-[#eff3ff] text-[#6b7a90] hover:text-[#1E2A38]'
              }`}
            >
              <span>2. Bead Validation</span>
            </button>
          </div>

          {/* STEP 1: FFT & Manual Scale Calculation */}
          {activeStep === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7a90]">
                  Option A: Stage Micrometer FFT
                </span>
                <span className="text-[11px] font-bold uppercase bg-[#4a90d9]/10 text-[#4a90d9] px-2 py-0.5 rounded-full border border-[#9ecae1]">
                  Automated
                </span>
              </div>

              {/* Micrometer Thumbnail Upload */}
              <div className="p-3.5 border border-dashed border-[#9ecae1] rounded-xl bg-[#eff3ff]/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src="/api/references/file/stage_micrometer_scale.png"
                    alt="Micrometer scale"
                    className="w-12 h-12 rounded-lg object-cover border border-[#9ecae1] bg-white"
                  />
                  <div>
                    <p className="text-[13px] font-bold text-[#1E2A38]">Stage Micrometer Image</p>
                    <p className="text-[11px] text-[#6b7a90]">Upload or use default reference scale</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && setFftFile(e.target.files[0])}
                  className="text-[12px] text-[#6b7a90] max-w-[140px]"
                />
              </div>

              {/* Known Line Spacing Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#6b7a90]">
                    Known Line Spacing
                  </label>
                  <span className="text-[13px] font-bold text-[#4a90d9] tabular-nums">
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
                  className="w-full accent-[#4a90d9]"
                />
              </div>

              <button
                onClick={handleCalculateFFT}
                disabled={fftLoading}
                className="w-full py-2.5 bg-[#4a90d9] hover:bg-[#3a7bc0] active:scale-[0.98] text-white text-[13px] font-bold rounded-full shadow-xs transition-all flex items-center justify-center space-x-2"
              >
                <span>{fftLoading ? 'Processing FFT...' : 'Calculate via FFT'}</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#D0DCE8]" />
                </div>
                <div className="relative flex justify-center text-[11px] font-bold uppercase tracking-wider text-[#6b7a90] bg-white px-3 w-max mx-auto">
                  Option B: Manual Distance
                </div>
              </div>

              {/* Manual Entry Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#6b7a90] block mb-1">
                    Pixel Distance
                  </label>
                  <input
                    type="number"
                    value={pixelDistance}
                    onChange={(e) => setPixelDistance(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#D0DCE8] rounded-xl text-[13px] font-bold text-[#1E2A38] tabular-nums focus:outline-none focus:border-[#4a90d9]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#6b7a90] block mb-1">
                    Num Divisions
                  </label>
                  <input
                    type="number"
                    value={numDivisions}
                    onChange={(e) => setNumDivisions(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#D0DCE8] rounded-xl text-[13px] font-bold text-[#1E2A38] tabular-nums focus:outline-none focus:border-[#4a90d9]"
                  />
                </div>
              </div>

              <button
                onClick={handleCalculateManual}
                disabled={manualLoading}
                className="w-full py-2.5 bg-white hover:bg-[#eff3ff] text-[#1E2A38] hover:text-[#4a90d9] border border-[#9ecae1] text-[13px] font-bold rounded-full transition-all"
              >
                <span>{manualLoading ? 'Calculating...' : 'Set Factor Manually'}</span>
              </button>
            </div>
          )}

          {/* STEP 2: Configure Magnification & Verification target */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-[#eff3ff] border border-[#9ecae1] rounded-xl">
                <p className="text-[11px] text-[#6b7a90] uppercase font-bold tracking-wider">Active Computed Factor</p>
                <p className="text-[24px] font-extrabold text-[#4a90d9] tabular-nums my-0.5">
                  {computedFactor.toFixed(4)} <span className="text-[13px] font-normal text-[#6b7a90]">µm/px</span>
                </p>
                <p className="text-[12px] text-[#1E2A38]">
                  Factor calibrated for current camera sensor and active optical objective.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#6b7a90] block mb-1">
                  Lens Magnification Tag
                </label>
                <select
                  value={magnification}
                  onChange={(e) => setMagnification(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D0DCE8] rounded-xl text-[13px] font-bold text-[#1E2A38] focus:outline-none focus:border-[#4a90d9]"
                >
                  <option value="100x">100x Optical</option>
                  <option value="200x">200x Optical (Default)</option>
                  <option value="400x">400x Optical</option>
                  <option value="1000x">1000x Oil Immersion</option>
                </select>
              </div>

              <button
                onClick={() => setActiveStep(1)}
                className="text-[12px] text-[#4a90d9] hover:underline font-bold"
              >
                ← Back to recalculate factor in Step 1
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Validate Reference Beads (Chart + Inputs + Save) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#9ecae1] p-6 shadow-[0_4px_20px_rgba(74,144,217,0.06)] space-y-5">
          <div>
            <h2 className="text-[16px] font-bold text-[#1E2A38]">Validate Reference Beads</h2>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7a90] mt-0.5">
              Polystyrene microsphere bead targets (10, 50, 100 µm)
            </p>
          </div>

          {/* Grouped Bar Chart */}
          <BeadChart
            beads={[
              { nominal: 10, measured: bead10 },
              { nominal: 50, measured: bead50 },
              { nominal: 100, measured: bead100 },
            ]}
          />

          {/* 3 Number Inputs beneath chart */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#6b7a90] block mb-1">
                10 µm Bead (µm)
              </label>
              <input
                type="number"
                step="0.1"
                value={bead10}
                onChange={(e) => setBead10(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-[#D0DCE8] rounded-xl text-[13px] font-bold text-[#1E2A38] tabular-nums focus:outline-none focus:border-[#4a90d9]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#6b7a90] block mb-1">
                50 µm Bead (µm)
              </label>
              <input
                type="number"
                step="0.1"
                value={bead50}
                onChange={(e) => setBead50(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-[#D0DCE8] rounded-xl text-[13px] font-bold text-[#1E2A38] tabular-nums focus:outline-none focus:border-[#4a90d9]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#6b7a90] block mb-1">
                100 µm Bead (µm)
              </label>
              <input
                type="number"
                step="0.1"
                value={bead100}
                onChange={(e) => setBead100(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-[#D0DCE8] rounded-xl text-[13px] font-bold text-[#1E2A38] tabular-nums focus:outline-none focus:border-[#4a90d9]"
              />
            </div>
          </div>

          {/* Save & Activate Primary Button */}
          <button
            onClick={handleSaveCalibration}
            disabled={saveLoading}
            className="w-full py-3.5 bg-[#4a90d9] hover:bg-[#3a7bc0] active:scale-[0.98] text-white text-[14px] font-bold rounded-full shadow-[0_6px_20px_rgba(74,144,217,0.3)] transition-all flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{saveLoading ? 'Saving & Validating...' : 'Save & Activate Calibration'}</span>
          </button>
        </div>
      </div>

      {/* Footer Note explaining 7-day expiry rule */}
      <p className="text-[12px] text-[#6b7a90] text-center pt-2 border-t border-[#9ecae1]">
        System Expiry Rule: Calibration records expire exactly 7 days after timestamp creation to prevent optical drift degradation. Stale calibrations automatically reduce quantitative sample confidence scores to 0.5.
      </p>
    </div>
  );
};
