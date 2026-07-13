import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="max-w-md text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">travel_explore</span>
        <h1 className="text-2xl font-headline font-extrabold text-primary mb-2">Page not found</h1>
        <p className="text-on-surface-variant mb-6 font-body">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
