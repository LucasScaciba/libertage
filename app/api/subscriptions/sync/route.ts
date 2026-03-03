import { AuthServerService } from "@/lib/services/auth-server.service";
import { stripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/subscriptions/sync
 * Manually sync user's Stripe subscriptions with database
 */
export async function POST() {
  try {
    const user = await AuthServerService.requireAuth();
    console.log("=== SYNC SUBSCRIPTIONS START ===");
    console.log("User ID:", user.id);

    const supabase = createServiceClient();

    // Get user's email to find Stripe customer
    const { data: userData } = await supabase
      .from("users")
      .select("email")
      .eq("id", user.id)
      .single();

    if (!userData?.email) {
      throw new Error("User email not found");
    }

    console.log("User email:", userData.email);

    // Find Stripe customer by email
    const customers = await stripe.customers.list({
      email: userData.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: "No Stripe customer found for this email" },
        { status: 404 }
      );
    }

    const customer = customers.data[0];
    console.log("Stripe customer found:", customer.id);

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 10,
    });

    console.log("Active subscriptions found:", subscriptions.data.length);

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: "No active subscriptions found in Stripe" },
        { status: 404 }
      );
    }

    // Process the first active subscription
    const stripeSubscription = subscriptions.data[0];
    console.log("Processing subscription:", stripeSubscription.id);

    // Get the price ID from the subscription
    const priceId = stripeSubscription.items.data[0]?.price.id;
    console.log("Price ID:", priceId);

    // Find the plan in our database by stripe_price_id
    const { data: plan } = await supabase
      .from("plans")
      .select("*")
      .eq("stripe_price_id", priceId)
      .single();

    if (!plan) {
      return NextResponse.json(
        { error: `No plan found for Stripe price ID: ${priceId}` },
        { status: 404 }
      );
    }

    console.log("Plan found:", plan.code, plan.name);

    // Prepare subscription data
    const periodStart = stripeSubscription.current_period_start 
      ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
      : new Date().toISOString();
    
    const periodEnd = stripeSubscription.current_period_end
      ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    console.log("Upserting subscription to database...");

    // Upsert subscription in database
    const { error: upsertError } = await supabase
      .from("subscriptions")
      .upsert({
        user_id: user.id,
        plan_id: plan.id,
        stripe_customer_id: customer.id,
        stripe_subscription_id: stripeSubscription.id,
        status: "active",
        current_period_start: periodStart,
        current_period_end: periodEnd,
      }, {
        onConflict: "user_id",
      });

    if (upsertError) {
      console.error("Error upserting subscription:", upsertError);
      throw upsertError;
    }

    console.log("✅ Subscription synced successfully");
    console.log("=== SYNC SUBSCRIPTIONS END ===");

    return NextResponse.json({
      success: true,
      message: "Subscription synced successfully",
      plan: {
        code: plan.code,
        name: plan.name,
      },
    });
  } catch (error: any) {
    console.error("Error syncing subscriptions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync subscriptions" },
      { status: 500 }
    );
  }
}
