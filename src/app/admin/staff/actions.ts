"use server";

import { cookies } from "next/headers";
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";
import type { StaffRole } from "@/lib/types";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("MISSING_SERVICE_KEY");
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("MISSING_SUPABASE_URL");
}

console.log("[DEBUG] Client Init Success");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

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
  console.log("[DEBUG] Auth Start:", { email, timestamp: new Date().toISOString() });

  // Explicit check for service role key before proceeding
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: "Missing Service Key - Supabase service role not configured." };
  }

  console.log("[DEBUG] Service Role Check:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {

    const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  const refreshToken = cookieStore.get("sb-refresh-token")?.value;
  if (!accessToken) {
    return { success: false, error: "Authentication required to create staff for Canvus Meru." };
  }

  await supabaseAdmin.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken ?? "",
  });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
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
    const { data: staffProfile } = await supabaseAdmin
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

  const tempPassword = 'TemporaryPassword123!';

  // Pre-check if user exists
  const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
  console.log("[DEBUG] Existing user check:", { existingUser, error: getUserError });

  if (getUserError && !existingUser?.user) {
    console.error("SUPABASE_GET_USER_ERROR:", getUserError);
    return { success: false, error: `Auth Error: ${getUserError.message || JSON.stringify(getUserError)}` };
  }

  let userId: string;
  if (existingUser?.user) {
    console.log("[DEBUG] User exists, skipping createUser");
    userId = existingUser.user.id;
  } else {
    // Create new user
    const result = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    console.log("[DEBUG] Supabase Response:", { data: result.data, error: result.error });

    if (result.error) {
      console.error("SUPABASE_AUTH_ERROR:", result.error);
      return { success: false, error: `Auth Error: ${result.error.message || JSON.stringify(result.error)}` };
    }

    if (!result.data.user) {
      return { success: false, error: "Failed to create Canvus Meru staff user." };
    }

    userId = result.data.user.id;
  }

  // Insert into staff_profiles
  const { error: profileError } = await supabaseAdmin
    .from("staff_profiles")
    .insert({
      user_id: userId,
      email: email.toLowerCase(),
      full_name: fullName,
      role,
      store_code: storeCode,
      is_active: true,
    });

  if (profileError) {
    console.error("Failed to create staff profile:", profileError);
    if (!existingUser?.user) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    }
    return { success: false, error: profileError.message || JSON.stringify(profileError) };
  }

  // Log the action
  const { error: logError } = await supabaseAdmin
    .from("admin_logs")
    .insert({
      admin_user_id: user.id,
      admin_email: user.email,
      action_type: "create_staff",
      target_user_id: userId,
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
  return { success: true, userId };
} catch (err) {
  return { success: false, error: "Critical Engine Error: " + err.message };
}
}

export async function deactivateStaff(staffId: string): Promise<DeactivateStaffResult> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  const refreshToken = cookieStore.get("sb-refresh-token")?.value;
  if (!accessToken) {
    return { success: false, error: "Authentication required." };
  }

  await supabaseAdmin.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken ?? "",
  });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
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
    const { data } = await supabaseAdmin
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
    const { data: targetStaff, error: fetchError } = await supabaseAdmin
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

    const { error: updateError } = await supabaseAdmin
      .from("staff_profiles")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", staffId);

    if (updateError) {
      throw updateError;
    }

    await supabaseAdmin.auth.admin.deleteUser(targetStaff.user_id);

    const { error: logError } = await supabaseAdmin
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
} catch (err) {
  return { success: false, error: "Critical Engine Error: " + err.message };
}
}
