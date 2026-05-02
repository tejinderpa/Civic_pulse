import React from 'react';

type StatusPillProps = {
  status: 'Pending' | 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved' | 'Rejected' | string;
  className?: string;
};

export const StatusPill: React.FC<StatusPillProps> = ({ status, className = '' }) => {
  let colors = '';
  switch (status) {
    case 'Pending':
    case 'Submitted':
      colors = 'bg-gray-100 text-gray-600 border border-gray-200';
      break;
    case 'Under Review':
      colors = 'bg-[#FFF3E0] text-[#F4A623] border border-[#F4A623]/30';
      break;
    case 'In Progress':
      colors = 'bg-blue-100 text-blue-600 border border-blue-200';
      break;
    case 'Resolved':
      colors = 'bg-[#E8F5EE] text-[#1A6B45] border border-[#1A6B45]/30';
      break;
    case 'Rejected':
      colors = 'bg-red-100 text-red-600 border border-red-200';
      break;
    default:
      colors = 'bg-gray-100 text-gray-600 border border-gray-200';
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${colors} ${className}`}>
      {status}
    </span>
  );
};
