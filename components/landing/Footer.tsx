import React from 'react';
import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="bg-white border-t-[2px] border-[#1A6B45] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Link href="/" className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-[#1A6B45]">
              CivicPulse
            </Link>
            <div className="flex gap-6 mt-4 md:mt-0 text-sm font-['DM_Sans'] text-gray-600 font-medium">
              <Link href="/about" className="hover:text-[#1A6B45] transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-[#1A6B45] transition-colors">Privacy Policy</Link>
              <Link href="/contact" className="hover:text-[#1A6B45] transition-colors">Contact</Link>
            </div>
          </div>
          <div className="mt-6 md:mt-0 text-gray-500 font-['DM_Sans'] text-sm font-medium">
            Built for smarter cities.
          </div>
        </div>
      </div>
    </footer>
  );
};
