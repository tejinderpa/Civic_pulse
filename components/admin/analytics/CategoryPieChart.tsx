'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CategoryStat } from '@/types/analytics';
import { CHART_COLORS } from '@/constants/colors';

interface Props {
  data: CategoryStat[];
}

export default function CategoryPieChart({ data }: Props) {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-sm font-black uppercase tracking-widest text-[#0D2D1C] opacity-70 mb-6">Issue Categories</h3>
      
      <div className="flex-1 min-h-[300px] relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-black uppercase text-slate-400">Total</span>
          <span className="text-3xl font-black">{total}</span>
        </div>
        
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={8}
              dataKey="count"
              nameKey="category"
              animationDuration={1000}
            >
              {data.map((entry) => (
                <Cell 
                  key={entry.category} 
                  fill={CHART_COLORS[entry.category.toLowerCase() as keyof typeof CHART_COLORS] || CHART_COLORS.other} 
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)' 
              }} 
            />
            <Legend 
              verticalAlign="bottom" 
              align="center"
              iconType="circle"
              formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
