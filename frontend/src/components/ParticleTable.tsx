import React, { useState } from 'react';
import { ArrowsDownUp, Warning, CheckCircle, Funnel } from '@phosphor-icons/react';
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

  if (detections.length === 0) {
    return (
      <div className="p-8 text-center bg-surface rounded-md border border-line">
        <p className="text-[13.5px] font-semibold text-ink">No particle candidates detected</p>
        <p className="text-[12px] text-ink-3 mt-1">
          Upload a sample micrograph or select a calibrated reference sample above to run detection.
        </p>
      </div>
    );
  }

  const columns: { field: SortField; label: string }[] = [
    { field: 'id', label: 'ID' },
    { field: 'class_name', label: 'Class' },
    { field: 'confidence', label: 'Confidence' },
    { field: 'feret_max', label: 'Feret Max/Min (µm)' },
    { field: 'ecd', label: 'ECD (µm)' },
    { field: 'aspect_ratio', label: 'Aspect Ratio' },
    { field: 'needs_lab', label: 'Lab Verification' }
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-2">
          <Funnel size={14} className="text-accent" />
          <span className="font-semibold text-ink text-[12px] mr-1">Morphology:</span>
          {['all', 'fragment', 'fiber', 'film', 'foam', 'pellet'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilterClass(c)}
              aria-pressed={filterClass === c}
              className={`px-2.5 py-1 rounded-sm text-[11.5px] font-medium capitalize transition-colors duration-150 cursor-pointer ${
                filterClass === c
                  ? 'bg-accent text-white font-semibold shadow-2xs'
                  : 'bg-surface hover:bg-sunken text-ink-2 border border-line'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <span className="text-[11.5px] font-mono tabular-nums text-ink-3">
          Showing {sortedDetections.length} of {detections.length} candidates
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border border-line bg-surface shadow-2xs">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="bg-sunken border-b border-line text-ink-3 text-[11px] font-semibold uppercase tracking-[0.06em]">
              {columns.map((col) => (
                <th
                  key={col.field}
                  aria-sort={sortField === col.field ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                  className="p-0 font-semibold"
                >
                  <button
                    type="button"
                    onClick={() => handleSort(col.field)}
                    className="w-full flex items-center gap-1.5 px-3.5 py-2.5 cursor-pointer hover:text-ink transition-colors"
                  >
                    <span>{col.label}</span>
                    <ArrowsDownUp size={12} className={sortField === col.field ? 'text-accent' : 'text-line-strong'} />
                  </button>
                </th>
              ))}
              <th className="px-3.5 py-2.5 font-semibold">Flag Justification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-ink-2 font-mono text-[12.5px]">
            {sortedDetections.map((det) => {
              const feretMax = det.size_um?.feret_max ?? det.size_px?.feret_max;
              const feretMin = det.size_um?.feret_min ?? det.size_px?.feret_min;
              const ecd = det.size_um?.ecd ?? det.size_px?.ecd;
              const aspect = det.size_um?.aspect_ratio ?? det.size_px?.aspect_ratio ?? 1.0;
              const isUncalibrated = det.size_um?.ecd === null;

              return (
                <tr key={det.id} className="hover:bg-sunken/40 transition-colors">
                  <td className="py-2 px-3.5 font-semibold text-accent">#{String(det.id).padStart(3, '0')}</td>
                  <td className="py-2 px-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11.5px] font-sans font-medium bg-sunken border border-line capitalize text-ink">
                      {det.class_name}
                    </span>
                  </td>
                  <td className="py-2 px-3.5">
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums font-semibold text-[12px] text-ink">
                        {(det.confidence * 100).toFixed(1)}%
                      </span>
                      <div className="w-12 h-1.5 bg-sunken rounded-sm overflow-hidden border border-line">
                        <div
                          className={`h-full ${
                            det.confidence >= 0.8 ? 'bg-ok' : det.confidence >= 0.5 ? 'bg-warn' : 'bg-err'
                          }`}
                          style={{ width: `${Math.min(det.confidence * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-3.5 tabular-nums">
                    {isUncalibrated ? (
                      <span className="text-ink-3 italic text-[11.5px] font-sans">Blocked</span>
                    ) : (
                      `${feretMax !== undefined ? feretMax.toFixed(1) : '-'} / ${feretMin !== undefined ? feretMin.toFixed(1) : '-'}`
                    )}
                  </td>
                  <td className="py-2 px-3.5 tabular-nums font-semibold text-ink">
                    {isUncalibrated ? (
                      <span className="text-ink-3 italic text-[11.5px] font-sans">Blocked</span>
                    ) : (
                      `${ecd !== undefined ? ecd.toFixed(1) : '-'} µm`
                    )}
                  </td>
                  <td className="py-2 px-3.5 tabular-nums">{aspect.toFixed(2)}</td>
                  <td className="py-2 px-3.5">
                    {det.needs_lab_confirmation ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-sans font-semibold bg-err-tint text-err border border-err-border">
                        <Warning size={12} weight="bold" />
                        <span>Required</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-sans font-semibold bg-ok-tint text-ok border border-ok-border">
                        <CheckCircle size={12} weight="bold" />
                        <span>Pass</span>
                      </span>
                    )}
                  </td>
                  <td
                    className="py-2 px-3.5 text-[11.5px] font-sans text-ink-3 max-w-[200px] truncate"
                    title={det.lab_confirmation_reasons?.join(', ')}
                  >
                    {det.lab_confirmation_reasons && det.lab_confirmation_reasons.length > 0
                      ? det.lab_confirmation_reasons.join(', ')
                      : 'None'}
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

export default ParticleTable;
