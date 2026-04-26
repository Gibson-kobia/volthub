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
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-10">
      <div className="w-full max-w-3xl rounded-lg border border-light-border bg-off-white p-8 shadow-sm">
        <div className="inline-flex rounded-lg border border-light-border bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">
          Access restricted
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-deep-ink">Premium admin access required</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
          This section is reserved for verified Canvus operators. A customer or unauthorised account will not be able to use admin workflows until a staff role is assigned.
        </p>
        <div className="mt-8 grid gap-3 sm:flex sm:items-center sm:gap-4">
          <Link
            href={returnHref}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            {returnLabel}
          </Link>
          <Link
            href="/auth/login?redirect=/admin"
            className="inline-flex items-center justify-center rounded-lg border border-light-border px-5 py-3 text-sm font-semibold text-deep-ink transition hover:bg-light-border"
          >
            Login as staff
          </Link>
        </div>
      </div>
    </div>
  );
}
