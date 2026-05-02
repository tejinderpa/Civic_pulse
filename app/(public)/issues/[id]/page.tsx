'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import IssueTimeline from '@/components/features/IssueTimeline';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function IssueDetailsPage({ params }: { params: { id: string } }) {
  const [issue, setIssue] = useState<any>(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Issue Details
        const issueRes = await fetch(`/api/issues/${params.id}`);
        const issueData = await issueRes.json();
        setIssue(issueData);

        // Fetch Timeline
        const timelineRes = await fetch(`/api/issues/${params.id}/timeline`);
        const timelineData = await timelineRes.json();
        setTimeline(timelineData);
      } catch (error) {
        console.error("Error fetching issue details:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id]);

  if (loading) return (
    <div className="min-h-screen bg-[#F9FAF8] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#0D2D1C]/10 border-t-[#0D2D1C] rounded-full animate-spin" />
        <p className="text-[#0D2D1C] font-bold uppercase tracking-widest text-xs">Loading Live Intel...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9FAF8]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* LEFT: Issue Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 md:p-12 rounded-[48px] border border-gray-100 shadow-xl overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full" />
               
               <div className="flex items-center gap-3 mb-6">
                  <span className="px-4 py-1.5 bg-[#0D2D1C] text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                     {issue?.category || 'General'}
                  </span>
                  <span className={`px-4 py-1.5 border font-black text-[10px] uppercase tracking-widest rounded-full ${issue?.status === 'Resolved' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-amber-400 text-amber-600 bg-amber-50'}`}>
                     {issue?.status || 'Pending'}
                  </span>
               </div>

               <h1 className="text-3xl md:text-5xl font-black text-[#0D2D1C] mb-6 tracking-tight leading-tight">
                  {issue?.title || 'Community Signal Detected'}
               </h1>
               
               <p className="text-gray-600 text-lg leading-relaxed mb-10 max-w-3xl">
                  {issue?.description || 'No detailed description provided for this incident.'}
               </p>

               <div className="h-[400px] w-full rounded-[32px] overflow-hidden border border-gray-100 shadow-inner group">
                  <MapComponent 
                    items={issue ? [issue] : []} 
                    center={[issue?.latitude || 31.3260, issue?.longitude || 75.5760]} 
                    zoom={16} 
                  />
               </div>
            </div>
          </div>

          {/* RIGHT: Timeline */}
          <div className="space-y-8">
            <div className="bg-[#F3F5F2] p-8 rounded-[40px] border border-white shadow-lg">
               <div className="flex items-center gap-4 mb-10">
                  <div className="w-10 h-10 rounded-2xl bg-[#0D2D1C] flex items-center justify-center text-white">
                     <span className="material-symbols-outlined">history</span>
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-[#0D2D1C] leading-none">Issue Timeline</h3>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Audit Trail & Progress</p>
                  </div>
               </div>

               <IssueTimeline events={timeline} />
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
