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
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(187,228,242,0.6)" vertical={false} />
          <XAxis
            dataKey="target"
            tickLine={false}
            axisLine={{ stroke: '#BBE4F2' }}
            tick={{ fill: '#2C637A', fontSize: 12, fontWeight: 600 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#4A7F96', fontSize: 12 }}
            unit=" µm"
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
          />
          <Legend 
            wrapperStyle={{ paddingTop: '12px', fontSize: '12px', fontWeight: 600 }} 
          />
          <Bar 
            dataKey="Nominal" 
            fill="#BAE6FD" 
            stroke="#7DD3FC"
            radius={[6, 6, 0, 0]} 
            name="Nominal Size (µm)" 
          />
          <Bar 
            dataKey="Measured" 
            fill="#0891B2" 
            radius={[6, 6, 0, 0]} 
            name="Measured Size (µm)" 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
