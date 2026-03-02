import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    console.log("🎯 Starting onboarding completion...");
    
    const supabase = await createClient();
    
    // Get authenticated user from Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      console.log("❌ User not authenticated");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    console.log(`👤 User authenticated: ${authUser.id}`);
    
    const { termsAccepted } = await request.json();
    console.log(`📋 Terms accepted: ${termsAccepted}`);

    if (!termsAccepted) {
      console.log("❌ Terms not accepted");
      return NextResponse.json(
        { error: "You must accept the terms and conditions" },
        { status: 400 }
      );
    }

    // Check if user exists in users table, if not create it
    console.log("🔍 Checking if user exists in users table...");
    
    // Use service client to bypass RLS for user creation/update
    const serviceSupabase = createServiceClient();
    
    const { data: existingUser } = await serviceSupabase
      .from("users")
      .select("id")
      .eq("id", authUser.id)
      .single();

    if (!existingUser) {
      console.log("📝 Creating user in users table...");
      
      // Generate a default name from email
      const defaultName = authUser.email?.split('@')[0] || 'User';
      
      const { error: createError } = await serviceSupabase
        .from("users")
        .insert({
          id: authUser.id,
          email: authUser.email,
          name: defaultName,
          terms_accepted_at: new Date().toISOString(),
          onboarding_completed: true,
        });

      if (createError) {
        console.error("❌ Error creating user:", createError);
        throw createError;
      }
      console.log("✅ User created in users table");
    } else {
      // Update existing user
      console.log("💾 Updating user onboarding status...");
      const { error: updateError } = await serviceSupabase
        .from("users")
        .update({
          terms_accepted_at: new Date().toISOString(),
          onboarding_completed: true,
        })
        .eq("id", authUser.id);

      if (updateError) {
        console.error("❌ Error updating user:", updateError);
        throw updateError;
      }
      console.log("✅ User onboarding status updated");
    }

    // Create free subscription for new user
    console.log("🔍 Looking for free plan...");
    const { data: freePlan, error: planError } = await serviceSupabase
      .from("plans")
      .select("id")
      .eq("code", "free")
      .single();

    if (planError) {
      console.error("⚠️ Error fetching free plan:", planError);
    } else if (freePlan) {
      console.log(`✅ Free plan found: ${freePlan.id}`);
      
      // Check if subscription already exists
      const { data: existingSub } = await serviceSupabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", authUser.id)
        .single();

      if (!existingSub) {
        console.log("💾 Creating subscription...");
        const { error: subError } = await serviceSupabase.from("subscriptions").insert({
          user_id: authUser.id,
          plan_id: freePlan.id,
          status: "active",
        });

        if (subError) {
          console.error("⚠️ Error creating subscription:", subError);
        } else {
          console.log("✅ Subscription created");
        }
      } else {
        console.log("ℹ️ Subscription already exists");
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
