'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useNearbyIssues } from '@/hooks/useMapLogic';
import { compressImageFile } from '@/lib/images/compress';
import {
  buildReportPriorityMeta,
  SEVERITY_BADGE_CLASS,
  type SeverityLevel,
} from '@/lib/reports/priority';
import { Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const MapWrapper = dynamic(() => import('@/components/shared/MapWrapper'), { ssr: false });
const IssueMarker = dynamic(() => import('@/components/shared/IssueMarker'), { ssr: false });

const SEVERITY_OPTIONS: { id: SeverityLevel; label: string; hint: string }[] = [
  { id: 'Low', label: 'Low', hint: 'Minor / routine' },
  { id: 'Medium', label: 'Medium', hint: 'Needs attention' },
  { id: 'High', label: 'High', hint: 'Safety risk' },
  { id: 'Critical', label: 'Critical', hint: 'Urgent hazard' },
];

const pinIcon = L.divIcon({
  className: 'custom-pin',
  html: `
    <div style="background-color: var(--primary); width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
      <span class="material-symbols-outlined" style="font-size: 16px;">location_on</span>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function ReportPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [reportData, setReportData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    severity: 'Medium' as SeverityLevel,
    imageUrl: '',
    imageFile: null as File | null,
  });

  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);

  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [duplicateStatus, setDuplicateStatus] = useState<'none' | 'suggest' | 'duplicate'>('none');
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [aiClassifying, setAiClassifying] = useState(false);
  const [aiMeta, setAiMeta] = useState<{
    severity: SeverityLevel;
    priority_score: number;
    department: string;
    category: string;
    rationale?: string;
    source?: string;
  } | null>(null);

  /** Live priority meta for review step — AI when available, else heuristic. */
  const heuristicMeta = useMemo(
    () =>
      buildReportPriorityMeta({
        title: reportData.title,
        description: reportData.description,
        category: reportData.category || 'Other',
        severity: reportData.severity,
      }),
    [reportData.title, reportData.description, reportData.category, reportData.severity]
  );

  const priorityMeta = aiMeta || heuristicMeta;

  const runAiClassify = async () => {
    setAiClassifying(true);
    try {
      const res = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reportData.title,
          description: reportData.description,
          category: reportData.category || 'Other',
          severity: reportData.severity,
          location: reportData.location,
        }),
      });
      if (!res.ok) throw new Error('classify failed');
      const data = await res.json();
      const sev = (data.severity || heuristicMeta.severity) as SeverityLevel;
      setAiMeta({
        severity: sev,
        priority_score: data.priority_score ?? heuristicMeta.priority_score,
        department: data.department || heuristicMeta.department,
        category: data.category || heuristicMeta.category,
        rationale: data.rationale,
        source: data.source,
      });
      setReportData((prev) => ({ ...prev, severity: sev }));
    } catch {
      setAiMeta(null);
    } finally {
      setAiClassifying(false);
    }
  };

  // Hook for nearby issues
  const { nearbyIssues } = useNearbyIssues(reportData.latitude, reportData.longitude, 500);
  
  useEffect(() => {
    const checkDuplicates = async () => {
      if (reportData.description.length < 20 || !reportData.latitude || !reportData.longitude) {
        setDuplicates([]);
        setDuplicateStatus('none');
        return;
      }
      setIsCheckingDuplicates(true);
      try {
        const res = await fetch('/api/ai/duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: reportData.description,
            lat: reportData.latitude,
            lng: reportData.longitude,
            category: reportData.category || null,
          }),
        });
        
        const data = await res.json();
        
        if (data.status !== 'none' && data.matches?.length > 0) {
          setDuplicates(data.matches);
          setDuplicateStatus(data.status);
        } else {
          setDuplicates([]);
          setDuplicateStatus('none');
        }
      } catch (err) {
        console.error('Duplicate check failed:', err);
      } finally {
        setIsCheckingDuplicates(false);
      }
    };

    const timer = setTimeout(() => {
      checkDuplicates();
    }, 800);

    return () => clearTimeout(timer);
  }, [reportData.description, reportData.latitude, reportData.longitude, reportData.category]);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, [supabase]);

  const handleLocationSearch = async (val: string) => {
    setReportData(prev => ({ ...prev, location: val }));
    if (val.length < 3) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`/api/maps/search?q=${encodeURIComponent(val)}`);
      const data = await res.json();
      setSearchSuggestions(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    setReportData(prev => ({ 
      ...prev, 
      location: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon)
    }));
    setSearchSuggestions([]);
  };

  const handleGetLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    setSearching(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      setReportData(prev => ({ ...prev, latitude, longitude }));
      try {
        const res = await fetch(`/api/maps/reverse?lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        if (data.display_name) setReportData(prev => ({ ...prev, location: data.display_name }));
      } catch (err) {
        setReportData(prev => ({ ...prev, location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }));
      } finally {
        setSearching(false);
      }
    }, () => {
        setSearching(false);
    }, { timeout: 8000 });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Auto-resize/compress large phone photos before preview + upload
    const compressed = await compressImageFile(file);
    setReportData((prev) => {
      if (prev.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.imageUrl);
      return {
        ...prev,
        imageFile: compressed,
        imageUrl: URL.createObjectURL(compressed),
      };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (!currentUser || userError) {
        alert('Your session has expired or you are not signed in. Please sign in again.');
        setLoading(false);
        return;
      }

      let finalImageUrl = '';

      // Upload image (already auto-compressed on pick)
      if (reportData.imageFile) {
        let uploadFile = reportData.imageFile;
        // Safety: compress again if somehow still huge
        if (uploadFile.size > 2 * 1024 * 1024) {
          uploadFile = await compressImageFile(uploadFile);
        }

        const fileName = `${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}.jpg`;
        const filePath = `reports/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('civicpulse-assets')
          .upload(filePath, uploadFile, { contentType: uploadFile.type || 'image/jpeg' });
          
        if (uploadError) {
          if (uploadError.message.includes('not found')) {
            console.warn('Storage bucket missing; continuing without image.');
          } else {
            throw uploadError;
          }
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('civicpulse-assets')
            .getPublicUrl(filePath);
          finalImageUrl = publicUrl;
        }
      }

      // Embedding is optional — never block the user if AI fails or dims mismatch
      let finalEmbedding: number[] | null = null;
      try {
        const res = await fetch('/api/ai/embed', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ text: `${reportData.category || 'unknown'} issue: ${reportData.description}` })
        });
        if (res.ok) {
           const data = await res.json();
           if (Array.isArray(data.embedding) && data.embedding.length === 768) {
             finalEmbedding = data.embedding;
           } else if (Array.isArray(data.embedding) && data.embedding.length > 0) {
             // Server should already fit to 768; ignore unexpected sizes
             console.warn('Skipping embedding: unexpected length', data.embedding.length);
           }
        }
      } catch (err) {
        console.error('Silent failure creating embeddings', err);
      }

      // Prefer server AI classify; fall back to local heuristic
      let severity = (aiMeta?.severity || heuristicMeta.severity) as SeverityLevel;
      let category = aiMeta?.category || heuristicMeta.category;
      let department = aiMeta?.department || heuristicMeta.department;
      let priority_score = aiMeta?.priority_score ?? heuristicMeta.priority_score;
      try {
        const classRes = await fetch('/api/ai/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: reportData.title,
            description: reportData.description,
            category: reportData.category || 'Other',
            severity: reportData.severity,
            location: reportData.location,
          }),
        });
        if (classRes.ok) {
          const data = await classRes.json();
          severity = (data.severity || severity) as SeverityLevel;
          priority_score = data.priority_score ?? priority_score;
          department = data.department || department;
          category = data.category || category;
        }
      } catch {
        /* keep meta */
      }

      const payload: Record<string, unknown> = {
        user_id: currentUser.id,
        title: reportData.title || (reportData.description || '').slice(0, 80) || 'Citizen report',
        description: reportData.description || '',
        category,
        location: reportData.location || null,
        image_url: finalImageUrl || null,
        status: 'Submitted',
        severity,
        priority_score,
        department,
        latitude: reportData.latitude,
        longitude: reportData.longitude,
      };

      if (finalEmbedding) {
        payload.embedding = finalEmbedding;
      }

      let { data: inserted, error: insertError } = await supabase
        .from('reports')
        .insert(payload)
        .select('id')
        .single();

      // If vector dim still fails, retry without embedding so the report goes through
      if (
        insertError &&
        finalEmbedding &&
        /dimension|embedding|vector/i.test(insertError.message)
      ) {
        console.warn('Embedding insert failed, retrying without embedding:', insertError.message);
        delete payload.embedding;
        ({ data: inserted, error: insertError } = await supabase
          .from('reports')
          .insert(payload)
          .select('id')
          .single());
      }

      if (insertError) throw insertError;

      // Warm shared cache so feed/admin open instantly with this report
      if (inserted?.id) {
        try {
          const { reportsCache } = await import('@/lib/cache/reports-cache');
          reportsCache.upsertOne({
            ...payload,
            id: inserted.id,
            created_at: new Date().toISOString(),
          });
        } catch {
          /* non-blocking */
        }
      }

      // Seed progress timeline (best-effort)
      if (inserted?.id) {
        try {
          const reporterName =
            (currentUser.user_metadata?.full_name as string) ||
            currentUser.email?.split('@')[0] ||
            'Citizen';
          await supabase.from('issue_history').insert({
            issue_id: inserted.id,
            action_type: 'submission',
            old_value: null,
            new_value: 'Submitted',
            user_name: reporterName,
            user_id: currentUser.id,
          });
        } catch (histErr) {
          console.warn('Timeline seed failed (report still saved):', histErr);
        }
        router.push(`/issues/${inserted.id}`);
        return;
      }

      router.push('/my-reports');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      alert(`Submission failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'Road', label: 'Roads & Potholes', icon: 'edit_road', color: 'bg-orange-50 text-orange-600 border-orange-100' },
    { id: 'Garbage', label: 'Waste & Sanitation', icon: 'delete_sweep', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { id: 'Water', label: 'Water & Sewage', icon: 'water_drop', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { id: 'Electricity', label: 'Power & Light', icon: 'bolt', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { id: 'Environment', label: 'Parks & Trees', icon: 'park', color: 'bg-green-50 text-green-600 border-green-100' },
    { id: 'Other', label: 'General Issue', icon: 'more_horiz', color: 'bg-slate-50 text-slate-600 border-slate-100' },
  ];

  return (
    <div className="min-h-full flex flex-col items-center pb-32 bg-transparent">
      {/* Progress Header */}
      <div className="w-full max-w-4xl px-8 pt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#0D2D1C] font-headline tracking-tighter">Submit Report</h1>
            <p className="text-on-surface-variant/70 font-body mt-2">Step {step}: {step === 1 ? 'Describe Issue' : step === 2 ? 'Location & Category' : 'Final Review'}</p>
          </div>
          <div className="flex items-center gap-2">
             {[1, 2, 3].map((s) => (
               <div key={s} className="flex items-center group">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${step >= s ? 'bg-primary text-white shadow-lg' : 'bg-surface-container-high text-outline'}`}>
                   {s < step ? <span className="material-symbols-outlined text-[18px]">check</span> : s}
                 </div>
                 {s < 3 && <div className={`w-8 md:w-16 h-0.5 mx-1 md:mx-3 rounded-full ${step > s ? 'bg-primary' : 'bg-surface-container-high'}`} />}
               </div>
             ))}
          </div>
        </div>

        {/* Dynamic Step Content */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
           
           {/* STEP 1: DESCRIPTION & MEDIA */}
           {step === 1 && (
             <div className="space-y-10">
               <section className="bg-white p-8 md:p-12 rounded-[40px] border border-outline-variant/10 shadow-xl shadow-on-surface/[0.02]">
                  <div className="mb-10 text-center md:text-left">
                     <h2 className="text-2xl font-black text-[#0D2D1C] font-headline mb-2">Issue Proof</h2>
                     <p className="text-on-surface-variant/60 font-body">Upload a photo to help authorities understand the issue better.</p>
                  </div>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video rounded-[32px] border-2 border-dashed border-outline-variant/30 bg-surface-container-lowest flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all overflow-hidden group"
                  >
                    {reportData.imageUrl ? (
                      <div className="w-full h-full relative">
                        <Image src={reportData.imageUrl} alt="Preview" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold">
                           Replace Image
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-outline group-hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[64px]">add_a_photo</span>
                        <span className="font-bold">Tap to add photo</span>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                  </div>
               </section>

               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-outline font-label tracking-widest ml-1">Issue Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Major Pothole on 5th Ave"
                      value={reportData.title}
                      onChange={(e) => setReportData({...reportData, title: e.target.value})}
                      className="w-full h-16 bg-white border border-outline-variant/10 rounded-2xl px-6 font-bold text-on-surface focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-outline font-label tracking-widest ml-1">Full Description</label>
                    <textarea 
                      placeholder="Please provide as much detail as possible..."
                      rows={5}
                      value={reportData.description}
                      onChange={(e) => setReportData({...reportData, description: e.target.value})}
                      className="w-full bg-white border border-outline-variant/10 rounded-2xl p-6 font-bold text-on-surface focus:ring-4 focus:ring-primary/5 transition-all outline-none resize-none"
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <button onClick={() => setStep(2)} className="px-14 h-16 bg-[#0D2D1C] text-white font-extrabold rounded-[22px] shadow-2xl shadow-[#0D2D1C]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">
                       Next Step
                       <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  </div>
               </div>
             </div>
           )}

           {/* STEP 2: CATEGORY & LOCATION */}
           {step === 2 && (
             <div className="space-y-12">
               <section>
                 <h2 className="text-2xl font-black text-[#0D2D1C] font-headline mb-8">What did you find?</h2>
                 <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setReportData({...reportData, category: cat.id})}
                        className={`group p-6 rounded-[32px] border-2 transition-all duration-300 text-left h-40 flex flex-col justify-between ${
                          reportData.category === cat.id 
                          ? 'bg-white border-primary shadow-2xl shadow-primary/10 -translate-y-1' 
                          : 'bg-white border-transparent shadow-sm hover:border-outline-variant/30'
                        }`}
                      >
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.color} border`}>
                            <span className="material-symbols-outlined text-[24px]">{cat.icon}</span>
                         </div>
                         <span className="block text-lg font-extrabold text-[#0D2D1C] font-headline leading-tight">{cat.label}</span>
                      </button>
                    ))}
                 </div>
               </section>

               <section>
                 <h2 className="text-2xl font-black text-[#0D2D1C] font-headline mb-4">How urgent is it?</h2>
                 <p className="text-sm text-on-surface-variant/70 mb-6">
                   Choose severity. We may raise it if the description signals a safety hazard.
                 </p>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
                   {SEVERITY_OPTIONS.map((opt) => {
                     const active = reportData.severity === opt.id;
                     return (
                       <button
                         key={opt.id}
                         type="button"
                         onClick={() => setReportData({ ...reportData, severity: opt.id })}
                         className={`p-4 rounded-2xl border-2 text-left transition-all ${
                           active
                             ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                             : 'border-transparent bg-white shadow-sm hover:border-outline-variant/30'
                         }`}
                       >
                         <span
                           className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border mb-2 ${
                             SEVERITY_BADGE_CLASS[opt.id]
                           }`}
                         >
                           {opt.label}
                         </span>
                         <p className="text-xs font-semibold text-on-surface-variant">{opt.hint}</p>
                       </button>
                     );
                   })}
                 </div>
               </section>

               <section>
                 <h2 className="text-2xl font-black text-[#0D2D1C] font-headline mb-8">Where is it located?</h2>
                  <div className="bg-white rounded-[40px] border border-outline-variant/10 p-4 shadow-xl shadow-on-surface/[0.02]">
                    <div className="h-[380px] w-full rounded-[32px] relative mb-6 overflow-hidden border border-outline-variant/10">
                       <MapWrapper 
                         center={reportData.latitude && reportData.longitude ? [reportData.latitude, reportData.longitude] : [20.5937, 78.9629]}
                         zoom={reportData.latitude ? 17 : 5}
                         className="h-full w-full"
                       >
                         {/* Nearby issues (semi-transparent) */}
                         {nearbyIssues.map(issue => (
                           <div key={issue.id} className="opacity-40">
                             <IssueMarker issue={issue} role="citizen" />
                           </div>
                         ))}

                         {/* The primary report pin - Draggable */}
                         {reportData.latitude && reportData.longitude && (
                           <Marker 
                             position={[reportData.latitude, reportData.longitude]} 
                             icon={pinIcon}
                             draggable={true}
                             eventHandlers={{
                               dragend: async (e) => {
                                 const marker = e.target;
                                 const position = marker.getLatLng();
                                 setReportData(prev => ({ ...prev, latitude: position.lat, longitude: position.lng }));
                                 try {
                                   const res = await fetch(`/api/maps/reverse?lat=${position.lat}&lon=${position.lng}`);
                                   const data = await res.json();
                                   if (data.display_name) setReportData(prev => ({ ...prev, location: data.display_name }));
                                 } catch (err) {
                                   console.error(err);
                                 }
                               },
                             }}
                           />
                         )}

                         {/* Click to move pin */}
                         <MapClickHandler onMapClick={async (lat, lng) => {
                            setReportData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                            try {
                               const res = await fetch(`/api/maps/reverse?lat=${lat}&lon=${lng}`);
                               const data = await res.json();
                               if (data.display_name) setReportData(prev => ({ ...prev, location: data.display_name }));
                            } catch (err) {
                               console.error(err);
                            }
                         }} />
                       </MapWrapper>
                       
                       {/* Duplicate Warning Overlay */}
                       {duplicateStatus !== 'none' && duplicates.length > 0 && (
                         <div className="absolute top-4 left-4 right-4 z-[1000] p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col gap-3 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500 max-h-[80%] overflow-y-auto">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                 <span className="material-symbols-outlined">warning</span>
                              </div>
                              <div className="flex-1">
                                 <p className="text-sm font-black text-amber-900 leading-tight">
                                   {duplicateStatus === 'duplicate' ? 'High Likelihood of Duplicate Detected' : 'Similar Reports Suggested'}
                                 </p>
                                 <p className="text-[11px] text-amber-700 font-medium">An issue was already reported here. Want to upvote it instead?</p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 mt-2">
                              {duplicates.map(match => (
                                <div key={match.id} className="bg-white rounded-xl p-3 border border-amber-100 flex flex-col">
                                  <div className="flex justify-between items-start">
                                    <span className="font-bold text-sm text-[#0D2D1C] line-clamp-1">{match.title}</span>
                                    <span className="text-xs text-amber-600 font-bold ml-2 shrink-0">{match.distance}m away</span>
                                  </div>
                                  {match.similarity && (
                                    <span className="text-xs text-green-600 font-bold mt-1">{match.similarity}% Semantic Match</span>
                                  )}
                                  <div className="flex gap-2 mt-3">
                                    <button onClick={() => router.push(`/feed`)} className="px-3 py-1.5 bg-amber-100/50 hover:bg-amber-100 text-amber-900 text-[10px] font-black uppercase rounded-lg transition-colors flex-1 text-center border border-amber-200">View Issue</button>
                                    <button onClick={() => router.push('/feed')} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase rounded-lg transition-colors flex-1 text-center shadow-sm">Upvote Instead</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                         </div>
                       )}

                       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
                          <button onClick={handleGetLocation} className="bg-white px-6 py-2.5 rounded-full font-bold text-xs shadow-xl active:scale-95 transition-all text-primary flex items-center gap-2 border border-primary/10">
                             <span className="material-symbols-outlined text-[18px]">my_location</span>
                             {searching ? 'Locating...' : 'Use current location'}
                          </button>
                       </div>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search address or move pin..."
                        value={reportData.location}
                        onChange={(e) => handleLocationSearch(e.target.value)}
                        className="w-full h-16 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-6 font-bold text-on-surface outline-none"
                      />
                      {searchSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-outline-variant/20 rounded-3xl shadow-2xl z-[1100] overflow-hidden max-h-[240px] overflow-y-auto">
                          {searchSuggestions.map((s, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectSuggestion(s)}
                              className="w-full text-left px-6 py-4 hover:bg-primary/5 border-b border-outline-variant/5 last:border-0 transition-colors"
                            >
                              <p className="font-bold text-sm text-[#0D2D1C] truncate">{s.display_name}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                 </div>
               </section>

               <div className="pt-10 flex justify-between gap-6">
                 <button onClick={() => setStep(1)} className="px-10 h-16 bg-surface-container-high text-on-surface-variant font-bold rounded-[22px] transition-all">Back</button>
                 <button
                   onClick={() => {
                     setStep(3);
                     void runAiClassify();
                   }}
                   className="px-14 h-16 bg-[#0D2D1C] text-white font-extrabold rounded-[22px] shadow-2xl shadow-[#0D2D1C]/20 transition-all"
                 >
                   Review Report
                 </button>
               </div>
             </div>
           )}

           {/* STEP 3: FINAL REVIEW */}
           {step === 3 && (
             <div className="space-y-12">
               <section className="bg-white p-6 rounded-[44px] border border-outline-variant/10 shadow-2xl shadow-on-surface/[0.04]">
                  <div className="flex flex-col md:flex-row gap-8">
                     <div className="w-full md:w-56 h-56 rounded-[32px] relative overflow-hidden bg-surface-container-low shrink-0">
                        {reportData.imageUrl ? <Image src={reportData.imageUrl} alt="Issue" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-outline"><span className="material-symbols-outlined text-5xl">image_not_supported</span></div>}
                     </div>
                     <div className="flex-1 py-2">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg">Draft Report</div>
                          <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${SEVERITY_BADGE_CLASS[priorityMeta.severity] || SEVERITY_BADGE_CLASS.Medium}`}>
                            {priorityMeta.severity} priority
                          </span>
                        </div>
                        <h3 className="text-3xl font-extrabold text-[#0D2D1C] font-headline mb-2">{reportData.title || 'Untitled Issue'}</h3>
                        <p className="text-on-surface-variant line-clamp-3 font-body mb-6">{reportData.description || 'No description provided.'}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="flex items-center gap-3 p-4 bg-[#F8FAF9] rounded-2xl border border-outline-variant/5">
                              <span className="material-symbols-outlined text-primary">category</span>
                              <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-outline">Category</p>
                                <span className="text-sm font-bold text-on-surface">{priorityMeta.category}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-3 p-4 bg-[#F8FAF9] rounded-2xl border border-outline-variant/5">
                              <span className="material-symbols-outlined text-primary">location_on</span>
                              <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-outline">Location</p>
                                <span className="text-sm font-bold text-on-surface truncate block">{reportData.location || 'Unknown location'}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-3 p-4 bg-[#F8FAF9] rounded-2xl border border-outline-variant/5">
                              <span className="material-symbols-outlined text-primary">priority_high</span>
                              <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-outline">Priority score</p>
                                <span className="text-sm font-bold text-on-surface">{priorityMeta.priority_score}/100 · {priorityMeta.severity}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-3 p-4 bg-[#F8FAF9] rounded-2xl border border-outline-variant/5">
                              <span className="material-symbols-outlined text-primary">account_balance</span>
                              <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-outline">Assigned department</p>
                                <span className="text-sm font-bold text-on-surface">{priorityMeta.department}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </section>

               <section className="bg-gradient-to-br from-[#0D2D1C] to-[#1a4a30] p-6 md:p-8 rounded-[32px] text-white shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-3xl">
                          {aiClassifying ? 'progress_activity' : 'psychology'}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">
                          {aiClassifying
                            ? 'AI is scoring this report…'
                            : `AI severity · ${aiMeta?.source || 'heuristic'}`}
                        </p>
                        <p className="text-sm font-medium text-white/90 leading-relaxed">
                          {aiMeta?.rationale || (
                            <>
                              This report will queue as <strong>{priorityMeta.severity}</strong> (score{' '}
                              <strong>{priorityMeta.priority_score}</strong>) for{' '}
                              <strong>{priorityMeta.department}</strong>. Higher priority items are worked first.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <p className="text-4xl font-black tabular-nums">{priorityMeta.priority_score}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Priority score</p>
                    </div>
                  </div>
               </section>

               <div className="bg-surface-container-lowest p-8 rounded-[32px] border border-dashed border-outline-variant/20 flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-primary text-5xl mb-4">verified</span>
                  <p className="text-lg font-bold text-[#0D2D1C] mb-1">Ready to submit?</p>
                  <p className="text-sm text-outline font-body max-w-sm">By submitting, you certify that this issue is reported in good faith and requires civil attention.</p>
               </div>

               <div className="pt-10 flex justify-between gap-6">
                 <button onClick={() => setStep(2)} className="px-10 h-16 bg-surface-container-high text-on-surface-variant font-bold rounded-[22px] transition-all">Edit Details</button>
                 <button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="flex-1 h-16 bg-primary text-white font-extrabold rounded-[22px] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-3"
                 >
                    {loading ? 'Submitting Details...' : (
                      <>
                        <span className="material-symbols-outlined">rocket_launch</span>
                        Finalize & Hub Submission
                      </>
                    )}
                 </button>
               </div>
             </div>
           )}

        </div>
      </div>
    </div>
  );
}
