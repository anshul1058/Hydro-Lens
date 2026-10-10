import React, { useState, useEffect } from 'react';
import { Cpu, AlertTriangle, Layers, Bookmark, Sparkles } from 'lucide-react';
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
            status: 'Production',
          },
          classes: [
            { name: 'fragment', description: 'Irregular sharp plastic particle candidate', count: 1200 },
            { name: 'fiber', description: 'Elongated synthetic strand candidate', count: 800 },
            { name: 'film', description: 'Thin translucent plastic sheet candidate', count: 450 },
            { name: 'foam', description: 'Porous cellular structure candidate', count: 320 },
            { name: 'pellet', description: 'Spherical pre-production bead candidate', count: 210 },
          ],
          limitations: [
            {
              id: 1,
              title: 'Polymer type NOT identified — morphology only',
              detail:
                'Hydro Lens does not identify polymer type (PE, PP, PET, etc.). It detects morphological candidates consistent with microplastics. Polymer ID requires FTIR/Raman spectroscopy — explicitly out of scope.',
            },
            {
              id: 2,
              title: '< 10 µm invisible — optical resolution bound',
              detail:
                'At 200× with 1920×1080 sensor: theoretical ~0.5 µm/pixel. Practical detection limit ~10 µm (SNR, diffraction, noise). Particles < 10 µm are invisible to this system.',
            },
            {
              id: 3,
              title: 'Training domain ≠ all field conditions — validate locally',
              detail:
                'Datasets 1 & 2: fluorescence + sewage microscopy. Dataset 3 (test): different microscopes, lighting. Performance on your microscope may differ. Always validate with local reference samples.',
            },
            {
              id: 4,
              title: 'No concentration without calibration + sample volume',
              detail:
                'Single image field of view extrapolation assumes uniform distribution. Concentration calculations strictly require valid active calibration, sample volume, and imaged filter area.',
            },
          ],
        });
      });
  }, []);

  const model = data?.model_info;

<<<<<<< HEAD
  // Real laboratory micrographs for each morphology
  const particleMicrographs: Record<string, string> = {
    fragment: fragmentImg,
    fiber: fiberImg,
    film: filmImg,
    foam: foamImg,
    pellet: pelletImg
  };

  // Scientific visual particle morphology icons
  const particleGlyphs: Record<string, React.ReactNode> = {
    fragment: (
      <svg className="w-4 h-4 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="4,7 11,2 20,6 22,16 14,22 3,18" opacity="0.8" />
        <polygon points="7,8 12,5 18,7 19,14 13,18 6,15" fill="#38BDF8" />
      </svg>
    ),
    fiber: (
      <svg className="w-4 h-4 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M3,20 C8,18 7,6 13,10 C18,14 17,4 21,3" />
      </svg>
    ),
    film: (
      <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3,6 L18,3 L21,17 L6,20 Z" opacity="0.6" />
        <path d="M5,8 L19,5 L20,16 L7,18 Z" fill="#34D399" />
      </svg>
    ),
    foam: (
      <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="8" cy="8" r="4.5" opacity="0.8" />
        <circle cx="16" cy="9" r="3.5" opacity="0.7" />
        <circle cx="12" cy="16" r="4" opacity="0.75" />
        <circle cx="7" cy="15" r="2.5" opacity="0.6" />
      </svg>
    ),
    pellet: (
      <svg className="w-4 h-4 text-rose-600" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="8" opacity="0.85" />
        <circle cx="9.5" cy="9.5" r="2.5" fill="#FDA4AF" />
      </svg>
    )
  };

  const classBadges: Record<string, { bg: string; text: string; border: string }> = {
    fragment: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-300' },
    fiber: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300' },
    film: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
    foam: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
    pellet: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' }
=======
  const classColors: Record<string, string> = {
    fragment: 'bg-[#4a90d9]',
    fiber: 'bg-[#9ecae1]',
    film: 'bg-[#2ECC91]',
    foam: 'bg-[#F5B942]',
    pellet: 'bg-[#FF6B6B]',
>>>>>>> origin/main
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* MAIN DIAGNOSTICS CONTENT (9 Cols) */}
      <div className="lg:col-span-9 space-y-6">
<<<<<<< HEAD
        {/* Top Laboratory Diagnostics Hero */}
        <section className="relative overflow-hidden rounded-[26px] hero-card-navy text-white shadow-2xl border border-cyan-500/30">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img 
              src={systemDiagnosticsHwImg} 
              alt="Photonics and Hardware Test Bench" 
              className="w-full h-full object-cover object-center opacity-30 mix-blend-luminosity filter blur-[0.3px]" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07172B] via-[#071F38]/95 to-[#083344]/85" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/25 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-400/15 border border-cyan-400/35 text-cyan-200 text-[11px] font-bold tracking-wider uppercase backdrop-blur-md shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                <span>Hardware Architecture &amp; AI Diagnostics</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                System Diagnostics
              </h1>
              <p className="text-cyan-100/85 text-[14px] leading-relaxed max-w-xl font-normal">
                Architecture specifications, detection class taxonomy, and certified hardware boundary compliance.
              </p>
            </div>

            <div className="shrink-0 hidden sm:block">
              <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-cyan-400/40 shadow-lg">
                <img 
                  src={systemDiagnosticsHwImg} 
                  alt="Embedded Sensor Workbench" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <span className="absolute bottom-1.5 left-2 text-[9.5px] font-mono text-cyan-300 font-bold">
                  USB3 SENSOR
                </span>
              </div>
            </div>
          </div>
        </section>
=======
        <div>
          <h1 className="text-[20px] sm:text-[24px] font-bold text-[#1E2A38] tracking-tight">
            System Diagnostics &amp; Model Specifications
          </h1>
          <p className="text-[13px] text-[#6b7a90] font-medium mt-0.5">
            Architecture specifications, detection class taxonomy, and formal safety limits.
          </p>
        </div>
>>>>>>> origin/main

        {/* SECTION 1: MODEL CARD PANEL */}
        <section
          id="model-card"
<<<<<<< HEAD
          className="bg-white/95 backdrop-blur-[20px] rounded-[20px] border border-[#BBE4F2] p-6 sm:p-7 shadow-[0_8px_24px_rgba(8,145,178,0.06)] space-y-6 transition-all"
=======
          className="bg-white rounded-2xl border border-[#9ecae1] p-6 shadow-[0_4px_20px_rgba(74,144,217,0.06)] space-y-6"
>>>>>>> origin/main
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#BBE4F2]/50 pb-5">
            <div className="flex items-center space-x-4">
<<<<<<< HEAD
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0284C7] via-[#0891B2] to-[#0D9488] p-[1.5px] shadow-sm">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-[#0891B2]">
                  <Cpu className="w-7 h-7" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#10B981] border-2 border-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h2 className="text-section-title">YOLOv8n Detection Model</h2>
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#E6FBF2] text-[#059669] border border-[#10B981]/30 shadow-2xs">
=======
              <div className="w-[56px] h-[56px] rounded-2xl bg-[#eff3ff] border border-[#9ecae1] flex items-center justify-center text-[#4a90d9] shrink-0">
                <Cpu className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-[16px] font-bold text-[#1E2A38]">YOLOv8n Detection Model</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#2ECC91]/15 text-[#2ECC91] border border-[#2ECC91]/30">
>>>>>>> origin/main
                    Production
                  </span>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7a90] mt-0.5">
                  Microplastic Candidate Object Detection Head
                </p>
              </div>
            </div>
<<<<<<< HEAD
            <div className="flex items-center space-x-2">
              <span className="text-[12px] font-mono font-bold text-[#0891B2] bg-[#EAF7FC] px-3 py-1 rounded-full border border-[#BBE4F2]">
                v1.0.0
              </span>
            </div>
          </div>

          {/* 4-Column Spec Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 bg-[#EAF7FC]/40 rounded-[16px] border border-[#BBE4F2]">
            <div className="p-3 bg-white rounded-xl border border-[#BBE4F2]/60 shadow-2xs">
              <p className="text-caption">Architecture</p>
              <p className="text-[14.5px] font-bold text-[#0A2540] mt-0.5">{model?.architecture || 'YOLOv8n (Nano)'}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#BBE4F2]/60 shadow-2xs">
              <p className="text-caption">Parameters</p>
              <p className="text-[14.5px] font-bold text-[#0A2540] tabular-nums mt-0.5">{model?.parameters || '3.2 M'}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#BBE4F2]/60 shadow-2xs">
              <p className="text-caption">Model Size</p>
              <p className="text-[14.5px] font-bold text-[#0A2540] mt-0.5">{model?.model_size || '~6 MB (.pt)'}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#BBE4F2]/60 shadow-2xs">
              <p className="text-caption">Latency (CPU)</p>
              <p className="text-[14.5px] font-bold text-[#0A2540] tabular-nums mt-0.5">{model?.latency || '1.2 s'}</p>
            </div>
          </div>

          {/* Additional Architecture Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#BBE4F2]/60">
              <span className="text-[#4A7F96] font-semibold">Framework Runtime</span>
              <span className="font-mono font-bold text-[#0A2540]">{model?.framework || 'Ultralytics YOLOv8 / PyTorch'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#BBE4F2]/60">
              <span className="text-[#4A7F96] font-semibold">Input Resolution</span>
              <span className="font-mono font-bold text-[#0A2540]">{model?.input_resolution || '640×640 RGB'}</span>
=======
            <span className="text-[12px] font-mono font-bold text-[#4a90d9] bg-[#eff3ff] px-2.5 py-1 rounded-lg border border-[#9ecae1]">
              v1.0.0
            </span>
          </div>

          {/* 4-Column Spec Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#eff3ff]/60 rounded-xl border border-[#D0DCE8]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b7a90]">Architecture</p>
              <p className="text-[14px] font-bold text-[#1E2A38] mt-0.5">{model?.architecture || 'YOLOv8n (Nano)'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b7a90]">Parameters</p>
              <p className="text-[14px] font-bold text-[#1E2A38] tabular-nums mt-0.5">{model?.parameters || '3.2 M'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b7a90]">Model Size</p>
              <p className="text-[14px] font-bold text-[#1E2A38] mt-0.5">{model?.model_size || '~6 MB (.pt)'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b7a90]">Latency (CPU)</p>
              <p className="text-[14px] font-bold text-[#1E2A38] tabular-nums mt-0.5">{model?.latency || '1.2 s'}</p>
>>>>>>> origin/main
            </div>
          </div>
        </section>

        {/* SECTION 2: DETECTION CLASSES TABLE */}
        <section
          id="detection-classes"
<<<<<<< HEAD
          className="bg-white/95 backdrop-blur-[20px] rounded-[20px] border border-[#BBE4F2] p-6 sm:p-7 shadow-[0_8px_24px_rgba(8,145,178,0.06)] space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#BBE4F2]/50 pb-3">
            <div className="flex items-center space-x-2.5">
              <Layers className="w-5 h-5 text-[#0891B2]" />
              <h2 className="text-section-title">Detection Classes Taxonomy</h2>
            </div>
            <span className="text-caption bg-[#EAF7FC] px-3 py-1 rounded-full border border-[#BBE4F2]">
              5 Verified Classes
            </span>
          </div>

          <div className="overflow-x-auto rounded-[16px] border border-[#BBE4F2] bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#EAF7FC]/80 border-b border-[#BBE4F2] text-[#4A7F96] text-[11px] font-bold uppercase tracking-[0.07em]">
                  <th className="py-3.5 px-4">Micrograph &amp; Glyph</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Morphology Description</th>
                  <th className="py-3.5 px-4 text-right">Training Support Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#BBE4F2]/50 text-[#0F334A]">
                {data?.classes.map((cls) => {
                  const style = classBadges[cls.name.toLowerCase()] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300' };
                  const img = particleMicrographs[cls.name.toLowerCase()];
                  return (
                    <tr key={cls.name} className="hover:bg-[#EAF7FC]/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          {img && (
                            <div className="relative w-14 h-11 rounded-lg overflow-hidden border border-[#BBE4F2] bg-slate-950 shrink-0 shadow-2xs group cursor-pointer">
                              <img
                                src={img}
                                alt={cls.name}
                                className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                            </div>
                          )}
                          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-[#BBE4F2]/60 flex items-center justify-center shadow-2xs shrink-0">
                            {particleGlyphs[cls.name.toLowerCase()]}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold capitalize border ${style.bg} ${style.text} ${style.border}`}>
                          {cls.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#2C637A] font-medium leading-relaxed">{cls.description}</td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums text-[#0A2540]">
                        {cls.count.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
=======
          className="bg-white rounded-2xl border border-[#9ecae1] p-6 shadow-[0_4px_20px_rgba(74,144,217,0.06)] space-y-4"
        >
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-[#4a90d9]" />
            <h2 className="text-[16px] font-bold text-[#1E2A38]">Detection Classes Taxonomy</h2>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#9ecae1] bg-white">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#eff3ff] border-b border-[#9ecae1] text-[#6b7a90] text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Class Glyph</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Morphology Description</th>
                  <th className="py-3 px-4 text-right">Training Support Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0DCE8]/60 text-[#1E2A38]">
                {data?.classes.map((cls) => (
                  <tr key={cls.name} className="hover:bg-[#eff3ff]/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`w-3.5 h-3.5 rounded-full ${classColors[cls.name] || 'bg-gray-400'}`} />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold capitalize text-[#4a90d9]">{cls.name}</td>
                    <td className="py-3 px-4 text-[#6b7a90] font-medium">{cls.description}</td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums text-[#1E2A38]">
                      {cls.count.toLocaleString()}
                    </td>
                  </tr>
                ))}
>>>>>>> origin/main
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 3: LIMITATIONS & COMPLIANCE CARD */}
        <section
          id="limitations"
<<<<<<< HEAD
          className="bg-white/95 backdrop-blur-[20px] rounded-[20px] border-l-4 border-l-[#F59E0B] border-y border-r border-[#BBE4F2] p-6 sm:p-7 shadow-[0_8px_24px_rgba(8,145,178,0.06)] space-y-4"
        >
          <div className="flex items-center space-x-2.5 border-b border-[#BBE4F2]/50 pb-3">
            <AlertTriangle className="w-5 h-5 text-[#D97706]" />
            <h2 className="text-section-title text-[#0A2540]">Limitations &amp; Compliance Rules</h2>
=======
          className="bg-white rounded-2xl border-l-4 border-l-[#F5B942] border-y border-r border-[#9ecae1] p-6 shadow-[0_4px_20px_rgba(74,144,217,0.06)] space-y-4"
        >
          <div className="flex items-center space-x-2 text-[#1E2A38]">
            <AlertTriangle className="w-5 h-5 text-[#F5B942]" />
            <h2 className="text-[16px] font-bold text-[#1E2A38]">Limitations &amp; Compliance Rules</h2>
>>>>>>> origin/main
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7a90]">
            Verbatim constraints from CONFIDENCE_AND_LIMITATIONS.md — strictly enforced safety boundaries.
          </p>

<<<<<<< HEAD
          <div className="space-y-3.5 pt-2">
            {data?.limitations.map((lim) => (
              <div
                key={lim.id}
                className="p-4 bg-[#FEF6E7]/30 hover:bg-[#FEF6E7]/50 rounded-[16px] border border-[#F59E0B]/35 space-y-1.5 transition-all shadow-2xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#F59E0B] text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                    {lim.id}
                  </span>
                  <h3 className="text-[14px] font-bold text-[#0A2540]">{lim.title}</h3>
                </div>
                <p className="text-[13px] text-[#2C637A] pl-8.5 leading-relaxed font-normal">{lim.detail}</p>
=======
          <div className="space-y-3 pt-2">
            {data?.limitations.map((lim) => (
              <div
                key={lim.id}
                className="p-4 bg-[#eff3ff]/60 rounded-xl border border-[#D0DCE8] space-y-1"
              >
                <div className="flex items-center space-x-2.5 text-[#1E2A38]">
                  <span className="w-5 h-5 rounded-full bg-[#F5B942]/20 text-[#1E2A38] text-[11px] font-bold flex items-center justify-center shrink-0 border border-[#F5B942]/40">
                    {lim.id}
                  </span>
                  <h3 className="text-[14px] font-bold">{lim.title}</h3>
                </div>
                <p className="text-[13px] text-[#6b7a90] pl-7 leading-relaxed font-medium">{lim.detail}</p>
>>>>>>> origin/main
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* STICKY RIGHT-EDGE TABLE OF CONTENTS RAIL (3 Cols) */}
      <div className="lg:col-span-3 sticky top-[88px] space-y-3">
<<<<<<< HEAD
        <div className="bg-white/95 backdrop-blur-[20px] rounded-[20px] border border-[#BBE4F2] p-5 shadow-[0_8px_24px_rgba(8,145,178,0.06)] space-y-3.5">
          <div className="flex items-center space-x-2 text-[#4A7F96] text-[11.5px] font-bold uppercase tracking-[0.08em] border-b border-[#BBE4F2]/50 pb-2">
            <Bookmark className="w-4 h-4 text-[#0891B2]" />
=======
        <div className="bg-white rounded-2xl border border-[#9ecae1] p-4 shadow-[0_4px_20px_rgba(74,144,217,0.06)] space-y-3">
          <div className="flex items-center space-x-2 text-[#6b7a90] text-[11px] font-bold uppercase tracking-wider">
            <Bookmark className="w-4 h-4 text-[#4a90d9]" />
>>>>>>> origin/main
            <span>Navigation Rail</span>
          </div>

          <nav className="space-y-1.5 text-[13px]">
            <a
              href="#model-card"
              onClick={() => setActiveSection('model')}
<<<<<<< HEAD
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeSection === 'model'
                  ? 'bg-gradient-to-r from-[#0284C7] to-[#0891B2] text-white font-bold shadow-xs'
                  : 'text-[#4A7F96] hover:bg-[#EAF7FC] hover:text-[#0A2540]'
=======
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all font-semibold ${
                activeSection === 'model'
                  ? 'bg-[#4a90d9] text-white shadow-xs'
                  : 'text-[#6b7a90] hover:bg-[#eff3ff] hover:text-[#1E2A38]'
>>>>>>> origin/main
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
<<<<<<< HEAD
                  activeSection === 'model' ? 'bg-white' : 'bg-[#BBE4F2]'
=======
                  activeSection === 'model' ? 'bg-white' : 'bg-[#9ecae1]'
>>>>>>> origin/main
                }`}
              />
              <span>Model Specs</span>
            </a>

            <a
              href="#detection-classes"
              onClick={() => setActiveSection('classes')}
<<<<<<< HEAD
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeSection === 'classes'
                  ? 'bg-gradient-to-r from-[#0284C7] to-[#0891B2] text-white font-bold shadow-xs'
                  : 'text-[#4A7F96] hover:bg-[#EAF7FC] hover:text-[#0A2540]'
=======
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all font-semibold ${
                activeSection === 'classes'
                  ? 'bg-[#4a90d9] text-white shadow-xs'
                  : 'text-[#6b7a90] hover:bg-[#eff3ff] hover:text-[#1E2A38]'
>>>>>>> origin/main
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
<<<<<<< HEAD
                  activeSection === 'classes' ? 'bg-white' : 'bg-[#BBE4F2]'
=======
                  activeSection === 'classes' ? 'bg-white' : 'bg-[#9ecae1]'
>>>>>>> origin/main
                }`}
              />
              <span>Detection Classes</span>
            </a>

            <a
              href="#limitations"
              onClick={() => setActiveSection('limitations')}
<<<<<<< HEAD
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeSection === 'limitations'
                  ? 'bg-gradient-to-r from-[#0284C7] to-[#0891B2] text-white font-bold shadow-xs'
                  : 'text-[#4A7F96] hover:bg-[#EAF7FC] hover:text-[#0A2540]'
=======
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all font-semibold ${
                activeSection === 'limitations'
                  ? 'bg-[#4a90d9] text-white shadow-xs'
                  : 'text-[#6b7a90] hover:bg-[#eff3ff] hover:text-[#1E2A38]'
>>>>>>> origin/main
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
<<<<<<< HEAD
                  activeSection === 'limitations' ? 'bg-white' : 'bg-[#BBE4F2]'
=======
                  activeSection === 'limitations' ? 'bg-white' : 'bg-[#9ecae1]'
>>>>>>> origin/main
                }`}
              />
              <span>Limitations (4 Rules)</span>
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
};
