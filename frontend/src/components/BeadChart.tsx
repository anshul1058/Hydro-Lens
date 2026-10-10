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
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
<<<<<<< HEAD
        <BarChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(187,228,242,0.6)" vertical={false} />
          <XAxis
            dataKey="target"
            tickLine={false}
            axisLine={{ stroke: '#BBE4F2' }}
            tick={{ fill: '#2C637A', fontSize: 12, fontWeight: 600 }}
=======
        <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D0DCE8" vertical={false} />
          <XAxis
            dataKey="target"
            tickLine={false}
            axisLine={{ stroke: '#D0DCE8' }}
            tick={{ fill: '#6b7a90', fontSize: 12, fontWeight: 500 }}
>>>>>>> origin/main
          />
          <YAxis
            tickLine={false}
            axisLine={false}
<<<<<<< HEAD
            tick={{ fill: '#4A7F96', fontSize: 12 }}
=======
            tick={{ fill: '#6b7a90', fontSize: 12, fontWeight: 500 }}
>>>>>>> origin/main
            unit=" µm"
          />
          <Tooltip
            contentStyle={{
<<<<<<< HEAD
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
=======
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
>>>>>>> origin/main
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
