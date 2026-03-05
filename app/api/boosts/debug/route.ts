import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const now = new Date();

    // Get all boosts
    const { data: boosts, error } = await supabase
      .from("boosts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      server_time: now.toISOString(),
      server_time_local: now.toString(),
      boosts: boosts?.map(b => ({
        id: b.id,
        status: b.status,
        start_time: b.start_time,
        end_time: b.end_time,
        start_passed: new Date(b.start_time) <= now,
        end_passed: new Date(b.end_time) <= now,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
