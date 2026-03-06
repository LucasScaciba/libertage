import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/media/upload/complete
 * 
 * Mark media upload as complete after client has uploaded to Supabase Storage.
 * Worker will pick up the job for processing.
 */
export async function POST(request: Request) {
  try {
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

    // 2. Parse request body
    const body = await request.json();
    const { media_id } = body;

    if (!media_id) {
      return NextResponse.json(
        { error: "Missing media_id" },
        { status: 400 }
      );
    }

    // 3. Verify media belongs to user
    const { data: media, error: fetchError } = await supabase
      .from("media_processing")
      .select("*")
      .eq("id", media_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !media) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      );
    }

    // 4. Media is already marked as "queued" from initiate endpoint
    // Worker will automatically pick it up for processing
    
    return NextResponse.json({
      success: true,
      media_id: media.id,
      status: media.status,
    });
  } catch (error) {
    console.error("[MediaUpload] Complete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
