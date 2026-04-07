import type { SupabaseClient } from "@supabase/supabase-js";
import type { StaffRole } from "./types";

export const STORE_CODES = ["main", "volthub"] as const;
export type StoreCode = (typeof STORE_CODES)[number];

export const STAFF_ROLES = ["super_admin", "store_admin", "cashier", "rider"] as const;

export type StaffAccessRecord = {
  id: string;
  email: string;
  full_name: string | null;
  role: StaffRole;
  store_code: StoreCode;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

const DEFAULT_STORE_CODE: StoreCode = "main";

const ROLE_HOME_PATH: Record<StaffRole, string> = {
  super_admin: "/admin",
  store_admin: "/admin",
  cashier: "/admin/pos",
  rider: "/admin/rider",
};

const ROLE_ROUTE_PREFIXES: Record<StaffRole, string[]> = {
  super_admin: ["/admin", "/rider"],
  store_admin: [
    "/admin",
    "/admin/products",
    "/admin/inventory",
    "/admin/orders",
    "/admin/reports",
    "/admin/settings",
    "/admin/staff",
    "/admin/pos",
  ],
  cashier: ["/admin/pos", "/admin/orders"],
  rider: ["/admin/rider", "/rider"],
};

export function normalizeEmail(email?: string | null) {
  return (email || "").trim().toLowerCase();
}

export function isStoreCode(value?: string | null): value is StoreCode {
  return Boolean(value && STORE_CODES.includes(value as StoreCode));
}

export function normalizeStoreCode(value?: string | null): StoreCode {
  if (isStoreCode(value)) return value;
  return DEFAULT_STORE_CODE;
}

export function getHomePathForRole(role?: StaffRole | null) {
  if (!role) return "/account";
  return ROLE_HOME_PATH[role] || "/account";
}

export function getPostLoginPath(staff: StaffAccessRecord | null) {
  if (!staff) return "/account";
  return getHomePathForRole(staff.role);
}

function pathMatchesPrefix(pathname: string, prefix: string) {
  const normalizedPath = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  if (normalizedPath === prefix) return true;
  return normalizedPath.startsWith(`${prefix}/`);
}

export function canRoleAccessPath(role: StaffRole, pathname: string) {
  return ROLE_ROUTE_PREFIXES[role].some((prefix) => pathMatchesPrefix(pathname, prefix));
}

export function canAccessStore(role: StaffRole, assignedStore: StoreCode, requestedStore?: string | null) {
  if (role === "super_admin") return true;
  if (!requestedStore) return true;
  return normalizeStoreCode(requestedStore) === normalizeStoreCode(assignedStore);
}

export function isStaffRoute(pathname: string) {
  return pathMatchesPrefix(pathname, "/admin") || pathMatchesPrefix(pathname, "/rider");
}

export async function getActiveStaffByEmail(
  supabase: SupabaseClient,
  email?: string | null
): Promise<StaffAccessRecord | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const baseQuery = supabase
    .from("staff_profiles")
    .select("id,email,full_name,role,store_code,is_active,created_at,updated_at")
    .eq("is_active", true);

  // Match exact email first, then a case-insensitive fallback for legacy rows.
  const { data: exactData } = await baseQuery.eq("email", normalizedEmail).maybeSingle();
  if (exactData) {
    return {
      ...(exactData as StaffAccessRecord),
      store_code: normalizeStoreCode((exactData as StaffAccessRecord).store_code),
      email: normalizeEmail((exactData as StaffAccessRecord).email),
    };
  }

  const { data: ciData } = await supabase
    .from("staff_profiles")
    .select("id,email,full_name,role,store_code,is_active,created_at,updated_at")
    .eq("is_active", true)
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (!ciData) return null;

  return {
    ...(ciData as StaffAccessRecord),
    store_code: normalizeStoreCode((ciData as StaffAccessRecord).store_code),
    email: normalizeEmail((ciData as StaffAccessRecord).email),
  };
}
