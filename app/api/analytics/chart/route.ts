import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsService } from "@/lib/services/analytics.service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
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
        { error: { code: "NOT_FOUND", message: "Profile not found" } },
        { status: 404 }
      );
    }

    // Get days parameter from query string (default 90)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "90");

    // Get visits by date
    const visitsByDate = await AnalyticsService.getVisitsByDate(profile.id, days);

    return NextResponse.json({ visitsByDate });
  } catch (error) {
    console.error("Error fetching analytics chart:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch analytics" } },
      { status: 500 }
    );
  }
}
