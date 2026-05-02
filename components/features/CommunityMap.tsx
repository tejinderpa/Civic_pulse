import React from 'react';

interface CommunityMapProps {
  issues: any[];
}

export const CommunityMap: React.FC<CommunityMapProps> = ({ issues }) => {
  return (
    <div className="relative w-full h-[calc(100vh-12rem)] min-h-[500px] bg-[#E8F5EE] rounded-3xl overflow-hidden border border-[#1A6B45]/10 shadow-inner">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-2xl font-display font-extrabold text-[#1A6B45] mb-2">Interactive Map View</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Visualizing {issues.length} active issues in your neighborhood. 
            Color-coded pins indicate severity and priority.
          </p>
          <div className="mt-8 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-xs font-bold text-gray-400 uppercase">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              <span className="text-xs font-bold text-gray-400 uppercase">High</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="text-xs font-bold text-gray-400 uppercase">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-xs font-bold text-gray-400 uppercase">Low</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mock pins for visual flair */}
      <div className="absolute top-1/4 left-1/3 animate-bounce">
         <Pin color="#EF4444" />
      </div>
      <div className="absolute top-1/2 left-2/3 animate-bounce [animation-delay:0.2s]">
         <Pin color="#F97316" />
      </div>
      <div className="absolute bottom-1/3 left-1/4 animate-bounce [animation-delay:0.4s]">
         <Pin color="#EAB308" />
      </div>
      <div className="absolute top-1/3 right-1/4 animate-bounce [animation-delay:0.6s]">
         <Pin color="#22C55E" />
      </div>
    </div>
  );
};

const Pin = ({ color }: { color: string }) => (
  <div className="relative">
    <div className="absolute -top-10 -left-5 bg-white p-2 rounded-lg shadow-xl border border-gray-100 whitespace-nowrap text-[10px] font-bold opacity-0 hover:opacity-100 transition-opacity z-10 pointer-events-none">
      View Report
    </div>
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill={color}/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  </div>
);
