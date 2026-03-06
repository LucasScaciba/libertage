import { imageProcessor } from "./image-processor.service";
import { videoProcessor } from "./video-processor.service";
import { createClient } from "@/lib/supabase/server";
import type { ProcessingJob } from "./job-queue.service";

/**
 * Media Processor Service
 * 
 * Main orchestrator for media processing.
 * Routes jobs to appropriate processors (Image or Video) based on media type.
 * Handles status updates, error handling, and cleanup.
 */

export class MediaProcessor {
  /**
   * Process a media job
   * Routes to Image Processor or Video Processor based on type
   */
  async process(job: ProcessingJob): Promise<void> {
    console.log(`[MediaProcessor] Starting processing for job ${job.id}, media ${job.mediaId}, type: ${job.type}`);

    try {
      // 1. Update status to "processing"
      await this.updateStatus(job.mediaId, "processing");

      // 2. Route to appropriate processor based on type
      if (job.type === "image") {
        console.log(`[MediaProcessor] Routing to Image Processor`);
        await imageProcessor.process(job);
      } else if (job.type === "video") {
        console.log(`[MediaProcessor] Routing to Video Processor`);
        await videoProcessor.process(job);
      } else {
        throw new Error(`Unknown media type: ${job.type}`);
      }

      // 3. Status is updated to "ready" by the processor
      console.log(`[MediaProcessor] Successfully completed processing for media ${job.mediaId}`);
    } catch (error) {
      console.error(`[MediaProcessor] Failed to process media ${job.mediaId}:`, error);

      // Update status to "failed" with error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await this.updateStatus(job.mediaId, "failed", errorMessage);

      // Re-throw error so job queue can handle retry
      throw error;
    }
  }

  /**
   * Get Supabase client (admin in worker context, regular in API context)
   */
  private async getSupabaseClient() {
    if ((global as any).supabaseAdmin) {
      return (global as any).supabaseAdmin;
    }
    return await createClient();
  }

  /**
   * Update media status in database
   */
  private async updateStatus(
    mediaId: string,
    status: "queued" | "processing" | "ready" | "failed",
    errorMessage?: string
  ): Promise<void> {
    // Use admin client if available (worker context), otherwise use regular client
    const supabase = await this.getSupabaseClient();

    const updates: any = { status };
    
    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    const { error } = await supabase
      .from("media_processing")
      .update(updates)
      .eq("id", mediaId);

    if (error) {
      console.error(`[MediaProcessor] Failed to update status for media ${mediaId}:`, error);
      throw new Error(`Failed to update media status: ${error.message}`);
    }

    console.log(`[MediaProcessor] Updated media ${mediaId} status to: ${status}`);
  }

  /**
   * Get media record from database
   */
  async getMediaRecord(mediaId: string): Promise<any> {
    const supabase = await this.getSupabaseClient();

    const { data, error } = await supabase
      .from("media_processing")
      .select("*")
      .eq("id", mediaId)
      .single();

    if (error) {
      throw new Error(`Failed to get media record: ${error.message}`);
    }

    return data;
  }

  /**
   * Validate media file type
   */
  validateMediaType(mimeType: string): "image" | "video" | null {
    if (mimeType.startsWith("image/")) {
      const validImageTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/heic",
        "image/heif",
      ];
      return validImageTypes.includes(mimeType) ? "image" : null;
    }

    if (mimeType.startsWith("video/")) {
      const validVideoTypes = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm",
      ];
      return validVideoTypes.includes(mimeType) ? "video" : null;
    }

    return null;
  }

  /**
   * Get supported MIME types
   */
  getSupportedMimeTypes(): {
    images: string[];
    videos: string[];
    all: string[];
  } {
    const images = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/heic",
      "image/heif",
    ];
    const videos = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];

    return {
      images,
      videos,
      all: [...images, ...videos],
    };
  }

  /**
   * Get file size limits
   */
  getFileSizeLimits(): {
    image: number;
    video: number;
  } {
    return {
      image: 10 * 1024 * 1024, // 10MB
      video: 80 * 1024 * 1024, // 80MB
    };
  }

  /**
   * Validate file size
   */
  validateFileSize(size: number, type: "image" | "video"): boolean {
    const limits = this.getFileSizeLimits();
    return size <= limits[type];
  }
}

// Export singleton instance
export const mediaProcessor = new MediaProcessor();
