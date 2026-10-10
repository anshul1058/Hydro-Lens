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
            status: 'Production'
          },
          classes: [
            { name: 'fragment', description: 'Irregular sharp plastic particle candidate', count: 1200 },
            { name: 'fiber', description: 'Elongated synthetic strand candidate', count: 800 },
            { name: 'film', description: 'Thin translucent plastic sheet candidate', count: 450 },
            { name: 'foam', description: 'Porous cellular structure candidate', count: 320 },
            { name: 'pellet', description: 'Spherical pre-production bead candidate', count: 210 }
          ],
          limitations: [
            {
              id: 1,
              title: 'Polymer type NOT identified — morphology only',
              detail:
                'Hydro Lens does not identify polymer type (PE, PP, PET, etc.). It detects morphological candidates consistent with microplastics. Polymer ID requires FTIR/Raman spectroscopy — explicitly out of scope.'
            },
            {
              id: 2,
              title: '< 10 µm invisible — optical resolution bound',
              detail:
                'At 200× with 1920×1080 sensor: theoretical ~0.5 µm/pixel. Practical detection limit ~10 µm (SNR, diffraction, noise). Particles < 10 µm are invisible to this system.'
            },
            {
              id: 3,
              title: 'Training domain ≠ all field conditions — validate locally',
              detail:
                'Datasets 1 & 2: fluorescence + sewage microscopy. Dataset 3 (test): different microscopes, lighting. Performance on your microscope may differ. Always validate with local reference samples.'
            },
            {
              id: 4,
              title: 'No concentration without calibration + sample volume',
              detail:
                'Single image field of view extrapolation assumes uniform distribution. Concentration calculations strictly require valid active calibration, sample volume, and imaged filter area.'
            }
          ]
        });
      });
  }, []);

  const model = data?.model_info;

  const classColors: Record<string, string> = {
    fragment: 'bg-[#6BBFD8]',
    fiber: 'bg-[#3FA7C4]',
    film: 'bg-[#65C99A]',
    foam: 'bg-[#F5C75A]',
    pellet: 'bg-[#F28B8B]'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* MAIN DIAGNOSTICS CONTENT (9 Cols) */}
      <div className="lg:col-span-9 space-y-6">
        <div>
          <h1 className="text-page-title">System Diagnostics</h1>
          <p className="text-body text-[#5294A8]">
            Architecture specifications, detection class taxonomy, and formal safety limits.
          </p>
        </div>

        {/* SECTION 1: MODEL CARD PANEL */}
        <section
          id="model-card"
          className="bg-[#E8F8FC]/85 backdrop-blur-[20px] rounded-[18px] border border-[#B9DFEA] p-6 shadow-[0_8px_24px_rgba(57,124,145,0.08)] space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-[56px] h-[56px] rounded-2xl bg-[#6BBFD8]/20 border border-[#6BBFD8]/35 flex items-center justify-center text-[#3FA7C4] shrink-0">
                <Cpu className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-section-title">YOLOv8n Detection Model</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#65C99A]/20 text-[#397C91] border border-[#65C99A]/35">
                    Production
                  </span>
                </div>
                <p className="text-caption mt-0.5">Microplastic Candidate Object Detection Head</p>
              </div>
            </div>
            <span className="text-[12px] font-mono text-[#5294A8]">v1.0.0</span>
          </div>

          {/* 4-Column Spec Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white/70 rounded-[14px] border border-[#B9DFEA]">
            <div>
              <p className="text-caption">Architecture</p>
              <p className="text-[14px] font-semibold text-[#397C91]">{model?.architecture || 'YOLOv8n (Nano)'}</p>
            </div>
            <div>
              <p className="text-caption">Parameters</p>
              <p className="text-[14px] font-semibold text-[#397C91] tabular-nums">{model?.parameters || '3.2 M'}</p>
            </div>
            <div>
              <p className="text-caption">Model Size</p>
              <p className="text-[14px] font-semibold text-[#397C91]">{model?.model_size || '~6 MB (.pt)'}</p>
            </div>
            <div>
              <p className="text-caption">Latency (CPU)</p>
              <p className="text-[14px] font-semibold text-[#397C91] tabular-nums">{model?.latency || '1.2 s'}</p>
            </div>
          </div>
        </section>

        {/* SECTION 2: DETECTION CLASSES TABLE */}
        <section
          id="detection-classes"
          className="bg-[#E8F8FC]/85 backdrop-blur-[20px] rounded-[18px] border border-[#B9DFEA] p-6 shadow-[0_8px_24px_rgba(57,124,145,0.08)] space-y-4"
        >
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-[#3FA7C4]" />
            <h2 className="text-section-title">Detection Classes Taxonomy</h2>
          </div>

          <div className="overflow-x-auto rounded-[14px] border border-[#B9DFEA] bg-white/60">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#E8F8FC] border-b border-[#B9DFEA] text-[#5294A8] text-[11px] font-semibold uppercase tracking-[0.06em]">
                  <th className="py-3 px-4">Class Glyph</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Morphology Description</th>
                  <th className="py-3 px-4 text-right">Training Support Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B9DFEA]/60 text-[#397C91]">
                {data?.classes.map((cls) => (
                  <tr key={cls.name} className="hover:bg-white/80 transition-all">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`w-3.5 h-3.5 rounded-full ${classColors[cls.name] || 'bg-gray-400'}`} />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold capitalize text-[#3FA7C4]">{cls.name}</td>
                    <td className="py-3 px-4 text-[#5294A8]">{cls.description}</td>
                    <td className="py-3 px-4 text-right font-semibold tabular-nums text-[#397C91]">
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
          className="bg-[#E8F8FC]/85 backdrop-blur-[20px] rounded-[18px] border-l-4 border-l-[#F5C75A] border-y border-r border-[#B9DFEA] p-6 shadow-[0_8px_24px_rgba(57,124,145,0.08)] space-y-4"
        >
          <div className="flex items-center space-x-2 text-[#397C91]">
            <AlertTriangle className="w-5 h-5 text-[#F5C75A]" />
            <h2 className="text-section-title text-[#397C91]">Limitations &amp; Compliance Rules</h2>
          </div>
          <p className="text-caption">
            Verbatim constraints from CONFIDENCE_AND_LIMITATIONS.md — strictly enforced safety boundaries.
          </p>

          <div className="space-y-4 pt-2">
            {data?.limitations.map((lim) => (
              <div
                key={lim.id}
                className="p-4 bg-white/80 rounded-[14px] border border-[#B9DFEA] space-y-1 shadow-xs"
              >
                <div className="flex items-center space-x-2 text-[#397C91]">
                  <span className="w-5 h-5 rounded-full bg-[#F5C75A]/30 text-[#397C91] text-[11px] font-bold flex items-center justify-center shrink-0">
                    {lim.id}
                  </span>
                  <h3 className="text-[14px] font-semibold">{lim.title}</h3>
                </div>
                <p className="text-[13px] text-[#5294A8] pl-7 leading-relaxed">{lim.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* STICKY RIGHT-EDGE TABLE OF CONTENTS RAIL (3 Cols) */}
      <div className="lg:col-span-3 sticky top-[88px] space-y-3">
        <div className="bg-[#E8F8FC]/85 backdrop-blur-[20px] rounded-[18px] border border-[#B9DFEA] p-4 shadow-[0_8px_24px_rgba(57,124,145,0.08)] space-y-3">
          <div className="flex items-center space-x-2 text-[#5294A8] text-[12px] font-semibold uppercase tracking-[0.06em]">
            <Bookmark className="w-4 h-4 text-[#3FA7C4]" />
            <span>Navigation Rail</span>
          </div>

          <nav className="space-y-1 text-[13px]">
            <a
              href="#model-card"
              onClick={() => setActiveSection('model')}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all ${
                activeSection === 'model'
                  ? 'bg-[#6BBFD8]/20 text-[#397C91] font-semibold'
                  : 'text-[#5294A8] hover:bg-white/70 hover:text-[#397C91]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  activeSection === 'model' ? 'bg-[#3FA7C4]' : 'bg-[#B9DFEA]'
                }`}
              />
              <span>Model Specs</span>
            </a>

            <a
              href="#detection-classes"
              onClick={() => setActiveSection('classes')}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all ${
                activeSection === 'classes'
                  ? 'bg-[#6BBFD8]/20 text-[#397C91] font-semibold'
                  : 'text-[#5294A8] hover:bg-white/70 hover:text-[#397C91]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  activeSection === 'classes' ? 'bg-[#3FA7C4]' : 'bg-[#B9DFEA]'
                }`}
              />
              <span>Detection Classes</span>
            </a>

            <a
              href="#limitations"
              onClick={() => setActiveSection('limitations')}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all ${
                activeSection === 'limitations'
                  ? 'bg-[#6BBFD8]/20 text-[#397C91] font-semibold'
                  : 'text-[#5294A8] hover:bg-white/70 hover:text-[#397C91]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  activeSection === 'limitations' ? 'bg-[#3FA7C4]' : 'bg-[#B9DFEA]'
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
