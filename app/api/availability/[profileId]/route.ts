import { AuthService } from "@/lib/services/auth.service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { profileId: string } }
) {
  try {
    const supabase = await createClient();
    const profileId = params.profileId;

    const { data: availability, error } = await supabase
      .from("availability")
      .select("*")
      .eq("profile_id", profileId)
      .order("weekday", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ availability });
  } catch (error: any) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { profileId: string } }
) {
  try {
    const user = await AuthService.requireAuth();
    const supabase = await createClient();
    const profileId = params.profileId;

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

    // Delete all availability for this profile
    const { error } = await supabase
      .from("availability")
      .delete()
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
