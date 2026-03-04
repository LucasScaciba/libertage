import { AuthServerService } from "@/lib/services/auth-server.service";
import { ProfileService } from "@/lib/services/profile.service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await AuthServerService.requireAuth();
    const data = await request.json();
    const { id: profileId } = await params;

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

    // Validate service_categories if provided (at least one required)
    if (data.service_categories !== undefined) {
      if (!Array.isArray(data.service_categories) || data.service_categories.length === 0) {
        return NextResponse.json(
          { error: "At least one service category is required" },
          { status: 400 }
        );
      }
    }

    // Validate birthdate age range if provided (18-60 years)
    if (data.birthdate) {
      const birthDate = new Date(data.birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18 || age > 60) {
        return NextResponse.json(
          { error: "Age must be between 18 and 60 years" },
          { status: 400 }
        );
      }
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
