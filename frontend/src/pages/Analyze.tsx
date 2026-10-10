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
  FileText,
  Download,
  Sparkles
} from 'lucide-react';
import { useCalibration } from '../hooks/useCalibration';
import { useAnalysis } from '../hooks/useAnalysis';
import {
  getReferences,
  calculateConcentration,
  getReportPdfUrl,
  downloadReportPdf
} from '../api/client';
import { StatusStrip } from '../components/StatusStrip';
import { MetricCard } from '../components/MetricCard';
import { Dropzone } from '../components/Dropzone';
import { Stepper } from '../components/Stepper';
import { SizeChart } from '../components/SizeChart';
import { ParticleTable } from '../components/ParticleTable';
import { JsonViewer } from '../components/JsonViewer';
import type { ReferenceItem } from '../api/types';

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

  // PDF report state
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    getReferences()
      .then((data) => setReferences(data))
      .catch(() => {
        setReferences([
          {
            id: 'demo_microplastic_sample.jpg',
            label: 'Microplastic Sample',
            url: '/api/references/file/demo_microplastic_sample.jpg',
          },
          {
            id: 'blank_filter_control.png',
            label: 'Blank Filter Control',
            url: '/api/references/file/blank_filter_control.png',
          },
          {
            id: 'stage_micrometer_scale.png',
            label: 'Stage Micrometer Scale',
            url: '/api/references/file/stage_micrometer_scale.png',
          },
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
        dilution_factor: dilutionFactor,
      });
      setCalcConcentration(res.concentration);
    } catch {
      setCalcConcentration(null);
    } finally {
      setCalcLoading(false);
    }
  };

  const calQuality = calibrationStatus?.quality ?? 0.0;

  const reportOpts = () => ({
    sampleVolumeMl: sampleVolumeMl > 0 ? sampleVolumeMl : undefined,
    dilutionFactor: dilutionFactor > 0 ? dilutionFactor : undefined
  });

  const handleViewReport = () => {
    if (!result) return;
    setPdfError(null);
    window.open(
      getReportPdfUrl(result.sample_id, reportOpts()),
      '_blank',
      'noopener'
    );
  };

  const handleDownloadReport = async () => {
    if (!result) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      await downloadReportPdf(result.sample_id, reportOpts());
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'PDF download failed.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calibration Status Banner */}
      <StatusStrip calibrationStatus={calibrationStatus} loading={calLoading} />

      {/* Main Grid: Left Source Selector (380px) | Right Metrics & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT 380px Panel: Image Source */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#9ecae1] p-5 shadow-[0_4px_20px_rgba(74,144,217,0.06)] space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#1E2A38]">Image Source</h2>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#4a90d9]/15 text-[#4a90d9] border border-[#9ecae1]">
              Input
            </span>
          </div>

          {/* Segmented Control (Upload | Demo reference) */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#eff3ff] rounded-xl border border-[#9ecae1]">
            <button
              onClick={() => setSourceMode('upload')}
              className={`py-2 px-3 rounded-lg text-[13px] font-bold transition-all ${
                sourceMode === 'upload'
                  ? 'bg-[#4a90d9] text-white shadow-xs'
                  : 'text-[#6b7a90] hover:text-[#1E2A38]'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setSourceMode('demo')}
              className={`py-2 px-3 rounded-lg text-[13px] font-bold transition-all ${
                sourceMode === 'demo'
                  ? 'bg-[#4a90d9] text-white shadow-xs'
                  : 'text-[#6b7a90] hover:text-[#1E2A38]'
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
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6b7a90] block mb-1">
                Select Reference Image
              </label>
              <div className="space-y-2.5">
                {references.map((ref) => {
                  const isSelected = selectedRefId === ref.id;
                  return (
                    <div
                      key={ref.id}
                      onClick={() => setSelectedRefId(ref.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#4a90d9]/10 border-[#4a90d9] shadow-2xs'
                          : 'bg-white border-[#D0DCE8] hover:border-[#9ecae1]'
                      }`}
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <img
                          src={ref.url}
                          alt={ref.label}
                          className="w-12 h-12 rounded-lg object-cover border border-[#9ecae1] bg-[#eff3ff] shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="truncate">
                          <p className="text-[13px] font-bold text-[#1E2A38] truncate">{ref.label}</p>
                          <p className="text-[11px] text-[#6b7a90] truncate">{ref.id}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#4a90d9] text-white flex items-center justify-center shrink-0 shadow-2xs">
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
            className="w-full py-3.5 bg-[#4a90d9] hover:bg-[#3a7bc0] active:scale-[0.98] disabled:opacity-50 text-white font-bold rounded-full shadow-[0_6px_20px_rgba(74,144,217,0.3)] transition-all flex items-center justify-center space-x-2 text-[14px]"
          >
            <Sparkles className="w-4 h-4" />
            <span>{analyzeLoading ? 'Processing Pipeline...' : 'Run Microplastics Screening'}</span>
          </button>

          {analyzeError && (
            <div className="p-3 bg-[#FF6B6B]/15 border border-[#FF6B6B]/30 rounded-xl text-[12px] text-[#FF6B6B] flex items-center space-x-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-[#FF6B6B] shrink-0" />
              <span>{analyzeError}</span>
            </div>
          )}
        </div>

        {/* RIGHT Column: Metrics Cards & Results */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Detector Fallback Info Banner */}
          {result?.detector_fallback && (
            <div className="p-4 bg-[#eff3ff] border border-[#9ecae1] rounded-2xl text-[13px] text-[#1E2A38] flex items-start space-x-3 shadow-xs">
              <Info className="w-5 h-5 text-[#4a90d9] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#4a90d9]">Demo Heuristic Mode Active:</span>{' '}
                {result.detector_load_error || 'No weights file (models/best.pt) found. Running adaptive morphological candidate detector.'}
              </div>
            </div>
          )}

          {/* Row of 5 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {analyzeLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-[#9ecae1]/50 animate-pulse" />
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
                        <span className="text-[13px] font-extrabold text-[#FF6B6B] uppercase">REQUIRED</span>
                      ) : (
                        <span className="text-[13px] font-extrabold text-[#2ECC91] uppercase">PASSED</span>
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
            <div className="bg-[#F5B942]/15 border border-[#F5B942]/40 rounded-2xl p-4 text-[13px] space-y-2">
              <button
                onClick={() => setFlagsExpanded(!flagsExpanded)}
                className="w-full flex items-center justify-between text-[#1E2A38] font-bold text-left"
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-[#F5B942]" />
                  <span>Pipeline Quality &amp; Flag Warnings ({result.flags.length})</span>
                </div>
                {flagsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {flagsExpanded && (
                <ul className="space-y-1.5 pt-2 border-t border-[#F5B942]/30">
                  {result.flags.map((flag, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-[#1E2A38]/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F5B942] mt-1.5 shrink-0" />
                      <div>
                        <strong className="text-[#1E2A38] capitalize">{flag.type.replace(/_/g, ' ')}:</strong>{' '}
                        {flag.message}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* PDF Report: view + download after detection */}
          {result && (
            <div className="bg-[#E8F8FC]/85 backdrop-blur-[20px] rounded-[18px] border border-[#B9DFEA] p-4 shadow-[0_8px_24px_rgba(57,124,145,0.08)] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#6BBFD8]/20 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#397C91]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#397C91]">
                      Screening Report Ready
                    </p>
                    <p className="text-[12px] text-[#5294A8]">
                      12-section PDF report for {result.sample_id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleViewReport}
                    className="px-4 py-2 bg-white hover:bg-[#6BBFD8]/15 border border-[#6BBFD8] text-[#397C91] text-[13px] font-semibold rounded-full shadow-xs transition-all flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Report</span>
                  </button>
                  <button
                    onClick={handleDownloadReport}
                    disabled={pdfLoading}
                    className="px-4 py-2 bg-[#6BBFD8] hover:bg-[#5AAEC7] disabled:opacity-50 text-white text-[13px] font-semibold rounded-full shadow-xs transition-all flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{pdfLoading ? 'Preparing PDF...' : 'Download PDF'}</span>
                  </button>
                </div>
              </div>

              {pdfError && (
                <div className="p-2.5 bg-[#F28B8B]/20 border border-[#F28B8B]/40 rounded-xl text-[12px] text-[#397C91] flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-[#F28B8B] shrink-0" />
                  <span>{pdfError}</span>
                </div>
              )}
            </div>
          )}

          {/* Segmented Tabs Navigation */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-[#9ecae1] px-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('visual')}
                  className={`pb-3 px-3 text-[13px] font-bold transition-all flex items-center space-x-2 relative whitespace-nowrap ${
                    activeTab === 'visual' ? 'text-[#4a90d9]' : 'text-[#6b7a90] hover:text-[#1E2A38]'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>Visual Detection</span>
                  {activeTab === 'visual' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#4a90d9] rounded-t" />}
                </button>

                <button
                  onClick={() => setActiveTab('size')}
                  className={`pb-3 px-3 text-[13px] font-bold transition-all flex items-center space-x-2 relative whitespace-nowrap ${
                    activeTab === 'size' ? 'text-[#4a90d9]' : 'text-[#6b7a90] hover:text-[#1E2A38]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Size Distribution</span>
                  {activeTab === 'size' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#4a90d9] rounded-t" />}
                </button>

                <button
                  onClick={() => setActiveTab('table')}
                  className={`pb-3 px-3 text-[13px] font-bold transition-all flex items-center space-x-2 relative whitespace-nowrap ${
                    activeTab === 'table' ? 'text-[#4a90d9]' : 'text-[#6b7a90] hover:text-[#1E2A38]'
                  }`}
                >
                  <TableIcon className="w-4 h-4" />
                  <span>Particle Table ({result.detections.length})</span>
                  {activeTab === 'table' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#4a90d9] rounded-t" />}
                </button>

                <button
                  onClick={() => setActiveTab('concentration')}
                  className={`pb-3 px-3 text-[13px] font-bold transition-all flex items-center space-x-2 relative whitespace-nowrap ${
                    activeTab === 'concentration' ? 'text-[#4a90d9]' : 'text-[#6b7a90] hover:text-[#1E2A38]'
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  <span>Concentration</span>
                  {activeTab === 'concentration' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#4a90d9] rounded-t" />}
                </button>

                <button
                  onClick={() => setActiveTab('json')}
                  className={`pb-3 px-3 text-[13px] font-bold transition-all flex items-center space-x-2 relative whitespace-nowrap ${
                    activeTab === 'json' ? 'text-[#4a90d9]' : 'text-[#6b7a90] hover:text-[#1E2A38]'
                  }`}
                >
                  <FileJson className="w-4 h-4" />
                  <span>JSON Export</span>
                  {activeTab === 'json' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#4a90d9] rounded-t" />}
                </button>
              </div>

              {/* Tab 1: Visual Detection */}
              {activeTab === 'visual' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-[#9ecae1] p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[15px] font-bold text-[#1E2A38]">Annotated Particles</h4>
                      <div className="flex items-center space-x-2 text-[11px] font-semibold text-[#6b7a90]">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#2ECC91]" title="High Conf" />
                        <span>≥0.8</span>
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#F5B942]" title="Med Conf" />
                        <span>0.5–0.8</span>
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FF6B6B]" title="Low/Flag" />
                        <span>&lt;0.5</span>
                      </div>
                    </div>
                    <div className="aspect-square bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-[#9ecae1]/50 shadow-inner">
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

                  <div className="bg-white rounded-2xl border border-[#9ecae1] p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[15px] font-bold text-[#1E2A38]">Preprocessed Input</h4>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7a90]">640×640 CLAHE</span>
                    </div>
                    <div className="aspect-square bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-[#9ecae1]/50 shadow-inner">
                      {result.images.preprocessed ? (
                        <img
                          src={result.images.preprocessed}
                          alt="Preprocessed Input"
                          className="w-full h-full object-contain"
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
                    <div className="p-6 bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-2xl text-center space-y-2">
                      <AlertTriangle className="w-8 h-8 text-[#FF6B6B] mx-auto" />
                      <h4 className="text-[16px] font-bold text-[#1E2A38]">Concentration Calculation Blocked</h4>
                      <p className="text-[13px] text-[#6b7a90] max-w-md mx-auto">
                        Calculating particles per liter requires an active micro-scale calibration factor. Please recalibrate in the Calibration Portal.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-[#9ecae1] p-6 space-y-5 shadow-xs">
                      <div className="flex items-center space-x-2">
                        <FlaskConical className="w-5 h-5 text-[#4a90d9]" />
                        <h3 className="text-[16px] font-bold text-[#1E2A38]">Sample Concentration Calculator</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#6b7a90] block mb-1">
                            Sample Volume (mL)
                          </label>
                          <input
                            type="number"
                            value={sampleVolumeMl}
                            onChange={(e) => setSampleVolumeMl(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-white border border-[#D0DCE8] rounded-xl text-[14px] font-bold text-[#1E2A38] tabular-nums focus:outline-none focus:border-[#4a90d9]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#6b7a90] block mb-1">
                            Dilution Factor
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={dilutionFactor}
                            onChange={(e) => setDilutionFactor(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-white border border-[#D0DCE8] rounded-xl text-[14px] font-bold text-[#1E2A38] tabular-nums focus:outline-none focus:border-[#4a90d9]"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleCalculateConcentration}
                        disabled={calcLoading}
                        className="px-6 py-2.5 bg-[#4a90d9] hover:bg-[#3a7bc0] active:scale-95 text-white text-[13px] font-bold rounded-full shadow-xs transition-all flex items-center space-x-2"
                      >
                        <Calculator className="w-4 h-4" />
                        <span>Calculate Concentration</span>
                      </button>

                      {calcConcentration !== null && (
                        <div className="p-4 bg-[#2ECC91]/15 border border-[#2ECC91]/30 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#1E2A38]">
                              Calculated Concentration
                            </p>
                            <p className="text-[28px] font-extrabold text-[#1E2A38] tabular-nums">
                              {calcConcentration} <span className="text-[15px] font-medium text-[#6b7a90]">particles / L</span>
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-[#2ECC91]/25 flex items-center justify-center text-[#2ECC91]">
                            <CheckCircle2 className="w-6 h-6 text-[#2ECC91]" />
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
