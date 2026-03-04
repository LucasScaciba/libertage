import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createClient } from "@/lib/supabase/server";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = ["/", "/catalog", "/profiles", "/api/catalog", "/api/profiles", "/api/analytics", "/api/reports"];
  const isPublicPath = publicPaths.some(p => path.startsWith(p)) || path === "/";
  const isAuthPath = path.startsWith("/api/auth");

  // Allow public paths and auth paths
  if (isPublicPath || isAuthPath) {
    return supabaseResponse;
  }

  // Require authentication for protected paths
  if (!user) {
    // Redirect to home page if not authenticated
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check phone validation and onboarding status for protected paths
  if (path.startsWith("/portal") || path.startsWith("/admin") || path.startsWith("/onboarding")) {
    const supabase = await createClient();
    const { data: userData } = await supabase
      .from("users")
      .select("phone_verified_at, onboarding_completed, role")
      .eq("id", user.id)
      .single();

    // Priority 1: Phone validation (must come before onboarding)
    if (userData?.phone_verified_at === null) {
      return NextResponse.redirect(new URL("/phone-validation", request.url));
    }

    // Priority 2: Onboarding (after phone validation)
    if (!userData?.onboarding_completed && !path.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // Redirect to portal if onboarding completed but trying to access onboarding
    if (userData?.onboarding_completed && path.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }

    // Check admin/moderator role for admin paths
    if (path.startsWith("/admin")) {
      if (userData?.role !== "admin" && userData?.role !== "moderator") {
        return NextResponse.redirect(new URL("/portal", request.url));
      }
    }
  }

  // Allow access to phone validation page for authenticated users
  if (path.startsWith("/phone-validation")) {
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
