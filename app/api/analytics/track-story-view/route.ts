import { NextRequest, NextResponse } from "next/server";
import { AnalyticsService } from "@/lib/services/analytics.service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { story_id } = body;

    if (!story_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get profile_id from story's user_id
    const supabase = await createClient();
    const { data: story } = await supabase
      .from("stories")
      .select("user_id")
      .eq("id", story_id)
      .single();

    if (!story) {
      return NextResponse.json({ success: true }); // Silent fail
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", story.user_id)
      .single();

    if (!profile) {
      return NextResponse.json({ success: true }); // Silent fail
    }

    const fingerprint = request.headers.get("x-forwarded-for") || "anonymous";
    
    await AnalyticsService.trackStoryView(profile.id, story_id, fingerprint);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking story view:", error);
    return NextResponse.json({ success: true }); // Silent fail
  }
}
