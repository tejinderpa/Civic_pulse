'use client';

import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Issue } from '@/types/issue';
import Image from 'next/image';
import Link from 'next/link';
import { createStatusIcon, getStatusVisual } from '@/lib/maps/status-icons';
import { normalizeStatus } from '@/types/report';

interface IssueMarkerProps {
  issue: Issue & {
    latitude?: number | null;
    longitude?: number | null;
    lat?: number | null;
    lng?: number | null;
    upvotes?: number | null;
    votes_count?: number | null;
  };
  role: 'citizen' | 'admin';
  onVote?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onDepartmentChange?: (id: string, dept: string) => void;
  onClick?: (issue: Issue) => void;
}

export default function IssueMarker({
  issue,
  role,
  onVote,
  onStatusChange,
  onDepartmentChange,
  onClick,
}: IssueMarkerProps) {
  const lat =
    issue.latitude ?? issue.lat ?? (issue as { lat?: number | null }).lat;
  const lng =
    issue.longitude ?? issue.lng ?? (issue as { lng?: number | null }).lng;

  const icon = useMemo(
    () => createStatusIcon(issue.status, issue.severity),
    [issue.status, issue.severity]
  );

  if (lat == null || lng == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
    return null;
  }

  const visual = getStatusVisual(issue.status);
  const statusLabel = normalizeStatus(issue.status);
  const votes = issue.upvotes ?? issue.votes_count ?? 0;

  return (
    <Marker
      position={[Number(lat), Number(lng)]}
      icon={icon}
      eventHandlers={{
        click: () => onClick?.(issue),
      }}
    >
      <Popup className="premium-popup">
        <div className="w-[280px] p-0 font-sans">
          {role === 'citizen' ? (
            <div className="flex flex-col gap-3">
              {issue.image_url && (
                <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-100">
                  <Image src={issue.image_url} alt={issue.title || 'Issue'} fill className="object-cover" />
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {issue.category || 'Issue'}
                  </span>
                  <span
                    className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md text-white"
                    style={{ backgroundColor: visual.color }}
                  >
                    {visual.label}
                  </span>
                </div>
                <h4 className="font-extrabold text-primary text-sm leading-tight">
                  {issue.title || 'Untitled report'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {issue.description}
                </p>
                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">location_on</span>
                  {(issue as { location?: string }).location || issue.address || 'Reported area'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onVote?.(issue.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg hover:border-primary transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">expand_less</span>
                  <span className="font-bold text-[11px]">{votes} Upvotes</span>
                </button>
                <Link
                  href={`/issues/${issue.id}`}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  Details
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-black text-primary text-sm truncate max-w-[160px]">
                  {issue.title}
                </h4>
                <span
                  className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md text-white shrink-0"
                  style={{ backgroundColor: visual.color }}
                >
                  {visual.label}
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                    Status
                  </p>
                  <select
                    defaultValue={statusLabel}
                    onChange={(e) => onStatusChange?.(issue.id, e.target.value)}
                    className="w-full h-8 text-xs font-bold border border-slate-200 rounded-lg bg-slate-50 px-2 outline-none focus:border-primary"
                  >
                    <option value="Submitted">Submitted / Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                    Assign Department
                  </p>
                  <select
                    defaultValue={issue.department || ''}
                    onChange={(e) => onDepartmentChange?.(issue.id, e.target.value)}
                    className="w-full h-8 text-xs font-bold border border-slate-200 rounded-lg bg-slate-50 px-2 outline-none focus:border-primary"
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

              <div className="flex justify-end items-center pt-2 border-t border-slate-100">
                <Link
                  href={`/admin/issues`}
                  className="px-3 py-1.5 signature-gradient text-white text-[10px] font-black uppercase rounded-lg shadow-md"
                >
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
