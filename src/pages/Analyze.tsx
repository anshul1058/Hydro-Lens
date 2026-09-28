import React, { useState, useEffect } from 'react';
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
  Download
} from 'lucide-react';
import { useCalibration } from '../hooks/useCalibration';
import { useAnalysis } from '../hooks/useAnalysis';
import { getReferences, calculateConcentration } from '../api/client';
import { StatusStrip } from '../components/StatusStrip';
import { MetricCard } from '../components/MetricCard';
import { Dropzone } from '../components/Dropzone';
import { Stepper } from '../components/Stepper';
import { SizeChart } from '../components/SizeChart';
import { ParticleTable } from '../components/ParticleTable';
import { JsonViewer } from '../components/JsonViewer';
import type { ReferenceItem } from '../api/types';

const testImages = [
  {
    filename: 'WhatsApp Image 2026-09-27 at 6.44.57 PM.jpeg',
    label: 'Test Sample 01',
    sizeText: '373 KB',
    dimensions: '1600 × 900 px',
    description: 'Field sample micrograph with microplastic candidates'
  },
  {
    filename: 'WhatsApp Image 2026-09-27 at 6.49.43 PM.jpeg',
    label: 'Test Sample 02',
    sizeText: '406 KB',
    dimensions: '1600 × 900 px',
    description: 'Field sample micrograph with irregular fragment particles'
  }
];

export const AnalyzePage: React.FC = () => {
  const { calibrationStatus, loading: calLoading } = useCalibration();
  const { result, loading: analyzeLoading, step, error: analyzeError, runAnalysis } = useAnalysis();

  const [sourceMode, setSourceMode] = useState<'upload' | 'demo'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedRefId, setSelectedRefId] = useState<string>('demo_microplastic_sample.jpg');
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
    if (sourceMode === 'upload') {
      runAnalysis(selectedFile, null);
    } else {
      runAnalysis(null, selectedRefId);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Calibration Status Banner */}
      <StatusStrip calibrationStatus={calibrationStatus} loading={calLoading} />

      {/* Main Stitch Grid: Left Source Selector (380px) | Right Metrics & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 380px Panel: Image Source */}
        <div className="lg:col-span-4 bg-[#E8F8FC]/85 backdrop-blur-[20px] rounded-[18px] border border-[#B9DFEA] p-5 shadow-[0_8px_24px_rgba(57,124,145,0.08)] space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-section-title">Image Source</h2>
            <span className="text-caption font-semibold px-2 py-0.5 rounded-full bg-[#6BBFD8]/20 text-[#397C91]">
              Input
            </span>
          </div>

          {/* Segmented Control (Upload | Demo reference) */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-white/80 rounded-full border border-[#B9DFEA] shadow-xs">
            <button
              onClick={() => setSourceMode('upload')}
              className={`py-1.5 px-3 rounded-full text-[13px] font-medium transition-all ${
                sourceMode === 'upload'
                  ? 'bg-[#6BBFD8] text-white shadow-xs font-semibold'
                  : 'text-[#5294A8] hover:text-[#397C91]'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setSourceMode('demo')}
              className={`py-1.5 px-3 rounded-full text-[13px] font-medium transition-all ${
                sourceMode === 'demo'
                  ? 'bg-[#6BBFD8] text-white shadow-xs font-semibold'
                  : 'text-[#5294A8] hover:text-[#397C91]'
              }`}
            >
              Demo Reference
            </button>
          </div>

          {sourceMode === 'upload' ? (
            <Dropzone
              onFileSelect={(file) => setSelectedFile(file)}
              selectedFile={selectedFile}
              onClear={() => setSelectedFile(null)}
              disabled={analyzeLoading}
            />
          ) : (
            <div className="space-y-2">
              <label className="text-caption block mb-1">Select Reference Image</label>
              <div className="space-y-2.5">
                {references.map((ref) => {
                  const isSelected = selectedRefId === ref.id;
                  return (
                    <div
                      key={ref.id}
                      onClick={() => setSelectedRefId(ref.id)}
                      className={`p-2.5 rounded-[14px] border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#6BBFD8]/20 border-[#6BBFD8] shadow-xs'
                          : 'bg-white/60 border-[#B9DFEA] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <img
                          src={ref.url}
                          alt={ref.label}
                          className="w-12 h-12 rounded-lg object-cover border border-[#B9DFEA] bg-slate-200 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="truncate">
                          <p className="text-[13px] font-semibold text-[#397C91] truncate">{ref.label}</p>
                          <p className="text-[11px] text-[#5294A8] truncate">{ref.id}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#6BBFD8] text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Run Analysis Action Button */}
          <button
            onClick={handleStartAnalysis}
            disabled={analyzeLoading || (sourceMode === 'upload' && !selectedFile)}
            className="w-full py-3 bg-[#6BBFD8] hover:bg-[#5AAEC7] disabled:opacity-50 text-white font-semibold rounded-full shadow-md transition-all flex items-center justify-center space-x-2 text-[14px]"
          >
            <Sparkles className="w-4 h-4" />
            <span>{analyzeLoading ? 'Processing Pipeline...' : 'Run Microplastics Screening'}</span>
          </button>

          {analyzeError && (
            <div className="p-3 bg-[#F28B8B]/20 border border-[#F28B8B]/40 rounded-xl text-[12px] text-[#397C91] flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#F28B8B] shrink-0" />
              <span>{analyzeError}</span>
            </div>
          )}
        </div>

        {/* RIGHT Column: Metrics Cards & Results */}
        <div className="lg:col-span-8 space-y-6">
          {/* Detector Fallback Info Banner */}
          {result?.detector_fallback && (
            <div className="p-4 bg-[#6BBFD8]/15 border border-[#6BBFD8]/35 rounded-[18px] text-[13px] text-[#397C91] flex items-start space-x-3 shadow-xs">
              <Info className="w-5 h-5 text-[#3FA7C4] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Demo Heuristic Mode Active:</span>{' '}
                {result.detector_load_error || 'No weights file (models/best.pt) found. Running adaptive morphological candidate detector.'}
              </div>
            </div>
          )}

          {/* Row of 5 Glass Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {analyzeLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 bg-[#E8F8FC]/60 rounded-[18px] border border-[#B9DFEA] animate-pulse" />
              ))
            ) : (
              <>
                <MetricCard
                  label="Particle Count"
                  value={result ? result.total_count : '—'}
                  subtitle="Detections"
                  valueColor="default"
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
                />

                <MetricCard
                  label="Lab Flag"
                  value={
                    result ? (
                      result.flag_lab_confirmation ? (
                        <span className="text-[14px] font-bold text-[#F28B8B] uppercase">REQUIRED</span>
                      ) : (
                        <span className="text-[14px] font-bold text-[#65C99A] uppercase">NOT REQUIRED</span>
                      )
                    ) : (
                      '—'
                    )
                  }
                  subtitle="Lab Confirmation"
                  valueColor={result?.flag_lab_confirmation ? 'rose' : 'mint'}
                />

                <MetricCard
                  label="Imaged Area"
                  value={result ? `${result.imaged_area_mm2.toFixed(2)}` : '—'}
                  subtitle="mm²"
                  valueColor="periwinkle"
                />

                <MetricCard
                  label="Inference Time"
                  value={result ? `${result.latency_sec.toFixed(2)} s` : '—'}
                  subtitle="Latency"
                  valueColor="default"
                />
              </>
            )}
          </div>

          {/* Stepper active during loading */}
          {analyzeLoading && <Stepper currentStep={step} />}

          {/* Flags Expander if any flags exist */}
          {result && result.flags && result.flags.length > 0 && (
            <div className="bg-[#F5C75A]/20 border border-[#F5C75A]/45 rounded-[18px] p-4 text-[13px] space-y-2">
              <button
                onClick={() => setFlagsExpanded(!flagsExpanded)}
                className="w-full flex items-center justify-between text-[#397C91] font-semibold text-left"
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-[#397C91]" />
                  <span>Pipeline Quality &amp; Flag Warnings ({result.flags.length})</span>
                </div>
                {flagsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {flagsExpanded && (
                <ul className="space-y-1.5 pt-2 border-t border-[#F5C75A]/40">
                  {result.flags.map((flag, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-[#5294A8]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F5C75A] mt-1.5 shrink-0" />
                      <div>
                        <strong className="text-[#397C91] capitalize">{flag.type.replace(/_/g, ' ')}:</strong>{' '}
                        {flag.message}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Segmented Tabs Navigation */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center space-x-6 border-b border-[#B9DFEA] px-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('visual')}
                  className={`pb-3 text-[14px] font-medium transition-all flex items-center space-x-2 relative whitespace-nowrap ${
                    activeTab === 'visual' ? 'text-[#6BBFD8] font-semibold' : 'text-[#5294A8] hover:text-[#397C91]'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>Visual Detection</span>
                  {activeTab === 'visual' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6BBFD8]" />}
                </button>

                <button
                  onClick={() => setActiveTab('size')}
                  className={`pb-3 text-[14px] font-medium transition-all flex items-center space-x-2 relative whitespace-nowrap ${
                    activeTab === 'size' ? 'text-[#6BBFD8] font-semibold' : 'text-[#5294A8] hover:text-[#397C91]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Size Distribution</span>
                  {activeTab === 'size' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6BBFD8]" />}
                </button>

                <button
                  onClick={() => setActiveTab('table')}
                  className={`pb-3 text-[14px] font-medium transition-all flex items-center space-x-2 relative whitespace-nowrap ${
                    activeTab === 'table' ? 'text-[#6BBFD8] font-semibold' : 'text-[#5294A8] hover:text-[#397C91]'
                  }`}
                >
                  <TableIcon className="w-4 h-4" />
                  <span>Particle Table ({result.detections.length})</span>
                  {activeTab === 'table' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6BBFD8]" />}
                </button>

                <button
                  onClick={() => setActiveTab('concentration')}
                  className={`pb-3 text-[14px] font-medium transition-all flex items-center space-x-2 relative whitespace-nowrap ${
                    activeTab === 'concentration' ? 'text-[#6BBFD8] font-semibold' : 'text-[#5294A8] hover:text-[#397C91]'
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  <span>Concentration</span>
                  {activeTab === 'concentration' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6BBFD8]" />}
                </button>

                <button
                  onClick={() => setActiveTab('json')}
                  className={`pb-3 text-[14px] font-medium transition-all flex items-center space-x-2 relative whitespace-nowrap ${
                    activeTab === 'json' ? 'text-[#6BBFD8] font-semibold' : 'text-[#5294A8] hover:text-[#397C91]'
                  }`}
                >
                  <FileJson className="w-4 h-4" />
                  <span>JSON Export</span>
                  {activeTab === 'json' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6BBFD8]" />}
                </button>
              </div>

              {/* Tab 1: Visual Detection */}
              {activeTab === 'visual' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#E8F8FC]/85 backdrop-blur-[20px] rounded-[18px] border border-[#B9DFEA] p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-section-title">Annotated Particles</h4>
                      <div className="flex items-center space-x-2 text-[11px] font-medium text-[#5294A8]">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#65C99A]" title="High Conf" />
                        <span>≥0.8</span>
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#F5C75A]" title="Med Conf" />
                        <span>0.5–0.8</span>
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#F28B8B]" title="Low/Flag" />
                        <span>&lt;0.5</span>
                      </div>
                    </div>
                    <div className="aspect-square bg-slate-900 rounded-[14px] overflow-hidden flex items-center justify-center border border-[#B9DFEA] shadow-inner">
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

                  <div className="bg-[#E8F8FC]/85 backdrop-blur-[20px] rounded-[18px] border border-[#B9DFEA] p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-section-title">Preprocessed Input</h4>
                      <span className="text-caption">640×640 CLAHE</span>
                    </div>
                    <div className="aspect-square bg-slate-900 rounded-[14px] overflow-hidden flex items-center justify-center border border-[#B9DFEA] shadow-inner">
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
                    <div className="p-6 bg-[#F28B8B]/15 border border-[#F28B8B]/40 rounded-[18px] text-center space-y-2">
                      <AlertTriangle className="w-8 h-8 text-[#F28B8B] mx-auto" />
                      <h4 className="text-section-title">Concentration Calculation Blocked</h4>
                      <p className="text-body text-[#5294A8] max-w-md mx-auto">
                        Calculating particles per liter requires an active micro-scale calibration factor. Please recalibrate in the Calibration Portal.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-[#E8F8FC]/85 backdrop-blur-[20px] rounded-[18px] border border-[#B9DFEA] p-6 space-y-5 shadow-[0_8px_24px_rgba(57,124,145,0.08)]">
                      <div className="flex items-center space-x-2">
                        <FlaskConical className="w-5 h-5 text-[#3FA7C4]" />
                        <h3 className="text-section-title">Sample Concentration Calculator</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-caption block mb-1">Sample Volume (mL)</label>
                          <input
                            type="number"
                            value={sampleVolumeMl}
                            onChange={(e) => setSampleVolumeMl(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-white border border-[#B9DFEA] rounded-xl text-[14px] font-semibold text-[#397C91] tabular-nums focus:outline-none focus:border-[#6BBFD8]"
                          />
                        </div>

                        <div>
                          <label className="text-caption block mb-1">Dilution Factor</label>
                          <input
                            type="number"
                            step="0.1"
                            value={dilutionFactor}
                            onChange={(e) => setDilutionFactor(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-white border border-[#B9DFEA] rounded-xl text-[14px] font-semibold text-[#397C91] tabular-nums focus:outline-none focus:border-[#6BBFD8]"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleCalculateConcentration}
                        disabled={calcLoading}
                        className="px-5 py-2.5 bg-[#6BBFD8] hover:bg-[#5AAEC7] text-white text-[13px] font-semibold rounded-full shadow-xs transition-all flex items-center space-x-2"
                      >
                        <Calculator className="w-4 h-4" />
                        <span>Calculate Concentration</span>
                      </button>

                      {calcConcentration !== null && (
                        <div className="p-4 bg-[#65C99A]/20 border border-[#65C99A]/40 rounded-[14px] flex items-center justify-between">
                          <div>
                            <p className="text-caption text-[#397C91]">Calculated Concentration</p>
                            <p className="text-[28px] font-bold text-[#397C91] tabular-nums">
                              {calcConcentration} <span className="text-[16px] font-normal text-[#5294A8]">particles / L</span>
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-[#65C99A]/25 flex items-center justify-center text-[#65C99A]">
                            <CheckCircle2 className="w-6 h-6 text-[#65C99A]" />
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
