"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/admin/admin-ui";
import { ROLE_LABELS } from "@/lib/admin";
import { canRoleAccessPath, getActiveStaffByEmail, getHomePathForRole, type StoreCode } from "@/lib/access-control";
import { getSupabase } from "@/lib/supabase";
import type { StaffRole } from "@/lib/types";

type NavItem = {
  name: string;
  href: string;
  roles: StaffRole[];
  description: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    name: "Overview",
    href: "/admin",
    roles: ["super_admin", "store_admin"],
    description: "Revenue, orders, and stock visibility.",
  },
  {
    name: "Products",
    href: "/admin/products",
    roles: ["super_admin", "store_admin"],
    description: "Catalogue, pricing, barcodes, and product readiness.",
  },
  {
    name: "Inventory",
    href: "/admin/inventory",
    roles: ["super_admin", "store_admin"],
    description: "Stock levels, movements, losses, and adjustments.",
  },
  {
    name: "Orders",
    href: "/admin/orders",
    roles: ["super_admin", "store_admin", "cashier"],
    description: "Customer orders, payment states, and fulfilment flow.",
  },
  {
    name: "Rider queue",
    href: "/admin/rider",
    roles: ["super_admin", "rider"],
    description: "Assigned delivery flow and dispatch progress.",
  },
  {
    name: "Reports",
    href: "/admin/reports",
    roles: ["super_admin", "store_admin"],
    description: "Revenue, gross profit, stock pressure, and demand signals.",
  },
  {
    name: "Sales desk",
    href: "/admin/pos",
    roles: ["super_admin", "store_admin", "cashier"],
    description: "POS-ready product lookup and in-store sale flow.",
  },
  {
    name: "Staff",
    href: "/admin/staff",
    roles: ["super_admin", "store_admin"],
    description: "Operational roles, current access, and future enforcement.",
  },
  {
    name: "Partners",
    href: "/admin/partners",
    roles: ["super_admin", "store_admin"],
    description: "Review and approve wholesale partner applications.",
  },
  {
    name: "Settings",
    href: "/admin/settings",
    roles: ["super_admin", "store_admin"],
    description: "Store identity, defaults, contacts, and operating settings.",
  },
];

function hasRoleAccess(item: NavItem, role: StaffRole | null) {
  return !!role && item.roles.includes(role);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [storeCode, setStoreCode] = useState<StoreCode | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [partnersCount, setPartnersCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabase();

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (!session) {
        router.push("/auth/login?redirect=/admin");
        setLoading(false);
        return;
      }

      const email = (session.user.email ?? "").toLowerCase().trim();
      setUserEmail(email);

      const staff = await getActiveStaffByEmail(supabase, email);

      if (!staff) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      if (!canRoleAccessPath(staff.role, pathname)) {
        router.push(getHomePathForRole(staff.role));
        setLoading(false);
        return;
      }

      setRole(staff.role);
      setStoreCode(staff.store_code);

      // Fetch partners count
      const { count } = await supabase
        .from('wholesale_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setPartnersCount(count || 0);

      setLoading(false);
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [pathname, router, supabase]);

  const navItems = useMemo(() => NAV_ITEMS.filter((item) => hasRoleAccess(item, role)), [role]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--background)]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/15 border-t-[color:var(--accent)]" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(47,107,255,0.12),transparent_30%),linear-gradient(180deg,#0a0a0b_0%,#121417_100%)] px-6">
        <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/42">Admin access</div>
          <h1 className="mt-4 font-serif text-4xl text-white">Account is not on the operations allowlist.</h1>
          <p className="mt-4 text-sm leading-7 text-white/62">
            This account is not linked to an active staff record. Staff access requires an active match on email, role, and store assignment.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleLogout}
              className="rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/8"
            >
              Logout
            </button>
            <Link
              href="/auth/login?redirect=/admin"
              className="rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Login with a different account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(47,107,255,0.14),transparent_28%),linear-gradient(180deg,#0a0a0b_0%,#11161b_100%)] text-white">
      <aside className="hidden h-screen w-80 flex-col border-r border-white/8 bg-black/22 px-6 py-7 backdrop-blur lg:fixed lg:flex">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/40">Store OS</div>
          <div className="mt-3 font-serif text-3xl text-white">Canvus Control</div>
          <div className="mt-2 text-sm text-white/56">Wholesale operations, inventory management, and order fulfillment.</div>
          {role ? (
            <div className="mt-4">
              <Badge tone="sky">{ROLE_LABELS[role]}</Badge>
            </div>
          ) : null}
        </div>

        <nav className="mt-6 flex-1 space-y-2 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-[24px] border px-4 py-4 transition-colors ${
                  isActive
                    ? "border-[color:var(--accent)]/40 bg-[color:var(--accent)]/16"
                    : "border-white/8 bg-white/3 hover:bg-white/6"
                }`}
              >
                <div className="text-sm font-semibold text-white">
                  {item.name === 'Partners' && partnersCount > 0 ? `${item.name} (${partnersCount})` : item.name}
                </div>
                <div className="mt-1 text-sm leading-6 text-white/45">{item.description}</div>
              </Link>
            );
          })}
        </nav>

        <div className="rounded-[24px] border border-amber-400/18 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100/88">
          Staff access is tied to active staff records. Role and store scope are enforced per route.
        </div>

        <div className="mt-4 rounded-[24px] border border-white/8 bg-white/4 p-4 text-sm text-white/60">
          <div className="font-semibold text-white">Signed in</div>
          <div className="mt-1 break-all">{userEmail}</div>
          {storeCode ? <div className="mt-1">Store scope: {storeCode}</div> : null}
          <button
            onClick={handleLogout}
            className="mt-4 rounded-full border border-white/12 px-4 py-2 font-semibold text-white hover:bg-white/8"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:ml-80">
        <header className="sticky top-0 z-20 border-b border-white/8 bg-black/22 px-4 py-4 backdrop-blur sm:px-6 lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/42">Canvus Control</div>
              <div className="mt-1 font-serif text-2xl text-white">Admin control</div>
            </div>
            {role ? <Badge tone="sky">{ROLE_LABELS[role]}</Badge> : null}
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${
                    isActive
                      ? "border-[color:var(--accent)]/40 bg-[color:var(--accent)]/18 text-white"
                      : "border-white/10 bg-white/4 text-white/70"
                  }`}
                >
                  {item.name === 'Partners' && partnersCount > 0 ? `${item.name} (${partnersCount})` : item.name}
                </Link>
              );
            })}
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
