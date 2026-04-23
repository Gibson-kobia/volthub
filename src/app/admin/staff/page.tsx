"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ActionButton,
  AdminPageHeader,
  Badge,
  EmptyState,
  MetricCard,
  Surface,
  SurfaceHeader,
} from "@/components/admin/admin-ui";
import {
  extractSupabaseErrorMessage,
  formatCompactDate,
  formatNumber,
  ROLE_LABELS,
} from "@/lib/admin";
import { resolveAccessForCurrentSession } from "@/lib/staff-session";
import { getSupabase } from "@/lib/supabase";
import type { StaffProfile, StaffRole } from "@/lib/types";

const ROLE_OPTIONS: StaffRole[] = ["super_admin", "store_admin", "cashier", "rider"];

type StaffFormState = {
  email: string;
  full_name: string;
  role: StaffRole;
  store_code: string;
};

const DEFAULT_FORM: StaffFormState = {
  email: "",
  full_name: "",
  role: "cashier",
  store_code: "main",
};

export default function AdminStaffPage() {
  const supabase = getSupabase();

  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tableReady, setTableReady] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState<StaffFormState>(DEFAULT_FORM);
  const [viewerRole, setViewerRole] = useState<StaffRole | null>(null);
  const [viewerStoreCode, setViewerStoreCode] = useState("main");

  async function loadProfiles() {
    setLoading(true);
    setWarning(null);

    try {
      const access = await resolveAccessForCurrentSession(supabase);
      if (!access.isStaff || !access.role || !access.storeCode) {
        setProfiles([]);
        setTableReady(false);
        setWarning("No active staff profile was found for this account.");
        return;
      }

      setViewerRole(access.role);
      setViewerStoreCode(access.storeCode);

      let query = supabase
        .from("staff_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (access.role !== "super_admin") {
        query = query.eq("store_code", access.storeCode);
      }

      const { data, error } = await query;

      if (error) {
        if (error.message.includes("staff_profiles")) {
          setTableReady(false);
          setWarning("Staff table is not available yet. Apply the admin operations migration.");
          setProfiles([]);
          return;
        }
        throw error;
      }

      setTableReady(true);
      setProfiles((data || []) as StaffProfile[]);
    } catch (error) {
      setWarning(extractSupabaseErrorMessage(error));
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfiles(); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const roleCoverage = useMemo(() => {
    const counts: Record<StaffRole, number> = {
      super_admin: 0,
      store_admin: 0,
      cashier: 0,
      rider: 0,
    };

    profiles.forEach((profile) => {
      counts[profile.role] += 1;
    });

    return counts;
  }, [profiles]);

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tableReady) {
      setWarning("Cannot save staff because table is unavailable.");
      return;
    }

    const email = form.email.toLowerCase().trim();
    if (!email) {
      setWarning("Email is required.");
      return;
    }

    setSaving(true);
    setWarning(null);

    try {
      const payload: Partial<StaffProfile> = {
        email,
        full_name: form.full_name.trim() || null,
        role: form.role,
        store_code: viewerRole === "super_admin" ? form.store_code.trim() || "main" : viewerStoreCode,
        is_active: true,
      };

      if (viewerRole !== "super_admin" && form.role === "super_admin") {
        setWarning("Only super admins can assign the super_admin role.");
        return;
      }

      const { error } = await supabase.from("staff_profiles").upsert([payload], { onConflict: "email" });
      if (error) throw error;

      setFeedback("Staff profile saved.");
      setForm(DEFAULT_FORM);
      await loadProfiles();
    } catch (error) {
      setWarning(extractSupabaseErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(profile: StaffProfile) {
    if (!tableReady) return;
    if (viewerRole !== "super_admin" && profile.store_code !== viewerStoreCode) {
      setWarning("You can only manage staff in your own store.");
      return;
    }

    const { error } = await supabase
      .from("staff_profiles")
      .update({ is_active: !profile.is_active })
      .eq("id", profile.id);

    if (error) {
      setWarning(error.message);
      return;
    }

    await loadProfiles();
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/15 border-t-[color:var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Staff and roles"
        title="Operational team structure"
        description="Manage active staff identity by email, role, and store assignment. Signup alone does not grant staff access."
      />

      {warning ? (
        <Surface className="border-amber-400/18 bg-amber-400/10 p-5 text-sm leading-6 text-amber-50/90">{warning}</Surface>
      ) : null}
      {feedback ? (
        <Surface className="border-emerald-400/18 bg-emerald-400/10 p-5 text-sm leading-6 text-emerald-50/90">{feedback}</Surface>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Super admins" value={formatNumber(roleCoverage.super_admin)} tone="sky" />
        <MetricCard label="Store admins" value={formatNumber(roleCoverage.store_admin)} tone="indigo" />
        <MetricCard label="Cashiers" value={formatNumber(roleCoverage.cashier)} tone="emerald" />
        <MetricCard label="Riders" value={formatNumber(roleCoverage.rider)} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Surface>
          <SurfaceHeader title="Add or update staff" description="Creates or updates a role-bearing staff identity by email and store." />
          {tableReady ? (
            <form onSubmit={submitProfile} className="space-y-4 px-5 py-5 sm:px-6">
              <label className="space-y-2 text-sm text-white/70 block">
                <span>Email</span>
                <input
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  placeholder="staff@store.com"
                />
              </label>
              <label className="space-y-2 text-sm text-white/70 block">
                <span>Full name</span>
                <input
                  value={form.full_name}
                  onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  placeholder="Optional"
                />
              </label>
              <label className="space-y-2 text-sm text-white/70 block">
                <span>Role</span>
                <select
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as StaffRole }))}
                  className="w-full rounded-2xl border border-white/10 bg-[#10161d] px-4 py-3 text-white outline-none"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-white/70 block">
                <span>Store code</span>
                <input
                  value={form.store_code}
                  onChange={(event) => setForm((current) => ({ ...current, store_code: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  placeholder="main or canvus"
                  disabled={viewerRole !== "super_admin"}
                />
              </label>
              <ActionButton type="submit" disabled={saving}>{saving ? "Saving..." : "Save staff profile"}</ActionButton>
            </form>
          ) : (
            <div className="px-5 py-6 sm:px-6">
              <EmptyState title="Staff persistence unavailable" description="Apply migration to create staff_profiles and enable profile management." />
            </div>
          )}
        </Surface>

        <Surface>
          <SurfaceHeader title="Current staff records" description="Role and activation status for operators and supervisors." />
          <div className="space-y-3 px-5 py-5 sm:px-6">
            {profiles.length === 0 ? (
              <EmptyState title="No staff records" description="Add staff profiles to start role-aware operations." />
            ) : (
              profiles.map((profile) => (
                <div key={profile.id} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-white">{profile.full_name || profile.email}</div>
                      <div className="mt-1 text-xs text-white/50">{profile.email}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge tone="sky">{ROLE_LABELS[profile.role]}</Badge>
                        <Badge tone={profile.is_active ? "emerald" : "zinc"}>{profile.is_active ? "Active" : "Inactive"}</Badge>
                      </div>
                      <div className="mt-2 text-xs text-white/45">
                        Store: {profile.store_code || "main"} · Added {formatCompactDate(profile.created_at || "")}
                      </div>
                    </div>
                    {tableReady ? (
                      <ActionButton variant="ghost" onClick={() => void toggleActive(profile)}>
                        {profile.is_active ? "Deactivate" : "Reactivate"}
                      </ActionButton>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </Surface>
      </div>
    </div>
  );
}
