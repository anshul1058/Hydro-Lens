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
  Microscope,
  Layers,
  Crosshair,
  CircleDot,
  Check
} from 'lucide-react';
import { useCalibration } from '../hooks/useCalibration';
import { useAnalysis } from '../hooks/useAnalysis';
import { getReferences, calculateConcentration } from '../api/client';
import { StatusStrip } from '../components/StatusStrip';
import { MetricCard } from '../components/MetricCard';
import { Dropzone, type DemoSelectionInfo } from '../components/Dropzone';
import { Scientific3DBackground } from '../components/Scientific3DBackground';
import { Stepper } from '../components/Stepper';
import { SizeChart } from '../components/SizeChart';
import { ParticleTable } from '../components/ParticleTable';
import { JsonViewer } from '../components/JsonViewer';
import type { ReferenceItem } from '../api/types';
import microplasticDemoImg from '../assets/demo_microplastic_sample.jpg';
import blankFilterDemoImg from '../assets/blank_filter_control.png';
import heroLabImg from '../assets/hero_lab_microscope.jpg';
import waterFiltrationImg from '../assets/water_filtration_lab.jpg';
import microscopeTechImg from '../assets/microscope_tech.jpg';
import calibrationMetrologyImg from '../assets/calibration_metrology.jpg';
import fragmentImg from '../assets/morphology_fragment.jpg';
import fiberImg from '../assets/morphology_fiber.jpg';
import filmImg from '../assets/morphology_film.jpg';
import foamImg from '../assets/morphology_foam.jpg';
import pelletImg from '../assets/morphology_pellet.jpg';

export const AnalyzePage: React.FC = () => {
  const { calibrationStatus, loading: calLoading } = useCalibration();
  const { result, loading: analyzeLoading, step, error: analyzeError, runAnalysis } = useAnalysis();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [activeTab, setActiveTab] = useState<'visual' | 'size' | 'table' | 'concentration' | 'json'>('visual');
  const [flagsExpanded, setFlagsExpanded] = useState<boolean>(true);

  // Concentration inputs
  const [sampleVolumeMl, setSampleVolumeMl] = useState<number>(1000);
  const [dilutionFactor, setDilutionFactor] = useState<number>(1.0);
  const [calcConcentration, setCalcConcentration] = useState<number | null>(null);
  const [calcLoading, setCalcLoading] = useState<boolean>(false);

  useEffect(() => {
    getReferences()
      .then((data) => setReferences(data))
      .catch(() => {
        setReferences([
          {
            id: 'demo_microplastic_sample.jpg',
            label: 'Microplastic Sample',
            url: '/api/references/file/demo_microplastic_sample.jpg'
          },
          {
            id: 'blank_filter_control.png',
            label: 'Blank Filter Control',
            url: '/api/references/file/blank_filter_control.png'
          },
          {
            id: 'stage_micrometer_scale.png',
            label: 'Stage Micrometer Scale',
            url: '/api/references/file/stage_micrometer_scale.png'
          }
        ]);
      });
  }, []);

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

  const handleInspectDemo = (refId: string) => {
    setSelectedDemoId(refId);
    setSelectedFile(null); // Replace any personal upload
    // IMPORTANT: Clicking Inspect Image 1 or 2 ONLY selects and previews. Does NOT start analysis!
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setSelectedDemoId(null); // Replace any demo selection
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setSelectedDemoId(null);
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

  const calQuality = calibrationStatus?.quality ?? 0.0;

  // Retrieve existing references for the two demo cards
  const microplasticRef = references.find((r) => r.id === 'demo_microplastic_sample.jpg') || {
    id: 'demo_microplastic_sample.jpg',
    label: 'Microplastic Sample',
    url: '/api/references/file/demo_microplastic_sample.jpg'
  };

  const blankControlRef = references.find((r) => r.id === 'blank_filter_control.png') || {
    id: 'blank_filter_control.png',
    label: 'Blank Filter Control',
    url: '/api/references/file/blank_filter_control.png'
  };

  return (
    <div className="space-y-7 relative">
      {/* Subtle 3D Scientific Water & Suspended Microplastics Background Effect */}
      <Scientific3DBackground />

      {/* Standard Aqueous Screening Protocol Showcase (Inspired by Reference Websites 1 & 2) */}
      <section className="bg-white/95 backdrop-blur-[20px] rounded-[24px] border border-[#BBE4F2] p-5 sm:p-6 shadow-[0_8px_30px_rgba(8,145,178,0.06)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#BBE4F2]/50 pb-3">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-[#0891B2] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Standard Operational Workflow</span>
            </div>
            <h2 className="text-[18px] sm:text-[20px] font-extrabold text-[#0A2540] mt-0.5">
              Standard Aqueous Screening Protocol
            </h2>
          </div>
          <span className="text-[12px] font-medium text-[#4A7F96]">
            Four-step microplastic detection and metrology pipeline
          </span>
        </div>

        {/* 4 Workflow Photo Cards with Numbers and Explanations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Sample Filtration */}
          <div className="group rounded-[18px] border border-[#BBE4F2] bg-white p-3 hover:border-[#0891B2]/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-900 mb-3">
                <img 
                  src={waterFiltrationImg} 
                  alt="0.45µm Vacuum Membrane Filtration" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#07172B]/85 backdrop-blur-xs text-white text-[10px] font-bold font-mono border border-cyan-400/30">
                  Step 01
                </div>
              </div>
              <h3 className="text-[14px] font-bold text-[#0A2540] group-hover:text-[#0284C7] transition-colors">
                Membrane Filtration
              </h3>
              <p className="text-[11.5px] text-[#4A7F96] mt-1 leading-relaxed">
                Aqueous sample vacuum filtration through 0.45 µm nitrocellulose membrane substrate.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#BBE4F2]/40 text-[10.5px] font-semibold text-[#0891B2] flex items-center justify-between">
              <span>0.45 µm Pore Size</span>
              <span>Filtration</span>
            </div>
          </div>

          {/* Card 2: Optical Microscopy */}
          <div className="group rounded-[18px] border border-[#BBE4F2] bg-white p-3 hover:border-[#0891B2]/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-900 mb-3">
                <img 
                  src={microscopeTechImg} 
                  alt="High-Contrast 200x Optical Microscopy" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#07172B]/85 backdrop-blur-xs text-white text-[10px] font-bold font-mono border border-cyan-400/30">
                  Step 02
                </div>
              </div>
              <h3 className="text-[14px] font-bold text-[#0A2540] group-hover:text-[#0284C7] transition-colors">
                Optical Microscopy
              </h3>
              <p className="text-[11.5px] text-[#4A7F96] mt-1 leading-relaxed">
                200× optical magnification with darkfield and LED illumination to expose particle contours.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#BBE4F2]/40 text-[10.5px] font-semibold text-[#0891B2] flex items-center justify-between">
              <span>200× Objective</span>
              <span>Imaging</span>
            </div>
          </div>

          {/* Card 3: Metrology Calibration */}
          <div className="group rounded-[18px] border border-[#BBE4F2] bg-white p-3 hover:border-[#0891B2]/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-900 mb-3">
                <img 
                  src={calibrationMetrologyImg} 
                  alt="Stage Micrometer Optical Metrology" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#07172B]/85 backdrop-blur-xs text-white text-[10px] font-bold font-mono border border-cyan-400/30">
                  Step 03
                </div>
              </div>
              <h3 className="text-[14px] font-bold text-[#0A2540] group-hover:text-[#0284C7] transition-colors">
                Metrology Scale
              </h3>
              <p className="text-[11.5px] text-[#4A7F96] mt-1 leading-relaxed">
                Stage micrometer scale verification calculating precise µm-per-pixel factor with 7-day safety lock.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#BBE4F2]/40 text-[10.5px] font-semibold text-[#0891B2] flex items-center justify-between">
              <span>µm / px Factor</span>
              <span>Metrology</span>
            </div>
          </div>

          {/* Card 4: AI Screening & Sizing */}
          <div className="group rounded-[18px] border border-[#BBE4F2] bg-white p-3 hover:border-[#0891B2]/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-900 mb-3">
                <img 
                  src={heroLabImg} 
                  alt="YOLOv8 Object Detection and Sizing" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#07172B]/85 backdrop-blur-xs text-white text-[10px] font-bold font-mono border border-cyan-400/30">
                  Step 04
                </div>
              </div>
              <h3 className="text-[14px] font-bold text-[#0A2540] group-hover:text-[#0284C7] transition-colors">
                AI Detection &amp; Sizing
              </h3>
              <p className="text-[11.5px] text-[#4A7F96] mt-1 leading-relaxed">
                YOLOv8 deep learning particle detection paired with OpenCV Feret and ECD sizing algorithms.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#BBE4F2]/40 text-[10.5px] font-semibold text-[#0891B2] flex items-center justify-between">
              <span>YOLOv8 + OpenCV</span>
              <span>Screening</span>
            </div>
          </div>
        </div>
      </section>

      {/* Calibration Status Banner */}
      <StatusStrip calibrationStatus={calibrationStatus} loading={calLoading} />

      {/* Main Grid: Left Source & Try Sample Images (4 cols) | Right Metrics & Results (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT Column: Image Source + Try Sample Images */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Image Source (Upload & Preview Section) */}
          <section className="bg-white/95 backdrop-blur-[20px] rounded-[20px] border border-[#BBE4F2] p-5 sm:p-6 shadow-[0_8px_24px_rgba(8,145,178,0.06)] space-y-4 transition-all">
            <div className="flex items-center justify-between border-b border-[#BBE4F2]/50 pb-3">
              <div className="flex items-center space-x-2">
                <Scan className="w-5 h-5 text-[#0891B2]" />
                <h2 className="text-section-title">Image Source</h2>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EAF7FC] text-[#0284C7] border border-[#0891B2]/30 shadow-2xs">
                {selectedDemoId ? 'Demo Staged' : selectedFile ? 'Custom Upload' : 'Standby'}
              </span>
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

            {/* Run Microplastics Screening Action Button */}
            <button
              onClick={handleStartAnalysis}
              disabled={analyzeLoading || (!selectedFile && !selectedDemoId)}
              className="w-full py-3.5 btn-primary-sci flex items-center justify-center space-x-2 text-[14px] cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${analyzeLoading ? 'animate-spin' : ''}`} />
              <span>{analyzeLoading ? 'Processing Pipeline...' : 'Run Microplastics Screening'}</span>
            </button>

            {analyzeError && (
              <div className="p-3.5 bg-[#FEECEB] border border-[#EF4444]/40 rounded-xl text-[12.5px] text-[#DC2626] font-medium flex items-center space-x-2.5 shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>{analyzeError}</span>
              </div>
            )}
          </section>

          {/* Card 2: Try Sample Images Section (Only image names visible during selection) */}
          <section className="bg-white/95 backdrop-blur-[20px] rounded-[20px] border border-[#BBE4F2] p-5 shadow-[0_8px_24px_rgba(8,145,178,0.06)] space-y-3.5 transition-all">
            <div className="flex items-center justify-between border-b border-[#BBE4F2]/50 pb-2.5">
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-5 h-5 text-[#0891B2]" />
                <h2 className="text-section-title">Try Sample Images</h2>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EAF7FC] text-[#0284C7] border border-[#0891B2]/30 shadow-2xs">
                2 Reference Samples
              </span>
            </div>

            <p className="text-[12px] text-[#4A7F96]">
              Choose a reference sample to stage and preview in the upload section above:
            </p>

            {/* Two demo image cards displayed vertically, one below the other (Image name visible, inspect image hidden during selection) */}
            <div className="flex flex-col space-y-2.5">
              {/* DEMO IMAGE 1 */}
              <div
                onClick={() => handleInspectDemo(microplasticRef.id)}
                className={`p-3.5 rounded-[16px] border-2 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                  selectedDemoId === microplasticRef.id
                    ? 'border-[#0891B2] bg-gradient-to-r from-[#EAF7FC] to-[#F0FAFE] shadow-[0_4px_16px_rgba(8,145,178,0.18)] ring-2 ring-[#0891B2]/30'
                    : 'border-[#BBE4F2] bg-white hover:border-[#0891B2]/60 hover:shadow-xs'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-[13.5px] font-bold text-[#0A2540] truncate">
                      Demo Image 1
                    </h3>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAF7FC] text-[#0891B2] border border-[#0891B2]/25 shrink-0">
                      Positive
                    </span>
                  </div>
                  <p className="text-[11.5px] font-mono text-[#0891B2] font-semibold truncate mt-0.5">
                    {microplasticRef.id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInspectDemo(microplasticRef.id);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all duration-200 flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    selectedDemoId === microplasticRef.id
                      ? 'bg-gradient-to-r from-[#0284C7] to-[#0891B2] text-white shadow-xs'
                      : 'bg-[#F0F9FD] hover:bg-[#E0F3FC] text-[#0891B2] border border-[#BBE4F2]'
                  }`}
                >
                  {selectedDemoId === microplasticRef.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Selected</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Image 1</span>
                    </>
                  )}
                </button>
              </div>

              {/* DEMO IMAGE 2 */}
              <div
                onClick={() => handleInspectDemo(blankControlRef.id)}
                className={`p-3.5 rounded-[16px] border-2 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                  selectedDemoId === blankControlRef.id
                    ? 'border-[#0891B2] bg-gradient-to-r from-[#EAF7FC] to-[#F0FAFE] shadow-[0_4px_16px_rgba(8,145,178,0.18)] ring-2 ring-[#0891B2]/30'
                    : 'border-[#BBE4F2] bg-white hover:border-[#0891B2]/60 hover:shadow-xs'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-[13.5px] font-bold text-[#0A2540] truncate">
                      Demo Image 2
                    </h3>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-[#4A7F96] border border-slate-200 shrink-0">
                      Control
                    </span>
                  </div>
                  <p className="text-[11.5px] font-mono text-[#0891B2] font-semibold truncate mt-0.5">
                    {blankControlRef.id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInspectDemo(blankControlRef.id);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all duration-200 flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    selectedDemoId === blankControlRef.id
                      ? 'bg-gradient-to-r from-[#0284C7] to-[#0891B2] text-white shadow-xs'
                      : 'bg-[#F0F9FD] hover:bg-[#E0F3FC] text-[#0891B2] border border-[#BBE4F2]'
                  }`}
                >
                  {selectedDemoId === blankControlRef.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Selected</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Image 2</span>
                    </>
                  )}
                </button>
              </div>
            </div>
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

          {/* Row of 5 Glass Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {analyzeLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-28 bg-white/70 rounded-[18px] border border-[#BBE4F2] animate-pulse" />
              ))
            ) : (
              <>
                <MetricCard
                  label="Particle Count"
                  value={result ? result.total_count : '—'}
                  subtitle="Detections"
                  valueColor="default"
                  icon={<Layers className="w-4 h-4" />}
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
                      : 'rose'
                  }
                  icon={<Sparkles className="w-4 h-4" />}
                />

                <MetricCard
                  label="Lab Flag"
                  value={
                    result ? (
                      result.flag_lab_confirmation ? (
                        <span className="text-[14px] font-bold text-[#DC2626] uppercase">REQUIRED</span>
                      ) : (
                        <span className="text-[14px] font-bold text-[#059669] uppercase">NOT REQUIRED</span>
                      )
                    ) : (
                      '—'
                    )
                  }
                  subtitle="Lab Confirmation"
                  valueColor={result?.flag_lab_confirmation ? 'rose' : 'mint'}
                  icon={<AlertTriangle className="w-4 h-4" />}
                />

                <MetricCard
                  label="Imaged Area"
                  value={result ? `${result.imaged_area_mm2.toFixed(2)}` : '—'}
                  subtitle="mm²"
                  valueColor="periwinkle"
                  icon={<Crosshair className="w-4 h-4" />}
                />

                <MetricCard
                  label="Inference Time"
                  value={result ? `${result.latency_sec.toFixed(2)} s` : '—'}
                  subtitle="Latency"
                  valueColor="default"
                  icon={<CircleDot className="w-4 h-4" />}
                />
              </>
            )}
          </div>

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

          {/* Empty state when no analysis has run yet */}
          {!result && !analyzeLoading && (
            <div className="flex-1 min-h-[340px] flex flex-col items-center justify-center bg-white/95 backdrop-blur-[20px] rounded-[20px] border border-[#BBE4F2] p-8 text-center shadow-[0_8px_24px_rgba(8,145,178,0.06)] relative overflow-hidden">
              <div className="max-w-md mx-auto space-y-4">
                <div className="relative w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#0284C7]/15 via-[#0891B2]/20 to-[#0D9488]/15 border border-[#0891B2]/30 flex items-center justify-center text-[#0891B2] shadow-sm">
                  <Microscope className="w-10 h-10 animate-pulse text-[#0891B2]" style={{ animationDuration: '3s' }} />
                  {/* Floating microplastic particle dots */}
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#06B6D4] animate-particle-1" />
                  <span className="absolute bottom-3 left-2 w-2.5 h-1.5 rounded-full bg-[#10B981] animate-particle-2" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-[18px] font-bold text-[#0A2540]">Microplastic Screening Workstation Ready</h3>
                  <p className="text-[13.5px] text-[#2C637A] leading-relaxed">
                    Select a reference sample above or upload optical microscopy imagery from your instrument to initiate automated particle classification, Feret diameter sizing, and sample confidence scoring.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#EAF7FC] border border-[#BBE4F2] text-[11.5px] font-semibold text-[#0891B2]">
                    YOLOv8n Inference
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#EAF7FC] border border-[#BBE4F2] text-[11.5px] font-semibold text-[#0891B2]">
                    Feret &amp; ECD Sizing
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#EAF7FC] border border-[#BBE4F2] text-[11.5px] font-semibold text-[#0891B2]">
                    ISO-Compliant Validation
                  </span>
                </div>
              </div>
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
                  {calQuality === 0.0 ? (
                    <div className="p-8 bg-gradient-to-br from-white to-[#FEECEB]/60 border border-[#EF4444]/40 rounded-[20px] text-center space-y-3 shadow-[0_4px_20px_rgba(239,68,68,0.08)]">
                      <div className="w-12 h-12 rounded-2xl bg-[#FEECEB] border border-[#EF4444]/30 flex items-center justify-center text-[#DC2626] mx-auto shadow-xs">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <h4 className="text-section-title text-[#0A2540]">Concentration Calculation Blocked</h4>
                      <p className="text-body text-[#2C637A] max-w-md mx-auto">
                        Calculating particles per liter requires an active micro-scale calibration factor. Please recalibrate in the Calibration Portal.
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

      {/* Laboratory Reference: 5 Microplastic Morphology Classes (Inspired by Reference 1 & 2) */}
      <section className="bg-white/95 backdrop-blur-[20px] rounded-[24px] border border-[#BBE4F2] p-6 sm:p-7 shadow-[0_8px_30px_rgba(8,145,178,0.06)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#BBE4F2]/50 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-[11.5px] font-bold text-[#0891B2] uppercase tracking-wider">
              <Microscope className="w-4 h-4 text-[#0891B2]" />
              <span>Morphological Classification Taxonomy</span>
            </div>
            <h2 className="text-xl font-extrabold text-[#0A2540] mt-0.5">
              Target Microplastic Candidate Morphologies
            </h2>
          </div>
          <span className="text-[12px] font-semibold text-[#4A7F96]">
            Standard Optical Microscopy Screening (10 µm – 5 mm)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {[
            {
              code: '01',
              name: 'Fragment',
              desc: 'Irregular sharp angular polymer particles from breakdown of larger plastics.',
              tag: 'High Rigidity',
              scale: '20 µm Scale',
              image: fragmentImg,
              borderColor: 'border-sky-300 hover:border-sky-500',
              badgeColor: 'bg-sky-50 text-sky-800 border-sky-300'
            },
            {
              code: '02',
              name: 'Fiber',
              desc: 'Elongated synthetic polymer threads shedding from textiles & filtration media.',
              tag: 'High Aspect Ratio',
              scale: '50 µm Scale',
              image: fiberImg,
              borderColor: 'border-cyan-300 hover:border-cyan-500',
              badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-300'
            },
            {
              code: '03',
              name: 'Film',
              desc: 'Ultra-thin translucent planar polymer sheets with flexible perimeter contours.',
              tag: 'Planar Surface',
              scale: '100 µm Scale',
              image: filmImg,
              borderColor: 'border-emerald-300 hover:border-emerald-500',
              badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300'
            },
            {
              code: '04',
              name: 'Foam',
              desc: 'Porous cellular expanded polymer structures with low optical density matrices.',
              tag: 'Cellular Void',
              scale: '50 µm Scale',
              image: foamImg,
              borderColor: 'border-amber-300 hover:border-amber-500',
              badgeColor: 'bg-amber-50 text-amber-800 border-amber-300'
            },
            {
              code: '05',
              name: 'Pellet',
              desc: 'Spherical or lenticular pre-production polymer microbeads and virgin resin.',
              tag: 'High Sphericity',
              scale: '50 µm Scale',
              image: pelletImg,
              borderColor: 'border-rose-300 hover:border-rose-500',
              badgeColor: 'bg-rose-50 text-rose-800 border-rose-300'
            }
          ].map((item) => (
            <div 
              key={item.code}
              className={`p-3.5 rounded-[20px] border ${item.borderColor} bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl flex flex-col justify-between group overflow-hidden`}
            >
              <div>
                {/* Micrograph Visual Frame */}
                <div className="relative aspect-[4/3] w-full rounded-[14px] overflow-hidden bg-slate-950 mb-3 border border-[#BBE4F2]/60">
                  <img 
                    src={item.image} 
                    alt={`${item.name} microscopic sample`} 
                    className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Top-Left Number Code Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#07172B]/85 backdrop-blur-xs text-white text-[10px] font-black font-mono border border-cyan-400/30">
                    {item.code}
                  </div>

                  {/* Bottom-Right Scale Bar Tag */}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[9.5px] font-mono font-bold text-cyan-300 border border-cyan-400/30">
                    {item.scale}
                  </div>
                </div>

                {/* Header with Title and Tag */}
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-[15px] font-extrabold text-[#0A2540] group-hover:text-[#0284C7] transition-colors">
                    {item.name}
                  </h3>
                  <span className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.tag}
                  </span>
                </div>

                <p className="text-[11.5px] text-[#4A7F96] leading-relaxed line-clamp-3">
                  {item.desc}
                </p>
              </div>

              {/* Card Footer */}
              <div className="mt-3.5 pt-2 border-t border-[#BBE4F2]/50 text-[10.5px] font-semibold text-[#0891B2] flex items-center justify-between">
                <span>Class ID: {item.name.toLowerCase()}</span>
                <span className="font-mono text-[9.5px] bg-[#EAF7FC] px-1.5 py-0.5 rounded text-[#0284C7] font-bold">
                  YOLOv8
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
