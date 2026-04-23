"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ActionButton,
  AdminPageHeader,
  EmptyState,
  MetricCard,
  Surface,
  SurfaceHeader,
} from "@/components/admin/admin-ui";
import { extractSupabaseErrorMessage, formatDateTime } from "@/lib/admin";
import { resolveAccessForCurrentSession } from "@/lib/staff-session";
import { getSupabase } from "@/lib/supabase";
import type { StoreSettings } from "@/lib/types";

type FormState = {
  store_name: string;
  public_brand_name: string;
  support_phone: string;
  support_email: string;
  physical_address: string;
  timezone_name: string;
  currency_code: string;
  low_stock_default: string;
  monday_hours: string;
  tuesday_hours: string;
  wednesday_hours: string;
  thursday_hours: string;
  friday_hours: string;
  saturday_hours: string;
  sunday_hours: string;
  default_delivery_fee: string;
  default_delivery_window_mins: string;
  allow_cash_on_delivery: boolean;
  send_order_sms: boolean;
  send_order_email: boolean;
};

const DEFAULT_FORM: FormState = {
  store_name: "Canvus Wholesale",
  public_brand_name: "Canvus",
  support_phone: "",
  support_email: "",
  physical_address: "",
  timezone_name: "Africa/Nairobi",
  currency_code: "KES",
  low_stock_default: "8",
  monday_hours: "08:00 - 21:00",
  tuesday_hours: "08:00 - 21:00",
  wednesday_hours: "08:00 - 21:00",
  thursday_hours: "08:00 - 21:00",
  friday_hours: "08:00 - 21:00",
  saturday_hours: "08:00 - 21:00",
  sunday_hours: "09:00 - 19:00",
  default_delivery_fee: "150",
  default_delivery_window_mins: "60",
  allow_cash_on_delivery: true,
  send_order_sms: false,
  send_order_email: true,
};

function mapSettingsToForm(settings: StoreSettings): FormState {
  const businessHours = settings.business_hours || {};
  const deliveryDefaults = settings.delivery_defaults || {};
  const adminPreferences = settings.admin_preferences || {};

  return {
    store_name: settings.store_name || DEFAULT_FORM.store_name,
    public_brand_name: settings.public_brand_name || DEFAULT_FORM.public_brand_name,
    support_phone: settings.support_phone || "",
    support_email: settings.support_email || "",
    physical_address: settings.physical_address || "",
    timezone_name: settings.timezone_name || DEFAULT_FORM.timezone_name,
    currency_code: settings.currency_code || DEFAULT_FORM.currency_code,
    low_stock_default: String(settings.low_stock_default ?? DEFAULT_FORM.low_stock_default),
    monday_hours: String(businessHours.monday || DEFAULT_FORM.monday_hours),
    tuesday_hours: String(businessHours.tuesday || DEFAULT_FORM.tuesday_hours),
    wednesday_hours: String(businessHours.wednesday || DEFAULT_FORM.wednesday_hours),
    thursday_hours: String(businessHours.thursday || DEFAULT_FORM.thursday_hours),
    friday_hours: String(businessHours.friday || DEFAULT_FORM.friday_hours),
    saturday_hours: String(businessHours.saturday || DEFAULT_FORM.saturday_hours),
    sunday_hours: String(businessHours.sunday || DEFAULT_FORM.sunday_hours),
    default_delivery_fee: String(deliveryDefaults.default_delivery_fee ?? DEFAULT_FORM.default_delivery_fee),
    default_delivery_window_mins: String(
      deliveryDefaults.default_delivery_window_mins ?? DEFAULT_FORM.default_delivery_window_mins
    ),
    allow_cash_on_delivery: Boolean(
      deliveryDefaults.allow_cash_on_delivery ?? DEFAULT_FORM.allow_cash_on_delivery
    ),
    send_order_sms: Boolean(adminPreferences.send_order_sms ?? DEFAULT_FORM.send_order_sms),
    send_order_email: Boolean(adminPreferences.send_order_email ?? DEFAULT_FORM.send_order_email),
  };
}

export default function AdminSettingsPage() {
  const supabase = getSupabase();

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [tableReady, setTableReady] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [viewerStoreCode, setViewerStoreCode] = useState("main");

  async function loadSettings() {
    setLoading(true);
    setWarning(null);

    try {
      const access = await resolveAccessForCurrentSession(supabase);
      const storeCode = access.storeCode || "main";
      setViewerStoreCode(storeCode);

      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("store_code", storeCode)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.message.includes("store_settings")) {
          setTableReady(false);
          setWarning(
            "Store settings table is not available yet. Apply the admin operations migration to persist these settings."
          );
          setForm(DEFAULT_FORM);
          return;
        }
        throw error;
      }

      setTableReady(true);
      if (data) {
        const parsed = mapSettingsToForm(data as StoreSettings);
        setForm(parsed);
        setUpdatedAt((data as StoreSettings).updated_at || null);
      } else {
        setForm(DEFAULT_FORM);
      }
    } catch (error) {
      setWarning(extractSupabaseErrorMessage(error));
      setForm(DEFAULT_FORM);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings(); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tableReady) {
      setWarning("Cannot save because store_settings table is not available yet.");
      return;
    }

    setSaving(true);
    setWarning(null);

    const payload: StoreSettings = {
      store_code: viewerStoreCode,
      store_name: form.store_name.trim() || null,
      public_brand_name: form.public_brand_name.trim() || null,
      support_phone: form.support_phone.trim() || null,
      support_email: form.support_email.trim() || null,
      physical_address: form.physical_address.trim() || null,
      timezone_name: form.timezone_name.trim() || "Africa/Nairobi",
      currency_code: form.currency_code.trim().toUpperCase() || "KES",
      low_stock_default: Number(form.low_stock_default || 0),
      business_hours: {
        monday: form.monday_hours,
        tuesday: form.tuesday_hours,
        wednesday: form.wednesday_hours,
        thursday: form.thursday_hours,
        friday: form.friday_hours,
        saturday: form.saturday_hours,
        sunday: form.sunday_hours,
      },
      delivery_defaults: {
        default_delivery_fee: Number(form.default_delivery_fee || 0),
        default_delivery_window_mins: Number(form.default_delivery_window_mins || 60),
        allow_cash_on_delivery: form.allow_cash_on_delivery,
      },
      admin_preferences: {
        send_order_sms: form.send_order_sms,
        send_order_email: form.send_order_email,
      },
    };

    try {
      const { data, error } = await supabase
        .from("store_settings")
        .upsert([payload], { onConflict: "store_code" })
        .select("*")
        .single();

      if (error) throw error;

      setFeedback("Settings saved.");
      setUpdatedAt((data as StoreSettings).updated_at || new Date().toISOString());
    } catch (error) {
      setWarning(extractSupabaseErrorMessage(error));
    } finally {
      setSaving(false);
    }
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
        eyebrow="Store settings"
        title="Operational defaults and business identity."
        description={`Configure store information, support contacts, inventory defaults, and delivery preferences used across admin workflows. Scope: ${viewerStoreCode}.`}
      />

      {warning ? (
        <Surface className="border-amber-400/18 bg-amber-400/10 p-5 text-sm leading-6 text-amber-50/90">
          {warning}
        </Surface>
      ) : null}
      {feedback ? (
        <Surface className="border-emerald-400/18 bg-emerald-400/10 p-5 text-sm leading-6 text-emerald-50/90">
          {feedback}
        </Surface>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Brand" value={form.public_brand_name || "Unset"} tone="sky" />
        <MetricCard label="Timezone" value={form.timezone_name || "Unset"} tone="indigo" />
        <MetricCard
          label="Last updated"
          value={updatedAt ? formatDateTime(updatedAt) : "Not saved yet"}
          tone="slate"
        />
      </div>

      {tableReady ? (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <Surface>
            <SurfaceHeader title="Store identity" description="What staff and customers should consistently see." />
            <div className="grid gap-4 px-5 py-5 md:grid-cols-2 sm:px-6">
              <label className="space-y-2 text-sm text-white/70">
                <span>Store name</span>
                <input
                  value={form.store_name}
                  onChange={(event) => setForm((current) => ({ ...current, store_name: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-white/70">
                <span>Public brand</span>
                <input
                  value={form.public_brand_name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, public_brand_name: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-white/70">
                <span>Support phone</span>
                <input
                  value={form.support_phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, support_phone: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-white/70">
                <span>Support email</span>
                <input
                  value={form.support_email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, support_email: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-white/70 md:col-span-2">
                <span>Physical address</span>
                <input
                  value={form.physical_address}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, physical_address: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </label>
            </div>
          </Surface>

          <Surface>
            <SurfaceHeader title="Operations defaults" description="Inventory thresholds and delivery assumptions." />
            <div className="grid gap-4 px-5 py-5 md:grid-cols-2 lg:grid-cols-4 sm:px-6">
              <label className="space-y-2 text-sm text-white/70">
                <span>Timezone</span>
                <input
                  value={form.timezone_name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, timezone_name: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-white/70">
                <span>Currency code</span>
                <input
                  value={form.currency_code}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, currency_code: event.target.value.toUpperCase() }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-white/70">
                <span>Low-stock default</span>
                <input
                  type="number"
                  min="0"
                  value={form.low_stock_default}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, low_stock_default: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-white/70">
                <span>Default delivery fee</span>
                <input
                  type="number"
                  min="0"
                  value={form.default_delivery_fee}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, default_delivery_fee: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-white/70">
                <span>Delivery window (mins)</span>
                <input
                  type="number"
                  min="5"
                  value={form.default_delivery_window_mins}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, default_delivery_window_mins: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </label>
            </div>
          </Surface>

          <Surface>
            <SurfaceHeader title="Business hours" />
            <div className="grid gap-4 px-5 py-5 md:grid-cols-2 lg:grid-cols-3 sm:px-6">
              <label className="space-y-2 text-sm text-white/70"><span>Monday</span><input value={form.monday_hours} onChange={(event) => setForm((current) => ({ ...current, monday_hours: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" /></label>
              <label className="space-y-2 text-sm text-white/70"><span>Tuesday</span><input value={form.tuesday_hours} onChange={(event) => setForm((current) => ({ ...current, tuesday_hours: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" /></label>
              <label className="space-y-2 text-sm text-white/70"><span>Wednesday</span><input value={form.wednesday_hours} onChange={(event) => setForm((current) => ({ ...current, wednesday_hours: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" /></label>
              <label className="space-y-2 text-sm text-white/70"><span>Thursday</span><input value={form.thursday_hours} onChange={(event) => setForm((current) => ({ ...current, thursday_hours: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" /></label>
              <label className="space-y-2 text-sm text-white/70"><span>Friday</span><input value={form.friday_hours} onChange={(event) => setForm((current) => ({ ...current, friday_hours: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" /></label>
              <label className="space-y-2 text-sm text-white/70"><span>Saturday</span><input value={form.saturday_hours} onChange={(event) => setForm((current) => ({ ...current, saturday_hours: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" /></label>
              <label className="space-y-2 text-sm text-white/70"><span>Sunday</span><input value={form.sunday_hours} onChange={(event) => setForm((current) => ({ ...current, sunday_hours: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" /></label>
            </div>
          </Surface>

          <Surface>
            <SurfaceHeader title="Notification and payment preferences" />
            <div className="grid gap-4 px-5 py-5 md:grid-cols-3 sm:px-6">
              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-sm text-white/75">
                <input
                  type="checkbox"
                  checked={form.allow_cash_on_delivery}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, allow_cash_on_delivery: event.target.checked }))
                  }
                />
                Allow cash on delivery
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-sm text-white/75">
                <input
                  type="checkbox"
                  checked={form.send_order_sms}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, send_order_sms: event.target.checked }))
                  }
                />
                Send SMS notifications
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-sm text-white/75">
                <input
                  type="checkbox"
                  checked={form.send_order_email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, send_order_email: event.target.checked }))
                  }
                />
                Send email notifications
              </label>
            </div>
          </Surface>

          <div className="flex justify-end">
            <ActionButton type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save settings"}
            </ActionButton>
          </div>
        </form>
      ) : (
        <Surface>
          <SurfaceHeader title="Settings persistence unavailable" />
          <div className="px-5 py-6 sm:px-6">
            <EmptyState
              title="Settings table is not ready"
              description="Run the latest admin operations migration to create store_settings, then this page will become fully persistent."
            />
          </div>
        </Surface>
      )}
    </div>
  );
}
