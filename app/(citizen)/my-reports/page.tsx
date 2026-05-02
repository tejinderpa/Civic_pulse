'use client';

import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MOCK_ISSUES } from '@/lib/mock-data';
import dynamic from 'next/dynamic';

const CommunityMap = dynamic(() => import('@/components/CommunityMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-surface-container-low animate-pulse rounded-[32px]" />
});

export default function MyReportsPage() {
  const supabase = createClient();
  const [issues, setIssues] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'map'>('card');
  const [copied, setCopied] = useState(false);
  const [userCenter, setUserCenter] = useState<[number, number] | undefined>(undefined);

  useEffect(() => {
    async function fetchReports() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Geocode User Location
      if (user?.user_metadata?.location) {
        try {
          const gRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(user.user_metadata.location)}&limit=1`);
          const gData = await gRes.json();
          if (gData && gData[0]) setUserCenter([parseFloat(gData[0].lat), parseFloat(gData[0].lon)]);
        } catch (e) { console.warn('Geocoding failed'); }
      }

      // 2. Fetch Data
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) console.error('Fetch error:', error);
      setIssues(data || []);
      setIsLoading(false);
    }
    fetchReports();
  }, [supabase]);

  useEffect(() => {
    if (copied) setTimeout(() => setCopied(false), 2000);
  }, [copied]);

  const displayIssues = issues;
  const totalReports = displayIssues?.length || 0;
  const pendingReports = displayIssues?.filter(i => (i.status || '').toLowerCase() === 'pending').length || 0;
  const inProgressReports = displayIssues?.filter(i => (i.status || '').toLowerCase() === 'in progress').length || 0;
  const resolvedReports = displayIssues?.filter(i => (i.status || '').toLowerCase() === 'resolved').length || 0;

  return (
    <div className="p-8 max-w-6xl mx-auto w-full pb-32">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0D2D1C] font-headline tracking-tighter">My Reports</h1>
          <p className="text-on-surface-variant mt-2 max-w-md font-body">Track your contributions and watch your neighborhood evolve.</p>
        </div>
        <div className="flex items-center bg-surface-container-high p-1.5 rounded-2xl shrink-0">
          <button onClick={() => setViewMode('card')} className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${viewMode === 'card' ? 'bg-white text-[#0D2D1C] font-bold shadow-lg' : 'text-on-surface-variant font-semibold hover:text-[#0D2D1C]'}`}><span className="material-symbols-outlined text-[18px]">list_alt</span> History</button>
          <button onClick={() => setViewMode('map')} className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${viewMode === 'map' ? 'bg-white text-[#0D2D1C] font-bold shadow-lg' : 'text-on-surface-variant font-semibold hover:text-[#0D2D1C]'}`}><span className="material-symbols-outlined text-[18px]">map</span> Map View</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard label="Total Reports" value={totalReports} icon="inventory" color="border-primary" />
        <StatCard label="Pending" value={pendingReports} icon="hourglass_empty" color="border-outline" />
        <StatCard label="In Progress" value={inProgressReports} icon="engineering" color="border-blue-500" />
        <StatCard label="Resolved" value={resolvedReports} icon="task_alt" color="border-emerald-600" />
      </div>

      {viewMode === 'card' ? (
        <div className="space-y-6">
          {!displayIssues || displayIssues.length === 0 ? (
            <div className="text-center py-20 bg-[#F8FAF9] rounded-[32px] border border-dashed border-outline-variant/30">
               <span className="material-symbols-outlined text-outline/20 text-6xl mb-4">move_to_inbox</span>
               <h3 className="text-lg font-bold text-[#0D2D1C]">Nothing reported yet</h3>
            </div>
          ) : (
            displayIssues.map((issue) => (
              <IssueRow key={issue.id} issue={issue} onClick={() => setSelectedIssue(issue)} />
            ))
          )}
        </div>
      ) : (
        <div className="w-full h-[600px] mb-20">
           <CommunityMap items={displayIssues} onItemClick={setSelectedIssue} center={userCenter} />
        </div>
      )}

      {selectedIssue && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedIssue(null)} />
          <div className="relative w-full max-w-5xl bg-white rounded-[32px] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
            <button onClick={() => setSelectedIssue(null)} className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-on-surface-variant shadow-lg"><span className="material-symbols-outlined">close</span></button>
            <div className="relative w-full md:w-1/2 h-[300px] md:h-auto bg-[#F8FAF9]">
              {(selectedIssue.image_url || selectedIssue.imageUrl) ? <Image src={selectedIssue.image_url || selectedIssue.imageUrl} alt="Case Proof" fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-outline/20"><span className="material-symbols-outlined text-8xl">image</span></div>}
            </div>
            <div className="flex-1 p-8 md:p-12 overflow-y-auto">
              <div className="flex items-center gap-2 mb-6">
                 <span className="bg-[#E9F3EB] text-[#005131] text-[10px] font-black px-3 py-1 rounded-full uppercase">{selectedIssue.category || 'Issue'}</span>
                 <span className="bg-surface-container-high text-on-surface text-[10px] font-black px-3 py-1 rounded-full uppercase">{selectedIssue.status || 'Draft'}</span>
              </div>
              <h2 className="text-3xl font-black text-[#0D2D1C] font-headline mb-4">{selectedIssue.title || selectedIssue.description}</h2>
              <div className="mb-8 p-6 bg-[#F8FAF9] rounded-2xl border border-outline-variant/10 font-body italic text-base">"{selectedIssue.description || "The community has flagged this concern for civil review."}"</div>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="flex flex-col gap-1"><span className="text-[10px] font-black text-outline uppercase tracking-widest">Location</span><span className="font-bold text-[#0D2D1C] truncate">{selectedIssue.location}</span></div>
                <div className="flex flex-col gap-1"><span className="text-[10px] font-black text-outline uppercase tracking-widest">Submitted</span><span className="font-bold text-[#0D2D1C]">{new Date(selectedIssue.created_at).toLocaleDateString()}</span></div>
              </div>
              <button onClick={() => {}} className="w-full h-16 bg-[#0D2D1C] text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-[#0D2D1C]/20">Share Progress</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className={`bg-white rounded-[24px] p-6 border-l-4 ${color} shadow-xl shadow-on-surface/[0.02] hover:shadow-2xl transition-all group overflow-hidden relative`}>
      <p className="text-[10px] font-black uppercase text-outline tracking-[0.1em] font-label">{label}</p>
      <div className="flex items-end justify-between mt-2">
        <span className="text-4xl font-black text-[#0D2D1C] font-headline leading-none">{value}</span>
        <div className="w-10 h-10 rounded-full bg-[#F8FAF9] flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-[20px]">{icon}</span></div>
      </div>
    </div>
  );
}

function IssueRow({ issue, onClick }: { issue: any; onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-white rounded-[28px] p-6 flex gap-6 shadow-xl shadow-on-surface/[0.02] hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer border border-outline-variant/10">
       <div className="w-24 h-24 rounded-2xl bg-[#F8FAF9] flex-shrink-0 relative overflow-hidden flex items-center justify-center text-outline">
         {(issue.image_url || issue.imageUrl) ? <Image src={issue.image_url || issue.imageUrl} alt="Proof" fill className="object-cover" /> : <span className="material-symbols-outlined text-3xl">image</span>}
       </div>
       <div className="flex-1 flex flex-col justify-between">
          <div>
            <span className="bg-[#E9F3EB] text-[#005131] text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border border-primary/10">{issue.category || 'Issue'}</span>
            <h4 className="text-lg font-extrabold text-[#0D2D1C] mt-1 line-clamp-1">{issue.title || issue.description}</h4>
            <p className="text-xs text-outline flex items-center gap-1 mt-1 truncate opacity-60"><span className="material-symbols-outlined text-[14px]">location_on</span> {issue.location}</p>
          </div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#1A6B45]" /><span className="text-[11px] font-black text-[#1A6B45] uppercase tracking-widest">{issue.status || 'Pending'}</span></div>
       </div>
    </div>
  );
}
