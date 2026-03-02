import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

interface CreateProfileInput {
  display_name: string;
  slug: string;
  category: string;
  short_description: string;
  long_description: string;
  city: string;
  region: string;
  latitude?: number;
  longitude?: number;
  age_attribute?: number;
  external_links?: any[];
  pricing_packages?: any[];
}

interface UpdateProfileInput {
  display_name?: string;
  slug?: string;
  category?: string;
  short_description?: string;
  long_description?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  age_attribute?: number;
  external_links?: any[];
  pricing_packages?: any[];
}

export class ProfileService {
  static async createProfile(userId: string, data: CreateProfileInput): Promise<Profile> {
    const supabase = await createClient();

    // Use default coordinates (center of Brazil) if not provided
    const latitude = data.latitude || -14.235;
    const longitude = data.longitude || -51.9253;

    // Generate a simple geohash alternative (first 5 chars of lat/lng combined)
    // This is just for privacy, not for actual geospatial queries
    const geoHash = `${Math.floor(latitude * 100)}${Math.floor(longitude * 100)}`.substring(0, 10);

    const { data: profile, error } = await supabase
      .from("profiles")
      .insert({
        user_id: userId,
        display_name: data.display_name,
        slug: data.slug,
        category: data.category,
        short_description: data.short_description,
        long_description: data.long_description,
        city: data.city,
        region: data.region,
        latitude,
        longitude,
        geohash: geoHash,
        age_attribute: data.age_attribute,
        external_links: data.external_links || [],
        pricing_packages: data.pricing_packages || [],
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;
    return profile;
  }

  static async updateProfile(profileId: string, data: UpdateProfileInput): Promise<Profile> {
    const supabase = await createClient();

    const updateData: any = { ...data };

    // Update geohash if location changed
    if (data.latitude && data.longitude) {
      const geoHash = `${Math.floor(data.latitude * 100)}${Math.floor(data.longitude * 100)}`.substring(0, 10);
      updateData.geohash = geoHash;
    }

    // Check slug cooldown if slug is being changed
    if (data.slug) {
      // Get current profile to check if slug actually changed
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("slug")
        .eq("id", profileId)
        .single();

      // Only check cooldown if slug is actually different
      if (currentProfile && currentProfile.slug !== data.slug) {
        const canChange = await this.canChangeSlug(profileId);
        if (!canChange) {
          throw new Error("Slug can only be changed once every 90 days");
        }
        updateData.slug_last_changed_at = new Date().toISOString();
      }
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", profileId)
      .select()
      .single();

    if (error) throw error;
    return profile;
  }

  static async getProfile(profileId: string): Promise<Profile | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (error) return null;
    return data;
  }

  static async getProfileBySlug(slug: string): Promise<Profile | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error) return null;
    return data;
  }

  static async canChangeSlug(profileId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data } = await supabase
      .from("profiles")
      .select("slug_last_changed_at")
      .eq("id", profileId)
      .single();

    if (!data?.slug_last_changed_at) return true;

    const lastChanged = new Date(data.slug_last_changed_at);
    const now = new Date();
    const daysSinceChange = (now.getTime() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceChange >= 90;
  }

  static async publishProfile(profileId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ status: "published" })
      .eq("id", profileId);

    if (error) throw error;
  }

  static async unpublishProfile(profileId: string, actorId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ status: "unpublished" })
      .eq("id", profileId);

    if (error) throw error;

    // Create audit log
    await supabase.from("audit_logs").insert({
      actor_user_id: actorId,
      action: "profile_unpublished",
      target_type: "profile",
      target_id: profileId,
    });
  }

  static async checkPublishingEligibility(userId: string): Promise<boolean> {
    const supabase = await createClient();

    // Check onboarding
    const { data: user } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", userId)
      .single();

    if (!user?.onboarding_completed) return false;

    // Check subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    return !!subscription;
  }
}
