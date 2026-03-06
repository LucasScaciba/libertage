import { createClient } from "@/lib/supabase/server";
import { mediaProcessor } from "@/lib/services/media-processor.service";
import { NextResponse } from "next/server";

/**
 * POST /api/media/upload/initiate
 * 
 * Initiate media upload by creating database record and returning upload path.
 * Client will upload directly to Supabase Storage.
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
    const { filename, content_type, file_size, profile_id } = body;

    if (!filename || !content_type || !file_size) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 3. Validate file type and size
    const type = mediaProcessor.validateMediaType(content_type);
    if (!type) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    const isValidSize = mediaProcessor.validateFileSize(file_size, type);
    if (!isValidSize) {
      const limits = mediaProcessor.getFileSizeLimits();
      const limitMB = type === "image" ? limits.image / (1024 * 1024) : limits.video / (1024 * 1024);
      return NextResponse.json(
        { error: `File size exceeds limit of ${limitMB}MB for ${type}s` },
        { status: 400 }
      );
    }

    // 3.5. Check plan limits if profile_id is provided
    if (profile_id) {
      // Get profile to find user's subscription
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("id", profile_id)
        .single();

      if (!profile) {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }

      // Get user's active subscription with plan limits
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan_id, plans(max_photos, max_videos)")
        .eq("user_id", profile.user_id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const plan = subscription?.plans as any;
      const maxPhotos = plan?.max_photos || 4; // Default to free plan
      const maxVideos = plan?.max_videos || 0;

      // Count current ready media for this profile
      const { count: photoCount } = await supabase
        .from("media_processing")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profile_id)
        .eq("type", "image")
        .eq("status", "ready");

      const { count: videoCount } = await supabase
        .from("media_processing")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profile_id)
        .eq("type", "video")
        .eq("status", "ready");

      // Check if user has reached the limit
      if (type === "image" && (photoCount || 0) >= maxPhotos) {
        return NextResponse.json(
          { error: `Você atingiu o limite de ${maxPhotos} fotos do seu plano` },
          { status: 403 }
        );
      }

      if (type === "video" && (videoCount || 0) >= maxVideos) {
        return NextResponse.json(
          { error: `Você atingiu o limite de ${maxVideos} vídeos do seu plano` },
          { status: 403 }
        );
      }
    }

    // 4. Generate media ID and upload path
    const mediaId = crypto.randomUUID();
    const fileExtension = (filename.split('.').pop() || 'jpg').toLowerCase();
    const sanitizedFilename = `${mediaId}.${fileExtension}`;
    const uploadPath = `${user.id}/${mediaId}/original/${sanitizedFilename}`;

    // 5. Create database record
    const insertData: any = {
      id: mediaId,
      user_id: user.id,
      type,
      original_path: uploadPath,
      status: "queued",
    };

    // Add profile_id if provided
    if (profile_id) {
      insertData.profile_id = profile_id;
      
      // Get max sort_order for this profile
      const { data: maxOrderData } = await supabase
        .from("media_processing")
        .select("sort_order")
        .eq("profile_id", profile_id)
        .eq("type", type)
        .order("sort_order", { ascending: false })
        .limit(1)
        .single();
      
      insertData.sort_order = (maxOrderData?.sort_order || 0) + 1;
      
      // Check if this is the first media of this type for this profile
      const { count } = await supabase
        .from("media_processing")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profile_id)
        .eq("type", type)
        .eq("status", "ready");
      
      // Set as cover if it's the first media
      if (count === 0) {
        insertData.is_cover = true;
      }
    }

    const { data: media, error: dbError } = await supabase
      .from("media_processing")
      .insert(insertData)
      .select()
      .single();

    if (dbError) {
      console.error("[MediaUpload] Database insert failed:", dbError);
      return NextResponse.json(
        { error: "Failed to create media record" },
        { status: 500 }
      );
    }

    // 6. Return media ID and upload path
    return NextResponse.json({
      media_id: media.id,
      upload_path: uploadPath,
    });
  } catch (error) {
    console.error("[MediaUpload] Initiate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
