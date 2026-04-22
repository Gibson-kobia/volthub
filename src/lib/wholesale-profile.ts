import { getSupabase } from "./supabase";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  account_type: "retail" | "wholesale_general" | "wholesale_school";
  institution_name: string | null;
  rep_role: string | null;
  application_status: "none" | "pending" | "approved" | "rejected";
  is_verified_wholesale: boolean;
}

/**
 * Fetch the current user's profile from Supabase
 * Returns null if user is not logged in or profile doesn't exist
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await getSupabase()
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data as UserProfile;
  } catch (err) {
    console.error("Unexpected error fetching profile:", err);
    return null;
  }
}

/**
 * Check if user has access to the wholesale portal
 */
export function canAccessWholesale(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return profile.is_verified_wholesale && profile.application_status === "approved";
}

/**
 * Get the user's wholesale application status description
 */
export function getWholesaleStatusDescription(profile: UserProfile | null): string {
  if (!profile) return "Not logged in";

  if (profile.account_type === "retail") {
    return "Retail account";
  }

  switch (profile.application_status) {
    case "pending":
      return "Application pending review";
    case "approved":
      return profile.is_verified_wholesale
        ? "Verified wholesale account"
        : "Approved but awaiting verification";
    case "rejected":
      return "Application rejected";
    default:
      return "Not applied";
  }
}
