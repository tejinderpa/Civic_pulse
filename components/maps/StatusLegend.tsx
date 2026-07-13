'use client';

import { STATUS_LEGEND } from '@/lib/maps/status-icons';

function Shape({
  shape,
  color,
}: {
  shape: 'dot' | 'ring' | 'diamond' | 'check' | 'cross';
  color: string;
}) {
  if (shape === 'dot') {
    return (
      <span
        className="inline-block w-3 h-3 rounded-full border-2 border-white shadow-sm shrink-0"
        style={{ backgroundColor: color }}
      />
    );
  }
  if (shape === 'ring') {
    return (
      <span
        className="inline-block w-3 h-3 rounded-full bg-white shrink-0"
        style={{ border: `3px solid ${color}` }}
      />
    );
  }
  if (shape === 'diamond') {
    return (
      <span
        className="inline-block w-2.5 h-2.5 border-2 border-white shadow-sm shrink-0"
        style={{ backgroundColor: color, transform: 'rotate(45deg)' }}
      />
    );
  }
  if (shape === 'check') {
    return (
      <span
        className="inline-flex w-3.5 h-3.5 rounded-full items-center justify-center text-white text-[8px] font-black shrink-0"
        style={{ backgroundColor: color }}
      >
        ✓
      </span>
    );
  }
  return (
    <span
      className="inline-flex w-3.5 h-3.5 rounded-full items-center justify-center text-white text-[8px] font-black shrink-0"
      style={{ backgroundColor: color }}
    >
      ✕
    </span>
  );
}

export function StatusLegend({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-white/95 backdrop-blur-xl rounded-2xl border border-outline-variant/30 shadow-xl p-3 ${className}`}
    >
      <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-2 px-1">
        Status legend
      </p>
      <ul className="space-y-1.5">
        {STATUS_LEGEND.map((item) => (
          <li key={item.key} className="flex items-center gap-2.5 px-1">
            <Shape shape={item.shape} color={item.color} />
            <span className="text-[11px] font-bold text-on-surface">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
