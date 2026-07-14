export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Server-side admin registration.
 * Access code never ships in the client bundle.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const fullName = String(body.fullName || '').trim();
    const accessCode = String(body.accessCode || '').trim();

    const expectedCode = process.env.ADMIN_ACCESS_CODE;
    if (!expectedCode) {
      console.error('[Admin Register] ADMIN_ACCESS_CODE is not configured');
      return NextResponse.json(
        { error: 'Admin registration is not configured', code: 'NOT_CONFIGURED' },
        { status: 503 }
      );
    }

    if (!email || !password || !fullName || !accessCode) {
      return NextResponse.json({ error: 'All fields are required', code: 'BAD_REQUEST' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters', code: 'BAD_REQUEST' }, { status: 400 });
    }

    if (accessCode !== expectedCode) {
      return NextResponse.json(
        { error: 'Invalid authority access code. Contact your system administrator.', code: 'INVALID_CODE' },
        { status: 403 }
      );
    }

    const admin = createAdminClient();

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        // Do NOT put admin role in metadata — profiles.role is source of truth
      },
    });

    if (createError || !created.user) {
      console.error('[Admin Register] createUser error:', createError);
      const message = createError?.message?.includes('already')
        ? 'An account with this email already exists.'
        : createError?.message || 'Failed to create account';
      return NextResponse.json({ error: message, code: 'CREATE_FAILED' }, { status: 400 });
    }

    const userId = created.user.id;

    // Upsert profile as admin (service role)
    const { error: profileError } = await admin.from('profiles').upsert(
      {
        id: userId,
        full_name: fullName,
        role: 'admin',
        email,
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      // Fallback: update only role if upsert shape differs
      const { error: updateError } = await admin
        .from('profiles')
        .update({ role: 'admin', full_name: fullName })
        .eq('id', userId);

      if (updateError) {
        console.error('[Admin Register] profile promote error:', profileError, updateError);
        return NextResponse.json(
          {
            error: 'Account created but role promotion failed. Contact an administrator.',
            code: 'PROMOTE_FAILED',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account created. You can sign in now.',
    });
  } catch (err) {
    console.error('[Admin Register] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL' }, { status: 500 });
  }
}
