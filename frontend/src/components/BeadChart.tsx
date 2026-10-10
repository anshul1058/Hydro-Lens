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

interface TooltipPayloadItem {
  payload: {
    target: string;
    Nominal: number;
    Measured: number;
    errorPct: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    const pData = payload[0].payload;
    return (
      <div className="bg-white/98 backdrop-blur-md p-3.5 rounded-xl border border-[#BBE4F2] shadow-[0_8px_24px_rgba(8,145,178,0.12)] text-[12px] space-y-1.5 min-w-[170px]">
        <p className="font-bold text-[#0A2540] border-b border-[#EAF7FC] pb-1">
          Bead Target: {label}
        </p>
        <div className="flex items-center justify-between space-x-3 text-[#0369A1]">
          <span className="font-medium">Nominal Size:</span>
          <span className="font-bold tabular-nums">{pData.Nominal} µm</span>
        </div>
        <div className="flex items-center justify-between space-x-3 text-[#0891B2]">
          <span className="font-medium">Measured Size:</span>
          <span className="font-bold tabular-nums">{pData.Measured} µm</span>
        </div>
        <div className="flex items-center justify-between space-x-3 text-[#56889E] pt-1 border-t border-[#EAF7FC]">
          <span>Deviation / Error:</span>
          <span
            className={`font-bold tabular-nums ${
              Math.abs(pData.errorPct) > 10 ? 'text-[#DC2626]' : 'text-[#059669]'
            }`}
          >
            {pData.errorPct > 0 ? `+${pData.errorPct}` : pData.errorPct}%
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const BeadChart: React.FC<BeadChartProps> = ({ beads }) => {
  const data = beads.map((b) => ({
    target: `${b.nominal} µm`,
    Nominal: b.nominal,
    Measured: b.measured,
    errorPct: Number((((b.measured - b.nominal) / b.nominal) * 100).toFixed(1))
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 20, left: -10, bottom: 5 }} barGap={6}>
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
            domain={[0, 'dataMax + 15']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '12px', fontSize: '12px', fontWeight: 600 }}
          />
          {/* Nominal reference bar (light sky blue) */}
          <Bar
            dataKey="Nominal"
            name="Nominal Reference (µm)"
            fill="#BAE6FD"
            stroke="#38BDF8"
            strokeWidth={1.5}
            radius={[6, 6, 0, 0]}
          />
          {/* Measured size bar (ocean cyan) */}
          <Bar
            dataKey="Measured"
            name="Measured Size (µm)"
            fill="#0891B2"
            stroke="#0369A1"
            strokeWidth={1.5}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
