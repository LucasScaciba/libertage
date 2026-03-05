import { NextRequest, NextResponse } from "next/server";
import { AnalyticsService } from "@/lib/services/analytics.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { media_id, profile_id } = body;

    if (!media_id || !profile_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const fingerprint = request.headers.get("x-forwarded-for") || "anonymous";
    
    await AnalyticsService.trackMediaView(profile_id, media_id, fingerprint);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking media view:", error);
    return NextResponse.json({ success: true }); // Silent fail
  }
}
