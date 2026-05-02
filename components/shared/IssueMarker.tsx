'use client';

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Issue } from '@/types/issue';
import Image from 'next/image';
import Link from 'next/link';

interface IssueMarkerProps {
  issue: Issue;
  role: 'citizen' | 'admin';
  onVote?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onDepartmentChange?: (id: string, dept: string) => void;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'Critical': return '#ba1a1a';
    case 'High': return '#f4a623';
    case 'Medium': return '#ffd43b';
    case 'Low': return '#1a6b45';
    default: return '#005131';
  }
};

const createCustomIcon = (severity: string) => {
  const color = getSeverityColor(severity);
  return L.divIcon({
    className: 'custom-issue-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
};

export default function IssueMarker({ 
  issue, 
  role, 
  onVote, 
  onStatusChange, 
  onDepartmentChange 
}: IssueMarkerProps) {
  if (!issue.lat || !issue.lng) return null;

  return (
    <Marker position={[issue.lat, issue.lng]} icon={createCustomIcon(issue.severity)}>
      <Popup className="premium-popup">
        <div className="w-[280px] p-0 font-[var(--font-manrope)]">
          {role === 'citizen' ? (
            <div className="flex flex-col gap-3">
              {issue.image_url && (
                <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-100">
                  <Image src={issue.image_url} alt={issue.title} fill className="object-cover" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                     {issue.category}
                   </span>
                   <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md" style={{ backgroundColor: `${getSeverityColor(issue.severity)}20`, color: getSeverityColor(issue.severity) }}>
                     {issue.severity}
                   </span>
                </div>
                <h4 className="font-extrabold text-[#0D2D1C] text-sm leading-tight truncate">{issue.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{issue.description}</p>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button 
                  onClick={() => onVote?.(issue.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg hover:border-[#0D2D1C] transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">expand_less</span>
                  <span className="font-bold text-[11px]">{issue.votes_count || 0} Upvotes</span>
                </button>
                <Link href={`/issues/${issue.id}`} className="text-sm font-bold text-[#0D2D1C] hover:underline">
                  Details
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                 <h4 className="font-black text-[#0D2D1C] text-sm truncate max-w-[180px]">{issue.title}</h4>
                 <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getSeverityColor(issue.severity) }}></span>
                    <span className="text-[9px] font-bold opacity-60 uppercase">{issue.severity}</span>
                 </div>
              </div>

              <div className="space-y-3">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Status</p>
                    <select 
                      defaultValue={issue.status}
                      onChange={(e) => onStatusChange?.(issue.id, e.target.value)}
                      className="w-full h-8 text-xs font-bold border border-slate-200 rounded-lg bg-slate-50 px-2 outline-none focus:border-[#0D2D1C]"
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Under Review">Under Review</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                 </div>

                 <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Assign Department</p>
                    <select 
                      defaultValue={issue.department || ''}
                      onChange={(e) => onDepartmentChange?.(issue.id, e.target.value)}
                      className="w-full h-8 text-xs font-bold border border-slate-200 rounded-lg bg-slate-50 px-2 outline-none focus:border-[#0D2D1C]"
                    >
                      <option value="">Unassigned</option>
                      <option value="Public Works">Public Works</option>
                      <option value="Water Supply">Water Supply</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Roads">Roads</option>
                      <option value="Waste Management">Waste Management</option>
                    </select>
                 </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 text-red-600 border border-red-100 animate-pulse">
                   <span className="material-symbols-outlined text-[14px]">timer</span>
                   <span className="text-[9px] font-black uppercase">24h SLA</span>
                </div>
                <Link href={`/admin/issues/${issue.id}`} className="px-3 py-1.5 signature-gradient text-white text-[10px] font-black uppercase rounded-lg shadow-md">
                   Full View
                </Link>
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
