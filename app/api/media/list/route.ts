import { createClient } from "@/lib/supabase/server";
import { NextResponse, NextRequest } from "next/server";

/**
 * GET /api/media/list
 * 
 * List all media for the authenticated user
 * 
 * Query params:
 * - type: Filter by type (image, video, or all)
 * - status: Filter by status (queued, processing, ready, failed, or all)
 * - limit: Number of items to return (default: 50)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Validate authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const status = searchParams.get("status") || "all";
    const profileId = searchParams.get("profile_id");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // 3. Build query
    let query = supabase
      .from("media_processing")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (type !== "all") {
      query = query.eq("type", type);
    }

    if (status !== "all") {
      query = query.eq("status", status);
    }
    
    if (profileId) {
      query = query.eq("profile_id", profileId);
    }

    // 4. Execute query
    const { data: media, error: queryError, count } = await query;

    if (queryError) {
      console.error("[MediaList] Query failed:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch media" },
        { status: 500 }
      );
    }

    // 5. Generate signed URLs for all variants
    const mediaWithSignedUrls = await Promise.all(
      (media || []).map(async (item) => {
        if (item.variants && typeof item.variants === "object") {
          const variantsWithSignedUrls: Record<string, any> = {};

          for (const [variantName, variantData] of Object.entries(
            item.variants
          )) {
            if (
              variantData &&
              typeof variantData === "object" &&
              "url" in variantData
            ) {
              const variantUrl = (variantData as any).url;
              const urlParts = variantUrl.split(
                "/storage/v1/object/public/media/"
              );

              if (urlParts.length === 2) {
                const storagePath = urlParts[1];
                const { data: signedUrlData } = await supabase.storage
                  .from("media")
                  .createSignedUrl(storagePath, 3600);

                if (signedUrlData) {
                  variantsWithSignedUrls[variantName] = {
                    ...variantData,
                    url: signedUrlData.signedUrl,
                    signedUrl: signedUrlData.signedUrl,
                  };
                } else {
                  variantsWithSignedUrls[variantName] = variantData;
                }
              } else {
                variantsWithSignedUrls[variantName] = variantData;
              }
            } else {
              variantsWithSignedUrls[variantName] = variantData;
            }
          }

          return {
            ...item,
            variants: variantsWithSignedUrls,
          };
        }

        return item;
      })
    );

    // 6. Return response
    return NextResponse.json(
      {
        media: mediaWithSignedUrls,
        total: count || 0,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[MediaList] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
