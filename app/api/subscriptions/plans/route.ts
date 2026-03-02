import { AuthServerService } from "@/lib/services/auth-server.service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all plans
    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select("*")
      .order("price", { ascending: true });

    if (plansError) throw plansError;

    // Try to get user's current subscription
    let subscription = null;
    try {
      const user = await AuthServerService.requireAuth();
      const { data: subData } = await supabase
        .from("subscriptions")
        .select(`
          *,
          plan:plans(*)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();
      
      subscription = subData;
    } catch (err) {
      // User not authenticated or no subscription - that's ok
    }

    return NextResponse.json({ plans, subscription });
  } catch (error: any) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch plans" },
      { status: 500 }
    );
  }
}
