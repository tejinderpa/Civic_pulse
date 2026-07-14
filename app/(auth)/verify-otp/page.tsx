import Link from 'next/link';

/** Static auth UI — no client handlers (Server Component safe for Vercel build). */
export default function VerifyOtpPage() {
  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col items-center justify-center p-6 selection:bg-primary-fixed selection:text-on-primary-fixed">
      <div className="mb-12">
        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-primary">CivicPulse</h1>
      </div>
      <main className="w-full max-w-md">
        <div className="bg-surface-container-lowest rounded-xl p-8 md:p-10 ambient-shadow ghost-border relative overflow-hidden">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-2 tracking-tight">Check your email</h2>
            <p className="text-on-surface-variant leading-relaxed">
              We sent a 6-digit code to your email
            </p>
          </div>

          <form className="space-y-8" action="#">
            <div className="flex justify-between gap-2 md:gap-3">
              <input className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-headline font-bold bg-surface-container-low border-transparent rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-primary" inputMode="numeric" maxLength={1} pattern="[0-9]*" placeholder="·" type="text" />
              <input className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-headline font-bold bg-surface-container-low border-transparent rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-primary" inputMode="numeric" maxLength={1} pattern="[0-9]*" placeholder="·" type="text" />
              <input className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-headline font-bold bg-surface-container-low border-transparent rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-primary" inputMode="numeric" maxLength={1} pattern="[0-9]*" placeholder="·" type="text" />
              <input className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-headline font-bold bg-surface-container-low border-transparent rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-primary" inputMode="numeric" maxLength={1} pattern="[0-9]*" placeholder="·" type="text" />
              <input className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-headline font-bold bg-surface-container-low border-transparent rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-primary" inputMode="numeric" maxLength={1} pattern="[0-9]*" placeholder="·" type="text" />
              <input className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-headline font-bold bg-surface-container-low border-transparent rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-primary" inputMode="numeric" maxLength={1} pattern="[0-9]*" placeholder="·" type="text" />
            </div>

            <div className="space-y-4">
              <button className="signature-gradient w-full py-4 rounded-lg font-headline font-bold text-on-primary hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/10" type="submit">
                Verify
              </button>
              <div className="flex flex-col items-center gap-2">
                <button className="text-primary font-label font-bold hover:underline py-1 transition-all" type="button">
                  Resend code
                </button>
                <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span className="text-xs font-label font-medium text-on-surface-variant">00:60</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-on-surface-variant font-label">
          Having trouble? <Link className="text-primary font-bold hover:underline transition-all" href="#">Contact Civic Support</Link>
        </p>
      </main>

      <div className="fixed top-0 left-0 -z-10 w-full h-full overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-primary-fixed rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-secondary-fixed rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
}
