'use client';

import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { ResolutionTrendPoint } from '@/types/analytics';

interface Props {
  data: ResolutionTrendPoint[];
}

export default function ResolutionAreaChart({ data }: Props) {
  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-sm font-black uppercase tracking-widest text-[#0D2D1C] opacity-70 mb-6">SLA Compliance Trend</h3>
      
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--on-surface-variant)', opacity: 0.5 }}
              tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--on-surface-variant)', opacity: 0.5 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                border: '1px solid #e2e8f0' 
              }} 
            />
            <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Target 70%', position: 'insideRight', fontSize: 10, fill: '#EF4444', fontWeight: 900 }} />
            <Area 
              type="monotone" 
              dataKey="compliancePercent" 
              name="SLA Compliance %"
              stroke="#10B981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCompliance)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
