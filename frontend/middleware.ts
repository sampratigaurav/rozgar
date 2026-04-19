import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Paths that never require authentication
const PUBLIC = ["/", "/auth/login", "/auth/signup", "/auth/verify", "/worker", "/partner", "/admin"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // ── Dashboard protection ─────────────────────────────────
  if (path.startsWith("/dashboard")) {
    if (!user) {
      // Not logged in → landing page
      return NextResponse.redirect(new URL("/", request.url));
    }
    const role = (user.user_metadata?.role as string | undefined) ?? "customer";
    if (!path.startsWith(`/dashboard/${role}`)) {
      // Logged in but wrong role URL → correct dashboard
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }
  }

  return response;
}

export const config = {
  // Only run middleware on dashboard routes — not on public pages, API routes, or static assets
  matcher: ["/dashboard/:path*"],
};