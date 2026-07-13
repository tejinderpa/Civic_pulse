'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="max-w-md text-center">
        <span className="material-symbols-outlined text-5xl text-error mb-4">error</span>
        <h1 className="text-2xl font-headline font-extrabold text-primary mb-2">Something went wrong</h1>
        <p className="text-on-surface-variant mb-6 font-body">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
