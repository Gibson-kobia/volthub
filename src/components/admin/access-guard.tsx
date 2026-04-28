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
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6 py-10">
      <div className="w-full max-w-3xl rounded-[32px] border border-gray-200 bg-white p-8 shadow-xl">
        <div className="inline-flex rounded-full border border-gray-200 bg-stone-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-700">
          Access restricted
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-900">Premium admin access required</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
          This section is reserved for verified Canvus operators. A customer or unauthorised account will not be able to use admin workflows until a staff role is assigned.
        </p>
        <div className="mt-8 grid gap-3 sm:flex sm:items-center sm:gap-4">
          <Link
            href={returnHref}
            className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-gray-50"
          >
            {returnLabel}
          </Link>
          <Link
            href="/auth/login?redirect=/admin"
            className="inline-flex items-center justify-center rounded-full bg-[#004225] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#003018]"
          >
            Login as staff
          </Link>
        </div>
      </div>
    </div>
  );
}
