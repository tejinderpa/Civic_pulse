'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { Issue } from '@/types/issue';
import { MOCK_ISSUES } from '@/lib/mock-data';

export async function fetchAdminIssues(searchQuery: string = ''): Promise<Issue[]> {
  const supabase = createAdminClient();
  let query = supabase.from('reports').select('*');
  
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%`);
  }
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching admin issues (server action):', error);
    return [];
  }
  
  return data as Issue[] || [];
}

