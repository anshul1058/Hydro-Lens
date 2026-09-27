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
      <div className="p-8 text-center bg-[#E8F8FC]/60 rounded-[14px] border border-[#B9DFEA]">
        <p className="text-[14px] text-[#5294A8]">No particles detected in current sample.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[14px] border border-[#B9DFEA] bg-[#E8F8FC]/80 backdrop-blur-[10px]">
      <table className="w-full text-left border-collapse text-[13px]">
        <thead>
          <tr className="bg-[#E8F8FC] border-b border-[#B9DFEA] text-[#5294A8] text-[11px] font-semibold uppercase tracking-[0.06em]">
            <th onClick={() => handleSort('id')} className="py-3 px-4 cursor-pointer hover:bg-white/80 transition-all">
              <div className="flex items-center space-x-1">
                <span>ID</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th onClick={() => handleSort('class_name')} className="py-3 px-4 cursor-pointer hover:bg-white/80 transition-all">
              <div className="flex items-center space-x-1">
                <span>Class</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th onClick={() => handleSort('confidence')} className="py-3 px-4 cursor-pointer hover:bg-white/80 transition-all">
              <div className="flex items-center space-x-1">
                <span>Confidence</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th onClick={() => handleSort('feret_max')} className="py-3 px-4 cursor-pointer hover:bg-white/80 transition-all">
              <div className="flex items-center space-x-1">
                <span>Feret Max/Min (µm)</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th onClick={() => handleSort('ecd')} className="py-3 px-4 cursor-pointer hover:bg-white/80 transition-all">
              <div className="flex items-center space-x-1">
                <span>ECD (µm)</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th onClick={() => handleSort('aspect_ratio')} className="py-3 px-4 cursor-pointer hover:bg-white/80 transition-all">
              <div className="flex items-center space-x-1">
                <span>Aspect Ratio</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th onClick={() => handleSort('needs_lab')} className="py-3 px-4 cursor-pointer hover:bg-white/80 transition-all">
              <div className="flex items-center space-x-1">
                <span>Needs Lab</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th className="py-3 px-4">Reasons</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#B9DFEA]/60 text-[#397C91]">
          {sortedDetections.map((det) => {
            const feretMax = det.size_um?.feret_max ?? det.size_px?.feret_max;
            const feretMin = det.size_um?.feret_min ?? det.size_px?.feret_min;
            const ecd = det.size_um?.ecd ?? det.size_px?.ecd;
            const aspect = det.size_um?.aspect_ratio ?? det.size_px?.aspect_ratio ?? 1.0;
            const isUncalibrated = det.size_um?.ecd === null;

            return (
              <tr key={det.id} className="hover:bg-white/60 transition-all">
                <td className="py-2.5 px-4 font-semibold tabular-nums text-[#3FA7C4]">#{det.id}</td>
                <td className="py-2.5 px-4">
                  <span className="capitalize px-2 py-0.5 rounded-md text-[12px] font-medium bg-[#6BBFD8]/20 text-[#397C91]">
                    {det.class_name}
                  </span>
                </td>
                <td className="py-2.5 px-4 tabular-nums font-medium">
                  {(det.confidence * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-4 tabular-nums">
                  {isUncalibrated ? (
                    <span className="text-[#5294A8] italic">Blocked</span>
                  ) : (
                    `${feretMax ?? '-'} / ${feretMin ?? '-'}`
                  )}
                </td>
                <td className="py-2.5 px-4 tabular-nums font-semibold">
                  {isUncalibrated ? (
                    <span className="text-[#5294A8] italic">Blocked</span>
                  ) : (
                    `${ecd ?? '-'} µm`
                  )}
                </td>
                <td className="py-2.5 px-4 tabular-nums">{aspect.toFixed(2)}</td>
                <td className="py-2.5 px-4">
                  {det.needs_lab_confirmation ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F28B8B]/25 text-[#397C91]">
                      <AlertTriangle className="w-3 h-3 text-[#F28B8B]" />
                      <span>REQUIRED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#65C99A]/25 text-[#397C91]">
                      <CheckCircle2 className="w-3 h-3 text-[#65C99A]" />
                      <span>NO</span>
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-4 text-[12px] text-[#5294A8]">
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
