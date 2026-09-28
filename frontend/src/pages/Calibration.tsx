import React, { useState, useEffect } from 'react';
import { Sliders, ShieldCheck, Cpu, Clock, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, Scale, Info } from 'lucide-react';
import { useCalibration } from '../hooks/useCalibration';
import { computeFactorFft, computeFactorManual, saveCalibration } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { BeadChart } from '../components/BeadChart';
import calibrationMetrologyImg from '../assets/calibration_metrology.jpg';
import microscopeTechImg from '../assets/microscope_tech.jpg';

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
      {/* Top Laboratory Hero Context Banner */}
      <section className="relative overflow-hidden rounded-[26px] hero-card-navy text-white shadow-2xl border border-cyan-500/30">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img 
            src={calibrationMetrologyImg} 
            alt="Optical Stage Metrology Bench" 
            className="w-full h-full object-cover object-center opacity-30 mix-blend-luminosity filter blur-[0.3px]" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07172B] via-[#071F38]/95 to-[#083344]/85" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/25 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-400/15 border border-cyan-400/35 text-cyan-200 text-[11px] font-bold tracking-wider uppercase backdrop-blur-md shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>Optical Metrology &amp; Certified Scale Factor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Calibration Portal
            </h1>
            <p className="text-cyan-100/85 text-[14px] leading-relaxed font-normal">
              Stage micrometer optical calibration establishes certified micron-per-pixel factors for precise Feret diameter and equivalent circular diameter (ECD) particle sizing.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-cyan-400/25 text-cyan-200 font-semibold">
                NIST Traceable Stage Grating
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-cyan-400/25 text-cyan-200 font-semibold">
                7-Day Mandatory Re-Calibration
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-cyan-400/25 text-cyan-200 font-semibold">
                ISO/TR 21960 Compliant
              </span>
            </div>
          </div>

          {/* Right Visual Metrology Reticle Showcase */}
          <div className="w-full lg:w-[320px] shrink-0">
            <div className="relative rounded-2xl overflow-hidden border border-cyan-400/35 bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-xl p-3 shadow-xl group">
              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-950">
                <img 
                  src={calibrationMetrologyImg} 
                  alt="Stage Micrometer Alignment" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07172B]/85 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#07172B]/90 backdrop-blur-xs text-cyan-300 text-[10px] font-mono font-bold border border-cyan-400/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Reticle Grid Active</span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-cyan-200">
                  <span className="font-semibold">Factor: {computedFactor.toFixed(3)} µm/px</span>
                  <button
                    onClick={() => refetch()}
                    className="p-1 rounded bg-black/60 hover:bg-black/90 text-cyan-300 hover:text-white transition-colors cursor-pointer"
                    title="Refresh Calibration Status"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
              <span className="text-[15px] font-bold text-[#059669]">VALID &amp; ACTIVE</span>
            ) : quality === 0.5 ? (
              <span className="text-[15px] font-bold text-[#D97706]">STALE (&gt;7d)</span>
            ) : (
              <span className="text-[15px] font-bold text-[#DC2626]">REQUIRED</span>
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
          className={`p-4 rounded-[16px] border text-[13px] font-medium flex items-center justify-between shadow-xs transition-all ${
            message.type === 'success'
              ? 'bg-gradient-to-r from-white via-[#E6FBF2] to-white border-[#10B981]/50 text-[#059669]'
              : 'bg-gradient-to-r from-white via-[#FEECEB] to-white border-[#EF4444]/50 text-[#DC2626]'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0" />
            )}
            <span className="text-[#0A2540]">{message.text}</span>
          </div>
          <button 
            onClick={() => setMessage(null)} 
            className="text-[11.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md hover:bg-black/5 cursor-pointer text-[#4A7F96]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Two Columns: LEFT Calibration Wizard | RIGHT Reference Beads Validation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Calibration Wizard (2-Step Vertical Stepper) */}
        <div className="lg:col-span-6 bg-white/95 backdrop-blur-[20px] rounded-[20px] border border-[#BBE4F2] p-6 shadow-[0_8px_24px_rgba(8,145,178,0.06)] space-y-6">
          <div className="flex items-center space-x-2 border-b border-[#BBE4F2]/50 pb-3">
            <Scale className="w-5 h-5 text-[#0891B2]" />
            <h2 className="text-section-title">Calibration Wizard</h2>
          </div>

          {/* Stepper Header */}
          <div className="flex items-center space-x-2 sm:space-x-3 border-b border-[#BBE4F2]/50 pb-4">
            <button
              onClick={() => setActiveStep(1)}
              className={`flex items-center space-x-2 text-[13px] font-bold px-4 py-2 rounded-full transition-all cursor-pointer ${
                activeStep === 1 
                  ? 'bg-gradient-to-r from-[#0284C7] to-[#0891B2] text-white shadow-sm shadow-cyan-500/25' 
                  : 'bg-[#EAF7FC] text-[#4A7F96] hover:text-[#0A2540] hover:bg-white'
              }`}
            >
              <span>1. Scale Factor Calculation</span>
            </button>
            <ArrowRight className="w-4 h-4 text-[#4A7F96] shrink-0" />
            <button
              onClick={() => setActiveStep(2)}
              className={`flex items-center space-x-2 text-[13px] font-bold px-4 py-2 rounded-full transition-all cursor-pointer ${
                activeStep === 2 
                  ? 'bg-gradient-to-r from-[#0284C7] to-[#0891B2] text-white shadow-sm shadow-cyan-500/25' 
                  : 'bg-[#EAF7FC] text-[#4A7F96] hover:text-[#0A2540] hover:bg-white'
              }`}
            >
              <span>2. Reference Bead Validation</span>
            </button>
          </div>

          {/* STEP 1: FFT & Manual Scale Calculation */}
          {activeStep === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-[#EAF7FC]/50 p-2.5 rounded-xl border border-[#BBE4F2]">
                <span className="text-caption font-bold text-[#0A2540]">Option A: Stage Micrometer FFT</span>
                <span className="text-[11.5px] font-bold px-2 py-0.5 rounded-full bg-[#0891B2]/15 text-[#0891B2] border border-[#0891B2]/25">
                  Automated
                </span>
              </div>

              {/* Micrometer Thumbnail Upload */}
              <div className="p-4 border-2 border-dashed border-[#0891B2]/40 rounded-[16px] bg-[#EAF7FC]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3.5">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#BBE4F2] bg-white shrink-0 shadow-2xs">
                    <img
                      src="/api/references/file/stage_micrometer_scale.png"
                      alt="Micrometer scale"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-bold text-[#0A2540]">Stage Micrometer Image</p>
                    <p className="text-[11.5px] text-[#4A7F96]">Upload or use default reference scale</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && setFftFile(e.target.files[0])}
                  className="text-[12px] text-[#2C637A] max-w-[170px] file:mr-2 file:py-1 file:px-2.5 file:rounded-full file:border-0 file:text-[11px] file:font-semibold file:bg-[#0891B2] file:text-white hover:file:bg-[#0284C7] cursor-pointer"
                />
              </div>

              {/* Known Line Spacing Slider */}
              <div className="p-4 bg-white rounded-xl border border-[#BBE4F2] shadow-2xs space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-caption">Known Line Spacing</label>
                  <span className="text-[14px] font-bold text-[#0A2540] tabular-nums bg-[#EAF7FC] px-2.5 py-0.5 rounded-lg border border-[#BBE4F2]">
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
                  className="w-full accent-[#0891B2] cursor-pointer"
                />
              </div>

              <button
                onClick={handleCalculateFFT}
                disabled={fftLoading}
                className="w-full py-3 btn-primary-sci text-[13.5px] flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Sparkles className={`w-4 h-4 ${fftLoading ? 'animate-spin' : ''}`} />
                <span>{fftLoading ? 'Processing FFT...' : 'Calculate via FFT'}</span>
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#BBE4F2]" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-bold text-[#4A7F96] bg-white px-3 rounded-full w-max mx-auto border border-[#BBE4F2]">
                  Option B: Manual Entry
                </div>
              </div>

              {/* Manual Entry Row */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-caption block mb-1.5">Pixel Distance</label>
                  <input
                    type="number"
                    value={pixelDistance}
                    onChange={(e) => setPixelDistance(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-[#EAF7FC]/30 border border-[#BBE4F2] rounded-xl text-[14px] font-bold text-[#0A2540] tabular-nums focus:outline-none focus:border-[#0891B2] focus:bg-white shadow-inner"
                  />
                </div>
                <div>
                  <label className="text-caption block mb-1.5">Num Divisions</label>
                  <input
                    type="number"
                    value={numDivisions}
                    onChange={(e) => setNumDivisions(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-[#EAF7FC]/30 border border-[#BBE4F2] rounded-xl text-[14px] font-bold text-[#0A2540] tabular-nums focus:outline-none focus:border-[#0891B2] focus:bg-white shadow-inner"
                  />
                </div>
              </div>

              <button
                onClick={handleCalculateManual}
                disabled={manualLoading}
                className="w-full py-2.5 bg-white hover:bg-[#EAF7FC] text-[#0A2540] hover:text-[#0284C7] border border-[#BBE4F2] hover:border-[#0891B2] text-[13px] font-bold rounded-full transition-all shadow-2xs cursor-pointer"
              >
                <span>{manualLoading ? 'Calculating...' : 'Set Factor Manually'}</span>
              </button>
            </div>
          )}

          {/* STEP 2: Configure Magnification & Verification target */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-r from-[#EAF7FC] to-white border border-[#0891B2]/35 rounded-[16px] shadow-xs">
                <p className="text-[11.5px] text-[#4A7F96] font-bold uppercase tracking-wider">Active Computed Factor</p>
                <p className="text-[28px] font-bold text-[#0A2540] tabular-nums my-1">
                  {computedFactor.toFixed(4)} <span className="text-[15px] font-normal text-[#2C637A]">µm/px</span>
                </p>
                <p className="text-[12.5px] text-[#2C637A]">
                  Factor carried into Step 2 verification target automatically.
                </p>
              </div>

              <div>
                <label className="text-caption block mb-1.5">Lens Magnification Tag</label>
                <select
                  value={magnification}
                  onChange={(e) => setMagnification(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#BBE4F2] rounded-xl text-[13.5px] font-bold text-[#0A2540] focus:outline-none focus:border-[#0891B2] shadow-2xs cursor-pointer"
                >
                  <option value="100x">100x Optical</option>
                  <option value="200x">200x Optical (Default)</option>
                  <option value="400x">400x Optical</option>
                  <option value="1000x">1000x Oil Immersion</option>
                </select>
              </div>

              {/* Certified Objective Metrology Visual */}
              <div className="relative rounded-xl overflow-hidden border border-[#BBE4F2] shadow-2xs group">
                <img
                  src={microscopeTechImg}
                  alt="Microscope Objective Lens Metrology"
                  className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07172B]/90 via-[#07172B]/35 to-transparent flex flex-col justify-end p-2.5">
                  <p className="text-[11.5px] font-bold text-white leading-tight">Certified Objective Metrology</p>
                  <p className="text-[10px] text-cyan-300 font-semibold">{magnification} Verified Optical FOV</p>
                </div>
              </div>

              <button
                onClick={() => setActiveStep(1)}
                className="text-[13px] text-[#0891B2] hover:text-[#0284C7] hover:underline font-bold flex items-center space-x-1 cursor-pointer pt-2"
              >
                <span>← Back to recalculate factor in Step 1</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Validate Reference Beads (Chart + Inputs + Save) */}
        <div className="lg:col-span-6 bg-white/95 backdrop-blur-[20px] rounded-[20px] border border-[#BBE4F2] p-6 shadow-[0_8px_24px_rgba(8,145,178,0.06)] space-y-5">
          <div className="border-b border-[#BBE4F2]/50 pb-3">
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
                className="w-full px-3 py-2 bg-[#EAF7FC]/30 border border-[#BBE4F2] rounded-xl text-[13.5px] font-bold text-[#0A2540] tabular-nums focus:outline-none focus:border-[#0891B2] focus:bg-white shadow-inner"
              />
            </div>

            <div>
              <label className="text-caption block mb-1">50 µm Bead (µm)</label>
              <input
                type="number"
                step="0.1"
                value={bead50}
                onChange={(e) => setBead50(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#EAF7FC]/30 border border-[#BBE4F2] rounded-xl text-[13.5px] font-bold text-[#0A2540] tabular-nums focus:outline-none focus:border-[#0891B2] focus:bg-white shadow-inner"
              />
            </div>

            <div>
              <label className="text-caption block mb-1">100 µm Bead (µm)</label>
              <input
                type="number"
                step="0.1"
                value={bead100}
                onChange={(e) => setBead100(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#EAF7FC]/30 border border-[#BBE4F2] rounded-xl text-[13.5px] font-bold text-[#0A2540] tabular-nums focus:outline-none focus:border-[#0891B2] focus:bg-white shadow-inner"
              />
            </div>
          </div>

          {/* Save & Activate Primary Button */}
          <button
            onClick={handleSaveCalibration}
            disabled={saveLoading}
            className="w-full py-3.5 btn-primary-sci text-[14px] flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>{saveLoading ? 'Saving & Validating...' : 'Save & Activate Calibration'}</span>
          </button>
        </div>
      </div>

      {/* Footer Note explaining 7-day expiry rule */}
      <div className="bg-[#EAF7FC]/60 border border-[#BBE4F2] rounded-[16px] p-4 text-center">
        <p className="text-[12px] text-[#2C637A] font-medium leading-relaxed max-w-3xl mx-auto flex items-center justify-center gap-1.5">
          <Info className="w-4 h-4 text-[#0891B2] shrink-0" />
          <span>
            System Expiry Rule: Calibration records expire exactly 7 days after timestamp creation to prevent optical drift degradation. Stale calibrations automatically reduce quantitative sample confidence scores to 0.5.
          </span>
        </p>
      </div>
    </div>
  );
};
