import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canRoleAccessPath, getHomePathForRole } from "../../../lib/access-control";

type VerifyType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email";

function isVerifyType(value: string | null): value is VerifyType {
	return Boolean(value && ["signup", "invite", "magiclink", "recovery", "email_change", "email"].includes(value));
}

function safeNextPath(value: string | null) {
	if (!value || !value.startsWith("/")) return null;
	if (value.startsWith("//")) return null;
	return value;
}

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const tokenHash = requestUrl.searchParams.get("token_hash");
	const typeParam = requestUrl.searchParams.get("type");
	const nextParam = safeNextPath(requestUrl.searchParams.get("next"));

	if (!tokenHash || !isVerifyType(typeParam)) {
		const loginUrl = new URL("/auth/login", requestUrl.origin);
		loginUrl.searchParams.set("confirm_error", "invalid_link");
		return NextResponse.redirect(loginUrl);
	}

	const cookieStore = await cookies();
	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(
					cookiesToSet: Array<{ name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] }>
				) {
					cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
				},
			},
		}
	);

	const { error } = await supabase.auth.verifyOtp({
		type: typeParam,
		token_hash: tokenHash,
	});

	if (error) {
		const loginUrl = new URL("/auth/login", requestUrl.origin);
		loginUrl.searchParams.set("confirm_error", "verification_failed");
		return NextResponse.redirect(loginUrl);
	}

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user?.email || !user.email_confirmed_at) {
		const loginUrl = new URL("/auth/login", requestUrl.origin);
		loginUrl.searchParams.set("confirm_error", "session_missing");
		return NextResponse.redirect(loginUrl);
	}

	let targetPath = "/account";
	const normalizedEmail = user.email.toLowerCase().trim();
	const { data: staff } = await supabase
		.from("staff_profiles")
		.select("role,is_active")
		.eq("is_active", true)
		.ilike("email", normalizedEmail)
		.maybeSingle();

	if (staff?.role) {
		const roleHome = getHomePathForRole(staff.role);
		if (nextParam && canRoleAccessPath(staff.role, nextParam)) {
			targetPath = nextParam;
		} else {
			targetPath = roleHome;
		}
	} else if (nextParam && !nextParam.startsWith("/admin") && !nextParam.startsWith("/rider")) {
		targetPath = nextParam;
	}

	const redirectUrl = new URL(targetPath, requestUrl.origin);
	redirectUrl.searchParams.set("confirmed", "1");
	return NextResponse.redirect(redirectUrl);
}
