'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<{ email?: string; name?: string }>({});
  const [departments, setDepartments] = useState<any[]>([]);
  const [slaConfig, setSlaConfig] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setProfile({ email: user.email, name: user.user_metadata?.full_name || '' });
      }

      // We use client side for demo since this page is behind admin auth
      const { data: deptData } = await supabase.from('departments').select('*');
      const { data: slaData } = await supabase.from('sla_config').select('*');
      
      setDepartments(deptData || []);
      setSlaConfig(slaData || []);
      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  const saveProfile = async () => {
    await supabase.auth.updateUser({ data: { full_name: profile.name } });
    alert('Profile saved!');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[var(--primary)] font-[var(--font-plus-jakarta)] mb-2">System Settings</h1>
        <p className="text-[var(--on-surface-variant)] font-medium max-w-lg">Configure your platform preferences, SLA rules, and departmental mappings.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          {[
            { id: 'profile', icon: 'person', label: 'Admin Profile' },
            { id: 'departments', icon: 'domain', label: 'Departments' },
            { id: 'sla', icon: 'timer', label: 'SLA Configuration' },
            { id: 'notifications', icon: 'notifications', label: 'Notifications' },
            { id: 'system', icon: 'dns', label: 'System Info' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                activeTab === tab.id 
                ? 'bg-[var(--primary)] text-white shadow-md' 
                : 'bg-transparent text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] hover:text-[var(--on-surface)]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-[32px] border border-[var(--outline-variant)] shadow-sm p-8 min-h-[500px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center pt-20">
              <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-[var(--primary)] animate-spin"></div>
            </div>
          ) : (
            <>
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black mb-6">Profile Settings</h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="text-[10px] font-black uppercase text-[var(--on-surface-variant)] ml-1">Email Address (Read-only)</label>
                      <input 
                        type="text" 
                        value={profile.email || ''} 
                        disabled 
                        className="w-full mt-1 px-4 py-3 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-sm font-medium opacity-70"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-[var(--on-surface-variant)] ml-1">Full Name</label>
                      <input 
                        type="text" 
                        value={profile.name || ''} 
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full mt-1 px-4 py-3 rounded-xl border border-[var(--outline-variant)] bg-white text-sm font-bold focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-[var(--on-surface-variant)] ml-1">Profile Photo</label>
                      <div className="mt-2 flex items-center gap-4">
                         <div className="w-16 h-16 rounded-full bg-[var(--surface-container-low)] flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined text-[24px]">person</span>
                         </div>
                         <button className="px-4 py-2 border border-[var(--outline-variant)] rounded-xl text-xs font-bold hover:bg-slate-50">Upload New</button>
                      </div>
                    </div>
                    <button onClick={saveProfile} className="mt-8 px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-bold hover:opacity-90 shadow-lg shadow-[var(--primary)]/20 px-8">
                      Save Profile
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'departments' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-black">Department Mapping</h2>
                     <button className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm bg-[var(--primary)]/10 px-4 py-2 rounded-xl">
                        <span className="material-symbols-outlined text-[18px]">add</span> Add Department
                     </button>
                  </div>
                  {departments.length === 0 ? (
                    <p className="text-sm font-medium text-slate-500">No departments configured.</p>
                  ) : (
                    <div className="grid gap-3">
                      {departments.map((dept, i) => (
                        <div key={i} className="flex justify-between items-center p-4 border border-[var(--outline-variant)] rounded-2xl bg-slate-50/50">
                          <div>
                            <p className="font-bold text-[var(--on-surface)]">{dept.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dept.category_slug}</p>
                          </div>
                           <button className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all hidden md:block">
                             <span className="material-symbols-outlined text-[20px]">delete</span>
                           </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sla' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black mb-6">Service Level Agreements (SLA)</h2>
                  <p className="text-sm font-medium text-slate-500 mb-8 max-w-lg">Define the maximum resolution timeframe allowed before an issue is flagged as a breach and escalated.</p>
                  
                  {slaConfig.length === 0 ? (
                    <p className="text-sm font-medium text-slate-500">No SLA config loaded.</p>
                  ) : (
                    <div className="space-y-4 max-w-md">
                      {slaConfig.map((sla, i) => (
                        <div key={i} className="flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <span className={`w-3 h-3 rounded-full ${sla.severity === 'Critical' ? 'bg-red-500' : sla.severity === 'High' ? 'bg-amber-500' : sla.severity === 'Medium' ? 'bg-yellow-400' : 'bg-emerald-500'}`}></span>
                              <span className="font-bold">{sla.severity}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <input type="number" defaultValue={sla.hours} className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-right font-bold text-sm bg-slate-50" />
                              <span className="text-xs font-bold text-slate-400 uppercase">Hours</span>
                           </div>
                        </div>
                      ))}
                      <div className="pt-6 border-t border-slate-100">
                        <button className="px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-bold hover:opacity-90 shadow-lg shadow-[var(--primary)]/20 px-8">Save SLAs</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                     {[
                       { label: 'Email notifications on new critical issue', enabled: true },
                       { label: 'Email notifications on SLA breach', enabled: true },
                       { label: 'In-app ping notifications', enabled: true },
                       { label: 'Daily digest summary', enabled: false }
                     ].map((pref, i) => (
                       <label key={i} className="flex items-center gap-4 cursor-pointer group">
                          <div className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${pref.enabled ? 'bg-[var(--primary)]' : 'bg-slate-200'}`}>
                             <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all ${pref.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                          </div>
                          <span className="text-sm font-bold text-[var(--on-surface)] group-hover:text-[var(--primary)] transition-colors">{pref.label}</span>
                       </label>
                     ))}
                  </div>
                </div>
              )}

              {activeTab === 'system' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black mb-6">System Health</h2>
                  <div className="grid gap-4 max-w-sm">
                     <div className="p-4 border border-[var(--outline-variant)] rounded-2xl bg-slate-50 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase">Database Connection</span>
                        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Operating
                        </div>
                     </div>
                     <div className="p-4 border border-[var(--outline-variant)] rounded-2xl bg-slate-50 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase">Environment</span>
                        <span className="text-sm font-black text-[#0D2D1C]">Development</span>
                     </div>
                     <div className="p-4 border border-[var(--outline-variant)] rounded-2xl bg-slate-50 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase">Core Framework</span>
                        <span className="text-sm font-black text-[#0D2D1C]">Next.js 14.2.1</span>
                     </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
