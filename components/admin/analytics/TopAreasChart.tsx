'use client';

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';

interface Props {
  data: { address: string; count: number }[];
}

export default function TopAreasChart({ data }: Props) {
  // Sort data for horizontal layout
  const sortedData = [...data].sort((a,b) => b.count - a.count).slice(0, 5);

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-sm font-black uppercase tracking-widest text-[#0D2D1C] opacity-70 mb-6">Top Problem Areas</h3>
      
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            layout="vertical" 
            data={sortedData} 
            margin={{ left: 20, right: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--outline-variant)" opacity={0.3} />
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="address" 
              axisLine={false}
              tickLine={false}
              width={150}
              tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--on-surface-variant)', opacity: 0.8 }}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
            />
            <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={20}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#EF4444' : '#F97316'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
