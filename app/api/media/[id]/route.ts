import { AuthServerService as AuthServerService } from "@/lib/services/auth-server.service";
import { MediaService } from "@/lib/services/media.service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthServerService.requireAuth();
    const data = await request.json();
    const mediaId = params.id;

    // Verify ownership through profile
    const supabase = await createClient();
    const { data: media } = await supabase
      .from("media")
      .select("profile_id, profiles(user_id)")
      .eq("id", mediaId)
      .single();

    if (!media || (media.profiles as any).user_id !== user.id) {
      return NextResponse.json(
        { error: "Media not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update media
    const updatedMedia = await MediaService.updateMedia(mediaId, data);

    return NextResponse.json({ media: updatedMedia });
  } catch (error: any) {
    console.error("Error updating media:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update media" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthServerService.requireAuth();
    const mediaId = params.id;

    // Verify ownership through profile
    const supabase = await createClient();
    const { data: media } = await supabase
      .from("media")
      .select("profile_id, profiles(user_id)")
      .eq("id", mediaId)
      .single();

    if (!media || (media.profiles as any).user_id !== user.id) {
      return NextResponse.json(
        { error: "Media not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete media
    await MediaService.deleteMedia(mediaId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting media:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete media" },
      { status: 500 }
    );
  }
}
