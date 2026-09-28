import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle,
  Warning,
  Info,
  CaretDown,
  CaretUp,
  Eye,
  ChartBar,
  Table as TableIcon,
  Calculator,
  FileCode,
  Scan,
  Microscope,
  Stack,
  Crosshair,
  Circle,
  Check,
  DownloadSimple
} from '@phosphor-icons/react';
import { useCalibration } from '../hooks/useCalibration';
import { useAnalysis } from '../hooks/useAnalysis';
import { getReferences, calculateConcentration } from '../api/client';
import { StatusStrip } from '../components/StatusStrip';
import { MetricCard } from '../components/MetricCard';
import { Dropzone, type DemoSelectionInfo } from '../components/Dropzone';
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

const workflowSteps = [
  {
    num: '01',
    title: 'Membrane filtration',
    text: 'Draw water sample through a 0.45 µm nitrocellulose membrane filter under mild vacuum to collect particulate matter.',
    meta: '0.45 µm pore size',
    image: waterFiltrationImg,
    alt: 'Vacuum filtration setup for water sample processing'
  },
  {
    num: '02',
    title: 'Optical microscopy',
    text: 'Mount filter on mechanical stage and capture digital micrographs at 200x optical magnification under ring-LED lighting.',
    meta: '200x optical objective',
    image: microscopeTechImg,
    alt: 'Compound microscope stage imaging water filter membrane'
  },
  {
    num: '03',
    title: 'Stage micrometer calibration',
    text: 'Record a calibrated stage micrometer target once every 7 days to derive the µm/pixel spatial scaling factor.',
    meta: 'Spatial scale factor (µm/px)',
    image: calibrationMetrologyImg,
    alt: 'Precision stage micrometer division scale'
  },
  {
    num: '04',
    title: 'Inference and Feret sizing',
    text: 'YOLOv8 identifies particle candidates. OpenCV calculates maximum/minimum Feret diameters, equivalent diameter, and aspect ratios.',
    meta: 'YOLOv8n + OpenCV Sizing',
    image: heroLabImg,
    alt: 'Detected microplastic candidates segmented and annotated'
  }
];

const morphologyClasses = [
  {
    code: '01',
    name: 'Fragment',
    desc: 'Angular, irregular particles originating from mechanical degradation of rigid plastic items.',
    scale: '20 µm scale',
    image: fragmentImg
  },
  {
    code: '02',
    name: 'Fiber',
    desc: 'Slender, elongated synthetic filaments typically shed from synthetic textiles and filtration ropes.',
    scale: '50 µm scale',
    image: fiberImg
  },
  {
    code: '03',
    name: 'Film',
    desc: 'Planar sheets with irregular, flexible boundaries, commonly derived from packaging bags and plastic wraps.',
    scale: '100 µm scale',
    image: filmImg
  },
  {
    code: '04',
    name: 'Foam',
    desc: 'Cellular, porous structures exhibiting lower optical density, characteristic of expanded polystyrene.',
    scale: '50 µm scale',
    image: foamImg
  },
  {
    code: '05',
    name: 'Pellet',
    desc: 'Spheroidal virgin resin nurdles and industrial microbead precursors.',
    scale: '50 µm scale',
    image: pelletImg
  }
];

const resultTabs = [
  { id: 'visual' as const, label: 'Micrograph Inspection', icon: Eye },
  { id: 'size' as const, label: 'Size Distribution', icon: ChartBar },
  { id: 'table' as const, label: 'Particle Candidates', icon: TableIcon },
  { id: 'concentration' as const, label: 'Volumetric Concentration', icon: Calculator },
  { id: 'json' as const, label: 'Diagnostic JSON', icon: FileCode }
];

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [activeTab, setActiveTab] = useState<'visual' | 'size' | 'table' | 'concentration' | 'json'>('visual');
  const [flagsExpanded, setFlagsExpanded] = useState<boolean>(true);

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
    setSelectedFile(null);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setSelectedDemoId(null);
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
        title: 'Environmental Sample 01',
        filename: 'demo_microplastic_sample.jpg',
        label: 'Surface Water Micrograph',
        thumbnail: microplasticDemoImg,
        badge: 'Spiked Sample',
        fileSizeText: '240 KB'
      };
    }
    if (selectedDemoId === 'blank_filter_control.png') {
      return {
        id: 'blank_filter_control.png',
        title: 'Negative Control Filter',
        filename: 'blank_filter_control.png',
        label: 'Clean Nitrocellulose Blank',
        thumbnail: blankFilterDemoImg,
        badge: 'Blank Control',
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

  const handleDownloadTestImage = async (filename: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const publicUrl = `/testing/${encodeURIComponent(filename)}`;
    try {
      const res = await fetch(publicUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      // Fallback: trigger API direct download or direct link
      const link = document.createElement('a');
      link.href = `/api/testing/download/${encodeURIComponent(filename)}`;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleStageTestImage = async (filename: string) => {
    try {
      const res = await fetch(`/testing/${encodeURIComponent(filename)}`);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/jpeg' });
      handleFileSelect(file);
    } catch (err) {
      console.error('Failed to stage test image:', err);
    }
  };

  const calQuality = calibrationStatus?.quality ?? 0.0;

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

  const demoCards = [
    {
      ref: microplasticRef,
      title: 'Positive Sample Reference',
      tag: 'Spiked Water',
      tagClass: 'bg-accent-tint text-accent border-accent-border'
    },
    {
      ref: blankControlRef,
      title: 'Negative Control Filter',
      tag: 'Field Blank',
      tagClass: 'bg-sunken text-ink-3 border-line'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="max-w-3xl">
        <h1 className="text-page-title">Optical Microplastic Screening</h1>
        <p className="text-body mt-2">
          Stage a reference micrograph or upload a raw sample image to execute the computer vision pipeline.
          The detector identifies morphology classes, calculates Feret metrics, and computes volumetric particle concentrations.
        </p>
      </header>

      {/* Calibration Gatekeeper Alert */}
      <StatusStrip calibrationStatus={calibrationStatus} loading={calLoading} />

      {/* Editorial Laboratory Workflow Progression */}
      <section aria-labelledby="workflow-heading" className="border-t border-line pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-5">
          <div className="lg:col-span-4">
            <h2 id="workflow-heading" className="text-section-title">
              Sample Preparation and Imaging Workflow
            </h2>
            <p className="text-body mt-2">
              From water bottle to counted report. Physical filtration and optical capture occur at the bench,
              followed by automated object detection and sizing in this application.
            </p>
          </div>
          <ol className="lg:col-span-8 divide-y divide-line border-t border-line">
            {workflowSteps.map((s) => (
              <li key={s.num} className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] gap-x-4 gap-y-2 py-4 items-start">
                <span className="font-mono text-[12px] font-semibold text-accent pt-0.5">{s.num}</span>
                <div className="min-w-0">
                  <h3 className="text-[14.5px] font-semibold text-ink">{s.title}</h3>
                  <p className="text-[13px] text-ink-2 mt-1 leading-relaxed">{s.text}</p>
                  <p className="text-[11px] font-mono text-ink-3 mt-1.5 uppercase tracking-[0.06em]">{s.meta}</p>
                </div>
                <img
                  src={s.image}
                  alt={s.alt}
                  loading="lazy"
                  width={160}
                  height={100}
                  className="col-span-2 sm:col-span-1 w-full sm:w-36 h-22 object-cover rounded-sm border border-line bg-sunken"
                />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sample Staging & Control Library */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
          <section aria-labelledby="image-source-heading" className="bg-surface border border-line rounded-md p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-line pb-3 gap-2">
              <h2 id="image-source-heading" className="text-section-title">
                Image Source
              </h2>
              <span className="text-[10.5px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm bg-sunken text-ink-2 border border-line">
                {selectedDemoId ? 'Reference Loaded' : selectedFile ? 'Upload Loaded' : 'Awaiting Image'}
              </span>
            </div>

            <Dropzone
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              selectedDemo={selectedDemoInfo}
              onClear={handleClearSelection}
              disabled={analyzeLoading}
            />

            {/* Quick Test Images Bar inside Image Source */}
            <div className="p-3 bg-sunken/60 rounded-md border border-line space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-ink flex items-center gap-1.5">
                  <DownloadSimple size={14} className="text-accent" weight="bold" />
                  Testing Images (testing/ folder)
                </span>
                <span className="text-[10px] font-mono text-ink-3">Click name to download</span>
              </div>
              <div className="space-y-1.5">
                {testImages.map((img) => (
                  <div
                    key={img.filename}
                    className="flex items-center justify-between gap-2 p-2 bg-surface rounded border border-line hover:border-accent transition-colors group"
                  >
                    <a
                      href={`/testing/${encodeURIComponent(img.filename)}`}
                      download={img.filename}
                      onClick={(e) => handleDownloadTestImage(img.filename, e)}
                      title={`Click name to directly download ${img.filename}`}
                      className="flex-1 min-w-0 text-left cursor-pointer flex items-center gap-2"
                    >
                      <span className="text-[9.5px] font-mono uppercase px-1.5 py-0.5 rounded bg-accent-tint text-accent border border-accent-border shrink-0 font-semibold">
                        {img.label}
                      </span>
                      <span className="text-[11.5px] font-mono text-ink group-hover:text-accent group-hover:underline truncate">
                        {img.filename}
                      </span>
                    </a>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-mono text-ink-3 mr-0.5">{img.sizeText}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDownloadTestImage(img.filename, e)}
                        title={`Download ${img.filename}`}
                        className="p-1 rounded hover:bg-accent-tint text-ink-2 hover:text-accent cursor-pointer transition-colors"
                      >
                        <DownloadSimple size={14} weight="bold" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartAnalysis}
              disabled={analyzeLoading || (!selectedFile && !selectedDemoId)}
              className="w-full py-2.5 btn-primary flex items-center justify-center gap-2 text-[13.5px] cursor-pointer"
            >
              {analyzeLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <span>Run Screening Pipeline</span>
              )}
            </button>

            {analyzeError && (
              <div role="alert" className="p-3 bg-err-tint border border-err-border rounded-sm text-[12px] text-err flex items-start gap-2.5">
                <Warning size={16} className="shrink-0 mt-0.5" weight="bold" />
                <span>{analyzeError}</span>
              </div>
            )}
          </section>

          {/* Model Test Images Download Section */}
          <section aria-labelledby="test-images-heading" className="bg-surface border border-line rounded-md p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-line pb-3 gap-2">
              <div className="flex items-center gap-2">
                <DownloadSimple size={16} className="text-accent" weight="bold" />
                <h2 id="test-images-heading" className="text-section-title">
                  Model Test Images
                </h2>
              </div>
              <span className="text-[10.5px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm bg-accent-tint text-accent border border-accent-border font-medium">
                2 Micrographs
              </span>
            </div>

            <p className="text-[12px] text-ink-3 leading-relaxed">
              Click on either image name to directly download test micrographs from the <code className="text-accent font-semibold">testing/</code> folder to test model detection:
            </p>

            <div className="space-y-2.5">
              {testImages.map((img) => (
                <div
                  key={img.filename}
                  className="p-3 rounded-md border border-line bg-page hover:border-line-strong transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={`/testing/${encodeURIComponent(img.filename)}`}
                      alt={img.label}
                      className="w-12 h-12 rounded object-cover border border-line bg-sunken shrink-0"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-accent-tint text-accent border border-accent-border shrink-0 font-semibold">
                          {img.label}
                        </span>
                        <span className="text-[11px] font-mono text-ink-3 shrink-0">
                          {img.sizeText}
                        </span>
                      </div>
                      {/* Clicking on the name triggers direct download */}
                      <a
                        href={`/testing/${encodeURIComponent(img.filename)}`}
                        download={img.filename}
                        onClick={(e) => handleDownloadTestImage(img.filename, e)}
                        title={`Click to directly download ${img.filename}`}
                        className="block mt-1 font-mono text-[12px] font-semibold text-ink group-hover:text-accent hover:underline truncate cursor-pointer"
                      >
                        {img.filename}
                      </a>
                      <p className="text-[11px] text-ink-3 mt-0.5 truncate">
                        {img.dimensions} • Click name to download
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleDownloadTestImage(img.filename, e)}
                      title={`Directly download ${img.filename}`}
                      className="px-2.5 py-1.5 rounded-sm text-[12px] font-medium bg-accent text-white hover:bg-accent-hover transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <DownloadSimple size={13} weight="bold" />
                      <span>Download</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStageTestImage(img.filename)}
                      title={`Stage ${img.label} into Dropzone for instant testing`}
                      className="px-2 py-1.5 rounded-sm text-[11.5px] font-medium bg-surface text-ink-2 border border-line hover:bg-sunken transition-colors cursor-pointer"
                    >
                      Stage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Reference Library Selection */}
          <section aria-labelledby="samples-heading" className="bg-surface border border-line rounded-md p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-line pb-3 gap-2">
              <h2 id="samples-heading" className="text-section-title">Reference Samples</h2>
              <span className="text-[10.5px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm bg-sunken text-ink-2 border border-line">
                2 Micrographs
              </span>
            </div>

            <p className="text-[12px] text-ink-3">
              Select a benchmark sample to test detector inference without local hardware capture:
            </p>

            <div className="space-y-2">
              {demoCards.map(({ ref, title, tag, tagClass }) => {
                const isSelected = selectedDemoId === ref.id;
                return (
                  <div
                    key={ref.id}
                    onClick={() => handleInspectDemo(ref.id)}
                    className={`p-3 rounded-sm border cursor-pointer flex items-center justify-between gap-3 transition-colors duration-150 ${
                      isSelected ? 'border-accent bg-accent-tint' : 'border-line bg-page hover:border-line-strong'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[13px] font-semibold text-ink truncate">{title}</h3>
                        <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border shrink-0 ${tagClass}`}>
                          {tag}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-ink-3 truncate mt-0.5">{ref.id}</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInspectDemo(ref.id);
                      }}
                      className={`px-2.5 py-1 rounded-sm text-[11.5px] font-medium transition-colors duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-accent text-white border border-accent'
                          : 'bg-surface text-ink-2 border border-line hover:bg-sunken'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check size={13} weight="bold" />
                          <span>Active</span>
                        </>
                      ) : (
                        <span>Stage</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Execution Metrics & Analytical Results */}
        <div className="lg:col-span-8 space-y-6">
          {result?.detector_fallback && (
            <div className="p-4 bg-accent-tint border border-accent-border rounded-md text-[13px] text-ink-2 flex items-start gap-3">
              <Info size={18} className="text-accent shrink-0 mt-0.5" weight="bold" />
              <div>
                <span className="font-semibold text-ink">Heuristic Detector Fallback: </span>
                {result.detector_load_error || 'Custom weights (models/best.pt) not detected on disk. The system has switched to optical morphological contour detection.'}
              </div>
            </div>
          )}

          {/* Metric Overview Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {analyzeLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-22 rounded-md border border-line" />
              ))
            ) : (
              <>
                <MetricCard
                  label="Candidate Count"
                  value={result ? result.total_count : '-'}
                  subtitle="Detected Particles"
                  valueColor="default"
                  icon={<Stack size={16} />}
                />
                <MetricCard
                  label="Sample Score"
                  value={result ? `${(result.sample_confidence * 100).toFixed(0)}%` : '-'}
                  subtitle="Aggregate Reliability"
                  valueColor={
                    !result
                      ? 'default'
                      : result.sample_confidence >= 0.8
                      ? 'ok'
                      : result.sample_confidence >= 0.6
                      ? 'warn'
                      : 'err'
                  }
                  icon={<Circle size={16} />}
                />
                <MetricCard
                  label="Lab Verification"
                  value={
                    result ? (
                      result.flag_lab_confirmation ? (
                        <span className="text-[13px] font-bold text-err uppercase">Required</span>
                      ) : (
                        <span className="text-[13px] font-bold text-ok uppercase">Screened</span>
                      )
                    ) : (
                      '-'
                    )
                  }
                  subtitle="FTIR / Raman Trigger"
                  valueColor={result?.flag_lab_confirmation ? 'err' : 'ok'}
                  icon={<Warning size={16} />}
                />
                <MetricCard
                  label="Imaged Area"
                  value={result ? `${result.imaged_area_mm2.toFixed(2)}` : '-'}
                  subtitle="mm² (Filter Window)"
                  valueColor="accent"
                  icon={<Crosshair size={16} />}
                />
                <MetricCard
                  label="Inference Time"
                  value={result ? `${result.latency_sec.toFixed(2)} s` : '-'}
                  subtitle="Pipeline Latency"
                  valueColor="default"
                  icon={<Scan size={16} />}
                />
              </>
            )}
          </div>

          {/* Active Step Progress */}
          {analyzeLoading && <Stepper currentStep={step} />}

          {/* Pipeline Warnings */}
          {result && result.flags && result.flags.length > 0 && (
            <div className="bg-warn-tint border border-warn-border rounded-md p-4 text-[12.5px] space-y-2">
              <button
                onClick={() => setFlagsExpanded(!flagsExpanded)}
                aria-expanded={flagsExpanded}
                className="w-full flex items-center justify-between text-ink font-semibold text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Warning size={16} className="text-warn" weight="bold" />
                  <span>Pipeline Quality Warnings ({result.flags.length})</span>
                </span>
                {flagsExpanded ? <CaretUp size={14} className="text-warn" /> : <CaretDown size={14} className="text-warn" />}
              </button>

              {flagsExpanded && (
                <ul className="space-y-2 pt-2.5 border-t border-warn-border">
                  {result.flags.map((flag, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-ink-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-warn mt-1.5 shrink-0" />
                      <div>
                        <strong className="text-ink capitalize">{flag.type.replace(/_/g, ' ')}:</strong>{' '}
                        {flag.message}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Empty State */}
          {!result && !analyzeLoading && (
            <div className="min-h-[320px] flex flex-col items-center justify-center bg-surface border border-line rounded-md p-8 text-center shadow-2xs">
              <Microscope size={38} className="text-accent mb-3" />
              <h2 className="text-[16px] font-semibold text-ink">Awaiting Sample Execution</h2>
              <p className="text-[13px] text-ink-2 mt-2 max-w-md leading-relaxed">
                Stage one of the reference micrographs or upload an optical filter image from the left panel.
                The YOLOv8 pipeline will segment particles and calculate metrics.
              </p>
            </div>
          )}

          {/* Analytical Results View Tabs */}
          {result && (
            <div className="space-y-4">
              <div role="tablist" aria-label="Result inspection views" className="flex items-center gap-1 border-b border-line overflow-x-auto">
                {resultTabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={activeTab === id}
                    onClick={() => setActiveTab(id)}
                    className={`pb-2.5 px-3 text-[13px] font-medium transition-colors duration-150 flex items-center gap-2 whitespace-nowrap cursor-pointer border-b-2 -mb-px ${
                      activeTab === id
                        ? 'text-accent border-accent font-semibold'
                        : 'text-ink-3 border-transparent hover:text-ink'
                    }`}
                  >
                    <Icon size={15} weight={activeTab === id ? 'bold' : 'regular'} />
                    <span>
                      {label}
                      {id === 'table' ? ` (${result.detections.length})` : ''}
                    </span>
                  </button>
                ))}
              </div>

              {/* View 1: Micrograph Visual Inspection */}
              {activeTab === 'visual' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <figure className="bg-surface border border-line rounded-md p-5 space-y-3 shadow-2xs">
                    <figcaption className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[13.5px] font-semibold text-ink">Annotated Particle Detection</span>
                      <span className="flex items-center gap-2 text-[11px] font-mono text-ink-3">
                        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-ok" title="Confidence ≥ 0.8" />
                        <span>≥ 0.8</span>
                        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-warn" title="Confidence 0.5 to 0.8" />
                        <span>0.5 to 0.8</span>
                        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-err" title="Confidence below 0.5" />
                        <span>&lt; 0.5</span>
                      </span>
                    </figcaption>
                    <div className="relative aspect-square bg-panel-dark rounded-sm overflow-hidden flex items-center justify-center border border-panel-dark-line">
                      {result.images.annotated ? (
                        <img
                          src={result.images.annotated}
                          alt="Micrograph sample with detected microplastics bounded and tagged"
                          loading="lazy"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <p className="text-[12px] text-panel-dark-ink font-mono">No annotated image available</p>
                      )}
                    </div>
                  </figure>

                  <figure className="bg-surface border border-line rounded-md p-5 space-y-3 shadow-2xs">
                    <figcaption className="flex items-center justify-between gap-2">
                      <span className="text-[13.5px] font-semibold text-ink">Preprocessed Optical Input</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-sunken text-ink-3 border border-line">
                        640×640 Median + CLAHE
                      </span>
                    </figcaption>
                    <div className="relative aspect-square bg-panel-dark rounded-sm overflow-hidden flex items-center justify-center border border-panel-dark-line">
                      {result.images.preprocessed ? (
                        <img
                          src={result.images.preprocessed}
                          alt="Denoised and contrast-enhanced grayscale micrograph input"
                          loading="lazy"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <p className="text-[12px] text-panel-dark-ink font-mono">No preprocessed image available</p>
                      )}
                    </div>
                  </figure>
                </div>
              )}

              {/* View 2: Particle Size Distribution Histogram */}
              {activeTab === 'size' && (
                <SizeChart
                  distribution={result.size_distribution_um}
                  calibrationQuality={calQuality}
                />
              )}

              {/* View 3: Candidate Table */}
              {activeTab === 'table' && (
                <ParticleTable detections={result.detections} />
              )}

              {/* View 4: Volumetric Concentration Calculation */}
              {activeTab === 'concentration' && (
                <div className="space-y-4">
                  {calQuality === 0.0 ? (
                    <div className="p-8 bg-err-tint border border-err-border rounded-md text-center space-y-3">
                      <Warning size={28} className="text-err mx-auto" weight="bold" />
                      <h3 className="text-section-title">Volumetric Extrapolation Blocked</h3>
                      <p className="text-body max-w-md mx-auto">
                        Calculating particles per liter requires an active calibration record to compute the physical field area. Calibrate the system to unlock this module.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-surface border border-line rounded-md p-6 space-y-5 shadow-2xs">
                      <div className="border-b border-line pb-3">
                        <h3 className="text-section-title">Volumetric Particle Concentration</h3>
                        <p className="text-[12.5px] text-ink-3 mt-0.5">
                          Extrapolates imaged filter area count across total filtered sample volume.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="sample-volume" className="text-caption block mb-1.5">
                            Sample Volume (mL)
                          </label>
                          <input
                            id="sample-volume"
                            type="number"
                            value={sampleVolumeMl}
                            onChange={(e) => setSampleVolumeMl(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-page border border-line rounded-sm text-[13.5px] font-mono text-ink focus:border-accent focus-visible:outline-accent transition-colors"
                          />
                        </div>

                        <div>
                          <label htmlFor="dilution-factor" className="text-caption block mb-1.5">
                            Dilution Factor
                          </label>
                          <input
                            id="dilution-factor"
                            type="number"
                            step="0.1"
                            value={dilutionFactor}
                            onChange={(e) => setDilutionFactor(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-page border border-line rounded-sm text-[13.5px] font-mono text-ink focus:border-accent focus-visible:outline-accent transition-colors"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleCalculateConcentration}
                        disabled={calcLoading}
                        className="btn-primary px-4 py-2 text-[13px] flex items-center gap-2 cursor-pointer"
                      >
                        <Calculator size={16} weight="bold" />
                        <span>{calcLoading ? 'Computing Concentration...' : 'Compute Concentration'}</span>
                      </button>

                      {calcConcentration !== null && (
                        <div className="p-5 bg-ok-tint border border-ok-border rounded-md flex items-center justify-between gap-4">
                          <div>
                            <p className="text-caption text-ok font-semibold">Calculated Water Quality Metric</p>
                            <p className="text-[28px] font-bold font-mono text-ink my-0.5 tracking-tight">
                              {calcConcentration.toLocaleString()}{' '}
                              <span className="text-[14px] font-sans font-normal text-ink-2">particles / L</span>
                            </p>
                          </div>
                          <CheckCircle size={32} className="text-ok shrink-0" weight="fill" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* View 5: JSON Export */}
              {activeTab === 'json' && (
                <JsonViewer data={result.report as unknown as Record<string, unknown>} sampleId={result.sample_id} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Morphology Taxonomy Reference Gallery */}
      <section aria-labelledby="morphology-heading" className="border-t border-line pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <div>
            <p className="text-caption">Taxonomy Matrix</p>
            <h2 id="morphology-heading" className="text-section-title">
              Microplastic Candidate Morphology Classes
            </h2>
          </div>
          <span className="text-[11.5px] font-mono text-ink-3">Optical screening detection range: 10 µm to 5 mm</span>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-4 gap-y-5">
          {morphologyClasses.map((item) => (
            <li key={item.code} className="bg-surface border border-line rounded-md p-3 flex flex-col shadow-2xs">
              <div className="relative aspect-[4/3] w-full rounded-sm overflow-hidden bg-panel-dark border border-panel-dark-line">
                <img
                  src={item.image}
                  alt={`${item.name} optical micrograph`}
                  loading="lazy"
                  width={320}
                  height={240}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-sm bg-panel-dark/90 text-panel-dark-ink text-[10px] font-mono border border-panel-dark-line">
                  {item.scale}
                </span>
              </div>
              <h3 className="text-[14px] font-semibold text-ink mt-2.5">{item.name}</h3>
              <p className="text-[12px] text-ink-2 leading-relaxed mt-1 flex-1">{item.desc}</p>
              <div className="mt-2.5 pt-2 border-t border-line flex items-center justify-between text-[11px] font-mono text-ink-3">
                <span>Code: {item.code}</span>
                <span className="text-accent uppercase font-semibold">{item.name.toLowerCase()}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AnalyzePage;
