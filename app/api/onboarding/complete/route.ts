import { AuthServerService } from "@/lib/services/auth-server.service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await AuthServerService.requireAuth();
    const { termsAccepted } = await request.json();

    if (!termsAccepted) {
      return NextResponse.json(
        { error: "You must accept the terms and conditions" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Complete onboarding
    const { error } = await supabase
      .from("users")
      .update({
        terms_accepted_at: new Date().toISOString(),
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (error) throw error;

    // Create free subscription for new user
    const { data: freePlan } = await supabase
      .from("plans")
      .select("id")
      .eq("code", "free")
      .single();

    if (freePlan) {
      await supabase.from("subscriptions").insert({
        user_id: user.id,
        plan_id: freePlan.id,
        status: "active",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
