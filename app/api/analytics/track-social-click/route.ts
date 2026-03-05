import { NextRequest, NextResponse } from "next/server";
import { AnalyticsService } from "@/lib/services/analytics.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { social_network, profile_id } = body;

    console.log('[track-social-click] Received body:', body);
    console.log('[track-social-click] social_network:', social_network);
    console.log('[track-social-click] profile_id:', profile_id);

    if (!social_network || !profile_id) {
      console.error('[track-social-click] Missing required fields:', { social_network, profile_id });
      return NextResponse.json(
        { error: "Missing required fields", received: { social_network, profile_id } },
        { status: 400 }
      );
    }

    const fingerprint = request.headers.get("x-forwarded-for") || "anonymous";
    
    await AnalyticsService.trackSocialClick(profile_id, social_network, fingerprint);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking social click:", error);
    return NextResponse.json({ success: true }); // Silent fail
  }
}
