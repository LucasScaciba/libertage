import { AuthServerService } from "@/lib/services/auth-server.service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    console.log("🎯 Starting onboarding completion...");
    
    const user = await AuthServerService.requireAuth();
    console.log(`👤 User authenticated: ${user.id}`);
    
    const { termsAccepted } = await request.json();
    console.log(`📋 Terms accepted: ${termsAccepted}`);

    if (!termsAccepted) {
      console.log("❌ Terms not accepted");
      return NextResponse.json(
        { error: "You must accept the terms and conditions" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    console.log("✅ Supabase client created");

    // Complete onboarding
    console.log("💾 Updating user onboarding status...");
    const { error: updateError } = await supabase
      .from("users")
      .update({
        terms_accepted_at: new Date().toISOString(),
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("❌ Error updating user:", updateError);
      throw updateError;
    }
    console.log("✅ User onboarding status updated");

    // Create free subscription for new user
    console.log("🔍 Looking for free plan...");
    const { data: freePlan, error: planError } = await supabase
      .from("plans")
      .select("id")
      .eq("code", "free")
      .single();

    if (planError) {
      console.error("⚠️ Error fetching free plan:", planError);
    } else if (freePlan) {
      console.log(`✅ Free plan found: ${freePlan.id}`);
      console.log("💾 Creating subscription...");
      
      const { error: subError } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        plan_id: freePlan.id,
        status: "active",
      });

      if (subError) {
        console.error("⚠️ Error creating subscription:", subError);
      } else {
        console.log("✅ Subscription created");
      }
    } else {
      console.log("⚠️ No free plan found");
    }

    console.log("✅ Onboarding completed successfully");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Error completing onboarding:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
