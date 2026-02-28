import { AuthService } from "@/lib/services/auth.service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await AuthService.requireAuth();
    const data = await request.json();

    const { profile_id, weekday, start_time, end_time, is_available } = data;

    if (!profile_id || weekday === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate time range
    if (start_time >= end_time) {
      return NextResponse.json(
        { error: "Start time must be before end time" },
        { status: 400 }
      );
    }

    // Verify profile ownership
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", profile_id)
      .single();

    if (!profile || profile.user_id !== user.id) {
      return NextResponse.json(
        { error: "Profile not found or unauthorized" },
        { status: 404 }
      );
    }

    // Create availability
    const { data: availability, error } = await supabase
      .from("availability")
      .insert({
        profile_id,
        weekday,
        start_time,
        end_time,
        is_available: is_available !== false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ availability }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating availability:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create availability" },
      { status: 500 }
    );
  }
}
