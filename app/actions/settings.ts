'use server';

import { requireAdmin, isAdminFailure } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

/** Update admin display name (auth metadata + profiles). */
export async function updateAdminProfile(fullName: string) {
  const auth = await requireAdmin();
  if (isAdminFailure(auth)) {
    return { ok: false as const, error: 'Unauthorized' };
  }

  const trimmed = fullName.trim();
  if (trimmed.length < 2) {
    return { ok: false as const, error: 'Name must be at least 2 characters' };
  }

  const { error: authErr } = await auth.supabase.auth.updateUser({
    data: { full_name: trimmed },
  });
  if (authErr) {
    return { ok: false as const, error: authErr.message };
  }

  try {
    const admin = createAdminClient();
    await admin.from('profiles').update({ full_name: trimmed }).eq('id', auth.user.id);
  } catch {
    /* profiles update optional */
  }

  return { ok: true as const };
}
