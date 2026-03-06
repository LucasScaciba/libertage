import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/media/{id}/set-cover
 * 
 * Set media as cover photo/video for the profile.
 * Removes cover status from all other media of the same type for the same profile.
 * 
 * Authorization:
 * - User must be authenticated
 * - User must own the media (enforced by RLS)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15+ requirement)
    const { id } = await params;

    // 1. Validate authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Get media record to check ownership and get profile_id
    const { data: media, error: queryError } = await supabase
      .from("media_processing")
      .select("id, user_id, profile_id, type")
      .eq("id", id)
      .single();

    if (queryError) {
      if (queryError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Media not found" },
          { status: 404 }
        );
      }

      console.error("[SetCover] Query failed:", queryError);
      return NextResponse.json(
        { error: "Failed to query media" },
        { status: 500 }
      );
    }

    // 3. Verify ownership
    if (media.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // 4. Check if media has profile_id
    if (!media.profile_id) {
      return NextResponse.json(
        { error: "Media is not linked to a profile" },
        { status: 400 }
      );
    }

    // 5. Only images can be set as cover
    if (media.type !== "image") {
      return NextResponse.json(
        { error: "Only images can be set as cover photo" },
        { status: 400 }
      );
    }

    // 6. Remove cover status from all other images for this profile
    const { error: updateAllError } = await supabase
      .from("media_processing")
      .update({ is_cover: false })
      .eq("profile_id", media.profile_id)
      .eq("type", "image")
      .neq("id", id);

    if (updateAllError) {
      console.error("[SetCover] Failed to remove cover from other media:", updateAllError);
      return NextResponse.json(
        { error: "Failed to update cover status" },
        { status: 500 }
      );
    }

    // 7. Set this image as cover
    const { error: setCoverError } = await supabase
      .from("media_processing")
      .update({ is_cover: true })
      .eq("id", id);

    if (setCoverError) {
      console.error("[SetCover] Failed to set cover:", setCoverError);
      return NextResponse.json(
        { error: "Failed to set cover" },
        { status: 500 }
      );
    }

    // 8. Return success
    return NextResponse.json(
      { message: "Cover photo updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SetCover] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
