'use client';

import Link from 'next/link';

export default function AdminAccessGuard({
  returnHref = '/shop',
  returnLabel = 'Return to Shop',
}: {
  returnHref?: string;
  returnLabel?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.28),transparent_35%),linear-gradient(180deg,#06070d_0%,#10141f_100%)] px-6 py-10">
      <div className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-white/8 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
          Access restricted
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white">Premium admin access required</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
          This section is reserved for verified Canvus operators. A customer or unauthorised account will not be able to use admin workflows until a staff role is assigned.
        </p>
        <div className="mt-8 grid gap-3 sm:flex sm:items-center sm:gap-4">
          <Link
            href={returnHref}
            className="inline-flex items-center justify-center rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            {returnLabel}
          </Link>
          <Link
            href="/auth/login?redirect=/admin"
            className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/5"
          >
            Login as staff
          </Link>
        </div>
      </div>
    </div>
  );
}
