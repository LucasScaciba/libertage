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

  // Check onboarding status for portal and admin paths
  if (path.startsWith("/portal") || path.startsWith("/admin")) {
    const supabase = await createClient();
    const { data: userData } = await supabase
      .from("users")
      .select("onboarding_completed, role")
      .eq("id", user.id)
      .single();

    // Redirect to onboarding if not completed
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
