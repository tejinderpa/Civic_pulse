'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import IssueTimeline from '@/components/features/IssueTimeline';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

type TimelineEvent = {
  id: string;
  action_type: string;
  old_value?: string | null;
  new_value?: string | null;
  user_name?: string | null;
  created_at: string;
};

export default function IssueProgressPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const issueId = params.id;
  const [issue, setIssue] = useState<Record<string, unknown> | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const progressUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/issues/${issueId}`
      : `/issues/${issueId}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const issueRes = await fetch(`/api/issues/${issueId}`);
      if (issueRes.status === 404) {
        setNotFound(true);
        setIssue(null);
        setTimeline([]);
        return;
      }
      if (!issueRes.ok) {
        throw new Error('Failed to load issue');
      }
      const issueData = await issueRes.json();
      if (issueData?.error || !issueData?.id) {
        setNotFound(true);
        setIssue(null);
        return;
      }
      setIssue(issueData);

      const timelineRes = await fetch(`/api/issues/${issueId}/timeline`);
      const timelineData = await timelineRes.json();
      setTimeline(Array.isArray(timelineData) ? timelineData : []);

      // Ownership for delete affordance
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setIsOwner(!!user && user.id === issueData.user_id);
      } catch {
        setIsOwner(false);
      }
    } catch (error) {
      console.error('Error fetching issue details:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const handleShare = async () => {
    setShareError(null);
    const title = (issue?.title as string) || 'CivicPulse issue progress';
    const text = `Track progress on: ${title}`;
    const url = progressUrl;

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch (err) {
      // User cancelled share — not an error
      if (err instanceof Error && err.name === 'AbortError') return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setShareError('Could not copy link. Copy it from the address bar.');
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    const ok = window.confirm(
      'Delete this report permanently? This cannot be undone.'
    );
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/issues/${issueId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to delete report');
        setDeleting(false);
        return;
      }
      router.push('/my-reports');
      router.refresh();
    } catch {
      alert('Network error while deleting.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAF8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#0D2D1C]/10 border-t-[#0D2D1C] rounded-full animate-spin" />
          <p className="text-[#0D2D1C] font-bold uppercase tracking-widest text-xs">
            Loading progress…
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !issue) {
    return (
      <div className="min-h-screen bg-[#F9FAF8]">
        <Navbar />
        <main className="max-w-lg mx-auto px-6 py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl text-outline">search_off</span>
          </div>
          <h1 className="text-2xl font-black text-[#0D2D1C] mb-2">Issue not found</h1>
          <p className="text-on-surface-variant mb-8">
            This report may have been deleted or the link is incorrect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/community"
              className="px-6 py-3 rounded-xl bg-[#0D2D1C] text-white font-bold"
            >
              Community map
            </Link>
            <Link
              href="/my-reports"
              className="px-6 py-3 rounded-xl border border-outline-variant font-bold text-[#0D2D1C]"
            >
              My reports
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const title = (issue.title as string) || 'Community report';
  const description = (issue.description as string) || 'No description provided.';
  const category = (issue.category as string) || 'General';
  const status = (issue.status as string) || 'Submitted';
  const location = (issue.location as string) || 'Location not set';
  const imageUrl = (issue.image_url as string) || null;
  const lat = typeof issue.latitude === 'number' ? issue.latitude : 31.326;
  const lng = typeof issue.longitude === 'number' ? issue.longitude : 75.576;
  const createdAt = issue.created_at
    ? new Date(issue.created_at as string).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const statusResolved = status.toLowerCase() === 'resolved';

  return (
    <div className="min-h-screen bg-[var(--surface,#F3F5F7)]">
      <Navbar />

      <main className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb / back */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Link href="/community" className="hover:text-primary font-semibold">
              Community
            </Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="font-bold text-[#0D2D1C] truncate max-w-[200px]">Progress</span>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-outline-variant/30 font-bold text-sm text-[#0D2D1C] hover:bg-surface-container-low transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">
                {copied ? 'check' : 'share'}
              </span>
              {copied ? 'Link copied' : 'Share progress'}
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 font-bold text-sm text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
        </div>

        {shareError && (
          <div className="mb-6 p-3 rounded-xl bg-amber-50 text-amber-800 text-sm font-medium border border-amber-100">
            {shareError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT: Issue Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 md:p-12 rounded-[40px] border border-gray-100 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full" />

              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="px-4 py-1.5 bg-[#0D2D1C] text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  {category}
                </span>
                <span
                  className={`px-4 py-1.5 border font-black text-[10px] uppercase tracking-widest rounded-full ${
                    statusResolved
                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                      : 'border-amber-400 text-amber-600 bg-amber-50'
                  }`}
                >
                  {status}
                </span>
                {createdAt && (
                  <span className="text-xs font-semibold text-outline">Filed {createdAt}</span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-[#0D2D1C] mb-4 tracking-tight leading-tight">
                {title}
              </h1>

              <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-6 max-w-3xl">
                {description}
              </p>

              <div className="flex items-start gap-2 text-sm text-on-surface-variant mb-8">
                <span className="material-symbols-outlined text-primary text-lg shrink-0">
                  location_on
                </span>
                <span className="font-medium">{location}</span>
              </div>

              {imageUrl && (
                <div className="relative w-full h-64 md:h-80 rounded-[28px] overflow-hidden border border-gray-100 mb-8 bg-[#F8FAF9]">
                  <Image
                    src={imageUrl}
                    alt="Report evidence"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 66vw"
                    unoptimized={imageUrl.includes('supabase')}
                  />
                </div>
              )}

              <div className="relative z-0 isolate h-[360px] w-full rounded-[28px] overflow-hidden border border-gray-100 shadow-inner">
                <MapComponent
                  items={[
                    {
                      id: issue.id as string,
                      title,
                      status,
                      latitude: lat,
                      longitude: lng,
                      category,
                    },
                  ]}
                  center={[lat, lng]}
                  zoom={16}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Timeline */}
          <div className="space-y-6">
            <div className="bg-[#F3F5F2] p-8 rounded-[36px] border border-white shadow-lg sticky top-[5.5rem] z-10 self-start">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-[#0D2D1C] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined">history</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0D2D1C] leading-none">Issue Timeline</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    Audit trail & progress
                  </p>
                </div>
              </div>

              <IssueTimeline events={timeline} />

              <div className="mt-8 pt-6 border-t border-gray-200/80 space-y-3">
                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                  Share this page so others can follow status updates for this civic report.
                </p>
                <code className="block text-[10px] bg-white/80 rounded-lg px-3 py-2 text-gray-500 break-all border border-gray-100">
                  {progressUrl}
                </code>
                <Link
                  href="/my-reports"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white border border-outline-variant/20 font-bold text-sm text-[#0D2D1C] hover:bg-white/80 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">assignment</span>
                  Back to my reports
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
