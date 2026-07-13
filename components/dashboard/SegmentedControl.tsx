'use client';

import React from 'react';

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: string }[];
}) {
  return (
    <div className="inline-flex items-center rounded-xl bg-surface-container-low p-1 border border-[var(--outline-variant)]">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
              active
                ? 'bg-white text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {opt.icon && (
              <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
