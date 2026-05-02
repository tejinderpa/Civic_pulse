import React from 'react';

export const AIFeatures = () => {
  return (
    <section className="py-24 bg-[#F9FAF8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A6B45] font-['Plus_Jakarta_Sans']">
            Powered by AI, Built for Impact
          </h2>
          <p className="mt-4 text-xl text-gray-600 font-['DM_Sans']">Advanced technology ensuring nothing slips through the cracks.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#E8F5EE] rounded-[16px] p-8 shadow-sm transform transition-transform hover:-translate-y-1 hover:shadow-md border border-[#1A6B45]/10">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-bold text-[#1A6B45] font-['Plus_Jakarta_Sans'] mb-2">Smart Classification</h3>
            <p className="text-gray-700 font-['DM_Sans'] leading-relaxed">AI reads your photo and text to tag and categorize instantly, eliminating manual sorting and speeding up resolution.</p>
          </div>
          
          <div className="bg-[#E8F5EE] rounded-[16px] p-8 shadow-sm transform transition-transform hover:-translate-y-1 hover:shadow-md border border-[#1A6B45]/10">
            <div className="text-4xl mb-4">🔁</div>
            <h3 className="text-xl font-bold text-[#1A6B45] font-['Plus_Jakarta_Sans'] mb-2">Duplicate Detection</h3>
            <p className="text-gray-700 font-['DM_Sans'] leading-relaxed">Merges overlapping reports from different users so nothing gets double-counted, keeping the city's queue clean.</p>
          </div>
          
          <div className="bg-[#E8F5EE] rounded-[16px] p-8 shadow-sm transform transition-transform hover:-translate-y-1 hover:shadow-md border border-[#1A6B45]/10">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-xl font-bold text-[#1A6B45] font-['Plus_Jakarta_Sans'] mb-2">Priority Scoring</h3>
            <p className="text-gray-700 font-['DM_Sans'] leading-relaxed">Critical locations like hospital roads and school zones get automatically bumped to the top of the queue.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
