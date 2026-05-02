'use client';
import React, { useEffect, useState, useRef } from 'react';

const AnimatedCounter = ({ end, duration = 2000, suffix = "" }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [isVisible, end, duration]);

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-['Plus_Jakarta_Sans'] font-extrabold text-[#1A6B45]">
      {count.toLocaleString()}{suffix}
    </div>
  );
};

export const StatsBar = () => {
  return (
    <div className="bg-[#E8F5EE] py-16 border-y border-[#1A6B45]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[#1A6B45]/20">
          <div className="p-4 flex flex-col items-center">
            <span className="text-3xl mb-2">📊</span>
            <AnimatedCounter end={12400} suffix="+" />
            <div className="mt-3 text-[#1A6B45] font-bold uppercase tracking-wider text-sm opacity-80">Issues Reported</div>
          </div>
          <div className="p-4 flex flex-col items-center">
            <span className="text-3xl mb-2">✅</span>
            <AnimatedCounter end={3200} />
            <div className="mt-3 text-[#1A6B45] font-bold uppercase tracking-wider text-sm opacity-80">Resolved This Month</div>
          </div>
          <div className="p-4 flex flex-col items-center">
            <span className="text-3xl mb-2">🏙️</span>
            <AnimatedCounter end={8} />
            <div className="mt-3 text-[#1A6B45] font-bold uppercase tracking-wider text-sm opacity-80">Cities Active</div>
          </div>
        </div>
      </div>
    </div>
  );
};
