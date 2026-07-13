'use client';

import React from 'react';

type Tone = 'primary' | 'warning' | 'error' | 'info' | 'neutral';

const toneStyles: Record<Tone, { iconBg: string; iconText: string; glow: string }> = {
  primary: {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-700',
    glow: 'bg-emerald-500/10',
  },
  warning: {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-700',
    glow: 'bg-amber-500/10',
  },
  error: {
    iconBg: 'bg-red-50',
    iconText: 'text-red-600',
    glow: 'bg-red-500/10',
  },
  info: {
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    glow: 'bg-blue-500/10',
  },
  neutral: {
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
    glow: 'bg-slate-500/10',
  },
};

export function DashStat({
  label,
  value,
  icon,
  change,
  trend = 'neutral',
  tone = 'primary',
  onClick,
  active = false,
  hint,
}: {
  label: string;
  value: string | number;
  icon?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  tone?: Tone;
  /** When set, card is clickable (e.g. filter) */
  onClick?: () => void;
  active?: boolean;
  hint?: string;
}) {
  const t = toneStyles[tone];
  const interactive = typeof onClick === 'function';

  const className = `dash-card-hover relative overflow-hidden p-5 w-full text-left transition-all ${
    interactive ? 'cursor-pointer hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30' : ''
  } ${active ? 'ring-2 ring-primary/35 border-primary/30 bg-white shadow-md' : ''}`;

  const inner = (
    <>
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full ${t.glow}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="dash-label mb-2">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-on-surface font-headline tabular-nums">
            {value}
          </p>
          {(change || hint || (interactive && !active)) && (
            <div
              className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                active
                  ? 'bg-primary/10 text-primary'
                  : trend === 'up'
                    ? 'bg-emerald-50 text-emerald-700'
                    : trend === 'down'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
              }`}
            >
              {active ? (
                <>
                  <span className="material-symbols-outlined text-[14px]">filter_alt</span>
                  Filtered
                </>
              ) : (
                <>
                  {change && (
                    <>
                      <span className="material-symbols-outlined text-[14px]">
                        {trend === 'up'
                          ? 'trending_up'
                          : trend === 'down'
                            ? 'trending_down'
                            : 'remove'}
                      </span>
                      {change}
                    </>
                  )}
                  {!change && interactive && (
                    <>
                      <span className="material-symbols-outlined text-[14px]">touch_app</span>
                      {hint || 'Tap to filter'}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.iconBg} ${t.iconText}`}
          >
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
          </div>
        )}
      </div>
    </>
  );

  if (interactive) {
    return (
      <button type="button" onClick={onClick} className={className} aria-pressed={active}>
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
}
