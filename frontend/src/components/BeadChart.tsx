import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BeadChartProps {
  beads: {
    nominal: number;
    measured: number;
  }[];
}

export const BeadChart: React.FC<BeadChartProps> = ({ beads }) => {
  const data = beads.map((b) => ({
    target: `${b.nominal} µm`,
    Nominal: b.nominal,
    Measured: b.measured,
    errorPct: (((b.measured - b.nominal) / b.nominal) * 100).toFixed(1),
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D0DCE8" vertical={false} />
          <XAxis
            dataKey="target"
            tickLine={false}
            axisLine={{ stroke: '#D0DCE8' }}
            tick={{ fill: '#6b7a90', fontSize: 12, fontWeight: 500 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6b7a90', fontSize: 12, fontWeight: 500 }}
            unit=" µm"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #9ecae1',
              borderRadius: '12px',
              fontSize: '13px',
              color: '#1E2A38',
              boxShadow: '0 8px 24px rgba(74,144,217,0.12)',
              fontWeight: 600,
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 500 }} />
          <Bar dataKey="Nominal" fill="#9ecae1" radius={[4, 4, 0, 0]} name="Nominal Size (µm)" />
          <Bar dataKey="Measured" fill="#4a90d9" radius={[4, 4, 0, 0]} name="Measured Size (µm)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
