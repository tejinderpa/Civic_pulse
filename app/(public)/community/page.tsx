'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from '../../../components/landing/Navbar';
import { Footer } from '../../../components/landing/Footer';
import { IssueCard } from '../../../components/ui/IssueCard';
import { FilterSidebar } from '../../../components/features/FilterSidebar';
import MapComponent from '../../../components/MapComponent';
import { FilterBottomSheet } from '../../../components/features/FilterBottomSheet';
import { createClient } from '../../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import { MOCK_ISSUES } from '../../../lib/mock-data';


export default function CommunityPage() {
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  // Filters
  const [category, setCategory] = useState<any>('All');
  const [status, setStatus] = useState<any>('All');
  const [sort, setSort] = useState<any>('Most Recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([31.3260, 75.5760]);
  const [mapZoom, setMapZoom] = useState(13);

  const supabase = createClient();
  const observer = useRef<IntersectionObserver | null>(null);
  const router = useRouter();

  const fetchIssues = useCallback(async (isNewSearch = false) => {
    setLoading(true);
    const currentPage = isNewSearch ? 0 : page;
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('issues')
      .select(`
        *,
        users (
          full_name,
          is_public
        )
      `)
      .range(from, to);

    // Initial Filter (Server-side range, but simple filters can be added)
    // For more complex client-side filter logic per spec:
    if (category !== 'All') query = query.eq('category', category);
    if (status !== 'All') query = query.eq('status', status);

    // Sort logic
    if (sort === 'Most Voted') query = query.order('upvotes', { ascending: false });
    else if (sort === 'Critical First') query = query.order('severity', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching issues:', error);
    } else {
      const formattedData = data.map(issue => ({
        ...issue,
        reporter_name: issue.users?.is_public ? issue.users.full_name : 'Anonymous',
        timeAgo: new Date(issue.created_at).toLocaleDateString(),
      }));

      if (isNewSearch) {
        setIssues(formattedData.length > 0 ? formattedData : MOCK_ISSUES);
      } else {
        setIssues(prev => [...prev, ...formattedData]);
      }

      setHasMore(data.length === PAGE_SIZE);
      if (!isNewSearch) setPage(prev => prev + 1);
    }
    setLoading(false);
  }, [page, category, status, sort, supabase]);

  useEffect(() => {
    // Reset and fetch when filters change
    setPage(0);
    fetchIssues(true);
  }, [category, status, sort]);

  const lastIssueRef = useCallback((node: any) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchIssues();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, fetchIssues]);

  const handleVote = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push(`/login?redirect=/community`);
      return;
    }

    // Call vote API
    const res = await fetch(`/api/issues/${id}/vote`, { method: 'POST' });
    if (res.ok) {
       // Optimistic update or refetch
       setIssues(prev => prev.map(issue => 
         issue.id === id ? { ...issue, upvotes: issue.upvotes + 1 } : issue
       ));
    }
  };

  const handleLocationSelect = (lat: number, lon: number, address: string) => {
    setMapCenter([lat, lon]);
    setMapZoom(15);
    setSearchQuery(address);
    setView('map');
  };

  const filteredIssues = issues.filter(issue => 
    (issue.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (issue.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (issue.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F9FAF8] font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* LEFT PANEL - Desktop Sidebar */}
          <div className="hidden lg:block w-[28%]">
            <FilterSidebar 
              category={category} setCategory={setCategory}
              status={status} setStatus={setStatus}
              sort={sort} setSort={setSort}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            />
          </div>

          {/* RIGHT PANEL - Content Area */}
          <div className="lg:w-[72%] flex-1">
            
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-display font-extrabold text-[#1A6B45]">
                  {loading && issues.length === 0 ? 'Searching...' : `${filteredIssues.length} issues found`}
                </h3>
                <p className="text-gray-500 text-sm">Priority updates from your community.</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Mobile Filter Trigger */}
                <button 
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-[#1A6B45]"
                >
                  <span>🔍</span> Filters
                </button>

                <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm flex-1 sm:flex-none">
                  <button 
                    onClick={() => setView('grid')}
                    className={`flex-1 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'grid' ? 'bg-[#1A6B45] text-white' : 'text-gray-500 hover:text-[#1A6B45]'}`}
                  >
                    Grid View
                  </button>
                  <button 
                    onClick={() => setView('map')}
                    className={`flex-1 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'map' ? 'bg-[#1A6B45] text-white' : 'text-gray-500 hover:text-[#1A6B45]'}`}
                  >
                    Map View
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content View */}
            {view === 'grid' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                  {filteredIssues.map((issue, index) => (
                    <div key={issue.id} ref={index === filteredIssues.length - 1 ? lastIssueRef : null}>
                      <IssueCard 
                        {...issue} 
                        imageUrl={issue.image_url} 
                        timeAgo={issue.timeAgo}
                        onVote={handleVote}
                      />
                    </div>
                  ))}
                </div>

                {loading && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-[400px] bg-gray-100 animate-pulse rounded-[24px]"></div>)}
                  </div>
                )}

                {!loading && filteredIssues.length === 0 && (
                  <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
                    <div className="text-6xl mb-6">🔍</div>
                    <h3 className="text-2xl font-display font-extrabold text-[#1A6B45] mb-2">No issues found</h3>
                    <p className="text-gray-500 mb-8 max-w-xs mx-auto">Be the first to report something in this category!</p>
                    <button 
                      onClick={() => router.push('/report')}
                      className="px-8 py-4 bg-[#1A6B45] text-white font-bold rounded-2xl shadow-lg shadow-[#1A6B45]/20 hover:-translate-y-1 transition-transform"
                    >
                      Report an Issue
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="h-[calc(100vh-20rem)] min-h-[500px]">
                <MapComponent 
                  items={filteredIssues} 
                  center={mapCenter} 
                  zoom={mapZoom}
                  onItemClick={(item) => router.push(`/issues/${item.id}`)}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filters Component */}
      <FilterBottomSheet isOpen={isMobileFiltersOpen} onClose={() => setIsMobileFiltersOpen(false)}>
        <FilterSidebar 
          category={category} setCategory={setCategory}
          status={status} setStatus={setStatus}
          sort={sort} setSort={setSort}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        />
      </FilterBottomSheet>

      <Footer />
    </div>
  );
}
