'use client';

import Image from 'next/image';
import { useReveal } from './useReveal';

const STEPS = [
  {
    step: '01',
    title: 'Snap & describe',
    body: 'Upload a photo and a short description. Your location is captured so authorities know exactly where to act.',
    icon: 'photo_camera',
    image:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800',
    tint: 'from-emerald-600/90',
  },
  {
    step: '02',
    title: 'AI prioritizes',
    body: 'Classification, duplicate detection, and priority scoring happen in seconds — the right department gets the signal.',
    icon: 'psychology',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
    tint: 'from-teal-700/90',
  },
  {
    step: '03',
    title: 'Authority acts',
    body: 'Teams dispatch, status updates stream live, and your neighborhood watches the issue move to resolved.',
    icon: 'engineering',
    image:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
    tint: 'from-slate-800/90',
  },
];

function StepCard({
  step,
  index,
}: {
  step: (typeof STEPS)[0];
  index: number;
}) {
  const { ref, className } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`${className} group relative overflow-hidden rounded-3xl bg-white border border-[var(--outline-variant)] shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] transition-shadow duration-300`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="relative h-48 overflow-hidden">
        <Image
          src={step.image}
          alt={step.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${step.tint} to-transparent opacity-80`} />
        <div className="absolute top-4 left-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur border border-white/25 text-white">
          <span className="material-symbols-outlined">{step.icon}</span>
        </div>
        <span className="absolute bottom-4 right-4 font-headline text-4xl font-black text-white/30">
          {step.step}
        </span>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold font-headline text-on-surface mb-2">{step.title}</h3>
        <p className="text-sm text-on-surface-variant leading-relaxed">{step.body}</p>
      </div>
    </div>
  );
}

export const HowItWorks = () => {
  const header = useReveal<HTMLDivElement>();

  return (
    <section id="how-it-works" className="py-24 bg-[var(--surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={header.ref} className={`${header.className} text-center mb-14`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">
            Simple flow
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-on-surface">
            How CivicPulse works
          </h2>
          <p className="mt-4 text-lg text-on-surface-variant max-w-2xl mx-auto">
            From a photo on your phone to a fix on the ground — transparent every step of the way.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {STEPS.map((step, i) => (
            <StepCard key={step.step} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
