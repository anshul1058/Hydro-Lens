import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
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
    errorPct: (((b.measured - b.nominal) / b.nominal) * 100).toFixed(1)
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(185,223,234,0.4)" vertical={false} />
          <XAxis
            dataKey="target"
            tickLine={false}
            axisLine={{ stroke: '#B9DFEA' }}
            tick={{ fill: '#5294A8', fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#5294A8', fontSize: 12 }}
            unit=" µm"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(232, 248, 252, 0.95)',
              border: '1px solid #B9DFEA',
              borderRadius: '10px',
              fontSize: '13px',
              color: '#397C91'
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
          <Bar dataKey="Nominal" fill="#C5ECF6" radius={[4, 4, 0, 0]} name="Nominal Size (µm)" />
          <Bar dataKey="Measured" fill="#6BBFD8" radius={[4, 4, 0, 0]} name="Measured Size (µm)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
