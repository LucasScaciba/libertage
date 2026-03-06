import { createClient } from "@/lib/supabase/server";
import { Readable } from "stream";

/**
 * Storage Manager Service
 * 
 * Manages file uploads, downloads, and deletions in Supabase Storage.
 * Handles streaming for large files and signed URL generation.
 */

export class StorageManager {
  private bucketName = "media";

  /**
   * Upload a file to Supabase Storage
   * Uses streaming for files larger than 10MB
   */
  async uploadFile(
    path: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    const supabase = await this.getSupabaseClient();
    
    // Use streaming for large files (> 10MB)
    const useStreaming = buffer.length > 10 * 1024 * 1024;

    if (useStreaming) {
      // Convert buffer to stream for large files
      const stream = Readable.from(buffer);
      
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(path, stream, {
          contentType,
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      return data.path;
    } else {
      // Direct buffer upload for smaller files
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(path, buffer, {
          contentType,
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      return data.path;
    }
  }

  /**
   * Get Supabase client (admin in worker context, regular in API context)
   */
  private async getSupabaseClient() {
    if ((global as any).supabaseAdmin) {
      console.log('[StorageManager] Using supabaseAdmin (service_role)');
      return (global as any).supabaseAdmin;
    }
    console.log('[StorageManager] Using regular client');
    return await createClient();
  }

  /**
   * Download a file from Supabase Storage
   * Uses signed URLs for reliable access with service role
   * Implements retry logic with exponential backoff for eventual consistency
   */
  async downloadFile(path: string): Promise<Buffer> {
    console.log(`[StorageManager] Attempting to download file: ${path}`);
    
    const supabase = await this.getSupabaseClient();
    const maxRetries = 3;
    let lastError: any;
    
    // Retry with exponential backoff (1s, 2s, 4s)
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0) {
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        console.log(`[StorageManager] Retry ${attempt}/${maxRetries} after ${delayMs}ms delay`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      try {
        // Generate signed URL (works reliably with service_role)
        const { data: urlData, error: urlError } = await supabase.storage
          .from(this.bucketName)
          .createSignedUrl(path, 60); // 60 seconds expiry
        
        if (urlError || !urlData) {
          console.error(`[StorageManager] Signed URL error for ${path} (attempt ${attempt + 1}):`, JSON.stringify(urlError));
          lastError = urlError || new Error('No signed URL data');
          continue; // Try again
        }
        
        console.log(`[StorageManager] Got signed URL, downloading...`);
        
        // Download using signed URL
        const response = await fetch(urlData.signedUrl);
        
        if (!response.ok) {
          console.error(`[StorageManager] Fetch error: ${response.status} ${response.statusText}`);
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          continue; // Try again
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log(`[StorageManager] Successfully downloaded file: ${path}, size: ${buffer.length} bytes`);
        
        return buffer;
      } catch (err) {
        console.error(`[StorageManager] Exception during download (attempt ${attempt + 1}):`, err);
        lastError = err;
      }
    }
    
    // All retries failed
    throw new Error(`Failed to download file after ${maxRetries} attempts: ${JSON.stringify(lastError)}`);
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(path: string): Promise<void> {
    const supabase = await this.getSupabaseClient();

    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Delete a directory and all its contents from Supabase Storage
   */
  async deleteDirectory(path: string): Promise<void> {
    const supabase = await this.getSupabaseClient();

    // List all files in the directory
    const { data: files, error: listError } = await supabase.storage
      .from(this.bucketName)
      .list(path, {
        limit: 1000,
        sortBy: { column: "name", order: "asc" },
      });

    if (listError) {
      throw new Error(`Failed to list directory: ${listError.message}`);
    }

    if (!files || files.length === 0) {
      return; // Directory is empty or doesn't exist
    }

    // Build full paths for all files
    const filePaths = files.map((file: { name: string }) => `${path}/${file.name}`);

    // Delete all files
    const { error: deleteError } = await supabase.storage
      .from(this.bucketName)
      .remove(filePaths);

    if (deleteError) {
      throw new Error(`Failed to delete directory: ${deleteError.message}`);
    }
  }

  /**
   * Generate a signed URL for private content access
   * @param path - Storage path to the file
   * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
   */
  async generateSignedUrl(
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const supabase = await this.getSupabaseClient();

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Get public URL for a file
   * Note: This returns a URL but the file may not be publicly accessible
   * depending on bucket policies. Use generateSignedUrl for private content.
   */
  getPublicUrl(path: string): string {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
    }

    return `${supabaseUrl}/storage/v1/object/public/${this.bucketName}/${path}`;
  }

  /**
   * Check if a file exists in storage
   */
  async fileExists(path: string): Promise<boolean> {
    const supabase = await this.getSupabaseClient();

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .list(path.split("/").slice(0, -1).join("/"), {
        limit: 1,
        search: path.split("/").pop(),
      });

    if (error) {
      return false;
    }

    return data && data.length > 0;
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(path: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
  } | null> {
    const supabase = await this.getSupabaseClient();

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .list(path.split("/").slice(0, -1).join("/"), {
        limit: 1,
        search: path.split("/").pop(),
      });

    if (error || !data || data.length === 0) {
      return null;
    }

    const file = data[0];
    return {
      size: file.metadata?.size || 0,
      contentType: file.metadata?.mimetype || "application/octet-stream",
      lastModified: new Date(file.updated_at || file.created_at),
    };
  }
}

// Export singleton instance
export const storageManager = new StorageManager();
