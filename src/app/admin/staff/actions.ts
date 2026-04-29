"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { StaffRole } from "@/lib/types";

type CreateStaffResult =
  | { success: true; userId: string }
  | { success: false; error: string };

type DeactivateStaffResult =
  | { success: true }
  | { success: false; error: string };

export async function createStaff(
  email: string,
  fullName: string,
  role: StaffRole,
  storeCode: string
): Promise<CreateStaffResult> {
  // Explicit check for service role key before proceeding
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: "Missing Service Key - Supabase service role not configured." };
  }

  const supabase = createServerClient(cookies());

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log("SERVER_ACTION_AUTH_DEBUG:", {
    email: user?.email ?? null,
    id: user?.id ?? null,
    timestamp: new Date().toISOString(),
  });

  if (authError || !user?.email) {
    return { success: false, error: "Authentication required to create staff for Canvus Meru." };
  }

  const isOwner = user.email === 'gibsonkobia@gmail.com';
  if (isOwner) {
    console.log("OWNER BYPASS AUTH GRANTED", user.email);
  } else {
    // Run the normal database role check
    const { data: staffProfile } = await supabase
      .from("staff_profiles")
      .select("role, store_code")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!staffProfile || !["super_admin", "store_admin"].includes(staffProfile.role)) {
      return { success: false, error: "Insufficient permissions to create staff for Canvus Meru." };
    }

    if (staffProfile.role === "store_admin" && storeCode !== staffProfile.store_code) {
      return { success: false, error: "Store admins can only add staff within their Canvus Meru store." };
    }
  }

  const tempPassword = Math.random().toString(36).slice(-12) + "Temp!";

  try {
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (createError) {
      if (createError.message.includes("already registered")) {
        return { success: false, error: "This email is already registered with Canvus Meru." };
      }
      return { success: false, error: createError.message || "Failed to create Canvus Meru staff user." };
    }

    if (!authData.user) {
      return { success: false, error: "Failed to create Canvus Meru staff user." };
    }

    const { error: profileError } = await supabase
      .from("staff_profiles")
      .insert({
        user_id: authData.user.id,
        email: email.toLowerCase(),
        full_name: fullName,
        role,
        store_code: storeCode,
        is_active: true,
      });

    if (profileError) {
      console.error("Failed to create staff profile:", profileError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: profileError.message || "Failed to create Canvus Meru staff profile." };
    }

    const { error: logError } = await supabase
      .from("admin_logs")
      .insert({
        admin_user_id: user.id,
        admin_email: user.email,
        action_type: "create_staff",
        target_user_id: authData.user.id,
        target_email: email.toLowerCase(),
        details: {
          role,
          store_code: storeCode,
          full_name: fullName,
        },
      });

    if (logError) {
      console.error("Failed to log staff creation for Canvus Meru:", logError);
    }

    revalidatePath("/admin/staff");
    return { success: true, userId: authData.user.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Network error or timeout while creating Canvus Meru staff.";
    console.error("Error creating Canvus Meru staff:", error);
    return { success: false, error: errorMessage };
  }
}

export async function deactivateStaff(staffId: string): Promise<DeactivateStaffResult> {
  const supabase = createServerClient(cookies());

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log("SERVER_ACTION_AUTH_DEBUG:", {
    email: user?.email ?? null,
    id: user?.id ?? null,
    timestamp: new Date().toISOString(),
  });

  if (authError || !user?.email) {
    return { success: false, error: "Authentication required." };
  }

  const isOwner = user.email === 'gibsonkobia@gmail.com';
  let staffProfile: { role: string; store_code: string } | null = null;

  if (isOwner) {
    console.log("OWNER BYPASS AUTH GRANTED", user.email);
  } else {
    // Run the normal database role check
    const { data } = await supabase
      .from("staff_profiles")
      .select("role, store_code")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    staffProfile = data;

    if (!staffProfile || !["super_admin", "store_admin"].includes(staffProfile.role)) {
      return { success: false, error: "Insufficient permissions." };
    }
  }

  try {
    const { data: targetStaff, error: fetchError } = await supabase
      .from("staff_profiles")
      .select("user_id, email, role, store_code")
      .eq("id", staffId)
      .single();

    if (fetchError || !targetStaff) {
      return { success: false, error: "Staff not found." };
    }

    if (staffProfile && staffProfile.role === "store_admin" && targetStaff.store_code !== staffProfile.store_code) {
      return { success: false, error: "Cannot deactivate staff from a different store." };
    }

    const { error: updateError } = await supabase
      .from("staff_profiles")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", staffId);

    if (updateError) {
      throw updateError;
    }

    await supabase.auth.admin.deleteUser(targetStaff.user_id);

    const { error: logError } = await supabase
      .from("admin_logs")
      .insert({
        admin_user_id: user.id,
        admin_email: user.email,
        action_type: "deactivate_staff",
        target_user_id: targetStaff.user_id,
        target_email: targetStaff.email,
        details: {
          role: targetStaff.role,
          store_code: targetStaff.store_code,
        },
      });

    if (logError) {
      console.error("Failed to log staff deactivation:", logError);
    }

    revalidatePath("/admin/staff");
    return { success: true };
  } catch (error) {
    console.error("Error deactivating staff:", error);
    return { success: false, error: "Network error or timeout." };
  }
}
