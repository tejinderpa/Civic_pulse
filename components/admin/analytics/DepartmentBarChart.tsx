'use client';

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend 
} from 'recharts';
import { DepartmentStat } from '@/types/analytics';

interface Props {
  data: DepartmentStat[];
}

export default function DepartmentBarChart({ data }: Props) {
  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-sm font-black uppercase tracking-widest text-[#0D2D1C] opacity-70 mb-6">Department Efficiency</h3>
      
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" opacity={0.5} />
            <XAxis 
              dataKey="department" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--on-surface-variant)', opacity: 0.5 }}
            />
            <YAxis 
              yAxisId="left"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--on-surface-variant)', opacity: 0.5 }}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 900 }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--on-surface-variant)', opacity: 0.5 }}
              label={{ value: '% SLA', angle: 90, position: 'insideRight', fontSize: 10, fontWeight: 900 }}
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
            />
            <Legend verticalAlign="top" align="right" iconType="circle" />
            <Bar yAxisId="left" dataKey="avgResolutionHours" name="Avg Resolution (Hrs)" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={24} />
            <Bar yAxisId="right" dataKey="slaCompliancePercent" name="SLA Compliance (%)" fill="#10B981" radius={[6, 6, 0, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
