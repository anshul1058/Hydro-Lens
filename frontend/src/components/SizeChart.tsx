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
import { Lock, BarChart3 } from 'lucide-react';

interface SizeChartProps {
  distribution: Record<string, number>;
  calibrationQuality: number;
}

export const SizeChart: React.FC<SizeChartProps> = ({ distribution, calibrationQuality }) => {
  if (calibrationQuality === 0.0) {
    return (
      <div className="w-full h-80 rounded-[20px] bg-gradient-to-br from-white/95 to-[#FEECEB]/60 border border-[#EF4444]/35 p-8 flex flex-col items-center justify-center text-center shadow-[0_4px_20px_rgba(239,68,68,0.08)]">
        <div className="w-14 h-14 rounded-2xl bg-[#FEECEB] border border-[#EF4444]/30 flex items-center justify-center text-[#DC2626] mb-3.5 shadow-xs">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-[17px] font-bold text-[#0A2540] mb-1.5 flex items-center gap-2">
          <span>Particle Size Distribution Blocked</span>
        </h3>
        <p className="text-[13px] text-[#2C637A] max-w-md leading-relaxed">
          Valid calibration is required to convert pixel dimensions into micrometers (µm).
          Please complete calibration in the Calibration Portal.
        </p>
      </div>
    );
  }

  const data = [
    { bin: '10–25 µm', count: distribution['10-25'] ?? 0, color: '#0284C7' },
    { bin: '25–50 µm', count: distribution['25-50'] ?? 0, color: '#0891B2' },
    { bin: '50–100 µm', count: distribution['50-100'] ?? 0, color: '#06B6D4' },
    { bin: '100+ µm', count: distribution['100+'] ?? 0, color: '#0D9488' }
  ];

  return (
    <div className="w-full bg-white/95 backdrop-blur-[20px] rounded-[20px] border border-[#BBE4F2] p-6 shadow-[0_8px_24px_rgba(8,145,178,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-[#0891B2]" />
            <h3 className="text-section-title">Particle Size Distribution (ECD)</h3>
          </div>
          <p className="text-caption mt-0.5">Micrometers (µm) bin counts</p>
        </div>
        <div className="text-[12px] font-bold text-[#0891B2] bg-[#EAF7FC] px-3 py-1 rounded-full border border-[#0891B2]/30 shadow-2xs">
          Active Scale Factor
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(187,228,242,0.6)" vertical={false} />
            <XAxis
              dataKey="bin"
              tickLine={false}
              axisLine={{ stroke: '#BBE4F2' }}
              tick={{ fill: '#2C637A', fontSize: 12, fontWeight: 600 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#4A7F96', fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid #BBE4F2',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(8,145,178,0.12)',
                fontSize: '13px',
                color: '#0A2540',
                fontWeight: 600
              }}
              cursor={{ fill: 'rgba(6, 182, 212, 0.08)' }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="url(#barGradient)">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
