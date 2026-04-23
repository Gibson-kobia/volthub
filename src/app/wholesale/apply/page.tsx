"use client";

import { WholesaleApplicationForm } from "../../../components/wholesale/wholesale-application-form";

export default function WholesaleApplyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-3xl text-white mb-2 text-center">Wholesale Application</h1>
        <p className="text-zinc-500 text-sm mb-8 text-center">
          Apply for wholesale access to the Canvus Bulk Portal.
        </p>
        <WholesaleApplicationForm />
      </div>
    </div>
  );
}