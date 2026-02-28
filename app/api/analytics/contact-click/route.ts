import { NextRequest, NextResponse } from "next/server";
import { AnalyticsService } from "@/lib/services/analytics.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile_id, contact_method } = body;

    if (!profile_id || !contact_method) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    // Generate a simple visitor fingerprint (IP + user-agent)
    const fingerprint =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("user-agent") ||
      "anonymous";

    await AnalyticsService.trackContactClick(profile_id, contact_method, fingerprint);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in contact-click analytics:", error);
    // Return success even on error to not break user experience
    return NextResponse.json({ success: true });
  }
}
