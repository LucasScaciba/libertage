import { AuthServerService as AuthServerService } from "@/lib/services/auth-server.service";
import { ProfileService } from "@/lib/services/profile.service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthServerService.requireAuth();
    const data = await request.json();
    const profileId = params.id;

    // Verify ownership
    const supabase = await createClient();
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

    // Validate short_description length if provided
    if (data.short_description && data.short_description.length > 160) {
      return NextResponse.json(
        { error: "Short description must be 160 characters or less" },
        { status: 400 }
      );
    }

    const updatedProfile = await ProfileService.updateProfile(profileId, data);

    return NextResponse.json({ profile: updatedProfile });
  } catch (error: any) {
    console.error("Error updating profile:", error);

    if (error.message?.includes("Slug can only be changed")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error.message?.includes("duplicate key")) {
      return NextResponse.json(
        { error: "This slug is already taken" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
