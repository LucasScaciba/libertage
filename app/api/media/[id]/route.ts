import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/media/{id}
 * 
 * Get media metadata and processing status.
 * 
 * Response: Complete media record with variants
 * 
 * Authorization:
 * - User must be authenticated
 * - User must own the media (enforced by RLS)
 */
export async function GET(
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

      console.error("[MediaQuery] Database query failed:", queryError);
      return NextResponse.json(
        { error: "Failed to query media" },
        { status: 500 }
      );
    }

    // 3. For public bucket, URLs are already accessible - no need for signed URLs
    // Just return the media record as-is

    // 4. Return media metadata
    return NextResponse.json(media, { status: 200 });
  } catch (error) {
    console.error("[MediaQuery] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/media/{id}
 * 
 * Delete media and all its variants from storage and database.
 * 
 * Authorization:
 * - User must be authenticated
 * - User must own the media (enforced by RLS)
 */
export async function DELETE(
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

    // 2. Query media record to get storage paths
    const { data: media, error: queryError } = await supabase
      .from("media_processing")
      .select("*")
      .eq("id", id)
      .single();

    if (queryError) {
      if (queryError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Media not found" },
          { status: 404 }
        );
      }

      console.error("[MediaDelete] Database query failed:", queryError);
      return NextResponse.json(
        { error: "Failed to query media" },
        { status: 500 }
      );
    }

    // 3. Delete all variant files from storage
    const filesToDelete: string[] = [];

    // Add original file
    if (media.original_path) {
      const originalPath = media.original_path.split("/storage/v1/object/public/media/")[1];
      if (originalPath) {
        filesToDelete.push(originalPath);
      }
    }

    // Add all variant files
    if (media.variants && typeof media.variants === 'object') {
      for (const variantData of Object.values(media.variants)) {
        if (variantData && typeof variantData === 'object' && 'url' in variantData) {
          const variantUrl = (variantData as any).url;
          const variantPath = variantUrl.split("/storage/v1/object/public/media/")[1];
          if (variantPath) {
            filesToDelete.push(variantPath);
          }
        }
      }
    }

    // Delete files from storage
    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase
        .storage
        .from("media")
        .remove(filesToDelete);

      if (storageError) {
        console.error("[MediaDelete] Storage deletion failed:", storageError);
        // Continue with database deletion even if storage fails
      }
    }

    // 4. Delete database record (RLS ensures user owns the media)
    const { error: deleteError } = await supabase
      .from("media_processing")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[MediaDelete] Database deletion failed:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete media" },
        { status: 500 }
      );
    }

    // 5. Return success
    return NextResponse.json(
      { message: "Media deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[MediaDelete] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
