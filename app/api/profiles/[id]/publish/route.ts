import { AuthServerService as AuthServerService } from "@/lib/services/auth-server.service";
import { ProfileService } from "@/lib/services/profile.service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthServerService.requireAuth();
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

    // Check publishing eligibility
    const eligible = await ProfileService.checkPublishingEligibility(user.id);
    if (!eligible) {
      return NextResponse.json(
        { error: "You must complete onboarding and have an active subscription to publish" },
        { status: 400 }
      );
    }

    await ProfileService.publishProfile(profileId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error publishing profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to publish profile" },
      { status: 500 }
    );
  }
}
