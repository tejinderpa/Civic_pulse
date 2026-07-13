import CitizenShell from '@/components/citizen/CitizenShell';

/**
 * Citizen app shell (sidebar + header). Kept as a Server Component wrapper
 * so the shell module can stay client-only without re-mount thrash.
 */
export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  return <CitizenShell>{children}</CitizenShell>;
}
