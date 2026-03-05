import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    // Get active boosts with profile data
    const { data: boosts, error } = await supabase
      .from("boosts")
      .select(`
        id,
        start_time,
        end_time,
        profiles!inner(
          id,
          slug,
          display_name,
          category,
          city,
          region,
          age,
          hourly_rate,
          selected_features,
          media(id, public_url, type, is_cover, display_order)
        )
      `)
      .eq("status", "active")
      .lte("start_time", now)
      .gte("end_time", now)
      .order("start_time", { ascending: true });

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
