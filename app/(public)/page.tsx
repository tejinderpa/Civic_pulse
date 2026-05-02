'use client';

import React from 'react';
import { Navbar } from '../../components/landing/Navbar';
import { HeroSection } from '../../components/landing/HeroSection';
import { StatsBar } from '../../components/landing/StatsBar';
import { HowItWorks } from '../../components/landing/HowItWorks';
import { FeaturedIssues } from '../../components/landing/FeaturedIssues';
import { AIFeatures } from '../../components/landing/AIFeatures';
import { Footer } from '../../components/landing/Footer';
import SearchHero from '../../components/SearchHero';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  const handleLocationSelect = (lat: number, lon: number, address: string) => {
    router.push(`/community?view=map&lat=${lat}&lon=${lon}&q=${encodeURIComponent(address)}`);
  };

  return (
    <div className="min-h-screen bg-[#F9FAF8] font-sans text-gray-900 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <div className="px-4 -mt-12 mb-12 relative z-20">
           <SearchHero onLocationSelect={handleLocationSelect} />
        </div>
        <StatsBar />
        <HowItWorks />
        <FeaturedIssues />
        <AIFeatures />
      </main>
      <Footer />
    </div>
  );
}

