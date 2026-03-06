import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";
import { withCache } from "@/lib/utils/cache";
import { LocationService } from "@/lib/services/location.service";

export interface CatalogFilters {
  search?: string;
  gender?: string;
  service?: string;
  city?: string;
  region?: string;
  features?: string[];
}

export interface CatalogResult {
  boostedProfiles: Profile[];
  regularProfiles: Profile[];
  totalCount: number;
  hasMore: boolean;
}

export class CatalogService {
  /**
   * Search catalog with filters and pagination
   */
  static async searchCatalog(
    filters: CatalogFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<CatalogResult> {
    const boostedProfiles = await this.getBoostedProfiles(filters);
    const regularProfiles = await this.getRegularProfiles(filters, page, pageSize);
    
    // Get total count for pagination (only complete profiles)
    const supabase = await createClient();
    let countQuery = supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .neq("status", "unpublished")
      // Check required fields for catalog visibility
      .not("display_name", "is", null)
      .not("slug", "is", null)
      .not("city", "is", null)
      .not("birthdate", "is", null)
      .not("short_description", "is", null)
      .not("service_categories", "eq", "[]"); // Has at least one service category

    // Apply filters to count query
    countQuery = this.applyFilters(countQuery, filters);

    const { count } = await countQuery;
    const totalCount = count || 0;
    const hasMore = page * pageSize < totalCount;

    return {
      boostedProfiles,
      regularProfiles,
      totalCount,
      hasMore,
    };
  }

  /**
   * Get boosted profiles (up to 15, ordered by expiration)
   * Only shows profiles that are complete (have all required fields)
   */
  static async getBoostedProfiles(filters: CatalogFilters): Promise<Profile[]> {
    const supabase = await createClient();

    // Get active boosts
    const now = new Date().toISOString();
    const { data: boosts } = await supabase
      .from("boosts")
      .select("profile_id, end_time")
      .eq("status", "active")
      .lte("start_time", now)
      .gte("end_time", now)
      .order("end_time", { ascending: true })
      .limit(15);

    if (!boosts || boosts.length === 0) {
      return [];
    }

    const profileIds = boosts.map((b) => b.profile_id);

    // Get profiles with completeness check
    let query = supabase
      .from("profiles")
      .select(`
        *, 
        external_links(*),
        availability(*)
      `)
      .neq("status", "unpublished") // Exclude unpublished profiles
      .in("id", profileIds)
      // Check required fields for catalog visibility
      .not("display_name", "is", null)
      .not("slug", "is", null)
      .not("city", "is", null)
      .not("birthdate", "is", null)
      .not("short_description", "is", null)
      .not("service_categories", "eq", "[]"); // Has at least one service category

    // Apply filters
    query = this.applyFilters(query, filters);

    const { data: profiles } = await query;

    if (!profiles) return [];

    // Fetch media from media_processing table for each profile
    const profilesWithMedia = await Promise.all(
      profiles.map(async (profile) => {
        // Try new media_processing table first
        const { data: processedMedia } = await supabase
          .from("media_processing")
          .select("*")
          .eq("profile_id", profile.id)
          .eq("status", "ready")
          .order("sort_order", { ascending: true });

        // Fallback to old media table if no processed media
        let media = processedMedia || [];
        if (media.length === 0) {
          const { data: oldMedia } = await supabase
            .from("media")
            .select("*")
            .eq("profile_id", profile.id)
            .eq("type", "photo")
            .order("created_at", { ascending: true });
          
          // Transform old media format to new format
          media = (oldMedia || []).map((m: any) => ({
            ...m,
            type: "image", // Convert "photo" to "image"
            status: "ready",
            variants: {
              thumb_240: {
                url: m.public_url
              }
            }
          }));
        }

        return {
          ...profile,
          media,
        };
      })
    );

    // Filter profiles that have at least one photo
    const profilesWithPhotos = profilesWithMedia.filter(p => 
      p.media && p.media.some((m: any) => m.type === "image")
    ).map(p => {
      // Verification will be added later when the verification system is implemented
      return {
        ...p,
        is_verified: false,
        verified_at: null,
      };
    });

    // Sort by boost expiration order
    const profileMap = new Map(profilesWithPhotos.map((p) => [p.id, p]));
    return boosts
      .map((b) => profileMap.get(b.profile_id))
      .filter((p) => p !== undefined) as Profile[];
  }

  /**
   * Get regular (non-boosted) profiles
   * Only shows profiles that are complete (have all required fields)
   */
  static async getRegularProfiles(
    filters: CatalogFilters,
    page: number,
    pageSize: number
  ): Promise<Profile[]> {
    const supabase = await createClient();

    // Get active boost profile IDs to exclude
    const now = new Date().toISOString();
    const { data: boosts } = await supabase
      .from("boosts")
      .select("profile_id")
      .eq("status", "active")
      .lte("start_time", now)
      .gte("end_time", now);

    const boostedIds = boosts?.map((b) => b.profile_id) || [];

    // Get profiles with completeness check
    let query = supabase
      .from("profiles")
      .select(`
        *, 
        external_links(*),
        availability(*)
      `)
      .neq("status", "unpublished") // Exclude unpublished profiles
      // Check required fields for catalog visibility
      .not("display_name", "is", null)
      .not("slug", "is", null)
      .not("city", "is", null)
      .not("birthdate", "is", null)
      .not("short_description", "is", null)
      .not("service_categories", "eq", "[]"); // Has at least one service category

    // Exclude boosted profiles
    if (boostedIds.length > 0) {
      query = query.not("id", "in", `(${boostedIds.join(",")})`);
    }

    // Apply filters
    query = this.applyFilters(query, filters);

    // Order by most recently updated
    query = query.order("updated_at", { ascending: false });

    // Pagination
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data: profiles } = await query;

    if (!profiles) return [];

    // Fetch media from media_processing table for each profile
    const profilesWithMedia = await Promise.all(
      profiles.map(async (profile) => {
        // Try new media_processing table first
        const { data: processedMedia } = await supabase
          .from("media_processing")
          .select("*")
          .eq("profile_id", profile.id)
          .eq("status", "ready")
          .order("sort_order", { ascending: true });

        // Fallback to old media table if no processed media
        let media = processedMedia || [];
        if (media.length === 0) {
          const { data: oldMedia } = await supabase
            .from("media")
            .select("*")
            .eq("profile_id", profile.id)
            .eq("type", "photo")
            .order("created_at", { ascending: true });
          
          // Transform old media format to new format
          media = (oldMedia || []).map((m: any) => ({
            ...m,
            type: "image", // Convert "photo" to "image"
            status: "ready",
            variants: {
              thumb_240: {
                url: m.public_url
              }
            }
          }));
        }

        return {
          ...profile,
          media,
        };
      })
    );

    // Filter profiles that have at least one photo
    return profilesWithMedia.filter(p => 
      p.media && p.media.some((m: any) => m.type === "image")
    ).map(p => {
      // Verification will be added later when the verification system is implemented
      return {
        ...p,
        is_verified: false,
        verified_at: null,
      };
    });
  }

  /**
   * Apply filters to a query
   */
  private static applyFilters(query: any, filters: CatalogFilters): any {
    // Search filter (display_name or description)
    if (filters.search) {
      query = query.or(
        `display_name.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%,long_description.ilike.%${filters.search}%`
      );
    }

    // Gender filter
    if (filters.gender) {
      query = query.eq("gender_identity", filters.gender);
    }

    // Service filter (check if service is in service_categories array)
    // Using filter with cs (contains) operator for JSONB array containment
    if (filters.service) {
      query = query.filter("service_categories", "cs", `["${filters.service}"]`);
    }

    // City/State filter - prioritize address_state over city (Estado Base)
    // This matches profiles where either:
    // 1. address_state matches the filter (complete address)
    // 2. address_state is null/empty AND city matches the filter (Estado Base fallback)
    if (filters.city) {
      query = query.or(
        `address_state.eq.${filters.city},and(address_state.is.null,city.eq.${filters.city}),and(address_state.eq.,city.eq.${filters.city})`
      );
    }

    // Region filter
    if (filters.region) {
      query = query.eq("region", filters.region);
    }

    // Features filter (requires join with profile_features)
    // This is more complex and would need a separate query or RPC function
    // For now, we'll skip this in the basic implementation

    return query;
  }

  /**
   * Get unique categories from complete profiles (cached for 5 minutes)
   */
  static async getCategories(): Promise<string[]> {
    return withCache(
      'catalog:categories',
      async () => {
        const supabase = await createClient();

        const { data } = await supabase
          .from("profiles")
          .select("category")
          .neq("status", "unpublished")
          .not("display_name", "is", null)
          .not("slug", "is", null)
          .not("city", "is", null)
          .not("birthdate", "is", null)
          .not("short_description", "is", null)
          .not("service_categories", "eq", "[]");

        if (!data) return [];

        const categories = [...new Set(data.map((p) => p.category))];
        return categories.sort();
      },
      300 // 5 minutes
    );
  }

  /**
   * Get unique cities from complete profiles (cached for 5 minutes)
   */
  static async getCities(): Promise<string[]> {
    return withCache(
      'catalog:cities',
      async () => {
        const supabase = await createClient();

        const { data } = await supabase
          .from("profiles")
          .select("city")
          .neq("status", "unpublished")
          .not("display_name", "is", null)
          .not("slug", "is", null)
          .not("city", "is", null)
          .not("birthdate", "is", null)
          .not("short_description", "is", null)
          .not("service_categories", "eq", "[]");

        if (!data) return [];

        const cities = [...new Set(data.map((p) => p.city))];
        return cities.sort();
      },
      300 // 5 minutes
    );
  }

  /**
   * Get unique regions from complete profiles (cached for 5 minutes)
   */
  static async getRegions(): Promise<string[]> {
    return withCache(
      'catalog:regions',
      async () => {
        const supabase = await createClient();

        const { data } = await supabase
          .from("profiles")
          .select("region")
          .neq("status", "unpublished")
          .not("display_name", "is", null)
          .not("slug", "is", null)
          .not("city", "is", null)
          .not("birthdate", "is", null)
          .not("short_description", "is", null)
          .not("service_categories", "eq", "[]");

        if (!data) return [];

        const regions = [...new Set(data.map((p) => p.region))];
        return regions.sort();
      },
      300 // 5 minutes
    );
  }
}
