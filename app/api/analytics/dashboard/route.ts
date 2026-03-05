import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsService } from "@/lib/services/analytics.service";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Fetch all dashboard data in parallel (old + new indicators)
    const [
      analyticsSummary,
      mediaViews,
      socialClicks,
      storyViews,
      visitsByDay,
      visitsByState,
      visibilityRank,
      contactChannels,
    ] = await Promise.all([
      AnalyticsService.getAnalyticsSummary(profile.id).catch((err) => {
        console.error("Error fetching analytics summary:", err);
        return {
          visitsToday: 0,
          visits7Days: 0,
          visits30Days: 0,
          visits12Months: 0,
          clicksByMethod: {},
        };
      }),
      AnalyticsService.getMediaViews(profile.id).catch((err) => {
        console.error("Error fetching media views:", err);
        return [];
      }),
      AnalyticsService.getSocialClicks(profile.id).catch((err) => {
        console.error("Error fetching social clicks:", err);
        return [];
      }),
      AnalyticsService.getStoryViews(profile.id).catch((err) => {
        console.error("Error fetching story views:", err);
        return [];
      }),
      AnalyticsService.getVisitsByDay(profile.id).catch((err) => {
        console.error("Error fetching visits by day:", err);
        return [];
      }),
      AnalyticsService.getVisitsByState(profile.id).catch((err) => {
        console.error("Error fetching visits by state:", err);
        return [];
      }),
      AnalyticsService.getVisibilityRank(profile.id).catch((err) => {
        console.error("Error fetching visibility rank:", err);
        return null;
      }),
      AnalyticsService.getContactChannels(profile.id).catch((err) => {
        console.error("Error fetching contact channels:", err);
        return [];
      }),
    ]);

    // Return both old format (for backward compatibility) and new indicators
    return NextResponse.json({
      // Old format (for existing SectionCards component)
      ...analyticsSummary,
      // New indicators
      indicators: {
        mediaViews,
        socialClicks,
        storyViews,
        visitsByDay,
        visitsByState,
        visibilityRank,
        contactChannels,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
