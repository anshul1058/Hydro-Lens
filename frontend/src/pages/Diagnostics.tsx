import React, { useState, useEffect } from 'react';
import { Cpu, Warning, Stack, Bookmark } from '@phosphor-icons/react';
import { getDiagnostics } from '../api/client';
import type { DiagnosticsResponse } from '../api/types';
import systemDiagnosticsHwImg from '../assets/system_diagnostics_hw.jpg';
import fragmentImg from '../assets/morphology_fragment.jpg';
import fiberImg from '../assets/morphology_fiber.jpg';
import filmImg from '../assets/morphology_film.jpg';
import foamImg from '../assets/morphology_foam.jpg';
import pelletImg from '../assets/morphology_pellet.jpg';

export const DiagnosticsPage: React.FC = () => {
  const [data, setData] = useState<DiagnosticsResponse | null>(null);
  const [activeSection, setActiveSection] = useState<'model' | 'classes' | 'limitations'>('model');

  useEffect(() => {
    getDiagnostics()
      .then((res) => setData(res))
      .catch(() => {
        setData({
          model_info: {
            name: 'Hydro Lens Detector',
            version: '1.0.0',
            architecture: 'YOLOv8n (Nano)',
            framework: 'Ultralytics YOLOv8 / PyTorch',
            parameters: '3.2 M',
            model_size: '~6 MB (.pt)',
            input_resolution: '640×640 RGB',
            latency: '1.2 s (Laptop CPU)',
            status: 'Production'
          },
          classes: [
            { name: 'fragment', description: 'Angular, irregular particles originating from fragmented rigid plastics', count: 1200 },
            { name: 'fiber', description: 'High aspect ratio elongated synthetic filaments from textiles', count: 800 },
            { name: 'film', description: 'Planar sheets with irregular, flexible boundaries from wrap/packaging', count: 450 },
            { name: 'foam', description: 'Cellular, porous structures exhibiting lower optical density', count: 320 },
            { name: 'pellet', description: 'Spheroidal virgin resin nurdles and industrial microbeads', count: 210 }
          ],
          limitations: [
            {
              id: 1,
              title: 'Morphological characterization boundary',
              detail:
                'Hydro Lens classifies particle physical geometry (fragment, fiber, film, foam, pellet). Chemical polymer classification (PE, PP, PET) requires spectroscopic confirmation via FTIR or Raman spectroscopy, which is explicitly outside the optical screening scope.'
            },
            {
              id: 2,
              title: 'Optical diffraction resolution limit at 10 µm',
              detail:
                'At 200x optical magnification with a 1920x1080 sensor, theoretical sampling yields ~0.5 µm per pixel. Optical diffraction, sensor noise, and signal-to-noise ratio establish the empirical detection threshold at 10 µm. Particles under 10 µm cannot be reliably resolved.'
            },
            {
              id: 3,
              title: 'Training dataset generalization and local validation',
              detail:
                'The detector was trained on fluorescence and sewage microscopy corpora. Environmental field conditions, organic debris, and differing illumination require local benchmark validation before production reporting.'
            },
            {
              id: 4,
              title: 'Prerequisites for volumetric concentration extrapolation',
              detail:
                'Extrapolating single field-of-view observations assumes homogeneous particle dispersion across the membrane filter. Concentration reporting strictly requires a valid active calibration record, known filter window area, and documented sample filtration volume.'
            }
          ]
        });
      });
  }, []);

  const model = data?.model_info;

  const particleMicrographs: Record<string, string> = {
    fragment: fragmentImg,
    fiber: fiberImg,
    film: filmImg,
    foam: foamImg,
    pellet: pelletImg
  };

  const tocItems = [
    { id: 'model-card', section: 'model' as const, label: 'Model Architecture' },
    { id: 'detection-classes', section: 'classes' as const, label: 'Morphology Taxonomy' },
    { id: 'limitations', section: 'limitations' as const, label: 'Operational Boundaries' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-9 space-y-6">
        {/* Page Header */}
        <header className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
          <div className="sm:col-span-8 max-w-2xl">
            <p className="text-caption">System Metrology and Architecture</p>
            <h1 className="text-page-title mt-1">System Diagnostics</h1>
            <p className="text-body mt-2">
              Detector specifications, the 5-class microplastic morphology taxonomy, and the scientific
              boundaries enforced by the screening pipeline to prevent misattribution.
            </p>
          </div>
          <img
            src={systemDiagnosticsHwImg}
            alt="Optical bench hardware and digital sensor testbed"
            width={320}
            height={200}
            className="sm:col-span-4 w-full h-32 object-cover rounded-sm border border-line bg-sunken"
          />
        </header>

        {!data ? (
          <div className="space-y-4" aria-busy="true" aria-live="polite">
            <div className="skeleton h-40 rounded-md border border-line" />
            <div className="skeleton h-56 rounded-md border border-line" />
            <div className="skeleton h-40 rounded-md border border-line" />
            <span className="sr-only">Loading diagnostics data...</span>
          </div>
        ) : (
          <>
            {/* Model Card Section */}
            <section id="model-card" className="bg-surface border border-line rounded-md p-6 space-y-5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-sm bg-accent-tint border border-accent-border flex items-center justify-center text-accent">
                    <Cpu size={22} weight="bold" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-section-title">YOLOv8n Neural Detector</h2>
                      <span className="px-2 py-0.5 rounded-sm text-[11px] font-mono font-semibold bg-ok-tint text-ok border border-ok-border">
                        Production Ready
                      </span>
                    </div>
                    <p className="text-caption mt-0.5">Single-Stage Morphological Particle Detector</p>
                  </div>
                </div>
                <span className="text-[11.5px] font-mono font-medium text-ink bg-sunken px-2.5 py-1 rounded-sm border border-line">
                  Version {model?.version || '1.0.0'}
                </span>
              </div>

              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-page rounded-sm border border-line">
                  <dt className="text-caption">Architecture</dt>
                  <dd className="text-[13.5px] font-semibold text-ink mt-0.5">
                    {model?.architecture || 'YOLOv8n (Nano)'}
                  </dd>
                </div>
                <div className="p-3 bg-page rounded-sm border border-line">
                  <dt className="text-caption">Parameters</dt>
                  <dd className="text-[13.5px] font-mono font-semibold text-ink mt-0.5">
                    {model?.parameters || '3.2 M'}
                  </dd>
                </div>
                <div className="p-3 bg-page rounded-sm border border-line">
                  <dt className="text-caption">Model Footprint</dt>
                  <dd className="text-[13.5px] font-mono font-semibold text-ink mt-0.5">
                    {model?.model_size || '~6 MB (.pt)'}
                  </dd>
                </div>
                <div className="p-3 bg-page rounded-sm border border-line">
                  <dt className="text-caption">CPU Inference Latency</dt>
                  <dd className="text-[13.5px] font-mono font-semibold text-ink mt-0.5">
                    {model?.latency || '1.2 s'}
                  </dd>
                </div>
              </dl>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
                <div className="flex items-center justify-between p-3 bg-page rounded-sm border border-line">
                  <dt className="text-ink-3 font-medium">Runtime Backend</dt>
                  <dd className="font-mono text-ink">
                    {model?.framework || 'Ultralytics YOLOv8 / PyTorch'}
                  </dd>
                </div>
                <div className="flex items-center justify-between p-3 bg-page rounded-sm border border-line">
                  <dt className="text-ink-3 font-medium">Input Tensor Geometry</dt>
                  <dd className="font-mono text-ink">
                    {model?.input_resolution || '640×640 RGB'}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Detection Classes Section */}
            <section id="detection-classes" className="bg-surface border border-line rounded-md p-6 space-y-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                <div className="flex items-center gap-2.5">
                  <Stack size={18} className="text-accent" weight="bold" />
                  <h2 className="text-section-title">Detection Class Taxonomy</h2>
                </div>
                <span className="text-caption font-mono bg-sunken px-2.5 py-1 rounded-sm border border-line">
                  5 Classes Standardized
                </span>
              </div>

              <div className="overflow-x-auto rounded-sm border border-line">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-sunken border-b border-line text-ink-3 text-[11px] font-semibold uppercase tracking-[0.06em]">
                      <th className="py-2.5 px-4 font-semibold">Micrograph Reference</th>
                      <th className="py-2.5 px-4 font-semibold">Morphology Name</th>
                      <th className="py-2.5 px-4 font-semibold">Diagnostic Definition</th>
                      <th className="py-2.5 px-4 text-right font-semibold">Corpus Annotations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-ink-2">
                    {data.classes.map((cls) => {
                      const img = particleMicrographs[cls.name.toLowerCase()];
                      return (
                        <tr key={cls.name} className="hover:bg-sunken/40 transition-colors">
                          <td className="py-2.5 px-4">
                            {img ? (
                              <img
                                src={img}
                                alt={`${cls.name} micrograph reference`}
                                loading="lazy"
                                width={56}
                                height={44}
                                className="w-14 h-11 rounded-sm overflow-hidden border border-line object-cover bg-panel-dark"
                              />
                            ) : (
                              <span className="block w-14 h-11 rounded-sm bg-sunken border border-line" />
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-sunken border border-line capitalize text-ink">
                              {cls.name}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[12.5px] leading-relaxed">{cls.description}</td>
                          <td className="py-2.5 px-4 text-right font-mono text-[12.5px] text-ink">
                            {cls.count.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Operational Limitations & Safety Rules */}
            <section id="limitations" className="bg-surface border border-line rounded-md p-6 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2.5 border-b border-line pb-3">
                <Warning size={18} className="text-warn" weight="bold" />
                <h2 className="text-section-title">Operational Boundaries and Scientific Constraints</h2>
              </div>
              <p className="text-caption">
                Verbatim constraints from CONFIDENCE_AND_LIMITATIONS.md. Strictly enforced by algorithm gates.
              </p>

              <ol className="space-y-4 pt-1">
                {data.limitations.map((lim) => (
                  <li key={lim.id} className="grid grid-cols-[auto_1fr] gap-x-3.5 items-start p-3 rounded-sm bg-page border border-line">
                    <span className="font-mono text-[12px] font-semibold text-accent pt-0.5">
                      {String(lim.id).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-[13.5px] font-semibold text-ink">{lim.title}</h3>
                      <p className="text-[12.5px] text-ink-2 leading-relaxed mt-1">{lim.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
      </div>

      {/* Sticky Table of Contents Navigation Rail */}
      <nav aria-label="Section navigation" className="lg:col-span-3 sticky top-24 space-y-3">
        <div className="bg-surface border border-line rounded-md p-4 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-ink-3 text-[11px] font-semibold uppercase tracking-[0.06em] border-b border-line pb-2">
            <Bookmark size={14} className="text-accent" />
            <span>Diagnostic Sections</span>
          </div>

          <ul className="space-y-1 text-[12.5px]">
            {tocItems.map(({ id, section, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={() => setActiveSection(section)}
                  aria-current={activeSection === section ? 'true' : undefined}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-sm transition-colors duration-150 ${
                    activeSection === section
                      ? 'bg-accent-tint text-accent font-semibold border border-accent-border'
                      : 'text-ink-2 hover:bg-sunken hover:text-ink border border-transparent'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      activeSection === section ? 'bg-accent' : 'bg-line-strong'
                    }`}
                  />
                  <span>{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default DiagnosticsPage;
