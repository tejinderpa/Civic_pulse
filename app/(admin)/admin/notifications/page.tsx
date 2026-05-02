'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      // For development/demo, we load generically. In prod, use user ID.
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) setNotifications(data);
      setIsLoading(false);
    }
    
    loadData();

    const channel = supabase.channel(`realtime_notifications_${Math.random()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const markAsRead = async (id: string, issueId?: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    if (issueId) {
      router.push(`/admin/issues?id=${issueId}`);
    }
  };

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).neq('is_read', true);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'Unread') return !n.is_read;
    if (filter === 'Critical') return n.type === 'new_issue' && n.title.includes('Critical'); // Mock logic
    if (filter === 'SLA Breaches') return n.type === 'sla_breach';
    return true;
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case 'new_issue': return { icon: 'info', color: 'bg-blue-100 text-blue-600' };
      case 'sla_breach': return { icon: 'warning', color: 'bg-red-100 text-red-600' };
      case 'status_change': return { icon: 'check_circle', color: 'bg-emerald-100 text-emerald-600' };
      case 'assignment': return { icon: 'person', color: 'bg-purple-100 text-purple-600' };
      default: return { icon: 'notifications', color: 'bg-slate-100 text-slate-600' };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black tracking-tight text-[var(--primary)] font-[var(--font-plus-jakarta)]">Notifications</h1>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-black">
                {notifications.filter(n => !n.is_read).length} New
              </span>
            )}
          </div>
          <p className="text-[var(--on-surface-variant)] font-medium max-w-lg">System alerts, assignment pings, and SLA breach warnings.</p>
        </div>
        <button 
          onClick={markAllAsRead}
          className="px-6 py-2 rounded-xl bg-white border border-[var(--outline-variant)] text-sm font-bold shadow-sm hover:bg-slate-50 transition-all text-slate-600"
        >
          Mark all as read
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {['All', 'Unread', 'Critical', 'SLA Breaches'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-bold transition-all whitespace-nowrap border-b-2 rounded-t-lg ${
              filter === tab ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/5' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-[var(--primary)] animate-spin"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-16 text-center border border-dashed border-slate-300 rounded-3xl bg-slate-50 opacity-60">
             <span className="material-symbols-outlined text-[48px] text-slate-400 mb-2">notifications_paused</span>
             <p className="font-bold text-slate-500 uppercase tracking-widest text-sm">No notifications found.</p>
          </div>
        ) : (
          filteredNotifications.map(notification => {
            const { icon, color } = getIconForType(notification.type);
            const timeAgo = (new Date().getTime() - new Date(notification.created_at).getTime()) / (1000 * 3600); // Simple hours ago calc
            
            return (
              <div 
                key={notification.id}
                onClick={() => markAsRead(notification.id, notification.issue_id)}
                className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                  !notification.is_read 
                  ? 'bg-blue-50/30 border-blue-200/50 hover:bg-blue-50/50 shadow-sm' 
                  : 'bg-white border-slate-200 hover:shadow-md'
                }`}
              >
                {!notification.is_read && (
                  <div className="w-1.5 h-10 mt-1 rounded-full bg-blue-500 shrink-0"></div>
                )}
                
                <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center ${color}`}>
                  <span className="material-symbols-outlined">{icon}</span>
                </div>

                <div className="flex-1 min-w-0 pt-1 border-r border-slate-100 pr-4">
                  <h4 className={`text-sm truncate ${!notification.is_read ? 'font-black text-[#0D2D1C]' : 'font-bold text-slate-600'}`}>
                    {notification.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 truncate">{notification.message}</p>
                </div>

                <div className="w-24 shrink-0 text-right pt-1">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{Math.floor(timeAgo) === 0 ? 'Just now' : `${Math.floor(timeAgo)}h ago`}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
