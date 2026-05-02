import React from 'react';

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-[#F9FAF8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A6B45] font-['Plus_Jakarta_Sans']">
            How CivicPulse Works
          </h2>
          <p className="mt-4 text-xl text-gray-600 font-['DM_Sans']">Fixing your community has never been this simple.</p>
        </div>
        
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-[#1A6B45]/20 to-transparent -z-10"></div>

          {/* Step 1 */}
          <div className="bg-white rounded-[16px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.07)] border border-[#E2E8E4] flex-1 max-w-sm text-center relative z-10 w-full transform transition-transform hover:-translate-y-1">
            <div className="w-20 h-20 mx-auto bg-[#E8F5EE] rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm border border-[#1A6B45]/10">
              📸
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-['Plus_Jakarta_Sans'] mb-3">Snap & Describe</h3>
            <p className="text-gray-600 font-['DM_Sans']">Upload a photo and describe the issue you've encountered in your city.</p>
          </div>

          {/* Arrow (Mobile) */}
          <div className="md:hidden text-[#1A6B45]/30 text-3xl">↓</div>

          {/* Step 2 */}
          <div className="bg-white rounded-[16px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.07)] border border-[#E2E8E4] flex-1 max-w-sm text-center relative z-10 w-full transform transition-transform hover:-translate-y-1">
            <div className="w-20 h-20 mx-auto bg-[#FFF3E0] rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm border border-[#F4A623]/10">
              🧠
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-['Plus_Jakarta_Sans'] mb-3">AI Prioritizes</h3>
            <p className="text-gray-600 font-['DM_Sans']">AI classifies, scores, and routes your report instantly to the correct department.</p>
          </div>

          {/* Arrow (Mobile) */}
          <div className="md:hidden text-[#1A6B45]/30 text-3xl">↓</div>

          {/* Step 3 */}
          <div className="bg-white rounded-[16px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.07)] border border-[#E2E8E4] flex-1 max-w-sm text-center relative z-10 w-full transform transition-transform hover:-translate-y-1">
            <div className="w-20 h-20 mx-auto bg-[#E8F5EE] rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm border border-[#1A6B45]/10">
              ✅
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-['Plus_Jakarta_Sans'] mb-3">Authority Acts</h3>
            <p className="text-gray-600 font-['DM_Sans']">The right department gets notified, takes action, and tracks resolution progress.</p>
          </div>

        </div>
      </div>
    </section>
  );
};
