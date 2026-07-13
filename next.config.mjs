import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Read KEY=VALUE from a dotenv file (no dependency). */
function loadEnvFile(filename) {
  const full = path.join(__dirname, filename);
  const out = {};
  try {
    const text = fs.readFileSync(full, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      out[key] = value;
    }
  } catch {
    // file missing
  }
  return out;
}

// Merge .env then .env.local (local wins). Do NOT rely only on process.env here —
// that is what left the browser bundle without keys before.
const fileEnv = {
  ...loadEnvFile('.env'),
  ...loadEnvFile('.env.local'),
};

const supabaseUrl =
  fileEnv.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const supabaseAnon =
  fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  fileEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  '';

if (!supabaseUrl || !supabaseAnon) {
  console.warn(
    '[next.config] WARNING: Supabase URL/key missing from .env.local — auth will fail in the browser.'
  );
} else {
  console.log('[next.config] Supabase public env loaded for client bundle:', supabaseUrl);
}

// Also put them on process.env so server/middleware see them during this process
process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseAnon;
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY =
  fileEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || supabaseAnon;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force-embed into client JS (fixes empty createBrowserClient URL/key)
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnon,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: supabaseAnon,
    NEXT_PUBLIC_SITE_URL:
      fileEnv.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000',
    NEXT_PUBLIC_USE_MOCK_DATA:
      fileEnv.NEXT_PUBLIC_USE_MOCK_DATA ||
      process.env.NEXT_PUBLIC_USE_MOCK_DATA ||
      'false',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
};

export default nextConfig;
