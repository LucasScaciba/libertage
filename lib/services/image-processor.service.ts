import sharp from "sharp";
import { storageManager } from "./storage-manager.service";
import { watermarkEngine } from "./watermark.service";
import { createClient } from "@/lib/supabase/server";
import type { ProcessingJob } from "./job-queue.service";

/**
 * Image Processor Service
 * 
 * Processes images by generating multiple optimized variants:
 * - avatar_64: 64px width (for small thumbnails)
 * - thumb_240: 240px width (for catalog grids)
 * - lightbox_600: 600px width (for modal views)
 * - large_1200: 1200px width (for high-resolution displays)
 * 
 * Features:
 * - WebP conversion with quality 80
 * - EXIF metadata removal
 * - Aspect ratio preservation
 * - Watermark application on lightbox and large variants
 * - Parallel variant generation
 */

export interface VariantMetadata {
  name: string;
  url: string;
  width: number;
  height: number;
  format: string;
  size_bytes: number;
}

interface ImageVariantSpec {
  name: string;
  width: number;
  watermark: boolean;
}

// Variant specifications
const IMAGE_VARIANTS: readonly ImageVariantSpec[] = [
  { name: "avatar_64", width: 64, watermark: false },
  { name: "thumb_240", width: 240, watermark: false },
  { name: "lightbox_600", width: 600, watermark: true },
  { name: "large_1200", width: 1200, watermark: true },
] as const;

export class ImageProcessor {
  /**
   * Process an image job
   * Downloads original, generates variants, uploads to storage, updates database
   */
  async process(job: ProcessingJob): Promise<VariantMetadata[]> {
    console.log(`[ImageProcessor] Starting processing for media ${job.mediaId}`);
    
    try {
      // 1. Download original image
      const originalBuffer = await storageManager.downloadFile(job.originalPath);
      console.log(`[ImageProcessor] Downloaded original image (${originalBuffer.length} bytes)`);

      // 2. Extract metadata with auto-rotation applied
      const metadata = await sharp(originalBuffer).rotate().metadata();
      const { width, height } = metadata;
      
      if (!width || !height) {
        throw new Error("Failed to extract image dimensions");
      }

      console.log(`[ImageProcessor] Image dimensions (after EXIF rotation): ${width}x${height}`);

      // 3. Generate variants in parallel
      const variantPromises = IMAGE_VARIANTS.map((spec) =>
        this.generateVariant(originalBuffer, spec, job)
      );

      const variants = await Promise.all(variantPromises);
      console.log(`[ImageProcessor] Generated ${variants.length} variants`);

      // 4. Update database with metadata and variants
      await this.updateMediaRecord(job.mediaId, {
        width,
        height,
        variants: this.formatVariantsForDatabase(variants),
        status: "ready",
      });

      console.log(`[ImageProcessor] Successfully processed media ${job.mediaId}`);
      return variants;
    } catch (error) {
      console.error(`[ImageProcessor] Failed to process media ${job.mediaId}:`, error);
      throw error;
    }
  }

  /**
   * Generate a single image variant
   */
  private async generateVariant(
    originalBuffer: Buffer,
    spec: ImageVariantSpec,
    job: ProcessingJob
  ): Promise<VariantMetadata> {
    console.log(`[ImageProcessor] Generating variant: ${spec.name}`);

    try {
      // Resize image with auto-rotation based on EXIF orientation
      let buffer = await sharp(originalBuffer)
        .rotate() // Auto-rotate based on EXIF orientation
        .resize(spec.width, null, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

      // Get resized dimensions
      const resizedMetadata = await sharp(buffer).metadata();
      const variantWidth = resizedMetadata.width!;
      const variantHeight = resizedMetadata.height!;

      // Apply watermark if needed
      if (spec.watermark) {
        console.log(`[ImageProcessor] Applying watermark to ${spec.name}`);
        try {
          buffer = await watermarkEngine.applyToImage(buffer);
        } catch (watermarkError) {
          console.warn(
            `[ImageProcessor] Failed to apply watermark to ${spec.name}, continuing without watermark:`,
            watermarkError
          );
          // Continue without watermark (graceful degradation)
        }
      }

      // Determine variant name (add _watermarked suffix if watermark was applied)
      const variantName = spec.watermark
        ? `${spec.name}_watermarked`
        : spec.name;

      // Upload variant to storage
      const variantPath = `${job.userId}/${job.mediaId}/images/${variantName}.webp`;
      await storageManager.uploadFile(variantPath, buffer, "image/webp");

      console.log(`[ImageProcessor] Uploaded variant ${variantName} (${buffer.length} bytes)`);

      // Return variant metadata
      return {
        name: variantName,
        url: storageManager.getPublicUrl(variantPath),
        width: variantWidth,
        height: variantHeight,
        format: "webp",
        size_bytes: buffer.length,
      };
    } catch (error) {
      console.error(`[ImageProcessor] Failed to generate variant ${spec.name}:`, error);
      throw error;
    }
  }

  /**
   * Format variants for database storage (JSONB)
   */
  private formatVariantsForDatabase(
    variants: VariantMetadata[]
  ): Record<string, any> {
    const formatted: Record<string, any> = {};

    for (const variant of variants) {
      formatted[variant.name] = {
        url: variant.url,
        width: variant.width,
        height: variant.height,
        format: variant.format,
        size_bytes: variant.size_bytes,
      };
    }

    return formatted;
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
   * Validate image file
   * Checks if the buffer is a valid image format
   */
  async validateImage(buffer: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(buffer).metadata();
      return !!(metadata.width && metadata.height && metadata.format);
    } catch {
      return false;
    }
  }

  /**
   * Get image metadata without processing
   */
  async getMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    hasAlpha: boolean;
  }> {
    const metadata = await sharp(buffer).metadata();
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || "unknown",
      hasAlpha: metadata.hasAlpha || false,
    };
  }
}

// Export singleton instance
export const imageProcessor = new ImageProcessor();
