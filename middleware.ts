import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canRoleAccessPath, getHomePathForRole, isStaffRoute } from "./src/lib/access-control";

function buildLoginRedirect(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/auth/login";
  loginUrl.searchParams.set("redirect", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return loginUrl;
}

function safeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] }>
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isConfirmedUser = Boolean(user?.email_confirmed_at);

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup");

  if (isAuthPage && user?.email && isConfirmedUser) {
    const requestedRedirect = safeRedirectPath(request.nextUrl.searchParams.get("redirect"));
    const { data: staff } = await supabase
      .from("staff_profiles")
      .select("role,is_active")
      .eq("is_active", true)
      .ilike("email", user.email.toLowerCase().trim())
      .maybeSingle();

    let target = staff?.role ? getHomePathForRole(staff.role) : "/account";
    if (requestedRedirect) {
      if (staff?.role && canRoleAccessPath(staff.role, requestedRedirect)) {
        target = requestedRedirect;
      } else if (!staff?.role && !isStaffRoute(requestedRedirect)) {
        target = requestedRedirect;
      }
    }
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (!isStaffRoute(pathname) && !pathname.startsWith("/wholesale")) {
    return response;
  }

  if (pathname.startsWith("/wholesale")) {
    if (!user?.email || !isConfirmedUser) {
      return NextResponse.redirect(buildLoginRedirect(request));
    }
    return response;
  }

  if (!user?.email || !isConfirmedUser) {
    return NextResponse.redirect(buildLoginRedirect(request));
  }

  const { data: staff } = await supabase
    .from("staff_profiles")
    .select("role,is_active")
    .eq("is_active", true)
    .ilike("email", user.email.toLowerCase().trim())
    .maybeSingle();

  if (!staff?.role) {
    return NextResponse.redirect(new URL("/account?denied=staff_required", request.url));
  }

  if (!canRoleAccessPath(staff.role, pathname)) {
    const redirectTo = getHomePathForRole(staff.role);
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/rider/:path*", "/wholesale/:path*", "/auth/login", "/auth/signup"],
};
