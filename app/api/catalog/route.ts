import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    
    const gender = searchParams.get("gender");
    const service = searchParams.get("service");
    const city = searchParams.get("city");
    const region = searchParams.get("region");
    const search = searchParams.get("search");

    // Build query for published profiles
    let query = supabase
      .from("profiles")
      .select("*")
      .eq("status", "published");

    // Apply filters
    if (gender) {
      query = query.eq("gender_identity", gender);
    }
    if (city) {
      query = query.eq("city", city);
    }
    if (region) {
      query = query.eq("region", region);
    }
    if (service) {
      query = query.contains("service_categories", [service]);
    }
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,short_description.ilike.%${search}%,long_description.ilike.%${search}%`);
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return NextResponse.json(
        { error: "Failed to fetch profiles" },
        { status: 500 }
      );
    }

    // Fetch media for all profiles (both old and new formats)
    const profileIds = profiles?.map((p) => p.id) || [];
    
    // Fetch from new media_processing table
    const { data: newMedia } = await supabase
      .from("media_processing")
      .select("*")
      .in("profile_id", profileIds)
      .eq("status", "ready")
      .order("sort_order", { ascending: true });

    // Fetch from old media table as fallback
    const { data: oldMedia } = await supabase
      .from("media")
      .select("*")
      .in("profile_id", profileIds)
      .order("created_at", { ascending: true });

    // Combine media data - prefer new format (media_processing), fallback to old (media)
    const mediaByProfile = new Map<string, any[]>();
    
    // First, add new media (processed media with variants)
    newMedia?.forEach((m) => {
      if (!mediaByProfile.has(m.profile_id)) {
        mediaByProfile.set(m.profile_id, []);
      }
      mediaByProfile.get(m.profile_id)!.push(m);
    });
    
    // Then, add old media ONLY if profile has no new media
    oldMedia?.forEach((m) => {
      if (!mediaByProfile.has(m.profile_id)) {
        // Profile has no new media, use old media
        mediaByProfile.set(m.profile_id, []);
        mediaByProfile.get(m.profile_id)!.push(m);
      }
      // If profile already has new media, skip old media entirely
    });

    // Attach media to profiles
    const profilesWithMedia = profiles?.map((profile) => ({
      ...profile,
      media: mediaByProfile.get(profile.id) || [],
    })) || [];

    // Get active boosts
    const { data: activeBoosts } = await supabase
      .from("boosts")
      .select("profile_id")
      .lte("boost_start", new Date().toISOString())
      .gte("boost_end", new Date().toISOString());

    const boostedProfileIds = new Set(activeBoosts?.map((b) => b.profile_id) || []);

    // Separate boosted and regular profiles
    const boostedProfiles = profilesWithMedia.filter((p) =>
      boostedProfileIds.has(p.id)
    );
    const regularProfiles = profilesWithMedia.filter((p) =>
      !boostedProfileIds.has(p.id)
    );

    // Get available filter options
    const categories = [...new Set(profiles?.flatMap((p) => p.service_categories || []))];
    const cities = [...new Set(profiles?.map((p) => p.city).filter(Boolean))];
    const regions = [...new Set(profiles?.map((p) => p.region).filter(Boolean))];

    return NextResponse.json({
      boostedProfiles,
      regularProfiles,
      filters: {
        categories,
        cities,
        regions,
      },
    });
  } catch (error) {
    console.error("Error in catalog API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
