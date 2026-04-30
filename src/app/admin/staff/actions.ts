"use server";

import { headers } from "next/headers";
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";
import type { StaffRole } from "@/lib/types";

// Bypass @supabase/ssr and Next.js Server Action header incompatibilities by using a raw service-role Supabase client.
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

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  return Buffer.from(padded, 'base64').toString('utf-8');
}

function parseJWTPayload(token: string): { sub?: string; email?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return {};
    const payload = parts[1];
    const decoded = decodeBase64Url(payload);
    return JSON.parse(decoded);
  } catch (err) {
    console.error("[JWT_PARSE_ERROR]", err);
    return {};
  }
}

function parseCookieHeader(headerValue: string): Record<string, string> {
  return headerValue.split(';').reduce<Record<string, string>>((acc, raw) => {
    const [key, ...rest] = raw.split('=');
    if (!key) return acc;
    acc[key.trim()] = rest.join('=').trim();
    return acc;
  }, {});
}

function getEmailFromCookieValue(value: string): string | null {
  if (!value) return null;

  // If the token looks like a JWT, parse payload directly
  if (value.split('.').length === 3) {
    const payload = parseJWTPayload(value);
    return payload.email || null;
  }

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.includes('email')) {
      const parsed = JSON.parse(decoded);
      return parsed?.user?.email || null;
    }
  } catch {
    // ignore malformed JSON/URI
  }

  return null;
}

async function extractUserEmailFromCookies(): Promise<string | null> {
  const cookieHeader = (await headers()).get('cookie') || '';
  const cookiesMap = parseCookieHeader(cookieHeader);

  const rawTokenNames = [
    'sb-tjuabpmmfnqlqbghfha-auth-token',
    'sb-access-token',
    'sb-auth-token',
    'sb-session',
  ];

  for (const tokenName of rawTokenNames) {
    const rawValue = cookiesMap[tokenName];
    if (!rawValue) continue;
    const email = getEmailFromCookieValue(rawValue);
    if (email) return email;
  }

  return null;
}

/**
 * Log an administrative action to the audit trail
 * This runs even if the action itself fails, to track unauthorized attempts
 */
async function logAdminAction(
  event: string,
  actor: string | null,
  target: string | null,
  actionType: string,
  role: string | null,
  status: "success" | "failed",
  errorMessage?: string
): Promise<void> {
  const auditDetails = {
    status,
    event,
    role: role ? role.toLowerCase() : null,
    errorMessage: errorMessage || null,
    timestamp: new Date().toISOString(),
  };

  const detailsString = `Action: ${actionType}, Role: ${role ? role.toLowerCase() : 'unknown'}` +
    (errorMessage ? `, Error: ${errorMessage}` : '');

  try {
    await supabaseAdmin
      .from("admin_logs")
      .insert({
        admin_email: actor || "SYSTEM",
        admin_user_id: null,
        action_type: actionType,
        target_email: target,
        target_user_id: null,
        details: auditDetails,
      });
  } catch (logErr) {
    console.error("[ADMIN_LOG_FAILED]", logErr);
  }

  try {
    await supabaseAdmin.from("system_logs").insert({
      event: "STAFF_MODIFICATION",
      actor: actor || "SYSTEM",
      target,
      details: detailsString,
    });
  } catch (systemLogErr) {
    console.error("[SYSTEM_LOG_FAILED]", systemLogErr);
  }
}

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

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedRole = role.toLowerCase() as StaffRole;
  const normalizedStoreCode = storeCode.trim();

  try {
    // Extract user email from cookies using manual JWT parsing
    const actorEmail = await extractUserEmailFromCookies();
    console.log("[DEBUG] Extracted Actor Email:", actorEmail || "UNKNOWN");

    const isOwner = actorEmail === 'gibsonkobia@gmail.com';
    
    if (!isOwner && !actorEmail) {
      await logAdminAction(
        "CREATE_STAFF_ATTEMPT",
        null,
        normalizedEmail,
        "create_staff",
        normalizedRole,
        "failed",
        "No authentication token found"
      );
      return { success: false, error: "Authentication required to create staff for Canvus Meru." };
    }

    // Authorization check
    if (isOwner) {
      console.log("[OWNER_BYPASS_AUTH_GRANTED]", actorEmail);
    } else {
      // Run the normal database role check
      const { data: staffProfile, error: staffError } = await supabaseAdmin
        .from("staff_profiles")
        .select("role, store_code")
        .eq("email", actorEmail)
        .eq("is_active", true)
        .single();

      if (staffError || !staffProfile || !["super_admin", "store_admin"].includes(staffProfile.role)) {
        await logAdminAction(
          "CREATE_STAFF_UNAUTHORIZED",
          actorEmail,
          normalizedEmail,
          "create_staff",
          normalizedRole,
          "failed",
          "Insufficient permissions to create staff"
        );
        return { success: false, error: "Insufficient permissions to create staff for Canvus Meru." };
      }

      if (staffProfile.role === "store_admin" && normalizedStoreCode !== staffProfile.store_code) {
        await logAdminAction(
          "CREATE_STAFF_STORE_SCOPE_VIOLATION",
          actorEmail,
          normalizedEmail,
          "create_staff",
          normalizedRole,
          "failed",
          `Store admin attempted to add staff outside their store (${normalizedStoreCode})`
        );
        return { success: false, error: "Store admins can only add staff within their Canvus Meru store." };
      }
    }

    // Administrative invariant audit: verify the target table exists and service role bypass is available.
    const { error: tableAuditError } = await supabaseAdmin
      .from("staff_profiles")
      .select("id")
      .limit(1);

    if (tableAuditError) {
      console.error("[AUDIT] staff_profiles table audit failed:", tableAuditError);
      await logAdminAction(
        "CREATE_STAFF_TABLE_AUDIT_FAILED",
        actorEmail || "SYSTEM",
        normalizedEmail,
        "create_staff",
        normalizedRole,
        "failed",
        `Database audit failed: ${tableAuditError.message}`
      );
      return { success: false, error: `Database audit failed: ${tableAuditError.message || JSON.stringify(tableAuditError)}` };
    }

    console.log("[AUDIT] Invariants passed: ServiceKey present, Table found.");

    // Check for existing user (conflict prevention)
    const { data: listUsersData, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers({
      query: normalizedEmail,
      limit: 1,
    });

    if (listUsersError) {
      console.error("SUPABASE_LIST_USERS_ERROR:", listUsersError);
      await logAdminAction(
        "CREATE_STAFF_AUTH_CHECK_FAILED",
        actorEmail || "SYSTEM",
        normalizedEmail,
        "create_staff",
        normalizedRole,
        "failed",
        `Auth error: ${listUsersError.message}`
      );
      return { success: false, error: `Auth Error: ${listUsersError.message || JSON.stringify(listUsersError)}` };
    }

    type ListUserShape = { id: string; email: string };
    const existingUser = (listUsersData?.users as Array<ListUserShape> | undefined)?.find(
      (user) => user.email === normalizedEmail
    ) || null;
    const tempPassword = 'TemporaryPassword123!';
    let userId: string;

    if (existingUser) {
      // User already exists, reuse their ID
      console.log("[DEBUG] User exists, skipping createUser - conflict prevention");
      userId = existingUser.id;
    } else {
      // Create new user
      const result = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true,
      });

      console.log("[DEBUG] Supabase Response:", { data: result.data, error: result.error });

      if (result.error) {
        console.error("SUPABASE_AUTH_ERROR:", result.error);
        await logAdminAction(
          "CREATE_STAFF_AUTH_CREATION_FAILED",
          actorEmail || "SYSTEM",
          normalizedEmail,
          "create_staff",
          normalizedRole,
          "failed",
          `Auth creation error: ${result.error.message}`
        );
        return { success: false, error: `Auth Error: ${result.error.message || JSON.stringify(result.error)}` };
      }

      if (!result.data.user) {
        await logAdminAction(
          "CREATE_STAFF_AUTH_CREATION_FAILED",
          actorEmail || "SYSTEM",
          normalizedEmail,
          "create_staff",
          normalizedRole,
          "failed",
          "Failed to create Supabase auth user (no user ID returned)"
        );
        return { success: false, error: "Failed to create Canvus Meru staff user." };
      }

      userId = result.data.user.id;
    }

    // Upsert into staff_profiles (handle existing profile edge case)
    const { error: profileError } = await supabaseAdmin
      .from("staff_profiles")
      .upsert(
        {
          user_id: userId,
          email: normalizedEmail,
          full_name: fullName,
          role: normalizedRole,
          store_code: normalizedStoreCode,
          is_active: true,
        },
        { onConflict: "email" }
      );

    if (profileError) {
      console.error("Failed to create staff profile:", profileError);
      await logAdminAction(
        "CREATE_STAFF_PROFILE_INSERT_FAILED",
        actorEmail || "SYSTEM",
        normalizedEmail,
        "create_staff",
        normalizedRole,
        "failed",
        `Profile insert error: ${profileError.message}`
      );
      // Do NOT delete the auth user on profile failure; let admins retry without recreating auth
      return { success: false, error: profileError.message || JSON.stringify(profileError) };
    }

    // Log the successful action
    await logAdminAction(
      "CREATE_STAFF_SUCCESS",
      actorEmail || "SYSTEM",
      normalizedEmail,
      "create_staff",
      normalizedRole,
      "success"
    );

    revalidatePath("/admin/staff");
    return { success: true, userId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await logAdminAction(
      "CREATE_STAFF_EXCEPTION",
      "SYSTEM",
      email.toLowerCase(),
      "create_staff",
      role,
      "failed",
      errorMsg
    );
    return { success: false, error: "Critical Engine Error: " + errorMsg };
  }
}

export async function deactivateStaff(staffId: string): Promise<DeactivateStaffResult> {
  try {
    // Extract user email from cookies using manual JWT parsing
    const actorEmail = await extractUserEmailFromCookies();
    console.log("[DEBUG] Extracted Actor Email:", actorEmail || "UNKNOWN");

    const isOwner = actorEmail === 'gibsonkobia@gmail.com';

    if (!isOwner && !actorEmail) {
      await logAdminAction(
        "DEACTIVATE_STAFF_ATTEMPT",
        null,
        null,
        "deactivate_staff",
        null,
        "failed",
        "No authentication token found"
      );
      return { success: false, error: "Authentication required." };
    }

    let staffProfile: { role: string; store_code: string } | null = null;

    // Authorization check
    if (isOwner) {
      console.log("[OWNER_BYPASS_AUTH_GRANTED]", actorEmail);
    } else {
      // Run the normal database role check
      const { data } = await supabaseAdmin
        .from("staff_profiles")
        .select("role, store_code")
        .eq("email", actorEmail)
        .eq("is_active", true)
        .single();

      staffProfile = data;

      if (!staffProfile || !["super_admin", "store_admin"].includes(staffProfile.role)) {
        await logAdminAction(
          "DEACTIVATE_STAFF_UNAUTHORIZED",
          actorEmail,
          null,
          "deactivate_staff",
          null,
          "failed",
          "Insufficient permissions to deactivate staff"
        );
        return { success: false, error: "Insufficient permissions." };
      }
    }

    // Fetch the staff member to be deactivated
    const { data: targetStaff, error: fetchError } = await supabaseAdmin
      .from("staff_profiles")
      .select("id, user_id, email, role, store_code")
      .eq("id", staffId)
      .single();

    if (fetchError || !targetStaff) {
      await logAdminAction(
        "DEACTIVATE_STAFF_NOT_FOUND",
        actorEmail || "SYSTEM",
        null,
        "deactivate_staff",
        null,
        "failed",
        `Staff member not found: ${staffId}`
      );
      return { success: false, error: "Staff not found." };
    }

    // Store scope validation for non-owners
    if (staffProfile && staffProfile.role === "store_admin" && targetStaff.store_code !== staffProfile.store_code) {
      await logAdminAction(
        "DEACTIVATE_STAFF_STORE_SCOPE_VIOLATION",
        actorEmail,
        targetStaff.email,
        "deactivate_staff",
        targetStaff.role,
        "failed",
        `Store admin attempted to deactivate staff outside their store`
      );
      return { success: false, error: "Cannot deactivate staff from a different store." };
    }

    // SOFT DELETION: Flip is_active instead of deleting auth user
    // This preserves sales history and audit trails
    const { error: updateError } = await supabaseAdmin
      .from("staff_profiles")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", staffId);

    if (updateError) {
      await logAdminAction(
        "DEACTIVATE_STAFF_UPDATE_FAILED",
        actorEmail || "SYSTEM",
        targetStaff.email,
        "deactivate_staff",
        targetStaff.role,
        "failed",
        `Profile update error: ${updateError.message}`
      );
      throw updateError;
    }

    // Optionally disable auth token (but do NOT delete the user)
    // The user remains in auth.users for audit and recovery purposes
    if (targetStaff.user_id) {
      try {
        // Schedule user for deletion or disable them (Supabase doesn't have a "disable" option)
        // For now, we just log the intent; the soft delete in staff_profiles is sufficient
        console.log("[INFO] Staff member deactivated (soft delete):", targetStaff.email);
      } catch (err) {
        console.error("[WARNING] Could not disable auth user:", err);
        // Do NOT fail the entire operation if auth user disabling fails
      }
    }

    // Log the successful action
    await logAdminAction(
      "DEACTIVATE_STAFF_SUCCESS",
      actorEmail || "SYSTEM",
      targetStaff.email,
      "deactivate_staff",
      targetStaff.role,
      "success"
    );

    revalidatePath("/admin/staff");
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await logAdminAction(
      "DEACTIVATE_STAFF_EXCEPTION",
      "SYSTEM",
      null,
      "deactivate_staff",
      null,
      "failed",
      errorMsg
    );
    return { success: false, error: "Critical Engine Error: " + errorMsg };
  }
}
