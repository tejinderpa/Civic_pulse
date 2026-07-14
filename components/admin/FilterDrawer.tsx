'use client';

import React from 'react';

type FilterDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
};

export const FilterDrawer: React.FC<FilterDrawerProps> = ({ isOpen, onClose, onApply }) => {
  const [category, setCategory] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [severity, setSeverity] = React.useState('');
  const [department, setDepartment] = React.useState('');

  const handleApply = () => {
    onApply({ category, status, severity, department });
    onClose();
  };

  const handleReset = () => {
    setCategory('');
    setStatus('');
    setSeverity('');
    setDepartment('');
    onApply({});
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer / Bottom Sheet */}
      <div 
        className={`fixed bg-white shadow-2xl transform transition-transform duration-300 z-50 flex flex-col
          md:top-0 md:right-0 md:h-full md:w-80 md:rounded-none
          bottom-0 left-0 w-full h-[85vh] rounded-t-3xl
          ${isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}
        `}
      >
        <div className="relative p-5 md:p-6 border-b border-gray-100 flex justify-between items-center bg-white md:bg-gray-50 rounded-t-3xl md:rounded-none">
          {/* Mobile Handle */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full md:hidden" />
          
          <h2 className="text-xl font-bold text-gray-800 mt-2 md:mt-0">Advanced Filters</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 mt-2 md:mt-0">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wide text-gray-500">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              <option value="Road">Road</option>
              <option value="Garbage">Garbage</option>
              <option value="Water">Water</option>
              <option value="Electricity">Electricity</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wide text-gray-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wide text-gray-500">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wide text-gray-500">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Departments</option>
              <option value="PWD">PWD</option>
              <option value="Municipal">Municipal</option>
              <option value="Electricity">Electricity</option>
              <option value="Water">Water</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
          <button 
            onClick={handleReset}
            className="flex-1 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Reset
          </button>
          <button 
            onClick={handleApply}
            className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};
