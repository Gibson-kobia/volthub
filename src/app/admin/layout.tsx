"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/admin/admin-ui";
import AdminAccessGuard from "@/components/admin/access-guard";
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
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-600" />
      </div>
    );
  }

  if (accessDenied) {
    return <AdminAccessGuard />;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-900 admin-theme">
      <aside className="hidden h-screen w-80 flex-col border-r border-gray-200 bg-white px-6 py-7 lg:fixed lg:flex">
        <div className="rounded-[28px] border border-gray-200 bg-white p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">Canvus Ops</div>
          <div className="mt-3 font-serif text-3xl text-zinc-900">Canvus Ops</div>
          <div className="mt-2 text-sm text-zinc-600">Canvus operations, inventory management, and order fulfillment.</div>
          {role ? (
            <div className="mt-4">
              <Badge tone="emerald">{ROLE_LABELS[role]}</Badge>
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
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                } ${isActive ? "border-l-4" : ""}`}
              >
                <div className="text-sm font-semibold text-zinc-900">
                  {item.name === 'Partners' && partnersCount > 0 ? `${item.name} (${partnersCount})` : item.name}
                </div>
                <div className="mt-1 text-sm leading-6 text-zinc-500">{item.description}</div>
              </Link>
            );
          })}
        </nav>

        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          Staff access is tied to active staff records. Role and store scope are enforced per route.
        </div>

        <div className="mt-4 rounded-[24px] border border-gray-200 bg-white p-4 text-sm text-zinc-600">
          <div className="font-semibold text-zinc-900">Signed in</div>
          <div className="mt-1 break-all">{userEmail}</div>
          {storeCode ? <div className="mt-1">Store scope: {storeCode}</div> : null}
          <button
            onClick={handleLogout}
            className="mt-4 rounded-full border border-gray-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:ml-80">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-4 py-4 backdrop-blur sm:px-6 lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">Canvus Ops</div>
              <div className="mt-1 font-serif text-2xl text-zinc-900">Admin control</div>
            </div>
            {role ? <Badge tone="emerald">{ROLE_LABELS[role]}</Badge> : null}
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
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-gray-200 bg-white text-zinc-700"
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
