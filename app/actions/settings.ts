import { createAdminClient } from '@/lib/supabase/admin';

export async function fetchDepartments() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('departments').select('*').order('name');
  if (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
  return data || [];
}

export async function fetchSlaConfig() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('sla_config').select('*');
  if (error) {
    console.error('Error fetching sla config:', error);
    return [];
  }
  return data || [];
}
