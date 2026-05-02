'use client';

import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Area, AreaChart 
} from 'recharts';
import { VolumeTrendPoint } from '@/types/analytics';

interface Props {
  data: VolumeTrendPoint[];
}

export default function IssueVolumeChart({ data }: Props) {
  const [range, setRange] = useState<'daily' | 'weekly'>('daily');

  const processedData = useMemo(() => {
    if (range === 'daily') return data;
    // Simple weekly grouping logic for demo
    const weeks: any[] = [];
    for (let i = 0; i < data.length; i += 7) {
      const slice = data.slice(i, i + 7);
      weeks.push({
        date: slice[0].date,
        count: slice.reduce((acc, curr) => acc + curr.count, 0)
      });
    }
    return weeks;
  }, [data, range]);

  const avgValue = useMemo(() => {
    if (data.length === 0) return 0;
    return data.reduce((acc, curr) => acc + curr.count, 0) / data.length;
  }, [data]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-[#0D2D1C] opacity-70">Issue Volume Trend</h3>
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          <button 
            onClick={() => setRange('daily')}
            className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${range === 'daily' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
          >
            Daily
          </button>
          <button 
            onClick={() => setRange('weekly')}
            className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${range === 'weekly' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
          >
            Weekly
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processedData}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--on-surface-variant)', opacity: 0.5 }}
              dy={10}
              tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--on-surface-variant)', opacity: 0.5 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255,255,255,0.9)', 
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid var(--outline-variant)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                padding: '12px'
              }}
              itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="var(--primary)" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorCount)" 
              animationDuration={1500}
            />
            <ReferenceLine y={avgValue} stroke="var(--primary)" strokeDasharray="5 5" opacity={0.3} label={{ value: 'AVG', position: 'right', fontSize: 10, fill: 'var(--primary)', fontWeight: 900 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
