import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AuthServerService } from "@/lib/services/auth-server.service";

export async function POST(request: NextRequest) {
  try {
    const user = await AuthServerService.requireAuth();
    const supabase = await createClient();

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Create test boost (active now for 2 hours)
    const now = new Date();
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

    const boostContext = `${profile.city}:${profile.region}:${profile.category}`;

    const { data: boost, error: boostError } = await supabase
      .from("boosts")
      .insert({
        profile_id: profile.id,
        boost_context: boostContext,
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        status: "active",
        amount_paid: 5000,
      })
      .select()
      .single();

    if (boostError) {
      return NextResponse.json({ error: boostError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Test boost created successfully",
      boost,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
