'use client';

import Image from 'next/image';
import { useReveal } from './useReveal';

const FEATURES = [
  {
    icon: 'psychology',
    title: 'Smart classification',
    body: 'AI reads your photo and text to tag and categorize instantly — less sorting, faster routing.',
    image:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=700',
  },
  {
    icon: 'hub',
    title: 'Duplicate detection',
    body: 'Overlapping reports merge automatically so departments see one clear signal, not noise.',
    image:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=700',
  },
  {
    icon: 'priority_high',
    title: 'Priority scoring',
    body: 'Schools, hospitals, and high-traffic zones rise to the top so critical risks get attention first.',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=700',
  },
];

export const AIFeatures = () => {
  const header = useReveal<HTMLDivElement>();

  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={header.ref} className={`${header.className} text-center mb-14`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">
            Intelligence layer
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-on-surface">
            Powered by AI, built for impact
          </h2>
          <p className="mt-4 text-lg text-on-surface-variant max-w-2xl mx-auto">
            Advanced tooling so nothing slips through the cracks — for citizens or authorities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[0];
  index: number;
}) {
  const { ref, className } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`${className} group overflow-hidden rounded-3xl border border-[var(--outline-variant)] bg-[var(--surface)] shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] transition-all duration-300`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="relative h-40 overflow-hidden">
        <Image
          src={feature.image}
          alt={feature.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg">
          <span className="material-symbols-outlined text-[20px]">{feature.icon}</span>
        </div>
      </div>
      <div className="p-6 pt-2">
        <h3 className="text-lg font-bold font-headline text-on-surface mb-2">{feature.title}</h3>
        <p className="text-sm text-on-surface-variant leading-relaxed">{feature.body}</p>
      </div>
    </div>
  );
}
