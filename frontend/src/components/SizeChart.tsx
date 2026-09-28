import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Lock } from '@phosphor-icons/react';

interface SizeChartProps {
  distribution: Record<string, number>;
  calibrationQuality: number;
}

export const SizeChart: React.FC<SizeChartProps> = ({ distribution, calibrationQuality }) => {
  if (calibrationQuality === 0.0) {
    return (
      <div className="w-full rounded-md border border-warn-border bg-warn-tint p-6 flex flex-col sm:flex-row sm:items-start gap-4">
        <Lock size={22} className="text-warn shrink-0 mt-0.5" weight="bold" />
        <div>
          <h3 className="text-[14px] font-semibold text-ink">Particle Size Distribution Blocked</h3>
          <p className="text-[12.5px] text-ink-2 mt-1 leading-relaxed max-w-prose">
            Converting image pixel coordinates into physical micrometer dimensions requires an active calibration record. Run scale calibration first, then re-execute this screening.
          </p>
        </div>
      </div>
    );
  }

  const data = [
    { bin: '10-25 µm', count: distribution['10-25'] ?? 0, color: '#075E67' },
    { bin: '25-50 µm', count: distribution['25-50'] ?? 0, color: '#075E67' },
    { bin: '50-100 µm', count: distribution['50-100'] ?? 0, color: '#075E67' },
    { bin: '100+ µm', count: distribution['100+'] ?? 0, color: '#075E67' }
  ];

  return (
    <section className="w-full bg-surface border border-line rounded-md p-5 shadow-2xs">
      <div className="mb-4">
        <h3 className="text-section-title">Particle Size Distribution</h3>
        <p className="text-caption mt-0.5">Equivalent Circular Diameter (ECD) Bin Breakdown</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD9E0" vertical={false} />
            <XAxis
              dataKey="bin"
              tickLine={false}
              axisLine={{ stroke: '#9CB4C0' }}
              tick={{ fill: '#2E4550', fontSize: 12, fontFamily: 'IBM Plex Mono' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#58717E', fontSize: 12, fontFamily: 'IBM Plex Mono' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD9E0',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'IBM Plex Mono',
                color: '#0D1C22',
                boxShadow: '0 2px 4px rgba(13, 28, 34, 0.06)'
              }}
              cursor={{ fill: 'rgba(7, 94, 103, 0.08)' }}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default SizeChart;
