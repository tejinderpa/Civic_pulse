'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

export default function ProfilePage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Real Data State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    avatar_url: ''
  });

  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    email: true,
    community: true,
    sms: false,
    monthly: true,
    tfa: false
  });

  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);


  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const metadata = user.user_metadata || {};
        setFormData({
          firstName: metadata.full_name?.split(' ')[0] || 'Citizen',
          lastName: metadata.full_name?.split(' ')[1] || 'User',
          email: user.email || '',
          location: metadata.location || '',
          avatar_url: metadata.avatar_url || ''
        });
        setNotifs({
          email: metadata.notif_email ?? true,
          community: metadata.notif_community ?? true,
          sms: metadata.notif_sms ?? false,
          monthly: metadata.notif_monthly ?? true,
          tfa: metadata.tfa_enabled ?? false
        });
      }
      setLoading(false);
    }
    loadUser();
  }, [supabase]);

  async function updateProfileMetaData(updates: any) {
    setProcessing(true);
    const { error } = await supabase.auth.updateUser({
      data: updates
    });
    if (!error) {
      // Refresh local state if needed
    }
    setProcessing(false);
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('civicpulse-assets')
      .upload(filePath, file);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('civicpulse-assets')
        .getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      await updateProfileMetaData({ avatar_url: publicUrl });
    }
    setProcessing(false);
  };

  const toggleNotif = async (key: string) => {
    const newVal = !notifs[key];
    setNotifs(prev => ({ ...prev, [key]: newVal }));
    await updateProfileMetaData({ [`notif_${key}`]: newVal });
  };

  const handlePasswordChange = async () => {
    if (!passwordData.current) return alert('Please enter your current password');
    if (passwordData.new !== passwordData.confirm) return alert('New passwords do not match');
    if (passwordData.new.length < 6) return alert('New password must be at least 6 characters');

    setProcessing(true);
    
    // Step 1: Verify current password by re-authenticating
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwordData.current
    });

    if (authError) {
      console.error('Auth verification error:', authError);
      alert(`Verification failed: ${authError.message}. (Note: If you signed in with Google, you don't have a local password to change)`);
      setProcessing(false);
      return;
    }


    // Step 2: Update to the new password
    const { error: updateError } = await supabase.auth.updateUser({ 
      password: passwordData.new 
    });

    if (!updateError) {
      setShowPasswordForm(false);
      setPasswordData({ current: '', new: '', confirm: '' });
      alert('Security success: Your password has been updated.');
    } else {
      alert(`Error updating password: ${updateError.message}`);
    }
    setProcessing(false);
  };


  const navItems = [
    { id: 'profile', label: 'Personal Information', icon: 'person' },
    { id: 'security', label: 'Account Security', icon: 'security' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  ];

  if (loading) return (
    <div className="min-h-[50vh] flex items-center justify-center bg-transparent">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-full flex relative overflow-hidden bg-transparent">
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      
      {/* Action Rail */}
      <div className="hidden lg:flex w-24 flex-col items-center py-12 border-r border-outline-variant/10 bg-white/50 backdrop-blur-md z-20">
        <Link href="/feed" className="group flex flex-col items-center gap-2">
           <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
             <span className="material-symbols-outlined">arrow_back</span>
           </div>
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center overflow-y-auto z-10 px-4">
        <div className="w-full max-w-4xl py-12 md:py-20">
          
          <div className="mb-14">
             <h1 className="text-5xl font-extrabold text-[#0D2D1C] font-headline tracking-tighter mb-2">My Civic Identity</h1>
             <p className="text-on-surface-variant/80 font-body text-lg">Manage your secure residency and notification preferences.</p>
          </div>

          <div className="bg-white rounded-[40px] shadow-2xl shadow-on-surface/[0.04] border border-white overflow-hidden">
            <div className="flex bg-surface-container-low/30 backdrop-blur-sm p-1.5 gap-1.5 overflow-x-auto">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex-1 min-w-[160px] py-4 rounded-[22px] text-sm font-bold flex items-center justify-center gap-3 transition-all ${
                    activeTab === item.id 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-outline hover:text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="p-8 md:p-14">
              {activeTab === 'profile' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col md:flex-row items-center gap-10 mb-16">
                    <div className="relative">
                      <div className="w-36 h-36 rounded-[48px] bg-primary/5 flex items-center justify-center text-primary text-6xl font-extrabold border border-primary/5 relative overflow-hidden">
                        {formData.avatar_url ? (
                          <Image src={formData.avatar_url} alt="Avatar" fill className="object-cover" />
                        ) : (
                          formData.firstName?.[0] || 'C'
                        )}
                      </div>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary text-white rounded-[18px] flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[20px]">upload</span>
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-3xl font-extrabold text-[#0D2D1C] font-headline mb-1">{formData.firstName} {formData.lastName}</h2>
                      <p className="text-on-surface-variant font-medium mb-4">{formData.email}</p>
                      <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-emerald-100">
                         <span className="material-symbols-outlined text-xs">verified_user</span> Master Profile Verified
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-2">
                       <label className="text-[11px] font-black uppercase text-outline font-label tracking-widest ml-1">First Name</label>
                       <input 
                         type="text" 
                         value={formData.firstName} 
                         onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                         className="w-full h-16 bg-[#F8FAF9] rounded-2xl px-6 font-bold text-on-surface border-none focus:ring-2 focus:ring-primary/20 transition-all font-body"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-black uppercase text-outline font-label tracking-widest ml-1">Last Name</label>
                       <input 
                         type="text" 
                         value={formData.lastName} 
                         onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                         className="w-full h-16 bg-[#F8FAF9] rounded-2xl px-6 font-bold text-on-surface border-none focus:ring-2 focus:ring-primary/20 transition-all font-body"
                       />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[11px] font-black uppercase text-outline font-label tracking-widest ml-1">Current Residency</label>
                       <input 
                         type="text" 
                         value={formData.location} 
                         onChange={(e) => setFormData({...formData, location: e.target.value})}
                         className="w-full h-16 bg-[#F8FAF9] rounded-2xl px-6 font-bold text-on-surface border-none focus:ring-2 focus:ring-primary/20 transition-all font-body"
                       />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={() => updateProfileMetaData({ full_name: `${formData.firstName} ${formData.lastName}`, location: formData.location })}
                      disabled={processing}
                      className="px-12 h-16 bg-[#0D2D1C] text-white font-extrabold rounded-[22px] shadow-2xl shadow-[#0D2D1C]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                      {processing ? 'Synchronizing...' : 'Save Public Profile'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                  <div className="p-8 rounded-[32px] bg-[#F8FAF9] border border-outline-variant/10">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4 text-[#0D2D1C]">
                           <span className="material-symbols-outlined text-3xl">key</span>
                           <div>
                              <h4 className="text-xl font-bold font-headline">Account Password</h4>
                              <p className="text-sm text-outline font-body">
                                {user?.app_metadata?.provider === 'google' 
                                  ? 'Your account is managed via Google' 
                                  : 'Manage your login credentials'}
                              </p>
                           </div>
                        </div>
                        {user?.app_metadata?.provider !== 'google' ? (
                          <button 
                            onClick={() => setShowPasswordForm(!showPasswordForm)}
                            className="px-6 py-3 bg-white border border-outline-variant/20 rounded-xl font-bold text-sm shadow-sm hover:bg-on-surface hover:text-white transition-all"
                          >
                            {showPasswordForm ? 'Cancel' : 'Update'}
                          </button>
                        ) : (
                          <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-bold border border-primary/20">
                             GOOGLE AUTH
                          </div>
                        )}
                     </div>

                     {user?.app_metadata?.provider !== 'google' && showPasswordForm && (

                        <div className="space-y-4 pt-6 mt-6 border-t border-outline-variant/10 animate-in slide-in-from-top-4 duration-300">
                           <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-outline font-label tracking-widest ml-1">Current Password</label>
                              <div className="relative">
                                <input 
                                  type={showPasswords ? "text" : "password"} 
                                  placeholder="••••••••" 
                                  className="w-full h-14 bg-white rounded-xl px-4 border border-outline-variant/10 font-mono pr-12"
                                  value={passwordData.current}
                                  onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                                />
                                <button 
                                  onClick={() => setShowPasswords(!showPasswords)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[20px]">{showPasswords ? 'visibility' : 'visibility_off'}</span>
                                </button>
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-outline font-label tracking-widest ml-1">New Password</label>
                              <div className="relative">
                                <input 
                                  type={showPasswords ? "text" : "password"} 
                                  placeholder="••••••••" 
                                  className="w-full h-14 bg-white rounded-xl px-4 border border-outline-variant/10 font-mono pr-12"
                                  value={passwordData.new}
                                  onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                                />
                                <button 
                                  onClick={() => setShowPasswords(!showPasswords)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[20px]">{showPasswords ? 'visibility' : 'visibility_off'}</span>
                                </button>
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-outline font-label tracking-widest ml-1">Confirm New Password</label>
                              <div className="relative">
                                <input 
                                  type={showPasswords ? "text" : "password"} 
                                  placeholder="••••••••" 
                                  className="w-full h-14 bg-white rounded-xl px-4 border border-outline-variant/10 font-mono pr-12"
                                  value={passwordData.confirm}
                                  onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                                />
                                <button 
                                  onClick={() => setShowPasswords(!showPasswords)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[20px]">{showPasswords ? 'visibility' : 'visibility_off'}</span>
                                </button>
                              </div>
                           </div>
                           <button 
                             onClick={handlePasswordChange}
                             disabled={processing}
                             className="w-full py-4 bg-[#0D2D1C] text-white font-black rounded-xl shadow-xl shadow-[#0D2D1C]/10 mt-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                           >
                             {processing ? 'Verifying & Updating...' : 'Securely Update Password'}
                           </button>
                        </div>
                     )}


                  </div>

                  <div className="p-8 rounded-[32px] bg-[#F8FAF9] border border-outline-variant/10 flex items-center justify-between">
                     <div className="flex items-center gap-4 text-[#0D2D1C]">
                        <span className="material-symbols-outlined text-3xl">shield_person</span>
                        <div>
                           <h4 className="text-xl font-bold font-headline">Two-Factor Authentication</h4>
                           <p className="text-sm text-outline font-body">Enhanced security for important reports</p>
                        </div>
                     </div>
                     <div 
                        onClick={() => toggleNotif('tfa')}
                        className={`w-14 h-8 rounded-full relative cursor-pointer transition-colors ${notifs.tfa ? 'bg-primary/20' : 'bg-outline/10'}`}
                     >
                        <div className={`absolute top-1 w-6 h-6 rounded-full transition-all ${notifs.tfa ? 'left-7 bg-primary' : 'left-1 bg-outline/40'}`} />
                     </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
                  {[
                    { key: 'email', title: 'Email Alerts', desc: 'Direct updates on your filed reports' },
                    { key: 'community', title: 'Community Activity', desc: 'New reports within 2km of your location' },
                    { key: 'sms', title: 'Critical SMS Toggles', desc: 'Immediate mobile alerts for life/safety issues' },
                    { key: 'monthly', title: 'Impact Digest', desc: 'Monthly summary of your civic contributions' },
                  ].map((notif) => (
                    <div key={notif.key} className="p-6 rounded-[28px] bg-[#F8FAF9] border border-outline-variant/5 flex items-center justify-between hover:bg-white hover:shadow-md transition-all group">
                       <div>
                          <h4 className="font-bold text-[#0D2D1C] font-headline">{notif.title}</h4>
                          <p className="text-sm text-outline font-body group-hover:text-on-surface-variant transition-colors">{notif.desc}</p>
                       </div>
                       <div 
                        onClick={() => toggleNotif(notif.key)}
                        className={`w-14 h-8 rounded-full relative cursor-pointer transition-colors ${notifs[notif.key] ? 'bg-primary/20' : 'bg-outline/10'}`}
                       >
                        <div className={`absolute top-1 w-6 h-6 rounded-full transition-all ${notifs[notif.key] ? 'left-7 bg-primary' : 'left-1 bg-outline/40'}`} />
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
