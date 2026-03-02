import { AuthServerService } from "@/lib/services/auth-server.service";
import { MediaService } from "@/lib/services/media.service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await AuthServerService.requireAuth();
    const { profileId, fileType, fileSize } = await request.json();

    if (!profileId || !fileType || !fileSize) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify profile ownership
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

    // Determine media type
    const type = fileType.startsWith("image/") ? "photo" : "video";

    // Check media limits
    const canUpload = await MediaService.validateMediaLimits(profileId, type);
    if (!canUpload) {
      return NextResponse.json(
        { error: `You have reached your ${type} upload limit for your current plan` },
        { status: 400 }
      );
    }

    // Generate upload URL
    const { uploadUrl, path } = await MediaService.generateUploadUrl(
      profileId,
      fileType,
      fileSize
    );

    return NextResponse.json({ uploadUrl, path });
  } catch (error: any) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
