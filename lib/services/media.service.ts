import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Media } from "@/types";

export class MediaService {
  static async generateUploadUrl(
    profileId: string,
    fileType: string,
    fileSize: number
  ): Promise<{ uploadUrl: string; path: string }> {
    const supabase = await createClient();

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(fileType)) {
      throw new Error("Invalid file type. Only images and videos are allowed.");
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (fileSize > maxSize) {
      throw new Error("File size exceeds 50MB limit");
    }

    // Generate unique file path
    const ext = fileType.split("/")[1];
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const path = `profiles/${profileId}/${fileName}`;

    // Generate signed URL (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from("media")
      .createSignedUploadUrl(path);

    if (error) throw error;

    return {
      uploadUrl: data.signedUrl,
      path,
    };
  }

  static async validateMediaLimits(
    profileId: string,
    type: "photo" | "video"
  ): Promise<boolean> {
    const supabase = await createClient();

    // Get profile's user
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", profileId)
      .single();

    if (!profile) throw new Error("Profile not found");

    // Get user's subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan_id, plans(max_photos, max_videos)")
      .eq("user_id", profile.user_id)
      .eq("status", "active")
      .single();

    if (!subscription) throw new Error("No active subscription found");

    const plan = subscription.plans as any;
    const maxPhotos = plan.max_photos;
    const maxVideos = plan.max_videos;

    // Count current media
    const { count } = await supabase
      .from("media")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("type", type);

    const currentCount = count || 0;
    const limit = type === "photo" ? maxPhotos : maxVideos;

    return currentCount < limit;
  }

  static async createMediaRecord(
    profileId: string,
    data: {
      type: "photo" | "video";
      storage_path: string;
      public_url: string;
      file_size: number;
      is_cover?: boolean;
      sort_order?: number;
    }
  ): Promise<Media> {
    const supabase = createServiceClient();

    // If this is set as cover, unset other covers
    if (data.is_cover) {
      await supabase
        .from("media")
        .update({ is_cover: false })
        .eq("profile_id", profileId)
        .eq("type", "photo");
    }

    const { data: media, error } = await supabase
      .from("media")
      .insert({
        profile_id: profileId,
        type: data.type,
        storage_path: data.storage_path,
        public_url: data.public_url,
        file_size: data.file_size,
        is_cover: data.is_cover || false,
        sort_order: data.sort_order || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return media;
  }

  static async updateMedia(
    mediaId: string,
    data: {
      is_cover?: boolean;
      sort_order?: number;
    }
  ): Promise<Media> {
    const supabase = await createClient();

    // If setting as cover, get profile_id first
    if (data.is_cover) {
      const { data: currentMedia } = await supabase
        .from("media")
        .select("profile_id")
        .eq("id", mediaId)
        .single();

      if (currentMedia) {
        await supabase
          .from("media")
          .update({ is_cover: false })
          .eq("profile_id", currentMedia.profile_id)
          .eq("type", "photo");
      }
    }

    const { data: media, error } = await supabase
      .from("media")
      .update(data)
      .eq("id", mediaId)
      .select()
      .single();

    if (error) throw error;
    return media;
  }

  static async deleteMedia(mediaId: string): Promise<void> {
    const supabase = await createClient();

    // Get media info
    const { data: media } = await supabase
      .from("media")
      .select("storage_path")
      .eq("id", mediaId)
      .single();

    if (!media) throw new Error("Media not found");

    // Delete from storage
    await supabase.storage.from("media").remove([media.storage_path]);

    // Delete from database
    const { error } = await supabase.from("media").delete().eq("id", mediaId);

    if (error) throw error;
  }

  static async setCoverImage(profileId: string, mediaId: string): Promise<void> {
    const supabase = await createClient();

    // Unset all covers for this profile
    await supabase
      .from("media")
      .update({ is_cover: false })
      .eq("profile_id", profileId)
      .eq("type", "photo");

    // Set new cover
    const { error } = await supabase
      .from("media")
      .update({ is_cover: true })
      .eq("id", mediaId)
      .eq("profile_id", profileId);

    if (error) throw error;
  }
}
