import { redirect } from 'next/navigation';

/** Dev-only diagnostic page — blocked in production via middleware and here. */
export default function TestSupabasePage() {
  if (process.env.NODE_ENV === 'production') {
    redirect('/');
  }

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-2xl font-headline font-bold text-primary mb-4">Supabase diagnostic</h1>
      <p className="text-on-surface-variant font-body mb-4">
        This page is only available in development. Use the Supabase dashboard or seed scripts for data checks.
      </p>
      <p className="text-sm text-outline">
        Set <code className="bg-surface-container-high px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
        <code className="bg-surface-container-high px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{' '}
        <code className="bg-surface-container-high px-1 rounded">.env.local</code>.
      </p>
    </div>
  );
}
