"use client";

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function ApplyWholesalePage() {
  const [type, setType] = useState<'individual' | 'wholesale'>('individual');
  const [wholesaleKind, setWholesaleKind] = useState<'school' | 'business'>('school');
  const [schoolName, setSchoolName] = useState('');
  const [repName, setRepName] = useState('');
  const [repRole, setRepRole] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    const profileUpdate: any = {};

    if (type === 'wholesale') {
      profileUpdate.account_type = wholesaleKind === 'school' ? 'wholesale_school' : 'wholesale_general';
      profileUpdate.application_status = 'pending';
      profileUpdate.is_verified_wholesale = false;

      if (wholesaleKind === 'school') {
        profileUpdate.institution_name = schoolName;
        profileUpdate.rep_role = repRole || 'Representative';
      } else {
        profileUpdate.institution_name = businessName;
        profileUpdate.rep_role = contactPerson || 'Contact';
      }
    } else {
      profileUpdate.account_type = 'retail';
      profileUpdate.application_status = 'none';
    }

    try {
      if (!user) throw new Error('Not signed in');

      // Upsert profile row (assumes profiles table uses id = auth.uid)
      await supabase.from('profiles').upsert({ id: user.id, ...profileUpdate }, { onConflict: 'id' });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Could not submit application. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Request Received</h2>
          <p className="text-slate-600 mb-6">Your application for a Canvus Wholesale account is being reviewed. We will contact you via WhatsApp to verify your details.</p>
          <a href="/" className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold">Return to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Apply for Wholesale Access</h1>
        <p className="text-slate-600 mb-6">Choose account type and provide institution details for verification.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="flex gap-4 items-center">
            <label className="flex items-center gap-2">
              <input type="radio" name="type" checked={type === 'individual'} onChange={() => setType('individual')} />
              <span className="ml-1">Individual (Retail)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="type" checked={type === 'wholesale'} onChange={() => setType('wholesale')} />
              <span className="ml-1">Wholesale</span>
            </label>
          </fieldset>

          {type === 'wholesale' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" name="kind" checked={wholesaleKind === 'school'} onChange={() => setWholesaleKind('school')} />
                  <span className="ml-1">School / Institution</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="kind" checked={wholesaleKind === 'business'} onChange={() => setWholesaleKind('business')} />
                  <span className="ml-1">Business / Reseller</span>
                </label>
              </div>

              {wholesaleKind === 'school' ? (
                <div className="grid grid-cols-1 gap-3">
                  <input className="border p-3 rounded" placeholder="School Name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required />
                  <input className="border p-3 rounded" placeholder="Representative Name" value={repName} onChange={(e) => setRepName(e.target.value)} required />
                  <input className="border p-3 rounded" placeholder="Role in School (e.g., Bursar)" value={repRole} onChange={(e) => setRepRole(e.target.value)} required />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  <input className="border p-3 rounded" placeholder="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                  <input className="border p-3 rounded" placeholder="Contact Person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button type="submit" disabled={submitting} className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold disabled:opacity-60">
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
            <a href="/wholesale" className="text-sm text-slate-600">Back to Wholesale</a>
          </div>
        </form>
      </div>
    </div>
  );
}
