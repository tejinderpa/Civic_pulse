import React from 'react';

export const FilterBottomSheet: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] md:hidden">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" onClick={onClose} />
        {children}
        <button 
          onClick={onClose}
          className="w-full mt-8 py-4 bg-[#1A6B45] text-white font-bold rounded-2xl shadow-lg shadow-[#1A6B45]/20"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};
