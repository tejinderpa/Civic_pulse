'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type AppNotification = {
  id: string;
  title: string | null;
  message: string | null;
  is_read: boolean | null;
  created_at: string;
  user_id: string;
};

export function useNotifications() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const rows = (data as AppNotification[]) || [];
      setNotifications(rows);
      setUnreadCount(rows.filter((n) => !n.is_read).length);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { notifications, unreadCount, loading, refresh, setNotifications };
}
