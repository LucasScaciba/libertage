import { createServiceClient } from "@/lib/supabase/server";
import sharp from "sharp";

/**
 * ThumbnailService
 * 
 * Generates optimized thumbnails for media items (photos and videos).
 * Thumbnails are resized to max 80x80px, converted to WebP format,
 * and uploaded to Supabase Storage.
 */
export class ThumbnailService {
  private static readonly MAX_DIMENSION = 80;
  private static readonly WEBP_QUALITY = 80;
  private static readonly STORAGE_BUCKET = "media";

  /**
   * Generate a thumbnail from an original media URL
   * 
   * @param originalUrl - Public URL of the original media
   * @param profileId - Profile ID for storage path
   * @param filename - Original filename
   * @returns Public URL of the generated thumbnail
   */
  static async generateThumbnail(
    originalUrl: string,
    profileId: string,
    filename: string
  ): Promise<string> {
    try {
      // Download original image
      const imageBuffer = await this.downloadImage(originalUrl);

      // Resize and convert to WebP
      const thumbnailBuffer = await this.resizeAndConvert(imageBuffer);

      // Generate thumbnail path
      const thumbnailFilename = this.generateThumbnailFilename(filename);
      const thumbnailPath = `profiles/${profileId}/media/thumbnails/${thumbnailFilename}`;

      // Upload to Supabase Storage
      const thumbnailUrl = await this.uploadThumbnail(
        thumbnailBuffer,
        thumbnailPath
      );

      return thumbnailUrl;
    } catch (error) {
      console.error("Failed to generate thumbnail:", error);
      throw new Error(
        `Thumbnail generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Download image from URL
   */
  private static async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Resize image to max 80x80px and convert to WebP
   */
  private static async resizeAndConvert(imageBuffer: Buffer): Promise<Buffer> {
    return sharp(imageBuffer)
      .resize(this.MAX_DIMENSION, this.MAX_DIMENSION, {
        fit: "inside", // Maintain aspect ratio, fit within box
        withoutEnlargement: true, // Don't upscale small images
      })
      .webp({ quality: this.WEBP_QUALITY })
      .toBuffer();
  }

  /**
   * Generate thumbnail filename from original filename
   */
  private static generateThumbnailFilename(originalFilename: string): string {
    // Remove extension and add .webp
    const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, "");
    return `${nameWithoutExt}.webp`;
  }

  /**
   * Upload thumbnail to Supabase Storage
   */
  private static async uploadThumbnail(
    thumbnailBuffer: Buffer,
    path: string
  ): Promise<string> {
    const supabase = createServiceClient();

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(this.STORAGE_BUCKET)
      .upload(path, thumbnailBuffer, {
        contentType: "image/webp",
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      throw new Error(`Failed to upload thumbnail: ${uploadError.message}`);
    }

    // Get public URL
    const { data } = supabase.storage
      .from(this.STORAGE_BUCKET)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Delete thumbnail from storage
   */
  static async deleteThumbnail(thumbnailPath: string): Promise<void> {
    const supabase = createServiceClient();

    const { error } = await supabase.storage
      .from(this.STORAGE_BUCKET)
      .remove([thumbnailPath]);

    if (error) {
      console.error("Failed to delete thumbnail:", error);
      throw new Error(`Failed to delete thumbnail: ${error.message}`);
    }
  }

  /**
   * Generate thumbnail for existing media (lazy generation)
   */
  static async generateThumbnailForMedia(
    mediaId: string
  ): Promise<string | null> {
    const supabase = createServiceClient();

    // Get media info
    const { data: media, error } = await supabase
      .from("media")
      .select("public_url, storage_path, profile_id, type")
      .eq("id", mediaId)
      .single();

    if (error || !media) {
      console.error("Media not found:", error);
      return null;
    }

    // Only generate thumbnails for photos
    if (media.type !== "photo") {
      return null;
    }

    // Extract filename from storage path
    const filename = media.storage_path.split("/").pop() || "thumbnail.webp";

    // Generate thumbnail
    const thumbnailUrl = await this.generateThumbnail(
      media.public_url,
      media.profile_id,
      filename
    );

    return thumbnailUrl;
  }
}
