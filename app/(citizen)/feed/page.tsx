'use client';

import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MOCK_ISSUES } from '@/lib/mock-data';
import dynamic from 'next/dynamic';

const CommunityMap = dynamic(() => import('@/components/CommunityMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-[600px] bg-surface-container-low animate-pulse rounded-[32px]" />
});

export default function CommunityFeedPage() {
  const supabase = createClient();
  const [issues, setIssues] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'map'>('card');
  const [isVoting, setIsVoting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userCenter, setUserCenter] = useState<[number, number] | undefined>(undefined);

  useEffect(() => {
    async function initFeed() {
      // 1. Fetch User Profile Location
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.location) {
        try {
          // Geocode the residency string
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(user.user_metadata.location)}&limit=1`);
          const data = await res.json();
          if (data && data[0]) {
            setUserCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
          }
        } catch (e) { console.warn('Geocoding failed, using GPS/Default'); }
      }

      // 2. Fetch Issues
      const { data } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      setIssues(data && data.length > 0 ? data : MOCK_ISSUES);
      setIsLoading(false);
    }
    initFeed();
  }, [supabase]);


  useEffect(() => {
    if (copied) {
      setTimeout(() => setCopied(false), 2000);
    }
  }, [copied]);

  const displayIssues = issues;

  async function handleShare(issue: any) {
    const shareData = {
      title: issue.title || issue.description,
      text: `Urgent! ${issue.category} issue at ${issue.location}. Help us get this resolved on CivicPulse!`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text} Check it out here: ${shareData.url}`);
      setCopied(true);
    }
  }

  async function handleVote(id: string) {
    if (String(id).startsWith('mock-')) {
      setIssues(prev => prev.map(issue => 
        issue.id === id ? { ...issue, upvotes: (issue.upvotes || 0) + 1 } : issue
      ));
      if (selectedIssue?.id === id) {
        setSelectedIssue((prev: any) => ({ ...prev, upvotes: (prev.upvotes || 0) + 1 }));
      }
      return;
    }

    setIsVoting(true);
    try {
      // For now, let's just simulate or add a simple upvote logic if possible
      // In a real prod app, you'd have an API route or direct Supabase increment
      setIssues(prev => prev.map(issue => 
        issue.id === id ? { ...issue, upvotes: (issue.upvotes || 0) + 1 } : issue
      ));
    } catch (err) {
      console.error('Vote failed:', err);
    } finally {
      setIsVoting(false);
    }
  }

  return (
    <div className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0D2D1C] font-headline tracking-tighter">Community Feed</h1>
          <p className="text-on-surface-variant max-w-lg font-body mt-2">
            Real-time updates from your neighborhood. Track progress, upvote urgent needs, and join the conversation.
          </p>
        </div>
        <div className="flex items-center bg-surface-container-high p-1.5 rounded-2xl shrink-0">
          <button 
            onClick={() => setViewMode('card')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${viewMode === 'card' ? 'bg-white text-[#0D2D1C] font-bold shadow-lg' : 'text-on-surface-variant font-semibold hover:text-[#0D2D1C]'}`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: viewMode === 'card' ? "'FILL' 1" : ""}}>grid_view</span>
            Gallery
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${viewMode === 'map' ? 'bg-white text-[#0D2D1C] font-bold shadow-lg' : 'text-on-surface-variant font-semibold hover:text-[#0D2D1C]'}`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: viewMode === 'map' ? "'FILL' 1" : ""}}>map</span>
            Map View
          </button>
        </div>
      </div>

      {viewMode === 'card' ? (
        <>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/15">
            <div className="flex gap-4">
              <span className="text-sm font-bold text-on-surface-variant flex items-center gap-2 font-label">
                Sort By:
                <select className="bg-transparent border-none text-primary font-bold focus:ring-0 cursor-pointer text-sm p-0">
                  <option>Most Recent</option>
                  <option>Most Voted</option>
                </select>
              </span>
            </div>
            <div className="text-sm text-on-surface-variant/60 font-medium font-body italic">
              Showing {displayIssues?.length || 0} active reports
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {(!displayIssues || displayIssues.length === 0) && !isLoading ? (
              <div className="col-span-full text-center py-20 bg-surface-container-low rounded-[24px]">
                <p className="text-on-surface-variant font-medium">No community reports found. Be the first to report an issue!</p>
              </div>
            ) : (
              displayIssues.map((issue) => (
                <div key={issue.id} onClick={() => setSelectedIssue(issue)} className="cursor-pointer h-full">
                  <FeedIssueCard issue={issue} onVote={handleVote} />
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="w-full h-[650px] mb-20">
           <CommunityMap items={displayIssues} onItemClick={setSelectedIssue} center={userCenter} onVote={handleVote} />
        </div>
      )}


      {selectedIssue && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedIssue(null)} />
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
            <button onClick={() => setSelectedIssue(null)} className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors shadow-lg"><span className="material-symbols-outlined">close</span></button>
            <div className="relative w-full md:w-1/2 h-[300px] md:h-auto shrink-0 bg-surface-variant">
              {(selectedIssue.image_url || selectedIssue.imageUrl) ? <Image src={selectedIssue.image_url || selectedIssue.imageUrl} alt={selectedIssue.title || selectedIssue.description} fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-outline/20"><span className="material-symbols-outlined text-8xl">image</span></div>}
            </div>
            <div className="flex-1 p-8 md:p-12 overflow-y-auto">
              <div className="flex items-center gap-2 mb-6">
                <span className="bg-primary-container text-on-primary-container text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">{selectedIssue.category || 'Issue'}</span>
                <span className="bg-surface-container-high text-on-surface text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">{selectedIssue.severity || 'Medium'}</span>
              </div>
              <h2 className="text-3xl font-black text-[#0D2D1C] font-headline mb-4 leading-tight">{selectedIssue.title || selectedIssue.description}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F8FAF9] flex items-center justify-center text-primary"><span className="material-symbols-outlined text-[24px]">location_on</span></div>
                  <div><p className="text-[10px] font-black uppercase text-outline tracking-tighter">Location</p><p className="text-base font-bold text-[#0D2D1C]">{selectedIssue.location || 'Reported Area'}</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F8FAF9] flex items-center justify-center text-primary"><span className="material-symbols-outlined text-[24px]">verified</span></div>
                  <div><p className="text-[10px] font-black uppercase text-outline tracking-tighter">Status</p><p className="text-base font-extrabold text-[#1A6B45] uppercase tracking-wider">{selectedIssue.status || 'Submitted'}</p></div>
                </div>
              </div>
              <div className="mb-10 p-6 bg-[#F8FAF9] rounded-2xl border border-outline-variant/10">
                <p className="text-[10px] font-black uppercase text-outline tracking-tighter mb-3">Case Insight</p>
                <p className="text-on-surface-variant/90 font-body text-base italic leading-relaxed">"{selectedIssue.description || "The community has flagged this concern for civil review."}"</p>
              </div>
              <div className="flex items-center gap-4 pt-6 border-t border-outline-variant/15">
                <button disabled={isVoting} onClick={() => handleVote(selectedIssue.id)} className="flex-1 h-14 bg-[#0D2D1C] text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-[#0D2D1C]/20 hover:scale-[1.02] active:scale-95 transition-all"><span className="material-symbols-outlined">expand_less</span>{selectedIssue.upvotes || 0} Votes • Support Need</button>
                <button onClick={() => handleShare(selectedIssue)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${copied ? 'bg-success-container text-success' : 'bg-surface-container-high text-on-surface-variant'}`}><span className="material-symbols-outlined">{copied ? 'check' : 'share'}</span></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedIssueCard({ issue, onVote }: { issue: any; onVote: (id: string) => void }) {
  const categoryStyle = { bg: 'bg-[#F8FAF9] text-[#0D2D1C]', dot: 'bg-primary' };
  return (
    <div className="bg-white rounded-[32px] overflow-hidden group shadow-xl shadow-on-surface/[0.03] hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 flex flex-col h-full border border-outline-variant/15">
      <div className="relative h-[240px] overflow-hidden shrink-0 bg-surface-variant">
        {(issue.image_url || issue.imageUrl) ? <Image src={issue.image_url || issue.imageUrl} alt="Civic Issue" fill className="object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-outline/20"><span className="material-symbols-outlined text-4xl">image</span></div>}
        <div className="absolute top-4 left-4"><span className={`${categoryStyle.bg} text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-outline-variant/10 shadow-sm`}><span className={`w-1.5 h-1.5 rounded-full ${categoryStyle.dot}`} />{issue.category || 'Issue'}</span></div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-extrabold text-[#0D2D1C] leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">{issue.title || issue.description}</h3>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-outline text-[11px] font-bold">
            <span className="material-symbols-outlined text-sm">location_on</span>
            {issue.location || 'Unknown Area'}
          </div>
          <span className="text-[10px] text-outline font-black opacity-40 whitespace-nowrap">
            {new Date(issue.created_at || Date.now()).toLocaleDateString()}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="bg-[#F8FAF9] text-[#1A6B45] text-[10px] font-black uppercase px-3 py-1 rounded-lg border border-outline-variant/5">{issue.status || 'Active'}</span>
          <button onClick={(e) => { e.stopPropagation(); onVote(issue.id); }} className="flex items-center gap-2 bg-[#F8FAF9] hover:bg-[#0D2D1C] hover:text-white px-4 py-2 rounded-xl transition-all font-bold text-[#0D2D1C] border border-outline-variant/10"><span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span> {issue.upvotes || 0}</button>
        </div>
      </div>
    </div>
  );
}
