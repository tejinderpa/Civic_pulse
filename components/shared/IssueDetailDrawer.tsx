import React, { useState } from 'react';
import { Issue, IssueStatus } from '@/types/issue';
import { StatusPill } from '@/components/ui/StatusPill';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

const STATUS_ORDER = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];

type IssueDetailDrawerProps = {
  issue: Issue | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
};

export const IssueDetailDrawer: React.FC<IssueDetailDrawerProps> = ({ issue, isOpen, onClose, onUpdate }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newDepartment, setNewDepartment] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const supabase = createClient();

  React.useEffect(() => {
    if (issue) {
      setNewStatus(issue.status);
      setNewDepartment(issue.department || '');
      setNote('');
    }
  }, [issue]);

  if (!issue) return null;

  const currentStatusIndex = STATUS_ORDER.indexOf(issue.status);
  
  const getAvailableStatuses = () => {
    if (issue.status === 'Rejected' || issue.status === 'Resolved') return [issue.status];
    
    // Can only move to the next status, or reject
    const nextStatusIndex = currentStatusIndex + 1;
    const available = [issue.status];
    if (nextStatusIndex < STATUS_ORDER.length) {
      available.push(STATUS_ORDER[nextStatusIndex]);
    }
    available.push('Rejected');
    return available;
  };

  const handleSave = async () => {
    if (newStatus === 'Rejected' && !note.trim()) {
      alert("You must provide a note when rejecting an issue.");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: newStatus,
          department: newDepartment || null,
        })
        .eq('id', issue.id);

      if (error) throw error;
      
      // Ideally we would save the note here to an issue_notes table
      // But keeping it simple for the direct requirement context

      onUpdate();
      onClose();
    } catch (err: any) {
      alert("Error updating issue: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 transition-opacity backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div 
        className={`fixed right-0 h-full bg-white shadow-2xl transform transition-transform duration-300 z-50 flex flex-col
          md:w-[450px] md:top-0 md:h-full 
          w-full bottom-0 top-auto rounded-t-3xl md:rounded-none
          ${isOpen ? 'translate-y-0 md:translate-x-0 md:translate-y-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}
        `}
        style={{ height: 'max(85vh, auto)' }}
      >
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50 md:bg-gray-50 bg-white rounded-t-3xl md:rounded-none relative">
          {/* Mobile Drag Handle */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full md:hidden" />
          
          <div className="mt-2 md:mt-0">
            <div className="flex gap-2 items-center mb-2">
              <Badge>{issue.category}</Badge>
              <StatusPill status={issue.status} />
            </div>
            <h2 className="text-xl font-black text-gray-900 leading-tight">{issue.title}</h2>
            <p className="text-gray-400 text-xs mt-1 font-mono uppercase">ID: {issue.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 bg-white p-2 rounded-full shadow-sm">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Image */}
          {issue.image_url ? (
            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <Image src={issue.image_url} alt="Issue" fill className="object-cover" />
            </div>
          ) : (
            <div className="w-full h-32 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
              <span className="material-symbols-outlined mr-2">image_not_supported</span>
              <span className="text-sm font-medium">No image provided</span>
            </div>
          )}

          {/* Details */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Description</p>
              <p className="text-gray-700 text-sm leading-relaxed">{issue.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Location</p>
                <div className="flex items-start text-sm text-gray-700 font-medium">
                  <span className="material-symbols-outlined text-red-500 text-base mr-1">location_on</span>
                  <span className="line-clamp-2">{issue.location}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">AI Severity</p>
                <Badge color={issue.severity === 'Critical' ? '#EF4444' : issue.severity === 'High' ? '#F97316' : '#EAB308'}>
                  {issue.severity || 'Medium'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Update Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                disabled={issue.status === 'Resolved' || issue.status === 'Rejected'}
              >
                {getAvailableStatuses().map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Assign Department
              </label>
              <select
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Unassigned</option>
                <option value="PWD">PWD (Public Works)</option>
                <option value="Municipal">Municipal Corp</option>
                <option value="Electricity">Electricity Board</option>
                <option value="Water">Water Supply</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {newStatus === 'Rejected' && (
              <div>
                <label className="block text-xs text-red-600 font-bold uppercase tracking-wider mb-2">
                  Rejection Reason (Required)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-3 bg-white border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  rows={3}
                  placeholder="Why is this issue being rejected?"
                  required
                />
              </div>
            )}
          </div>
          
          {/* History/Duplicates */}
          <div className="space-y-6 pt-4 border-t border-gray-100">
            {/* Duplicates Section */}
            {issue.duplicate_of && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-start gap-2 text-orange-800">
                  <span className="material-symbols-outlined text-orange-500 mt-0.5">content_copy</span>
                  <div>
                    <h4 className="text-sm font-bold">Marked as Duplicate</h4>
                    <p className="text-xs mt-1 text-orange-700/80">
                      This issue was flagged by AI as a potential duplicate of <span className="font-mono font-bold bg-orange-100 px-1 rounded">{issue.duplicate_of.slice(0, 6)}</span>.
                    </p>
                    <button className="mt-3 text-xs font-bold bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors shadow-sm">
                      Review Original Issue
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Audit Timeline Timeline Placeholder */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400">history</span>
                Audit Timeline
              </h3>
              
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {/* Mock Timeline Item 1 */}
                <div className="relative">
                  <div className="absolute -left-[27px] bg-emerald-100 w-4 h-4 rounded-full border-4 border-white" />
                  <p className="text-xs text-gray-500 font-medium">Today at {new Date(issue.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  <p className="text-sm text-gray-900 mt-1">Issue <span className="font-bold text-emerald-600">Submitted</span> by System</p>
                </div>
                
                {/* Mock Timeline Item 2 */}
                {(issue.status !== 'Submitted') && (
                  <div className="relative">
                    <div className="absolute -left-[27px] bg-blue-100 w-4 h-4 rounded-full border-4 border-white" />
                    <p className="text-xs text-gray-500 font-medium">Recent Update</p>
                    <p className="text-sm text-gray-900 mt-1">Status changed to <span className="font-bold text-blue-600">{issue.status}</span></p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-4 bg-white">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isSaving ? (
              <span className="material-symbols-outlined animate-spin">autorenew</span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </>
  );
};
