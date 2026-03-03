import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";
import { withCache } from "@/lib/utils/cache";

export interface CatalogFilters {
  search?: string;
  category?: string;
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
    
    // Get total count for pagination
    const supabase = await createClient();
    let countQuery = supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");

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

    // Get profiles
    let query = supabase
      .from("profiles")
      .select("*, media(*)")
      .eq("status", "published")
      .in("id", profileIds);

    // Apply filters
    query = this.applyFilters(query, filters);

    const { data: profiles } = await query;

    if (!profiles) return [];

    // Sort by boost expiration order
    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    return boosts
      .map((b) => profileMap.get(b.profile_id))
      .filter((p) => p !== undefined) as Profile[];
  }

  /**
   * Get regular (non-boosted) profiles
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

    // Get profiles
    let query = supabase
      .from("profiles")
      .select("*, media(*)")
      .eq("status", "published");

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

    return profiles || [];
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

    // Category filter
    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    // City filter
    if (filters.city) {
      query = query.eq("city", filters.city);
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
   * Get unique categories from published profiles (cached for 5 minutes)
   */
  static async getCategories(): Promise<string[]> {
    return withCache(
      'catalog:categories',
      async () => {
        const supabase = await createClient();

        const { data } = await supabase
          .from("profiles")
          .select("category")
          .eq("status", "published");

        if (!data) return [];

        const categories = [...new Set(data.map((p) => p.category))];
        return categories.sort();
      },
      300 // 5 minutes
    );
  }

  /**
   * Get unique cities from published profiles (cached for 5 minutes)
   */
  static async getCities(): Promise<string[]> {
    return withCache(
      'catalog:cities',
      async () => {
        const supabase = await createClient();

        const { data } = await supabase
          .from("profiles")
          .select("city")
          .eq("status", "published");

        if (!data) return [];

        const cities = [...new Set(data.map((p) => p.city))];
        return cities.sort();
      },
      300 // 5 minutes
    );
  }

  /**
   * Get unique regions from published profiles (cached for 5 minutes)
   */
  static async getRegions(): Promise<string[]> {
    return withCache(
      'catalog:regions',
      async () => {
        const supabase = await createClient();

        const { data } = await supabase
          .from("profiles")
          .select("region")
          .eq("status", "published");

        if (!data) return [];

        const regions = [...new Set(data.map((p) => p.region))];
        return regions.sort();
      },
      300 // 5 minutes
    );
  }
}
