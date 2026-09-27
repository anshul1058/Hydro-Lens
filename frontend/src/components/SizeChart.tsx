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
import { Lock } from 'lucide-react';

interface SizeChartProps {
  distribution: Record<string, number>;
  calibrationQuality: number;
}

export const SizeChart: React.FC<SizeChartProps> = ({ distribution, calibrationQuality }) => {
  if (calibrationQuality === 0.0) {
    return (
      <div className="w-full h-72 rounded-[18px] bg-[#F28B8B]/15 border border-[#F28B8B]/40 p-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-[#F28B8B]/25 flex items-center justify-center text-[#397C91] mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-[16px] font-semibold text-[#397C91] mb-1">
          Particle Size Distribution Blocked
        </h3>
        <p className="text-[13px] text-[#5294A8] max-w-md">
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
    { bin: '100+ µm', count: distribution['100+'] ?? 0 }
  ];

  return (
    <div className="w-full bg-[#E8F8FC]/85 backdrop-blur-[20px] rounded-[18px] border border-[#B9DFEA] p-6 shadow-[0_8px_24px_rgba(57,124,145,0.08)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-section-title">Particle Size Distribution (ECD)</h3>
          <p className="text-caption mt-0.5">Micrometers (µm) bin counts</p>
        </div>
        <div className="text-[12px] font-medium text-[#397C91] bg-[#6BBFD8]/20 px-3 py-1 rounded-full border border-[#6BBFD8]/30">
          Active Scale Factor
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(185,223,234,0.4)" vertical={false} />
            <XAxis
              dataKey="bin"
              tickLine={false}
              axisLine={{ stroke: '#B9DFEA' }}
              tick={{ fill: '#5294A8', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#5294A8', fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(232, 248, 252, 0.95)',
                border: '1px solid #B9DFEA',
                borderRadius: '10px',
                boxShadow: '0 4px 16px rgba(57,124,145,0.1)',
                fontSize: '13px',
                color: '#397C91'
              }}
              cursor={{ fill: 'rgba(107, 191, 216, 0.1)' }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill="#6BBFD8" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
