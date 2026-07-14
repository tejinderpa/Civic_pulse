import dynamic from 'next/dynamic';

/**
 * Leaflet / react-leaflet touch `window` at import time.
 * Keep the map UI client-only so Vercel static generation never loads it on the server.
 */
const ReportPageClient = dynamic(() => import('./ReportPageClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-10 h-10 rounded-full border-4 border-outline-variant/30 border-t-primary animate-spin" />
    </div>
  ),
});

export default function ReportPage() {
  return <ReportPageClient />;
}
