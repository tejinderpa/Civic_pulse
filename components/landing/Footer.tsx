import React from 'react';
import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="bg-white border-t-2 border-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Link href="/" className="font-headline font-bold text-xl text-primary">
              CivicPulse
            </Link>
            <div className="flex gap-6 mt-4 md:mt-0 text-sm font-body text-on-surface-variant font-medium">
              <Link href="/#about" className="hover:text-primary transition-colors">About</Link>
              <Link href="/community" className="hover:text-primary transition-colors">Community</Link>
              <Link href="/login" className="hover:text-primary transition-colors">Sign in</Link>
            </div>
          </div>
          <div className="mt-6 md:mt-0 text-outline font-body text-sm font-medium">
            Built for smarter cities.
          </div>
        </div>
      </div>
    </footer>
  );
};
