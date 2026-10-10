import React, { useState } from 'react';
import { ArrowUpDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Detection } from '../api/types';

interface ParticleTableProps {
  detections: Detection[];
}

type SortField = 'id' | 'class_name' | 'confidence' | 'feret_max' | 'ecd' | 'aspect_ratio' | 'needs_lab';

export const ParticleTable: React.FC<ParticleTableProps> = ({ detections }) => {
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedDetections = [...detections].sort((a, b) => {
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

  if (detections.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#9ecae1]">
        <p className="text-[14px] text-[#6b7a90] font-medium">No particles detected in current sample.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#9ecae1] bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-[13px]">
        <thead>
          <tr className="bg-[#eff3ff] border-b border-[#9ecae1] text-[#6b7a90] text-[11px] font-bold uppercase tracking-wider">
            <th onClick={() => handleSort('id')} className="py-3.5 px-4 cursor-pointer hover:bg-white/80 transition-all">
              <div className="flex items-center space-x-1">
                <span>ID</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th onClick={() => handleSort('class_name')} className="py-3.5 px-4 cursor-pointer hover:bg-white/80 transition-all">
              <div className="flex items-center space-x-1">
                <span>Class</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th onClick={() => handleSort('confidence')} className="py-3.5 px-4 cursor-pointer hover:bg-white/80 transition-all">
              <div className="flex items-center space-x-1">
                <span>Confidence</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th onClick={() => handleSort('feret_max')} className="py-3.5 px-4 cursor-pointer hover:bg-white/80 transition-all">
              <div className="flex items-center space-x-1">
                <span>Feret Max/Min (µm)</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th onClick={() => handleSort('ecd')} className="py-3.5 px-4 cursor-pointer hover:bg-white/80 transition-all">
              <div className="flex items-center space-x-1">
                <span>ECD (µm)</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th onClick={() => handleSort('aspect_ratio')} className="py-3.5 px-4 cursor-pointer hover:bg-white/80 transition-all">
              <div className="flex items-center space-x-1">
                <span>Aspect Ratio</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th onClick={() => handleSort('needs_lab')} className="py-3.5 px-4 cursor-pointer hover:bg-white/80 transition-all">
              <div className="flex items-center space-x-1">
                <span>Needs Lab</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th className="py-3.5 px-4">Reasons</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D0DCE8]/60 text-[#1E2A38]">
          {sortedDetections.map((det) => {
            const feretMax = det.size_um?.feret_max ?? det.size_px?.feret_max;
            const feretMin = det.size_um?.feret_min ?? det.size_px?.feret_min;
            const ecd = det.size_um?.ecd ?? det.size_px?.ecd;
            const aspect = det.size_um?.aspect_ratio ?? det.size_px?.aspect_ratio ?? 1.0;
            const isUncalibrated = det.size_um?.ecd === null;

            return (
              <tr key={det.id} className="hover:bg-[#eff3ff]/50 transition-colors">
                <td className="py-3 px-4 font-bold tabular-nums text-[#4a90d9]">#{det.id}</td>
                <td className="py-3 px-4">
                  <span className="capitalize px-2.5 py-1 rounded-md text-[12px] font-semibold bg-[#4a90d9]/10 text-[#1E2A38] border border-[#9ecae1]/50">
                    {det.class_name}
                  </span>
                </td>
                <td className="py-3 px-4 tabular-nums font-semibold">
                  {(det.confidence * 100).toFixed(1)}%
                </td>
                <td className="py-3 px-4 tabular-nums text-[#6b7a90]">
                  {isUncalibrated ? (
                    <span className="text-[#6b7a90] italic">Blocked</span>
                  ) : (
                    `${feretMax ?? '-'} / ${feretMin ?? '-'}`
                  )}
                </td>
                <td className="py-3 px-4 tabular-nums font-bold text-[#1E2A38]">
                  {isUncalibrated ? (
                    <span className="text-[#6b7a90] italic">Blocked</span>
                  ) : (
                    `${ecd ?? '-'} µm`
                  )}
                </td>
                <td className="py-3 px-4 tabular-nums text-[#6b7a90]">{aspect.toFixed(2)}</td>
                <td className="py-3 px-4">
                  {det.needs_lab_confirmation ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FF6B6B]/15 text-[#FF6B6B] border border-[#FF6B6B]/30">
                      <AlertTriangle className="w-3 h-3" />
                      <span>REQUIRED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2ECC91]/15 text-[#2ECC91] border border-[#2ECC91]/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>PASSED</span>
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-[12px] text-[#6b7a90]">
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
  );
};
