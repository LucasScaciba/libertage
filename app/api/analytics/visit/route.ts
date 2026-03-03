import { NextRequest, NextResponse } from "next/server";
import { AnalyticsService } from "@/lib/services/analytics.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile_id, device_type } = body;

    console.log('[Visit API] Received tracking request:', { profile_id, device_type });

    if (!profile_id) {
      console.log('[Visit API] Missing profile_id');
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Missing profile_id" } },
        { status: 400 }
      );
    }

    // Generate a simple visitor fingerprint (IP + user-agent)
    const fingerprint =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("user-agent") ||
      "anonymous";

    console.log('[Visit API] Fingerprint:', fingerprint.substring(0, 50));

    await AnalyticsService.trackVisit(profile_id, fingerprint, device_type);

    console.log('[Visit API] Visit tracked successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in visit analytics:", error);
    // Return success even on error to not break user experience
    return NextResponse.json({ success: true });
  }
}
