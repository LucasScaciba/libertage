import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const { searchParams } = new URL(request.url);

    // Parse filters
    const filters = {
      gender: searchParams.get("gender") || undefined,
      service: searchParams.get("service") || undefined,
      city: searchParams.get("city") || undefined,
      search: searchParams.get("search") || undefined,
    };

    // Get active boosts with profile data
    let query = supabase
      .from("boosts")
      .select(`
        id,
        start_time,
        end_time,
        profiles!inner(*)
      `)
      .eq("status", "active")
      .lte("start_time", now)
      .gte("end_time", now);

    // Apply filters to profiles
    if (filters.gender) {
      query = query.eq("profiles.gender_identity", filters.gender);
    }
    
    if (filters.service) {
      query = query.filter("profiles.service_categories", "cs", `["${filters.service}"]`);
    }
    
    if (filters.city) {
      query = query.eq("profiles.city", filters.city);
    }
    
    if (filters.search) {
      query = query.or(
        `profiles.display_name.ilike.%${filters.search}%,profiles.short_description.ilike.%${filters.search}%,profiles.long_description.ilike.%${filters.search}%`
      );
    }

    query = query.order("start_time", { ascending: true });

    const { data: boosts, error } = await query;

    if (error) {
      console.error("Error fetching active boosts:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get profile IDs to fetch media
    const profileIds = boosts?.map((b: any) => b.profiles.id) || [];

    // Fetch media from new media_processing table
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

    // Transform data to include profile info at top level with media
    const boostedProfiles = boosts?.map((boost: any) => ({
      ...boost.profiles,
      media: mediaByProfile.get(boost.profiles.id) || [],
      boost_id: boost.id,
      boost_start: boost.start_time,
      boost_end: boost.end_time,
    })) || [];

    return NextResponse.json({ profiles: boostedProfiles });
  } catch (error: any) {
    console.error("Error in active boosts API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
