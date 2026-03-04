import { createClient } from '@/lib/supabase/client';

export interface VideoValidationResult {
  valid: boolean;
  error?: string;
}

export interface VideoUploadResult {
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  file_size_bytes: number;
}

const MAX_FILE_SIZE = 18 * 1024 * 1024; // 18 MB
const MAX_DURATION = 60; // seconds
const ALLOWED_FORMATS = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

export class VideoUploadService {
  /**
   * Validates video file before upload
   */
  static async validateVideo(file: File): Promise<VideoValidationResult> {
    // Check file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return {
        valid: false,
        error: 'Formato de vídeo inválido. Use mp4, mov ou avi'
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'Vídeo excede o tamanho máximo de 18 MB'
      };
    }

    // Check video duration
    try {
      const duration = await this.getVideoDuration(file);
      if (duration > MAX_DURATION) {
        return {
          valid: false,
          error: 'Vídeo não pode exceder 60 segundos'
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Erro ao validar duração do vídeo'
      };
    }

    return { valid: true };
  }

  /**
   * Gets video duration in seconds
   */
  static async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.floor(video.duration));
      };

      video.onerror = () => {
        reject(new Error('Failed to load video metadata'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Uploads video to Supabase Storage
   */
  static async uploadVideo(
    file: File,
    userId: string
  ): Promise<VideoUploadResult> {
    const supabase = createClient();

    // Validate first
    const validation = await this.validateVideo(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const storyId = crypto.randomUUID();
    const fileExt = file.name.split('.').pop();
    const videoPath = `${userId}/${storyId}/video.${fileExt}`;

    // Upload video
    const { data: videoData, error: videoError } = await supabase.storage
      .from('stories')
      .upload(videoPath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (videoError) {
      throw new Error(`Erro ao fazer upload: ${videoError.message}`);
    }

    // Get public URL
    const { data: { publicUrl: videoUrl } } = supabase.storage
      .from('stories')
      .getPublicUrl(videoPath);

    // Generate thumbnail
    const thumbnailUrl = await this.generateThumbnail(file, userId, storyId);

    // Get duration
    const duration = await this.getVideoDuration(file);

    return {
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      duration_seconds: duration,
      file_size_bytes: file.size
    };
  }

  /**
   * Generates thumbnail from video first frame
   */
  static async generateThumbnail(
    file: File,
    userId: string,
    storyId: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadeddata = async () => {
        // Seek to 1 second or start
        video.currentTime = Math.min(1, video.duration);
      };

      video.onseeked = async () => {
        try {
          // Set canvas size
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Draw video frame to canvas
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert to blob
          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error('Failed to generate thumbnail'));
              return;
            }

            // Upload thumbnail
            const supabase = createClient();
            const thumbnailPath = `${userId}/${storyId}/thumbnail.jpg`;

            const { error: uploadError } = await supabase.storage
              .from('stories')
              .upload(thumbnailPath, blob, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              reject(new Error(`Failed to upload thumbnail: ${uploadError.message}`));
              return;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('stories')
              .getPublicUrl(thumbnailPath);

            window.URL.revokeObjectURL(video.src);
            resolve(publicUrl);
          }, 'image/jpeg', 0.8);
        } catch (error) {
          reject(error);
        }
      };

      video.onerror = () => {
        reject(new Error('Failed to load video for thumbnail'));
      };

      video.src = URL.createObjectURL(file);
      video.load();
    });
  }

  /**
   * Deletes video and thumbnail from storage
   */
  static async deleteVideo(videoUrl: string): Promise<void> {
    const supabase = createClient();

    // Extract path from URL
    const url = new URL(videoUrl);
    const pathMatch = url.pathname.match(/\/stories\/(.+)$/);
    if (!pathMatch) {
      throw new Error('Invalid video URL');
    }

    const videoPath = pathMatch[1];
    const thumbnailPath = videoPath.replace(/\/video\.[^/]+$/, '/thumbnail.jpg');

    // Delete video
    const { error: videoError } = await supabase.storage
      .from('stories')
      .remove([videoPath]);

    if (videoError) {
      console.error('Error deleting video:', videoError);
    }

    // Delete thumbnail
    const { error: thumbnailError } = await supabase.storage
      .from('stories')
      .remove([thumbnailPath]);

    if (thumbnailError) {
      console.error('Error deleting thumbnail:', thumbnailError);
    }
  }
}
