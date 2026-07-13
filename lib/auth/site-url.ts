/** Browser-safe site origin for OAuth / email redirects. */
export function getSiteOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

/** Allowed post-auth redirect paths (relative only). */
export function safeNextPath(next: string | null | undefined, fallback = '/feed'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback;
  return next;
}
