'use client';

import Image from 'next/image';

const PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=600',
    label: 'City streets',
  },
  {
    src: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=600',
    label: 'Roads',
  },
  {
    src: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=600',
    label: 'Sanitation',
  },
  {
    src: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=600',
    label: 'Water systems',
  },
  {
    src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=600',
    label: 'Skyline',
  },
  {
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=600',
    label: 'Green spaces',
  },
  {
    src: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&q=80&w=600',
    label: 'Transit',
  },
  {
    src: 'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?auto=format&fit=crop&q=80&w=600',
    label: 'Infrastructure',
  },
];

export function PhotoMarquee() {
  const strip = [...PHOTOS, ...PHOTOS];

  return (
    <section className="relative py-10 overflow-hidden border-y border-[var(--outline-variant)] bg-white">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-white to-transparent" />

      <div className="mb-5 px-4 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
          Real streets · Real communities · Real impact
        </p>
      </div>

      <div className="flex w-max animate-landing-marquee gap-4 px-2">
        {strip.map((photo, i) => (
          <div
            key={`${photo.src}-${i}`}
            className="relative h-36 w-56 md:h-44 md:w-72 shrink-0 overflow-hidden rounded-2xl ring-1 ring-black/5 shadow-md group"
          >
            <Image
              src={photo.src}
              alt={photo.label}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="288px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 text-xs font-bold text-white tracking-wide">
              {photo.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
