import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Eye,
  BarChart3,
  Table as TableIcon,
  Calculator,
  FileJson,
  Sparkles,
  Scan,
  Layers,
  Crosshair,
  CircleDot,
  Download
} from 'lucide-react';
import { useCalibration } from '../hooks/useCalibration';
import { useAnalysis } from '../hooks/useAnalysis';
import { calculateConcentration } from '../api/client';
import { StatusStrip } from '../components/StatusStrip';
import { MetricCard } from '../components/MetricCard';
import { Dropzone, type DemoSelectionInfo } from '../components/Dropzone';
import { Scientific3DBackground } from '../components/Scientific3DBackground';
import { Stepper } from '../components/Stepper';
import { SizeChart } from '../components/SizeChart';
import { ParticleTable } from '../components/ParticleTable';
import { JsonViewer } from '../components/JsonViewer';
import { ImageQualityAssessment } from '../components/ImageQualityAssessment';
import { assessImageQuality, type QualityAssessmentResult } from '../utils/imageQuality';
import { generateSamplePdfReport } from '../utils/pdfExport';
import microplasticDemoImg from '../assets/demo_microplastic_sample.jpg';
import blankFilterDemoImg from '../assets/blank_filter_control.png';

export const AnalyzePage: React.FC = () => {
  const { calibrationStatus, loading: calLoading } = useCalibration();
  const { result, loading: analyzeLoading, step, error: analyzeError, runAnalysis } = useAnalysis();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'size' | 'table' | 'concentration' | 'json'>('visual');
  const [flagsExpanded, setFlagsExpanded] = useState<boolean>(true);

  // Concentration inputs
  const [sampleVolumeMl, setSampleVolumeMl] = useState<number>(1000);
  const [dilutionFactor, setDilutionFactor] = useState<number>(1.0);
  const [calcConcentration, setCalcConcentration] = useState<number | null>(null);
  const [calcLoading, setCalcLoading] = useState<boolean>(false);

  // Automatic Image Quality Assessment state
  const [qualityAssessment, setQualityAssessment] = useState<QualityAssessmentResult | null>(null);
  const [qualityLoading, setQualityLoading] = useState<boolean>(false);
  const [severeOverride, setSevereOverride] = useState<boolean>(false);

  // Real-time Automatic Image Quality Assessment Workflow
  useEffect(() => {
    let isCurrent = true;
    setQualityAssessment(null);
    setSevereOverride(false);

    if (selectedFile) {
      setQualityLoading(true);
      assessImageQuality(selectedFile)
        .then((res) => {
          if (isCurrent) {
            setQualityAssessment(res);
            setQualityLoading(false);
          }
        })
        .catch(() => {
          if (isCurrent) setQualityLoading(false);
        });
    } else if (selectedDemoId) {
      const srcUrl =
        selectedDemoId === 'demo_microplastic_sample.jpg'
          ? microplasticDemoImg
          : selectedDemoId === 'blank_filter_control.png'
          ? blankFilterDemoImg
          : `/api/references/file/${selectedDemoId}`;

      setQualityLoading(true);
      assessImageQuality(srcUrl)
        .then((res) => {
          if (isCurrent) {
            setQualityAssessment(res);
            setQualityLoading(false);
          }
        })
        .catch(() => {
          if (isCurrent) setQualityLoading(false);
        });
    } else {
      setQualityLoading(false);
    }

    return () => {
      isCurrent = false;
    };
  }, [selectedFile, selectedDemoId]);

  const handleRecheckQuality = () => {
    if (selectedFile) {
      setQualityLoading(true);
      assessImageQuality(selectedFile).then((res) => {
        setQualityAssessment(res);
        setQualityLoading(false);
      });
    } else if (selectedDemoId) {
      const srcUrl =
        selectedDemoId === 'demo_microplastic_sample.jpg'
          ? microplasticDemoImg
          : selectedDemoId === 'blank_filter_control.png'
          ? blankFilterDemoImg
          : `/api/references/file/${selectedDemoId}`;
      setQualityLoading(true);
      assessImageQuality(srcUrl).then((res) => {
        setQualityAssessment(res);
        setQualityLoading(false);
      });
    }
  };

  const isGatedByQuality = Boolean(qualityAssessment?.isSevere && !severeOverride);
  const canRunAnalysis =
    Boolean(selectedFile || selectedDemoId) &&
    !analyzeLoading &&
    !qualityLoading &&
    !isGatedByQuality;



  useEffect(() => {
    if (result?.flag_lab_confirmation) {
      setFlagsExpanded(true);
    }
  }, [result]);

  const handleStartAnalysis = () => {
    if (selectedFile) {
      runAnalysis(selectedFile, null);
    } else if (selectedDemoId) {
      runAnalysis(null, selectedDemoId);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setSelectedDemoId(null); // Replace any demo selection
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setSelectedDemoId(null);
    setQualityAssessment(null);
    setSevereOverride(false);
  };

  const selectedDemoInfo: DemoSelectionInfo | null = useMemo(() => {
    if (!selectedDemoId) return null;
    if (selectedDemoId === 'demo_microplastic_sample.jpg') {
      return {
        id: 'demo_microplastic_sample.jpg',
        title: 'Demo Image 1',
        filename: 'demo_microplastic_sample.jpg',
        label: 'Microplastic Sample',
        thumbnail: microplasticDemoImg,
        badge: 'Positive Candidate',
        fileSizeText: '240 KB'
      };
    }
    if (selectedDemoId === 'blank_filter_control.png') {
      return {
        id: 'blank_filter_control.png',
        title: 'Demo Image 2',
        filename: 'blank_filter_control.png',
        label: 'Blank Filter Control',
        thumbnail: blankFilterDemoImg,
        badge: 'Negative Control',
        fileSizeText: '265 KB'
      };
    }
    return null;
  }, [selectedDemoId]);

  const handleCalculateConcentration = async () => {
    if (!result) return;
    setCalcLoading(true);
    try {
      const res = await calculateConcentration({
        total_count: result.total_count,
        imaged_area_mm2: result.imaged_area_mm2,
        sample_volume_ml: sampleVolumeMl,
        dilution_factor: dilutionFactor
      });
      setCalcConcentration(res.concentration);
    } catch {
      setCalcConcentration(null);
    } finally {
      setCalcLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!result) return;
    generateSamplePdfReport({
      result,
      calibrationRecord: calibrationStatus?.record,
      calibrationFactor: calibrationStatus?.record?.factor_um_per_px ?? 0.417,
      qualityAssessment,
      sampleVolumeMl,
      dilutionFactor,
      calculatedConcentration: calcConcentration
    });
  };

  const calQuality = calibrationStatus?.quality ?? 0.0;

  return (
    <div className="space-y-7 relative">
      {/* Subtle 3D Scientific Water & Suspended Microplastics Background Effect */}
      <Scientific3DBackground />

      {/* Calibration Status Banner */}
      <StatusStrip calibrationStatus={calibrationStatus} loading={calLoading} />

      {/* Main Grid: Left Source & Try Sample Images (4 cols) | Right Metrics & Results (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT Column: Image Source + Try Sample Images */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Image Source (Upload & Preview Section) */}
          <section className="bg-white/95 backdrop-blur-[20px] rounded-[20px] border border-[#BBE4F2] p-5 sm:p-6 shadow-[0_8px_24px_rgba(8,145,178,0.06)] space-y-4 transition-all">
            <div className="flex items-center justify-between border-b border-[#BBE4F2]/50 pb-3 gap-2 flex-wrap">
              <div className="flex items-center space-x-2">
                <Scan className="w-5 h-5 text-[#0891B2]" />
                <h2 className="text-section-title">Image Source</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EAF7FC] text-[#0284C7] border border-[#0891B2]/30 shadow-2xs">
                  {selectedDemoId ? 'Demo Staged' : selectedFile ? 'Custom Upload' : 'Standby'}
                </span>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={!result}
                  title={result ? 'Download certified PDF analysis report' : 'Run sample analysis first to generate PDF report'}
                  className={`px-3 py-1 rounded-full text-[11.5px] font-bold border transition-all duration-200 flex items-center space-x-1.5 shadow-xs ${
                    result
                      ? 'bg-[#E7E3DA] hover:bg-[#DCD7CB] text-[#1A1917] border-[#DCD7CB] cursor-pointer hover:shadow-sm active:scale-95'
                      : 'bg-[#E7E3DA]/50 text-[#1A1917]/40 border-[#DCD7CB]/40 cursor-not-allowed'
                  }`}
                >
                  <Download className={`w-3.5 h-3.5 ${result ? 'text-[#9B3418]' : 'text-[#9B3418]/50'}`} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Upload Dropzone & Staged Image Preview */}
            <div className="space-y-2">
              <Dropzone
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                selectedDemo={selectedDemoInfo}
                onClear={handleClearSelection}
                disabled={analyzeLoading}
              />
            </div>

            {/* Automated Microscope Image Quality Assessment */}
            {(selectedFile || selectedDemoId) && (
              <ImageQualityAssessment
                assessment={qualityAssessment}
                loading={qualityLoading}
                filename={selectedFile?.name || selectedDemoInfo?.filename || selectedDemoId || 'Micrograph Sample'}
                fileSizeText={selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : selectedDemoInfo?.fileSizeText}
                onReplaceImage={handleClearSelection}
                onRecheck={handleRecheckQuality}
                allowSevereOverride={severeOverride}
                onToggleOverride={setSevereOverride}
              />
            )}

            {/* Action Row: Run Screening + Download PDF Report */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                onClick={handleStartAnalysis}
                disabled={!canRunAnalysis}
                className={`flex-1 py-3.5 btn-primary-sci flex items-center justify-center space-x-2 text-[14px] transition-all ${
                  !canRunAnalysis ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${analyzeLoading || qualityLoading ? 'animate-spin' : ''}`} />
                <span>
                  {analyzeLoading
                    ? 'Processing Pipeline...'
                    : qualityLoading
                    ? 'Assessing Image Quality...'
                    : isGatedByQuality
                    ? 'Analysis Gated (Severe Optical Issue)'
                    : 'Run Microplastics Screening'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={!result}
                title={result ? 'Download certified PDF analysis report' : 'Run sample analysis first to generate PDF report'}
                className={`py-3.5 px-4 rounded-full text-[13px] font-bold border transition-all duration-200 flex items-center justify-center space-x-2 shadow-xs shrink-0 ${
                  result
                    ? 'bg-[#E7E3DA] hover:bg-[#DCD7CB] text-[#1A1917] border-[#DCD7CB] cursor-pointer hover:shadow-md active:scale-98'
                    : 'bg-[#E7E3DA]/60 text-[#1A1917]/40 border-[#DCD7CB]/50 cursor-not-allowed'
                }`}
              >
                <Download className={`w-4 h-4 ${result ? 'text-[#9B3418]' : 'text-[#9B3418]/50'}`} />
                <span>Download PDF Report</span>
              </button>
            </div>

            {analyzeError && (
              <div className="p-3.5 bg-[#FEECEB] border border-[#EF4444]/40 rounded-xl text-[12.5px] text-[#DC2626] font-medium flex items-center space-x-2.5 shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>{analyzeError}</span>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT Column: Metrics Cards & Results */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">
          {result?.detector_fallback && (
            <div className="p-4 bg-gradient-to-r from-white/95 via-[#EAF7FC] to-white/95 border border-[#0891B2]/40 rounded-[18px] text-[13px] text-[#0F334A] flex items-start space-x-3 shadow-xs">
              <Info className="w-5 h-5 text-[#0891B2] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#0A2540]">Demo Heuristic Mode Active:</span>{' '}
                {result.detector_load_error || 'No weights file (models/best.pt) found. Running adaptive morphological candidate detector.'}
              </div>
            </div>
          )}

          {result && !result.detector_fallback && (
            <div className="px-4 py-2.5 bg-white/80 border border-[#0F334A]/10 rounded-2xl text-[12px] text-[#0F334A]/70 flex items-center space-x-2 shadow-xs">
              <Info className="w-4 h-4 text-[#0891B2] shrink-0" />
              <span>
                Detection model:{' '}
                <span className="font-semibold text-[#0A2540]">{result.detection_model}</span>
              </span>
            </div>
          )}

          {/* Row of 5 Floating 3D Metric Bubbles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 my-2">
            {analyzeLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="aspect-square min-h-[160px] max-w-[210px] mx-auto rounded-full bg-white/40 border border-white/60 animate-pulse shadow-sm" />
              ))
            ) : (
              <>
                <MetricCard
                  label="Particle Count"
                  value={result ? result.total_count : '—'}
                  subtitle="Detections"
                  valueColor="default"
                  icon={<Layers className="w-3.5 h-3.5" />}
                  index={0}
                />

                <MetricCard
                  label="Sample Conf."
                  value={result ? `${(result.sample_confidence * 100).toFixed(0)}%` : '—'}
                  subtitle="Reliability Score"
                  valueColor={
                    !result
                      ? 'default'
                      : result.sample_confidence >= 0.8
                      ? 'mint'
                      : result.sample_confidence >= 0.6
                      ? 'amber'
                      : 'rust'
                  }
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  index={1}
                />

                <MetricCard
                  label="Lab Flag"
                  value={
                    result ? (
                      result.flag_lab_confirmation ? (
                        <span className="text-[13px] sm:text-[14px] font-extrabold text-[#9B3418] uppercase">REQUIRED</span>
                      ) : (
                        <span className="text-[13px] sm:text-[14px] font-extrabold text-[#059669] uppercase">NOT REQUIRED</span>
                      )
                    ) : (
                      '—'
                    )
                  }
                  subtitle="Lab Confirmation"
                  valueColor={result?.flag_lab_confirmation ? 'rust' : 'mint'}
                  icon={<AlertTriangle className="w-3.5 h-3.5" />}
                  index={2}
                />

                <MetricCard
                  label="Imaged Area"
                  value={result ? `${result.imaged_area_mm2.toFixed(2)}` : '—'}
                  subtitle="mm²"
                  valueColor="periwinkle"
                  icon={<Crosshair className="w-3.5 h-3.5" />}
                  index={3}
                />

                <MetricCard
                  label="Inference Time"
                  value={result ? `${result.latency_sec.toFixed(2)} s` : '—'}
                  subtitle="Latency"
                  valueColor="default"
                  icon={<CircleDot className="w-3.5 h-3.5" />}
                  index={4}
                />
              </>
            )}
          </div>

          {/* Capture Quality Telemetry (Addition 1) */}
          {result?.capture_quality && (
            <div className="bg-white rounded-2xl border border-[#9ecae1]/50 p-4 shadow-xs">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="w-4 h-4 text-[#4a90d9]" />
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#6b7a90]">
                  Capture Quality Telemetry
                </span>
                <span
                  className={`ml-auto px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                    result.capture_quality.status === 'OK'
                      ? 'bg-[#2ECC91]/15 text-[#1a7a55]'
                      : result.capture_quality.status === 'DEFERRED'
                      ? 'bg-[#F5B942]/20 text-[#8a6500]'
                      : 'bg-[#FF6B6B]/15 text-[#8B1E1E]'
                  }`}
                >
                  {result.capture_quality.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    {
                      key: 'sharpness',
                      label: 'Sharpness',
                      value: result.capture_quality.metrics.sharpness_laplacian_var.toFixed(1),
                      unit: 'Laplacian var',
                      passed: result.capture_quality.gates.find((g) => g.name === 'sharpness')?.passed,
                    },
                    {
                      key: 'exposure',
                      label: 'Exposure',
                      value: result.capture_quality.metrics.luma_mean.toFixed(1),
                      unit: `luma · ${result.capture_quality.metrics.clipped_pct.toFixed(1)}% clip`,
                      passed: result.capture_quality.gates.find((g) => g.name === 'exposure')?.passed,
                    },
                    {
                      key: 'contrast',
                      label: 'Contrast',
                      value: result.capture_quality.metrics.rms_contrast.toFixed(3),
                      unit: 'RMS contrast',
                      passed: result.capture_quality.gates.find((g) => g.name === 'contrast')?.passed,
                    },
                  ] as const
                ).map((m) => (
                  <div
                    key={m.key}
                    className={`rounded-xl border p-3 ${
                      m.passed ? 'border-[#2ECC91]/40 bg-[#2ECC91]/5' : 'border-[#FF6B6B]/40 bg-[#FF6B6B]/5'
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b7a90]">{m.label}</p>
                    <p
                      className={`text-[20px] font-extrabold tabular-nums ${
                        m.passed ? 'text-[#1a7a55]' : 'text-[#8B1E1E]'
                      }`}
                    >
                      {m.value}
                    </p>
                    <p className="text-[10px] text-[#6b7a90]">{m.unit}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stepper active during loading */}
          {analyzeLoading && <Stepper currentStep={step} />}

          {/* Flags Expander if any flags exist */}
          {result && result.flags && result.flags.length > 0 && (
            <div className="bg-gradient-to-r from-[#FEF6E7]/90 to-white border border-[#F59E0B]/50 rounded-[18px] p-4 text-[13px] space-y-2 shadow-xs">
              <button
                onClick={() => setFlagsExpanded(!flagsExpanded)}
                className="w-full flex items-center justify-between text-[#0A2540] font-bold text-left cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                  <span>Pipeline Quality &amp; Flag Warnings ({result.flags.length})</span>
                </div>
                {flagsExpanded ? <ChevronUp className="w-4 h-4 text-[#D97706]" /> : <ChevronDown className="w-4 h-4 text-[#D97706]" />}
              </button>

              {flagsExpanded && (
                <ul className="space-y-2 pt-2.5 border-t border-[#F59E0B]/30">
                  {result.flags.map((flag, idx) => (
                    <li key={idx} className="flex items-start space-x-2.5 text-[#2C637A]">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B] mt-1.5 shrink-0" />
                      <div>
                        <strong className="text-[#0A2540] capitalize">{flag.type.replace(/_/g, ' ')}:</strong>{' '}
                        {flag.message}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}


          {/* Segmented Tabs Navigation & Results View */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-[#BBE4F2] px-1 overflow-x-auto pb-0.5">
                <button
                  onClick={() => setActiveTab('visual')}
                  className={`pb-3 px-3 text-[13.5px] font-bold transition-all flex items-center space-x-2 relative whitespace-nowrap cursor-pointer ${
                    activeTab === 'visual' ? 'text-[#0284C7]' : 'text-[#4A7F96] hover:text-[#0A2540]'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>Visual Detection</span>
                  {activeTab === 'visual' && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#0284C7] to-[#0891B2] rounded-t-full shadow-xs" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('size')}
                  className={`pb-3 px-3 text-[13.5px] font-bold transition-all flex items-center space-x-2 relative whitespace-nowrap cursor-pointer ${
                    activeTab === 'size' ? 'text-[#0284C7]' : 'text-[#4A7F96] hover:text-[#0A2540]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Size Distribution</span>
                  {activeTab === 'size' && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#0284C7] to-[#0891B2] rounded-t-full shadow-xs" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('table')}
                  className={`pb-3 px-3 text-[13.5px] font-bold transition-all flex items-center space-x-2 relative whitespace-nowrap cursor-pointer ${
                    activeTab === 'table' ? 'text-[#0284C7]' : 'text-[#4A7F96] hover:text-[#0A2540]'
                  }`}
                >
                  <TableIcon className="w-4 h-4" />
                  <span>Particle Table ({result.detections.length})</span>
                  {activeTab === 'table' && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#0284C7] to-[#0891B2] rounded-t-full shadow-xs" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('concentration')}
                  className={`pb-3 px-3 text-[13.5px] font-bold transition-all flex items-center space-x-2 relative whitespace-nowrap cursor-pointer ${
                    activeTab === 'concentration' ? 'text-[#0284C7]' : 'text-[#4A7F96] hover:text-[#0A2540]'
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  <span>Concentration</span>
                  {activeTab === 'concentration' && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#0284C7] to-[#0891B2] rounded-t-full shadow-xs" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('json')}
                  className={`pb-3 px-3 text-[13.5px] font-bold transition-all flex items-center space-x-2 relative whitespace-nowrap cursor-pointer ${
                    activeTab === 'json' ? 'text-[#0284C7]' : 'text-[#4A7F96] hover:text-[#0A2540]'
                  }`}
                >
                  <FileJson className="w-4 h-4" />
                  <span>JSON Export</span>
                  {activeTab === 'json' && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#0284C7] to-[#0891B2] rounded-t-full shadow-xs" />
                  )}
                </button>
              </div>

              {/* Tab 1: Visual Detection */}
              {activeTab === 'visual' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white/95 backdrop-blur-[20px] rounded-[20px] border border-[#BBE4F2] p-5 shadow-[0_8px_24px_rgba(8,145,178,0.06)] space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Crosshair className="w-4 h-4 text-[#0891B2]" />
                        <h4 className="text-section-title">Annotated Particles</h4>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] font-bold text-[#4A7F96] bg-[#EAF7FC] px-2.5 py-1 rounded-full border border-[#BBE4F2]">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#10B981]" title="High Conf" />
                        <span>≥0.8</span>
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#F59E0B]" title="Med Conf" />
                        <span>0.5–0.8</span>
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#EF4444]" title="Low/Flag" />
                        <span>&lt;0.5</span>
                      </div>
                    </div>
                    <div className="relative aspect-square bg-[#061520] rounded-[16px] overflow-hidden flex items-center justify-center border border-[#BBE4F2] shadow-inner group">
                      {/* Microscope Reticle Corner Overlay */}
                      <span className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#06B6D4]/70 z-10 pointer-events-none" />
                      <span className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#06B6D4]/70 z-10 pointer-events-none" />
                      <span className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#06B6D4]/70 z-10 pointer-events-none" />
                      <span className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#06B6D4]/70 z-10 pointer-events-none" />
                      
                      {result.images.annotated ? (
                        <img
                          src={result.images.annotated}
                          alt="Annotated Detections"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <p className="text-[12px] text-slate-400">No annotated image</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/95 backdrop-blur-[20px] rounded-[20px] border border-[#BBE4F2] p-5 shadow-[0_8px_24px_rgba(8,145,178,0.06)] space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Scan className="w-4 h-4 text-[#0891B2]" />
                        <h4 className="text-section-title">Preprocessed Input</h4>
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#EAF7FC] text-[#0891B2] border border-[#BBE4F2]">
                        640×640 CLAHE
                      </span>
                    </div>
                    <div className="relative aspect-square bg-[#061520] rounded-[16px] overflow-hidden flex items-center justify-center border border-[#BBE4F2] shadow-inner">
                      {/* Microscope Reticle Corner Overlay */}
                      <span className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#06B6D4]/70 z-10 pointer-events-none" />
                      <span className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#06B6D4]/70 z-10 pointer-events-none" />
                      <span className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#06B6D4]/70 z-10 pointer-events-none" />
                      <span className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#06B6D4]/70 z-10 pointer-events-none" />

                      {result.images.preprocessed ? (
                        <img
                          src={result.images.preprocessed}
                          alt="Preprocessed Input"
                          className="w-full h-full object-contain filter desaturate-30"
                        />
                      ) : (
                        <p className="text-[12px] text-slate-400">No preprocessed image</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Size Distribution */}
              {activeTab === 'size' && (
                <SizeChart
                  distribution={result.size_distribution_um}
                  calibrationQuality={calQuality}
                />
              )}

              {/* Tab 3: Particle Table */}
              {activeTab === 'table' && (
                <ParticleTable detections={result.detections} />
              )}

              {/* Tab 4: Concentration Calculator */}
              {activeTab === 'concentration' && (
                <div className="space-y-4">
{calQuality !== 1.0 || result?.measurement_status === 'REJECTED' ? (
                    <div className="p-8 bg-gradient-to-br from-white to-[#FEECEB]/60 border border-[#EF4444]/40 rounded-[20px] text-center space-y-3 shadow-[0_4px_20px_rgba(239,68,68,0.08)]">
                      <div className="w-12 h-12 rounded-2xl bg-[#FEECEB] border border-[#EF4444]/30 flex items-center justify-center text-[#DC2626] mx-auto shadow-xs">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <h4 className="text-section-title text-[#0A2540]">Concentration Calculation Blocked</h4>
                      <p className="text-body text-[#2C637A] max-w-md mx-auto">
                        {result?.measurement_status === 'REJECTED'
                          ? 'Capture conditions are outside the supported range. Particle concentration cannot be reported without false precision. Fix capture conditions and re-image the sample.'
                          : 'Calculating particles per liter requires an active in-date micro-scale calibration (≤ 7 days). Please recalibrate in the Calibration Portal.'}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white/95 backdrop-blur-[20px] rounded-[20px] border border-[#BBE4F2] p-6 space-y-5 shadow-[0_8px_24px_rgba(8,145,178,0.06)]">
                      <div className="flex items-center space-x-2 border-b border-[#BBE4F2]/50 pb-3">
                        <FlaskConical className="w-5 h-5 text-[#0891B2]" />
                        <h3 className="text-section-title">Sample Concentration Calculator</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-caption block mb-1.5">Sample Volume (mL)</label>
                          <input
                            type="number"
                            value={sampleVolumeMl}
                            onChange={(e) => setSampleVolumeMl(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-[#EAF7FC]/40 border border-[#BBE4F2] rounded-xl text-[14px] font-bold text-[#0A2540] tabular-nums focus:outline-none focus:border-[#0891B2] focus:bg-white transition-all shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="text-caption block mb-1.5">Dilution Factor</label>
                          <input
                            type="number"
                            step="0.1"
                            value={dilutionFactor}
                            onChange={(e) => setDilutionFactor(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-[#EAF7FC]/40 border border-[#BBE4F2] rounded-xl text-[14px] font-bold text-[#0A2540] tabular-nums focus:outline-none focus:border-[#0891B2] focus:bg-white transition-all shadow-inner"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleCalculateConcentration}
                        disabled={calcLoading}
                        className="px-6 py-2.5 btn-primary-sci text-[13.5px] flex items-center space-x-2 cursor-pointer"
                      >
                        <Calculator className="w-4 h-4" />
                        <span>Calculate Concentration</span>
                      </button>

                      {calcConcentration !== null && (
                        <div className="p-5 bg-gradient-to-r from-white via-[#E6FBF2]/80 to-white border border-[#10B981]/40 rounded-[16px] flex items-center justify-between shadow-[0_4px_16px_rgba(16,185,129,0.1)]">
                          <div>
                            <p className="text-caption text-[#059669]">Calculated Concentration</p>
                            <p className="text-[32px] font-bold text-[#0A2540] tabular-nums my-0.5 tracking-tight">
                              {calcConcentration} <span className="text-[15px] font-normal text-[#2C637A]">particles / L</span>
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-[#E6FBF2] border border-[#10B981]/30 flex items-center justify-center text-[#059669] shadow-xs">
                            <CheckCircle2 className="w-7 h-7 text-[#059669]" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: JSON Export */}
              {activeTab === 'json' && (
                <JsonViewer data={result.report as unknown as Record<string, unknown>} sampleId={result.sample_id} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

