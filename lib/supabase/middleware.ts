import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the auth session and guards the /admin + /client routes.
 * Role-based checks happen at the page level.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Gracefully skip auth when Supabase isn't configured yet (dev preview).
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  // Auth redirects must never be cached at the edge: a cached 307 would
  // loop once the user's session/cookie changes (logged in vs not).
  const noCache = (res: NextResponse) => {
    res.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    res.headers.set("Pragma", "no-cache");
    return res;
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: avoid running code between createServerClient and
  // supabase.auth.getUser() so the session is refreshed correctly.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isClientRoute = pathname.startsWith("/client");
  const isLoginRoute = pathname === "/admin/login" || pathname === "/client/login";
  const isAuthRoute = pathname === "/client/register";
  const isProtectedRoute = (isAdminRoute || isClientRoute) && !isLoginRoute && !isAuthRoute;

  // Suspended (banned) accounts must be treated as signed-out, even with a
  // valid unexpired session, so suspension cannot be bypassed via a stale
  // cookie or a direct API request.
  const isBanned =
    !!user?.banned_until && new Date(user.banned_until).getTime() > Date.now();

  if (isLoginRoute && user && !isBanned) {
    const url = request.nextUrl.clone();
    // Redirect to correct dashboard based on role
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      url.pathname = profile?.role === "client" ? "/client" : "/admin";
    } catch {
      url.pathname = isAdminRoute ? "/admin" : "/client";
    }
    url.search = "";
    return noCache(NextResponse.redirect(url));
  }

  if (isProtectedRoute && (!user || isBanned)) {
    const url = request.nextUrl.clone();
    url.pathname = isClientRoute ? "/client/login" : "/admin/login";
    url.search = "";
    return noCache(NextResponse.redirect(url));
  }

  return supabaseResponse;
}
