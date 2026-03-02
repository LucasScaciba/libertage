import { AuthServerService } from "@/lib/services/auth-server.service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ profileId: string; id: string }> }
) {
  try {
    const user = await AuthServerService.requireAuth();
    const data = await request.json();
    const supabase = await createClient();
    const { profileId, id } = await params;

    // Verify profile ownership
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", profileId)
      .single();

    if (!profile || profile.user_id !== user.id) {
      return NextResponse.json(
        { error: "Profile not found or unauthorized" },
        { status: 404 }
      );
    }

    // Validate time range if both times provided
    if (data.start_time && data.end_time && data.start_time >= data.end_time) {
      return NextResponse.json(
        { error: "Start time must be before end time" },
        { status: 400 }
      );
    }

    // Update availability
    const { data: availability, error } = await supabase
      .from("availability")
      .update(data)
      .eq("id", id)
      .eq("profile_id", profileId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ availability });
  } catch (error: any) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update availability" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ profileId: string; id: string }> }
) {
  try {
    const user = await AuthServerService.requireAuth();
    const supabase = await createClient();
    const { profileId, id } = await params;

    // Verify profile ownership
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", profileId)
      .single();

    if (!profile || profile.user_id !== user.id) {
      return NextResponse.json(
        { error: "Profile not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete availability
    const { error } = await supabase
      .from("availability")
      .delete()
      .eq("id", id)
      .eq("profile_id", profileId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting availability:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete availability" },
      { status: 500 }
    );
  }
}
