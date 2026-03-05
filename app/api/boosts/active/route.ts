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
        profiles!inner(
          *,
          media(*),
          external_links(*),
          availability(*)
        )
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

    // Transform data to include profile info at top level
    const boostedProfiles = boosts?.map((boost: any) => ({
      ...boost.profiles,
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
