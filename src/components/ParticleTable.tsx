import React, { useState } from 'react';
import { ArrowUpDown, AlertTriangle, CheckCircle2, Filter } from 'lucide-react';
import type { Detection } from '../api/types';

interface ParticleTableProps {
  detections: Detection[];
}

type SortField = 'id' | 'class_name' | 'confidence' | 'feret_max' | 'ecd' | 'aspect_ratio' | 'needs_lab';

export const ParticleTable: React.FC<ParticleTableProps> = ({ detections }) => {
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [filterClass, setFilterClass] = useState<string>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredDetections = filterClass === 'all' 
    ? detections 
    : detections.filter(d => d.class_name.toLowerCase() === filterClass.toLowerCase());

  const sortedDetections = [...filteredDetections].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sortField) {
      case 'id':
        aVal = a.id;
        bVal = b.id;
        break;
      case 'class_name':
        aVal = a.class_name;
        bVal = b.class_name;
        break;
      case 'confidence':
        aVal = a.confidence;
        bVal = b.confidence;
        break;
      case 'feret_max':
        aVal = a.size_um?.feret_max ?? a.size_px?.feret_max ?? 0;
        bVal = b.size_um?.feret_max ?? b.size_px?.feret_max ?? 0;
        break;
      case 'ecd':
        aVal = a.size_um?.ecd ?? a.size_px?.ecd ?? 0;
        bVal = b.size_um?.ecd ?? b.size_px?.ecd ?? 0;
        break;
      case 'aspect_ratio':
        aVal = a.size_um?.aspect_ratio ?? a.size_px?.aspect_ratio ?? 1;
        bVal = b.size_um?.aspect_ratio ?? b.size_px?.aspect_ratio ?? 1;
        break;
      case 'needs_lab':
        aVal = a.needs_lab_confirmation ? 1 : 0;
        bVal = b.needs_lab_confirmation ? 1 : 0;
        break;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const classBadges: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    fragment: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-300', dot: 'bg-sky-500' },
    fiber: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300', dot: 'bg-cyan-600' },
    film: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500' },
    foam: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500' },
    pellet: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300', dot: 'bg-rose-500' }
  };

  if (detections.length === 0) {
    return (
      <div className="p-10 text-center bg-white/90 rounded-[18px] border border-[#BBE4F2] shadow-xs">
        <p className="text-[14.5px] font-medium text-[#2C637A]">No particles detected in current sample.</p>
        <p className="text-[12px] text-[#4A7F96] mt-1">Upload a microscopic water sample or select a reference image.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center space-x-2 text-[12px] font-semibold text-[#2C637A]">
          <Filter className="w-3.5 h-3.5 text-[#0891B2]" />
          <span>Filter Morphology:</span>
          {['all', 'fragment', 'fiber', 'film', 'foam', 'pellet'].map((c) => (
            <button
              key={c}
              onClick={() => setFilterClass(c)}
              className={`px-2.5 py-1 rounded-full text-[11.5px] font-bold capitalize transition-all cursor-pointer ${
                filterClass === c
                  ? 'bg-gradient-to-r from-[#0284C7] to-[#0891B2] text-white shadow-xs'
                  : 'bg-white hover:bg-[#EAF7FC] text-[#4A7F96] border border-[#BBE4F2]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <span className="text-[11.5px] font-mono font-medium text-[#4A7F96]">
          Showing {sortedDetections.length} of {detections.length} candidates
        </span>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-[18px] border border-[#BBE4F2] bg-white/95 backdrop-blur-[20px] shadow-[0_4px_20px_rgba(8,145,178,0.06)]">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#EAF7FC]/90 border-b border-[#BBE4F2] text-[#4A7F96] text-[11px] font-bold uppercase tracking-[0.07em]">
              <th onClick={() => handleSort('id')} className="py-3 px-4 cursor-pointer hover:bg-white/80 transition-all">
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                  <ArrowUpDown className="w-3 h-3 text-[#0891B2]" />
                </div>
              </th>
              <th onClick={() => handleSort('class_name')} className="py-3 px-4 cursor-pointer hover:bg-white/80 transition-all">
                <div className="flex items-center space-x-1">
                  <span>Class</span>
                  <ArrowUpDown className="w-3 h-3 text-[#0891B2]" />
                </div>
              </th>
              <th onClick={() => handleSort('confidence')} className="py-3 px-4 cursor-pointer hover:bg-white/80 transition-all">
                <div className="flex items-center space-x-1">
                  <span>Confidence</span>
                  <ArrowUpDown className="w-3 h-3 text-[#0891B2]" />
                </div>
              </th>
              <th onClick={() => handleSort('feret_max')} className="py-3 px-4 cursor-pointer hover:bg-white/80 transition-all">
                <div className="flex items-center space-x-1">
                  <span>Feret Max/Min (µm)</span>
                  <ArrowUpDown className="w-3 h-3 text-[#0891B2]" />
                </div>
              </th>
              <th onClick={() => handleSort('ecd')} className="py-3 px-4 cursor-pointer hover:bg-white/80 transition-all">
                <div className="flex items-center space-x-1">
                  <span>ECD (µm)</span>
                  <ArrowUpDown className="w-3 h-3 text-[#0891B2]" />
                </div>
              </th>
              <th onClick={() => handleSort('aspect_ratio')} className="py-3 px-4 cursor-pointer hover:bg-white/80 transition-all">
                <div className="flex items-center space-x-1">
                  <span>Aspect Ratio</span>
                  <ArrowUpDown className="w-3 h-3 text-[#0891B2]" />
                </div>
              </th>
              <th onClick={() => handleSort('needs_lab')} className="py-3 px-4 cursor-pointer hover:bg-white/80 transition-all">
                <div className="flex items-center space-x-1">
                  <span>Needs Lab</span>
                  <ArrowUpDown className="w-3 h-3 text-[#0891B2]" />
                </div>
              </th>
              <th className="py-3 px-4">Reasons</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#BBE4F2]/50 text-[#0F334A]">
            {sortedDetections.map((det) => {
              const feretMax = det.size_um?.feret_max ?? det.size_px?.feret_max;
              const feretMin = det.size_um?.feret_min ?? det.size_px?.feret_min;
              const ecd = det.size_um?.ecd ?? det.size_px?.ecd;
              const aspect = det.size_um?.aspect_ratio ?? det.size_px?.aspect_ratio ?? 1.0;
              const isUncalibrated = det.size_um?.ecd === null;
              const badgeStyle = classBadges[det.class_name.toLowerCase()] || {
                bg: 'bg-slate-100',
                text: 'text-slate-700',
                border: 'border-slate-300',
                dot: 'bg-slate-400'
              };

              return (
                <tr key={det.id} className="hover:bg-[#EAF7FC]/60 transition-colors">
                  <td className="py-2.5 px-4 font-bold tabular-nums text-[#0284C7]">#{det.id}</td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold border capitalize ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
                      <span>{det.class_name}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="tabular-num font-semibold text-[13px] text-[#0A2540]">
                        {(det.confidence * 100).toFixed(1)}%
                      </span>
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            det.confidence >= 0.8 ? 'bg-[#10B981]' : det.confidence >= 0.5 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                          }`}
                          style={{ width: `${Math.min(det.confidence * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 tabular-nums text-[#2C637A] font-medium">
                    {isUncalibrated ? (
                      <span className="text-[#56889E] italic text-[12px]">Blocked (Uncalibrated)</span>
                    ) : (
                      `${feretMax ?? '-'} / ${feretMin ?? '-'}`
                    )}
                  </td>
                  <td className="py-2.5 px-4 tabular-nums font-bold text-[#0A2540]">
                    {isUncalibrated ? (
                      <span className="text-[#56889E] italic text-[12px]">Blocked</span>
                    ) : (
                      `${ecd ?? '-'} µm`
                    )}
                  </td>
                  <td className="py-2.5 px-4 tabular-nums text-[#2C637A] font-medium">{aspect.toFixed(2)}</td>
                  <td className="py-2.5 px-4">
                    {det.needs_lab_confirmation ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEECEB] text-[#DC2626] border border-[#EF4444]/30 shadow-2xs">
                        <AlertTriangle className="w-3 h-3 text-[#DC2626]" />
                        <span>REQUIRED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E6FBF2] text-[#059669] border border-[#10B981]/30 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                        <span>NO</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-[12px] text-[#4A7F96] max-w-[200px] truncate" title={det.lab_confirmation_reasons?.join(', ')}>
                    {det.lab_confirmation_reasons && det.lab_confirmation_reasons.length > 0
                      ? det.lab_confirmation_reasons.join(', ')
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
