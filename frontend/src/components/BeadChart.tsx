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
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#CBD9E0" vertical={false} />
          <XAxis
            dataKey="target"
            tickLine={false}
            axisLine={{ stroke: '#9CB4C0' }}
            tick={{ fill: '#2E4550', fontSize: 12, fontFamily: 'IBM Plex Mono' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#58717E', fontSize: 12, fontFamily: 'IBM Plex Mono' }}
            unit=" µm"
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
          />
          <Legend
            wrapperStyle={{
              paddingTop: '10px',
              fontSize: '11.5px',
              fontFamily: 'IBM Plex Sans'
            }}
          />
          <Bar dataKey="Nominal" fill="#9CB4C0" radius={[3, 3, 0, 0]} name="Nominal Standard (µm)" />
          <Bar dataKey="Measured" fill="#075E67" radius={[3, 3, 0, 0]} name="Observed Optical (µm)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BeadChart;
