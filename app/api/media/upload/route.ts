import { createClient } from "@/lib/supabase/server";
import { storageManager } from "@/lib/services/storage-manager.service";
import { mediaProcessor } from "@/lib/services/media-processor.service";
import { NextResponse } from "next/server";

// Configure route segment to allow larger body size
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

/**
 * POST /api/media/upload
 * 
 * Upload media file (image or video) for processing.
 * 
 * Request: multipart/form-data with 'file' field
 * Response: { id, status, type, created_at }
 * 
 * Validations:
 * - User must be authenticated
 * - File type must be supported (JPEG, PNG, WebP, GIF, HEIC, HEIF, MP4, MOV, AVI, WebM)
 * - File size must be within limits (10MB for images, 80MB for videos)
 * - Video duration must be max 30 seconds (validated on client)
 * - File must not be empty
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

    // 2. Parse multipart form data with error handling for large files
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseError: any) {
      console.error("[MediaUpload] FormData parse error:", parseError);
      
      // Check if it's a size limit error
      if (parseError.message?.includes("body") || parseError.message?.includes("size")) {
        return NextResponse.json(
          { error: "File size exceeds maximum allowed (80MB for videos, 10MB for images)" },
          { status: 413 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to parse upload data" },
        { status: 400 }
      );
    }
    
    const file = formData.get("file") as File;
    const profileId = formData.get("profile_id") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // 3. Validate file
    const validation = validateMediaFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // 4. Generate media ID and sanitized filename
    const mediaId = crypto.randomUUID();
    
    // Sanitize filename: remove special characters, spaces, and accents
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const sanitizedFilename = `${mediaId}.${fileExtension}`;
    const originalPath = `${user.id}/${mediaId}/original/${sanitizedFilename}`;

    // 5. Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Upload to storage
    try {
      await storageManager.uploadFile(originalPath, buffer, file.type);
    } catch (uploadError) {
      console.error("[MediaUpload] Storage upload failed:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    // 7. Create database record
    const insertData: any = {
      id: mediaId,
      user_id: user.id,
      type: validation.type,
      original_path: originalPath,
      status: "queued",
    };

    // Add profile_id if provided
    if (profileId) {
      insertData.profile_id = profileId;
      
      // Get max sort_order for this profile
      const { data: maxOrderData } = await supabase
        .from("media_processing")
        .select("sort_order")
        .eq("profile_id", profileId)
        .eq("type", validation.type)
        .order("sort_order", { ascending: false })
        .limit(1)
        .single();
      
      insertData.sort_order = (maxOrderData?.sort_order || 0) + 1;
      
      // Check if this is the first media of this type for this profile
      const { count } = await supabase
        .from("media_processing")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profileId)
        .eq("type", validation.type)
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
      
      // Cleanup: delete uploaded file
      try {
        await storageManager.deleteFile(originalPath);
      } catch (cleanupError) {
        console.error("[MediaUpload] Failed to cleanup uploaded file:", cleanupError);
      }

      return NextResponse.json(
        { error: "Failed to create media record" },
        { status: 500 }
      );
    }

    // 8. Return response (worker will pick up the job automatically)
    return NextResponse.json(
      {
        id: media.id,
        status: media.status,
        type: media.type,
        created_at: media.created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[MediaUpload] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Validate media file
 */
function validateMediaFile(file: File): {
  valid: boolean;
  error?: string;
  type?: "image" | "video";
} {
  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: "File is empty",
    };
  }

  // Validate file type
  const type = mediaProcessor.validateMediaType(file.type);
  if (!type) {
    const supportedTypes = mediaProcessor.getSupportedMimeTypes();
    return {
      valid: false,
      error: `Unsupported file type. Supported formats: ${supportedTypes.all.join(", ")}`,
    };
  }

  // Validate file size
  const isValidSize = mediaProcessor.validateFileSize(file.size, type);
  if (!isValidSize) {
    const limits = mediaProcessor.getFileSizeLimits();
    const limitMB = type === "image" ? limits.image / (1024 * 1024) : limits.video / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds limit of ${limitMB}MB for ${type}s`,
    };
  }

  return {
    valid: true,
    type,
  };
}
