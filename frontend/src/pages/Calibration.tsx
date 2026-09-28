import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  ShieldCheck,
  Cpu,
  Clock,
  CheckCircle,
  Warning,
  Info,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { useCalibration } from '../hooks/useCalibration';
import { computeFactorFft, computeFactorManual, saveCalibration } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { BeadChart } from '../components/BeadChart';
import calibrationMetrologyImg from '../assets/calibration_metrology.jpg';
import microscopeTechImg from '../assets/microscope_tech.jpg';

export const CalibrationPage: React.FC = () => {
  const { calibrationStatus, loading: calLoading, refetch } = useCalibration();

  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [computedFactor, setComputedFactor] = useState<number>(0.417);
  const [knownSpacingUm, setKnownSpacingUm] = useState<number>(10.0);
  const [fftFile, setFftFile] = useState<File | null>(null);
  const [fftLoading, setFftLoading] = useState<boolean>(false);

  const [pixelDistance, setPixelDistance] = useState<number>(24);
  const [numDivisions, setNumDivisions] = useState<number>(1);
  const [manualLoading, setManualLoading] = useState<boolean>(false);

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
      setMessage({ type: 'error', text: 'Upload a stage micrometer scale micrograph before running FFT spatial calculation.' });
      return;
    }
    setFftLoading(true);
    setMessage(null);
    try {
      const res = await computeFactorFft(fftFile, knownSpacingUm);
      setComputedFactor(res.factor_um_per_px);
      setActiveStep(2);
      setMessage({ type: 'success', text: `FFT spatial scale derived: ${res.factor_um_per_px} µm/px. Step 1 verified.` });
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
      setMessage({ type: 'success', text: `Manual scale factor calculated: ${res.factor_um_per_px} µm/px. Continue to validation.` });
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
      setMessage({ type: 'success', text: 'Calibration record saved and activated in system registry.' });
      await refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save calibration.' });
    } finally {
      setSaveLoading(false);
    }
  };

  const record = calibrationStatus?.record;
  const quality = calibrationStatus?.quality ?? 0.0;

  const inputClass =
    'w-full px-3 py-2 bg-page border border-line rounded-sm text-[13px] font-mono text-ink focus:border-accent focus-visible:outline-accent transition-colors';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 max-w-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-caption">Metrological Traceability</p>
              <h1 className="text-page-title mt-1">Scale Metrology and Calibration</h1>
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-sm border border-line bg-surface hover:bg-sunken text-ink-3 hover:text-ink transition-colors cursor-pointer"
              title="Refresh Calibration Status"
              aria-label="Refresh Calibration Status"
            >
              <ArrowsClockwise size={16} />
            </button>
          </div>
          <p className="text-body mt-2">
            Quantitative physical sizing (Feret max/min and ECD) requires converting pixel measurements into micrometers.
            Record a stage micrometer scale target and validate observed microsphere bead diameters. Records remain active for 7 days.
          </p>
        </div>
        <img
          src={calibrationMetrologyImg}
          alt="Precision stage micrometer reticle on microscope mechanical stage"
          width={480}
          height={300}
          className="lg:col-span-5 w-full h-44 object-cover rounded-sm border border-line bg-sunken"
        />
      </header>

      {/* Calibration Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Spatial Scale Factor"
          value={`${computedFactor.toFixed(3)}`}
          subtitle="µm per pixel"
          valueColor="accent"
          icon={<SlidersHorizontal size={16} />}
        />
        <MetricCard
          label="Optical Objective"
          value={magnification}
          subtitle="Preset Magnification"
          valueColor="default"
          icon={<Cpu size={16} />}
        />
        <MetricCard
          label="Registry Status"
          value={
            calLoading ? (
              'Verifying...'
            ) : quality === 1.0 ? (
              <span className="text-[14px] font-bold text-ok">Active and Valid</span>
            ) : quality === 0.5 ? (
              <span className="text-[14px] font-bold text-warn">Stale (Over 7 Days)</span>
            ) : (
              <span className="text-[14px] font-bold text-err">Calibration Required</span>
            )
          }
          subtitle={calibrationStatus?.reason ?? 'Verify System Status'}
          valueColor={quality === 1.0 ? 'ok' : quality === 0.5 ? 'warn' : 'err'}
          icon={<ShieldCheck size={16} />}
        />
        <MetricCard
          label="Record Expiry"
          value={record?.expires ? record.expires.substring(0, 10) : 'None'}
          subtitle="7-Day Safety Drift Window"
          valueColor="default"
          icon={<Clock size={16} />}
        />
      </div>

      {/* User Feedback Alert */}
      {message && (
        <div
          role="status"
          className={`p-4 rounded-md border text-[13px] flex items-center justify-between gap-3 ${
            message.type === 'success'
              ? 'bg-ok-tint border-ok-border text-ok'
              : 'bg-err-tint border-err-border text-err'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle size={18} className="shrink-0" weight="fill" />
            ) : (
              <Warning size={18} className="shrink-0" weight="fill" />
            )}
            <span className="text-ink font-medium">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-[11px] font-mono font-semibold uppercase tracking-wider px-2 py-1 rounded-sm hover:bg-black/5 cursor-pointer text-ink-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2-Step Interactive Wizard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Step 1: Scale Factor Computation */}
        <section aria-labelledby="wizard-heading" className="lg:col-span-6 bg-surface border border-line rounded-md p-6 space-y-5 shadow-2xs">
          <div className="border-b border-line pb-3">
            <h2 id="wizard-heading" className="text-section-title">Calibration Wizard</h2>
            <p className="text-[12px] text-ink-3 mt-0.5">Two-step procedure: calculate factor, then validate against reference beads.</p>
          </div>

          <nav aria-label="Calibration Steps" className="flex items-center gap-2 border-b border-line pb-4">
            {[
              { step: 1 as const, label: '1. Scale Factor Calculation' },
              { step: 2 as const, label: '2. Bead Verification' }
            ].map((s, i) => (
              <React.Fragment key={s.step}>
                {i > 0 && <span className="text-line-strong text-[12px] font-mono px-1">/</span>}
                <button
                  onClick={() => setActiveStep(s.step)}
                  aria-current={activeStep === s.step ? 'step' : undefined}
                  className={`text-[12.5px] font-medium px-3 py-1.5 rounded-sm transition-colors duration-150 cursor-pointer ${
                    activeStep === s.step
                      ? 'bg-accent text-white font-semibold shadow-2xs'
                      : 'bg-sunken text-ink-2 hover:text-ink border border-line'
                  }`}
                >
                  {s.label}
                </button>
              </React.Fragment>
            ))}
          </nav>

          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-sunken p-2.5 rounded-sm border border-line gap-2">
                <span className="text-caption text-ink">Method A: Automated 2D FFT Peak Detection</span>
                <span className="text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded-sm bg-accent-tint text-accent border border-accent-border">
                  Recommended
                </span>
              </div>

              <div className="p-4 border border-dashed border-line-strong rounded-sm bg-page flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-sm overflow-hidden border border-line bg-panel-dark shrink-0 flex items-center justify-center">
                    <img
                      src="/api/references/file/stage_micrometer_scale.png"
                      alt="Stage micrometer scale target preview"
                      width={48}
                      height={48}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-ink">Stage Micrometer Target</p>
                    <p className="text-[11.5px] text-ink-3">Upload custom capture or use system default</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && setFftFile(e.target.files[0])}
                  aria-label="Upload stage micrometer scale target image"
                  className="text-[11.5px] font-mono text-ink-2 max-w-[190px] file:mr-2 file:py-1 file:px-2.5 file:rounded-sm file:border-0 file:text-[11px] file:font-semibold file:bg-accent file:text-white cursor-pointer"
                />
              </div>

              <div className="p-4 bg-page rounded-sm border border-line space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="known-spacing" className="text-caption">Physical Division Spacing</label>
                  <span className="text-[13px] font-mono font-semibold text-ink bg-sunken px-2 py-0.5 rounded-sm border border-line">
                    {knownSpacingUm} µm
                  </span>
                </div>
                <input
                  id="known-spacing"
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={knownSpacingUm}
                  onChange={(e) => setKnownSpacingUm(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>

              <button
                onClick={handleCalculateFFT}
                disabled={fftLoading}
                className="w-full py-2.5 btn-primary text-[13px] flex items-center justify-center gap-2 cursor-pointer"
              >
                {fftLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                )}
                <span>{fftLoading ? 'Computing 2D FFT...' : 'Calculate Scale Factor via FFT'}</span>
              </button>

              <div className="relative my-4 flex items-center gap-3">
                <div className="flex-1 border-t border-line" />
                <span className="text-[10.5px] uppercase tracking-wider font-mono font-semibold text-ink-3">
                  Method B: Manual Reticle Division Entry
                </span>
                <div className="flex-1 border-t border-line" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pixel-distance" className="text-caption block mb-1">Pixel Distance</label>
                  <input
                    id="pixel-distance"
                    type="number"
                    value={pixelDistance}
                    onChange={(e) => setPixelDistance(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="num-divisions" className="text-caption block mb-1">Division Count</label>
                  <input
                    id="num-divisions"
                    type="number"
                    value={numDivisions}
                    onChange={(e) => setNumDivisions(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                onClick={handleCalculateManual}
                disabled={manualLoading}
                className="w-full py-2 btn-secondary text-[12.5px] cursor-pointer"
              >
                {manualLoading ? 'Computing...' : 'Apply Manual Distance'}
              </button>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-accent-tint border border-accent-border rounded-sm">
                <p className="text-[11px] font-mono text-ink-3 uppercase tracking-wider">Derived Spatial Scaling</p>
                <p className="text-[26px] font-bold font-mono text-ink my-0.5">
                  {computedFactor.toFixed(4)} <span className="text-[14px] font-sans font-normal text-ink-2">µm/pixel</span>
                </p>
                <p className="text-[12px] text-ink-2">
                  This scaling factor will be assigned to subsequent physical measurements.
                </p>
              </div>

              <div>
                <label htmlFor="magnification" className="text-caption block mb-1.5">Microscope Objective Tag</label>
                <select
                  id="magnification"
                  value={magnification}
                  onChange={(e) => setMagnification(e.target.value)}
                  className="w-full px-3 py-2 bg-page border border-line rounded-sm text-[13px] font-medium text-ink focus:border-accent cursor-pointer"
                >
                  <option value="100x">100x Optical</option>
                  <option value="200x">200x Optical (Default Laboratory Spec)</option>
                  <option value="400x">400x Optical</option>
                  <option value="1000x">1000x Oil Immersion</option>
                </select>
              </div>

              <img
                src={microscopeTechImg}
                alt="Microscope optical lens turret"
                loading="lazy"
                width={640}
                height={96}
                className="w-full h-24 object-cover rounded-sm border border-line bg-sunken"
              />

              <button
                onClick={() => setActiveStep(1)}
                className="text-[12.5px] text-accent hover:underline font-semibold cursor-pointer"
              >
                ← Return to Step 1 (Adjust Scale Factor)
              </button>
            </div>
          )}
        </section>

        {/* Step 2: Reference Bead Validation Chart */}
        <section aria-labelledby="beads-heading" className="lg:col-span-6 bg-surface border border-line rounded-md p-6 space-y-5 shadow-2xs">
          <div className="border-b border-line pb-3">
            <h2 id="beads-heading" className="text-section-title">Reference Bead Verification</h2>
            <p className="text-caption mt-0.5">Polystyrene microsphere standards (10 / 50 / 100 µm)</p>
          </div>

          <BeadChart
            beads={[
              { nominal: 10, measured: bead10 },
              { nominal: 50, measured: bead50 },
              { nominal: 100, measured: bead100 }
            ]}
          />

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="bead-10" className="text-caption block mb-1">10 µm Bead</label>
              <input
                id="bead-10"
                type="number"
                step="0.1"
                value={bead10}
                onChange={(e) => setBead10(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="bead-50" className="text-caption block mb-1">50 µm Bead</label>
              <input
                id="bead-50"
                type="number"
                step="0.1"
                value={bead50}
                onChange={(e) => setBead50(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="bead-100" className="text-caption block mb-1">100 µm Bead</label>
              <input
                id="bead-100"
                type="number"
                step="0.1"
                value={bead100}
                onChange={(e) => setBead100(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <button
            onClick={handleSaveCalibration}
            disabled={saveLoading}
            className="w-full py-2.5 btn-primary text-[13.5px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck size={18} weight="bold" />
            <span>{saveLoading ? 'Storing Record in Registry...' : 'Save and Activate Calibration'}</span>
          </button>
        </section>
      </div>

      {/* Safety Policy Note */}
      <div className="bg-sunken border border-line rounded-md p-4 flex items-start gap-3 max-w-3xl">
        <Info size={18} className="text-accent shrink-0 mt-0.5" weight="bold" />
        <p className="text-[12.5px] text-ink-2 leading-relaxed">
          <strong>Mandatory 7-Day Expiration Policy:</strong> Environmental temperature fluctuations and optical bench displacement introduce physical drift.
          Calibration records automatically degrade to a 0.5 quality factor after 7 days, blocking unverified quantitative sizing until recalibration.
        </p>
      </div>
    </div>
  );
};

export default CalibrationPage;
