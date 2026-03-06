import { exec } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { storageManager } from "./storage-manager.service";
import { imageProcessor } from "./image-processor.service";
import { createClient } from "@/lib/supabase/server";
import type { ProcessingJob } from "./job-queue.service";
import type { VariantMetadata } from "./image-processor.service";

const execAsync = promisify(exec);

/**
 * Video Processor Service
 * 
 * Processes videos by:
 * - Extracting metadata (width, height, duration)
 * - Generating HLS streams at multiple resolutions (360p, 720p, 1080p)
 * - Creating watermarked versions of streams
 * - Extracting and processing video thumbnails
 * - Creating master playlists
 */

interface HLSResolution {
  name: string;
  height: number;
  bitrate: string;
  conditional?: boolean;
}

// HLS resolution ladder
const HLS_RESOLUTIONS: readonly HLSResolution[] = [
  { name: "360p", height: 360, bitrate: "800k" },
  { name: "720p", height: 720, bitrate: "2500k" },
  { name: "1080p", height: 1080, bitrate: "5000k", conditional: true },
] as const;

interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  format: string;
  bitrate: number;
}

export class VideoProcessor {
  /**
   * Process a video job
   */
  async process(job: ProcessingJob): Promise<VariantMetadata[]> {
    console.log(`[VideoProcessor] Starting processing for media ${job.mediaId}`);
    
    let tempDir: string | null = null;

    try {
      // 1. Create temporary directory
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `video-${job.mediaId}-`));
      console.log(`[VideoProcessor] Created temp directory: ${tempDir}`);

      // 2. Download original video
      const originalBuffer = await storageManager.downloadFile(job.originalPath);
      const originalPath = path.join(tempDir, "original.mp4");
      await fs.writeFile(originalPath, originalBuffer);
      console.log(`[VideoProcessor] Downloaded original video (${originalBuffer.length} bytes)`);

      // 3. Extract metadata
      const metadata = await this.extractMetadata(originalPath);
      console.log(`[VideoProcessor] Video metadata:`, metadata);

      // 4. Extract thumbnail at 2 seconds
      const thumbnailPath = await this.extractThumbnail(originalPath, 2, tempDir);
      console.log(`[VideoProcessor] Extracted thumbnail`);

      // 5. Process thumbnail through Image Processor
      const thumbnailBuffer = await fs.readFile(thumbnailPath);
      const thumbnailJob: ProcessingJob = {
        ...job,
        type: "image",
        originalPath: `${job.userId}/${job.mediaId}/images/thumbnail.jpg`,
      };
      
      // Upload thumbnail as "original" for image processor
      await storageManager.uploadFile(
        thumbnailJob.originalPath,
        thumbnailBuffer,
        "image/jpeg"
      );
      
      const thumbnailVariants = await imageProcessor.process(thumbnailJob);
      console.log(`[VideoProcessor] Processed thumbnail variants`);

      // 6. Determine resolutions to generate
      const resolutions = HLS_RESOLUTIONS.filter(
        (res) => !res.conditional || metadata.height >= res.height
      );
      console.log(`[VideoProcessor] Generating HLS for resolutions:`, resolutions.map(r => r.name));

      // 7. Generate HLS streams (sequential to avoid resource exhaustion)
      for (const res of resolutions) {
        await this.generateHLSStream(originalPath, res, job, tempDir, false);
        await this.generateHLSStream(originalPath, res, job, tempDir, true);
      }

      // 8. Create master playlists
      const masterPath = `${job.userId}/${job.mediaId}/hls/master.m3u8`;
      const masterWatermarkedPath = `${job.userId}/${job.mediaId}/hls_watermarked/master.m3u8`;
      
      await this.createMasterPlaylist(masterPath, resolutions, tempDir, false);
      await this.createMasterPlaylist(masterWatermarkedPath, resolutions, tempDir, true);

      // 9. Update database
      const variants = this.formatVariantsForDatabase(
        thumbnailVariants,
        resolutions,
        masterPath,
        masterWatermarkedPath
      );

      await this.updateMediaRecord(job.mediaId, {
        width: metadata.width,
        height: metadata.height,
        duration: Math.round(metadata.duration),
        variants,
        status: "ready",
      });

      console.log(`[VideoProcessor] Successfully processed media ${job.mediaId}`);
      return [];
    } catch (error) {
      console.error(`[VideoProcessor] Failed to process media ${job.mediaId}:`, error);
      throw error;
    } finally {
      // Cleanup temporary directory
      if (tempDir) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
          console.log(`[VideoProcessor] Cleaned up temp directory`);
        } catch (cleanupError) {
          console.warn(`[VideoProcessor] Failed to cleanup temp directory:`, cleanupError);
        }
      }
    }
  }

  /**
   * Extract video metadata using FFprobe
   */
  private async extractMetadata(videoPath: string): Promise<VideoMetadata> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration,bit_rate -of json "${videoPath}"`
      );

      const data = JSON.parse(stdout);
      const stream = data.streams[0];

      return {
        width: parseInt(stream.width),
        height: parseInt(stream.height),
        duration: parseFloat(stream.duration || "0"),
        format: "video",
        bitrate: parseInt(stream.bit_rate || "0"),
      };
    } catch (error) {
      console.error("[VideoProcessor] Failed to extract metadata:", error);
      throw new Error("Failed to extract video metadata");
    }
  }

  /**
   * Extract thumbnail from video at specific timestamp
   */
  private async extractThumbnail(
    videoPath: string,
    timestamp: number,
    tempDir: string
  ): Promise<string> {
    const thumbnailPath = path.join(tempDir, "thumbnail.jpg");

    try {
      await execAsync(
        `ffmpeg -i "${videoPath}" -ss ${timestamp} -vframes 1 -q:v 2 "${thumbnailPath}"`
      );

      return thumbnailPath;
    } catch (error) {
      console.error("[VideoProcessor] Failed to extract thumbnail:", error);
      throw new Error("Failed to extract video thumbnail");
    }
  }

  /**
   * Generate HLS stream for a specific resolution
   */
  private async generateHLSStream(
    inputPath: string,
    resolution: HLSResolution,
    job: ProcessingJob,
    tempDir: string,
    watermark: boolean
  ): Promise<void> {
    console.log(`[VideoProcessor] Generating ${watermark ? "watermarked " : ""}HLS ${resolution.name}`);

    const outputDir = path.join(
      tempDir,
      watermark ? "hls_watermarked" : "hls",
      resolution.name
    );
    await fs.mkdir(outputDir, { recursive: true });

    const playlistPath = path.join(outputDir, "playlist.m3u8");
    const segmentPattern = path.join(outputDir, "segment_%03d.ts");

    // Build FFmpeg command
    // Note: Watermark for video requires FFmpeg with libfreetype support
    // For now, we generate the same stream for both watermarked and non-watermarked
    // TODO: Install FFmpeg with --enable-libfreetype to enable drawtext filter
    
    const command = [
      "ffmpeg",
      "-i", `"${inputPath}"`,
      "-vf", `"scale=-2:${resolution.height}"`,
      "-c:v", "libx264",
      "-preset", "fast",
      "-b:v", resolution.bitrate,
      "-c:a", "aac",
      "-b:a", "128k",
      "-hls_time", "6",
      "-hls_playlist_type", "vod",
      "-hls_segment_filename", `"${segmentPattern}"`,
      `"${playlistPath}"`
    ].join(" ");

    try {
      await execAsync(command);
      console.log(`[VideoProcessor] Generated HLS ${resolution.name}`);

      // Upload all segments and playlist to storage
      await this.uploadHLSDirectory(
        outputDir,
        `${job.userId}/${job.mediaId}/${watermark ? "hls_watermarked" : "hls"}/${resolution.name}`
      );
    } catch (error) {
      console.error(`[VideoProcessor] Failed to generate HLS ${resolution.name}:`, error);
      throw error;
    }
  }

  /**
   * Upload HLS directory (segments and playlist) to storage
   */
  private async uploadHLSDirectory(
    localDir: string,
    storagePath: string
  ): Promise<void> {
    const files = await fs.readdir(localDir);

    for (const file of files) {
      const localPath = path.join(localDir, file);
      const remotePath = `${storagePath}/${file}`;
      
      const buffer = await fs.readFile(localPath);
      const contentType = file.endsWith(".m3u8")
        ? "application/vnd.apple.mpegurl"
        : "video/mp2t";

      await storageManager.uploadFile(remotePath, buffer, contentType);
    }

    console.log(`[VideoProcessor] Uploaded ${files.length} HLS files to ${storagePath}`);
  }

  /**
   * Create master playlist for HLS
   */
  private async createMasterPlaylist(
    storagePath: string,
    resolutions: readonly HLSResolution[],
    tempDir: string,
    watermark: boolean
  ): Promise<void> {
    const lines = ["#EXTM3U", "#EXT-X-VERSION:3"];

    for (const res of resolutions) {
      const bandwidth = parseInt(res.bitrate) * 1000; // Convert to bps
      lines.push(
        `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${res.height}x${Math.round(res.height * 16 / 9)}`,
        `${res.name}/playlist.m3u8`
      );
    }

    const content = lines.join("\n");
    const localPath = path.join(tempDir, "master.m3u8");
    await fs.writeFile(localPath, content);

    // Upload master playlist
    const buffer = await fs.readFile(localPath);
    await storageManager.uploadFile(
      storagePath,
      buffer,
      "application/vnd.apple.mpegurl"
    );

    console.log(`[VideoProcessor] Created master playlist at ${storagePath}`);
  }

  /**
   * Format variants for database storage
   */
  private formatVariantsForDatabase(
    thumbnailVariants: VariantMetadata[],
    resolutions: readonly HLSResolution[],
    masterPath: string,
    masterWatermarkedPath: string
  ): Record<string, any> {
    const variants: Record<string, any> = {};

    // Add thumbnail variants
    for (const variant of thumbnailVariants) {
      variants[variant.name] = {
        url: variant.url,
        width: variant.width,
        height: variant.height,
        format: variant.format,
        size_bytes: variant.size_bytes,
      };
    }

    // Add HLS master playlists
    variants.hls_master = {
      url: storageManager.getPublicUrl(masterPath),
      resolutions: resolutions.map((r) => r.name),
      format: "m3u8",
    };

    variants.hls_master_watermarked = {
      url: storageManager.getPublicUrl(masterWatermarkedPath),
      resolutions: resolutions.map((r) => r.name),
      format: "m3u8",
    };

    return variants;
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
   * Update media record in database
   */
  private async updateMediaRecord(
    mediaId: string,
    updates: {
      width?: number;
      height?: number;
      duration?: number;
      variants?: Record<string, any>;
      status?: string;
    }
  ): Promise<void> {
    const supabase = await this.getSupabaseClient();

    const { error } = await supabase
      .from("media_processing")
      .update(updates)
      .eq("id", mediaId);

    if (error) {
      throw new Error(`Failed to update media record: ${error.message}`);
    }
  }

  /**
   * Validate video file
   */
  async validateVideo(filePath: string): Promise<boolean> {
    try {
      await this.extractMetadata(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const videoProcessor = new VideoProcessor();
