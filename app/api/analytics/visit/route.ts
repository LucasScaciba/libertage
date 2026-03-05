import { NextRequest, NextResponse } from "next/server";
import { AnalyticsService } from "@/lib/services/analytics.service";
import { GeolocationService } from "@/lib/services/geolocation.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile_id, device_type } = body;

    if (!profile_id) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Missing profile_id" } },
        { status: 400 }
      );
    }

    // Extract IP address from headers
    const ip = request.headers.get("x-forwarded-for")?.split(',')[0].trim() 
      || request.headers.get("x-real-ip") 
      || "unknown";

    // Generate a simple visitor fingerprint (IP + user-agent)
    const fingerprint =
      ip !== "unknown" ? ip : request.headers.get("user-agent") || "anonymous";

    // Get state from IP (with caching)
    let state = "Não identificado";
    if (ip !== "unknown") {
      state = await GeolocationService.getStateFromIP(ip);
    }

    // Track visit with state in metadata
    await AnalyticsService.trackVisit(profile_id, fingerprint, device_type, state);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in visit analytics:", error);
    // Return success even on error to not break user experience
    return NextResponse.json({ success: true });
  }
}
