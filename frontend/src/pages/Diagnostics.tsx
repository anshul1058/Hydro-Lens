import React, { useState, useEffect } from 'react';
import { Cpu, AlertTriangle, Layers, Bookmark } from 'lucide-react';
import { getDiagnostics } from '../api/client';
import type { DiagnosticsResponse } from '../api/types';

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

  const classColors: Record<string, string> = {
    fragment: 'bg-[#4a90d9]',
    fiber: 'bg-[#9ecae1]',
    film: 'bg-[#2ECC91]',
    foam: 'bg-[#F5B942]',
    pellet: 'bg-[#FF6B6B]',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* MAIN DIAGNOSTICS CONTENT (9 Cols) */}
      <div className="lg:col-span-9 space-y-6">
        <div>
          <h1 className="text-[20px] sm:text-[24px] font-bold text-[#1E2A38] tracking-tight">
            System Diagnostics &amp; Model Specifications
          </h1>
          <p className="text-[13px] text-[#6b7a90] font-medium mt-0.5">
            Architecture specifications, detection class taxonomy, and formal safety limits.
          </p>
        </div>

        {/* SECTION 1: MODEL CARD PANEL */}
        <section
          id="model-card"
          className="bg-white rounded-2xl border border-[#9ecae1] p-6 shadow-[0_4px_20px_rgba(74,144,217,0.06)] space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-[56px] h-[56px] rounded-2xl bg-[#eff3ff] border border-[#9ecae1] flex items-center justify-center text-[#4a90d9] shrink-0">
                <Cpu className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-[16px] font-bold text-[#1E2A38]">YOLOv8n Detection Model</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#2ECC91]/15 text-[#2ECC91] border border-[#2ECC91]/30">
                    Production
                  </span>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7a90] mt-0.5">
                  Microplastic Candidate Object Detection Head
                </p>
              </div>
            </div>
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
            </div>
          </div>
        </section>

        {/* SECTION 2: DETECTION CLASSES TABLE */}
        <section
          id="detection-classes"
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
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 3: LIMITATIONS & COMPLIANCE CARD */}
        <section
          id="limitations"
          className="bg-white rounded-2xl border-l-4 border-l-[#F5B942] border-y border-r border-[#9ecae1] p-6 shadow-[0_4px_20px_rgba(74,144,217,0.06)] space-y-4"
        >
          <div className="flex items-center space-x-2 text-[#1E2A38]">
            <AlertTriangle className="w-5 h-5 text-[#F5B942]" />
            <h2 className="text-[16px] font-bold text-[#1E2A38]">Limitations &amp; Compliance Rules</h2>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7a90]">
            Verbatim constraints from CONFIDENCE_AND_LIMITATIONS.md — strictly enforced safety boundaries.
          </p>

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
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* STICKY RIGHT-EDGE TABLE OF CONTENTS RAIL (3 Cols) */}
      <div className="lg:col-span-3 sticky top-[88px] space-y-3">
        <div className="bg-white rounded-2xl border border-[#9ecae1] p-4 shadow-[0_4px_20px_rgba(74,144,217,0.06)] space-y-3">
          <div className="flex items-center space-x-2 text-[#6b7a90] text-[11px] font-bold uppercase tracking-wider">
            <Bookmark className="w-4 h-4 text-[#4a90d9]" />
            <span>Navigation Rail</span>
          </div>

          <nav className="space-y-1 text-[13px]">
            <a
              href="#model-card"
              onClick={() => setActiveSection('model')}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all font-semibold ${
                activeSection === 'model'
                  ? 'bg-[#4a90d9] text-white shadow-xs'
                  : 'text-[#6b7a90] hover:bg-[#eff3ff] hover:text-[#1E2A38]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  activeSection === 'model' ? 'bg-white' : 'bg-[#9ecae1]'
                }`}
              />
              <span>Model Specs</span>
            </a>

            <a
              href="#detection-classes"
              onClick={() => setActiveSection('classes')}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all font-semibold ${
                activeSection === 'classes'
                  ? 'bg-[#4a90d9] text-white shadow-xs'
                  : 'text-[#6b7a90] hover:bg-[#eff3ff] hover:text-[#1E2A38]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  activeSection === 'classes' ? 'bg-white' : 'bg-[#9ecae1]'
                }`}
              />
              <span>Detection Classes</span>
            </a>

            <a
              href="#limitations"
              onClick={() => setActiveSection('limitations')}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all font-semibold ${
                activeSection === 'limitations'
                  ? 'bg-[#4a90d9] text-white shadow-xs'
                  : 'text-[#6b7a90] hover:bg-[#eff3ff] hover:text-[#1E2A38]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  activeSection === 'limitations' ? 'bg-white' : 'bg-[#9ecae1]'
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
