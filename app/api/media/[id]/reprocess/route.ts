import { createClient } from "@/lib/supabase/server";
import { jobQueue } from "@/lib/services/job-queue.service";
import { NextResponse } from "next/server";

/**
 * POST /api/media/{id}/reprocess
 * 
 * Reprocess a media file (regenerate variants).
 * 
 * Response: { id, status, message }
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

    // 2. Query media record (RLS ensures user owns the media)
    const { data: media, error: queryError } = await supabase
      .from("media_processing")
      .select("*")
      .eq("id", id)
      .single();

    if (queryError) {
      if (queryError.code === "PGRST116") {
        // No rows returned - either doesn't exist or user doesn't own it
        return NextResponse.json(
          { error: "Media not found" },
          { status: 404 }
        );
      }

      console.error("[MediaReprocess] Database query failed:", queryError);
      return NextResponse.json(
        { error: "Failed to query media" },
        { status: 500 }
      );
    }

    // 3. Update status to "queued"
    const { error: updateError } = await supabase
      .from("media_processing")
      .update({
        status: "queued",
        error_message: null, // Clear previous error
      })
      .eq("id", id);

    if (updateError) {
      console.error("[MediaReprocess] Failed to update status:", updateError);
      return NextResponse.json(
        { error: "Failed to update media status" },
        { status: 500 }
      );
    }

    // 4. Enqueue new processing job
    try {
      await jobQueue.enqueue({
        mediaId: media.id,
        userId: media.user_id,
        type: media.type as "image" | "video",
        originalPath: media.original_path,
      });
    } catch (queueError) {
      console.error("[MediaReprocess] Failed to enqueue job:", queueError);
      return NextResponse.json(
        { error: "Failed to enqueue reprocessing job" },
        { status: 500 }
      );
    }

    // 5. Return response
    return NextResponse.json(
      {
        id: media.id,
        status: "queued",
        message: "Media reprocessing queued",
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("[MediaReprocess] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
