import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    // Activate scheduled boosts that should be active now
    const { data: activated, error: activateError } = await supabase
      .from("boosts")
      .update({ status: "active" })
      .eq("status", "scheduled")
      .lte("start_time", now)
      .gt("end_time", now)
      .select();

    if (activateError) {
      console.error("Error activating boosts:", activateError);
      return NextResponse.json({ error: activateError.message }, { status: 500 });
    }

    // Expire active boosts that have ended
    const { data: expired, error: expireError } = await supabase
      .from("boosts")
      .update({ status: "expired" })
      .eq("status", "active")
      .lte("end_time", now)
      .select();

    if (expireError) {
      console.error("Error expiring boosts:", expireError);
      return NextResponse.json({ error: expireError.message }, { status: 500 });
    }

    return NextResponse.json({
      activated: activated?.length || 0,
      expired: expired?.length || 0,
      message: `Activated ${activated?.length || 0} boosts, expired ${expired?.length || 0} boosts`,
    });
  } catch (error: any) {
    console.error("Error in activate boosts API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
