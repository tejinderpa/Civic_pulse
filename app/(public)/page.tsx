'use client';

import React from 'react';
import { Navbar } from '../../components/landing/Navbar';
import { HeroSection } from '../../components/landing/HeroSection';
import { StatsBar } from '../../components/landing/StatsBar';
import { HowItWorks } from '../../components/landing/HowItWorks';
import { FeaturedIssues } from '../../components/landing/FeaturedIssues';
import { AIFeatures } from '../../components/landing/AIFeatures';
import { Footer } from '../../components/landing/Footer';
import { PhotoMarquee } from '../../components/landing/PhotoMarquee';
import { CtaBanner } from '../../components/landing/CtaBanner';
import SearchHero from '../../components/SearchHero';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  const handleLocationSelect = (lat: number, lon: number, address: string) => {
    // Map focus only — don't dump long address into text filters
    const params = new URLSearchParams({
      view: 'map',
      lat: String(lat),
      lon: String(lon),
    });
    // Short label for UI context (optional)
    if (address && address.length < 80) {
      params.set('q', address);
    }
    router.push(`/community?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] font-sans text-on-surface flex flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />

        {/* Clear breathing room so search is not clipped under hero */}
        <div className="relative z-30 px-4 sm:px-6 pt-10 md:pt-14 pb-12 md:pb-16">
          <SearchHero onLocationSelect={handleLocationSelect} />
        </div>

        <PhotoMarquee />
        <StatsBar />
        <HowItWorks />
        <FeaturedIssues />
        <AIFeatures />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
