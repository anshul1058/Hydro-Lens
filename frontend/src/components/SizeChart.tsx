import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Lock } from 'lucide-react';

interface SizeChartProps {
  distribution: Record<string, number>;
  calibrationQuality: number;
}

export const SizeChart: React.FC<SizeChartProps> = ({ distribution, calibrationQuality }) => {
  if (calibrationQuality === 0.0) {
    return (
      <div className="w-full h-72 rounded-2xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 p-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-[#FF6B6B]/20 flex items-center justify-center text-[#FF6B6B] mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-[16px] font-bold text-[#1E2A38] mb-1">
          Particle Size Distribution Blocked
        </h3>
        <p className="text-[13px] text-[#6b7a90] max-w-md">
          Valid calibration is required to convert pixel dimensions into micrometers (µm).
          Please complete calibration in the Calibration Portal.
        </p>
      </div>
    );
  }

  const data = [
    { bin: '10–25 µm', count: distribution['10-25'] ?? 0 },
    { bin: '25–50 µm', count: distribution['25-50'] ?? 0 },
    { bin: '50–100 µm', count: distribution['50-100'] ?? 0 },
    { bin: '100+ µm', count: distribution['100+'] ?? 0 },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-[#9ecae1] p-6 shadow-[0_4px_20px_rgba(74,144,217,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[16px] font-bold text-[#1E2A38]">Particle Size Distribution (ECD)</h3>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7a90] mt-0.5">
            Micrometers (µm) bin counts
          </p>
        </div>
        <div className="text-[12px] font-semibold text-[#4a90d9] bg-[#4a90d9]/10 px-3 py-1 rounded-full border border-[#9ecae1]">
          Active Scale Factor
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D0DCE8" vertical={false} />
            <XAxis
              dataKey="bin"
              tickLine={false}
              axisLine={{ stroke: '#D0DCE8' }}
              tick={{ fill: '#6b7a90', fontSize: 12, fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6b7a90', fontSize: 12, fontWeight: 500 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #9ecae1',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(74,144,217,0.12)',
                fontSize: '13px',
                color: '#1E2A38',
                fontWeight: 600,
              }}
              cursor={{ fill: 'rgba(74, 144, 217, 0.08)' }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill="#4a90d9" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
