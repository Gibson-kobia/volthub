import type { SupabaseClient } from "@supabase/supabase-js";
import {
  canRoleAccessPath,
  getActiveStaffByEmail,
  getHomePathForRole,
  getPostLoginPath,
  normalizeStoreCode,
  type StaffAccessRecord,
  type StoreCode,
} from "./access-control";

export type AccessResolution = {
  email: string;
  isStaff: boolean;
  role: StaffAccessRecord["role"] | null;
  storeCode: StoreCode | null;
  staff: StaffAccessRecord | null;
};

export async function resolveAccessForCurrentSession(
  supabase: SupabaseClient
): Promise<AccessResolution> {
  const { data } = await supabase.auth.getSession();
  const email = (data.session?.user.email || "").trim().toLowerCase();

  if (!email) {
    return {
      email: "",
      isStaff: false,
      role: null,
      storeCode: null,
      staff: null,
    };
  }

  const staff = await getActiveStaffByEmail(supabase, email);

  if (!staff) {
    return {
      email,
      isStaff: false,
      role: null,
      storeCode: null,
      staff: null,
    };
  }

  return {
    email,
    isStaff: true,
    role: staff.role,
    storeCode: normalizeStoreCode(staff.store_code),
    staff,
  };
}

export function getPostLoginRedirectPath(staff: StaffAccessRecord | null) {
  return getPostLoginPath(staff);
}

export function getUnauthorizedRedirectPath(staff: StaffAccessRecord | null, pathname: string) {
  if (!staff) return "/account";
  if (canRoleAccessPath(staff.role, pathname)) return pathname;
  return getHomePathForRole(staff.role);
}
