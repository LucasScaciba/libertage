import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Get all visits for this profile
    const { data: allVisits, error: visitsError } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("profile_id", profile.id)
      .eq("event_type", "visit")
      .order("created_at", { ascending: false })
      .limit(50);

    if (visitsError) {
      return NextResponse.json(
        { error: "Error fetching visits", details: visitsError },
        { status: 500 }
      );
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return NextResponse.json({
      profileId: profile.id,
      currentTime: now.toISOString(),
      twentyFourHoursAgo: twentyFourHoursAgo.toISOString(),
      totalVisits: allVisits?.length || 0,
      recentVisits: allVisits?.slice(0, 10).map(v => ({
        created_at: v.created_at,
        device_type: v.device_type,
        visitor_fingerprint: v.visitor_fingerprint?.substring(0, 20) + "...",
      })) || [],
      oldestVisit: allVisits?.[allVisits.length - 1]?.created_at,
      newestVisit: allVisits?.[0]?.created_at,
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json(
      { error: "Internal error", details: String(error) },
      { status: 500 }
    );
  }
}
