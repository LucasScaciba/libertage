import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import Stripe from "stripe";
import { withRetry } from "@/lib/utils/retry";
import { logger } from "@/lib/utils/logger";

export class SubscriptionService {
  static async createCheckoutSession(
    userId: string,
    planCode: "premium" | "black"
  ): Promise<string> {
    const supabase = await createClient();

    // Get plan details
    const { data: plan } = await supabase
      .from("plans")
      .select("*")
      .eq("code", planCode)
      .single();

    if (!plan || !plan.stripe_price_id) {
      throw new Error("Plan not found or not configured");
    }

    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      // Get user email
      const { data: user } = await supabase
        .from("users")
        .select("email, name")
        .eq("id", userId)
        .single();

      // Create Stripe customer with retry logic
      const customer = await withRetry(
        async () => await stripe.customers.create({
          email: user!.email,
          name: user!.name,
          metadata: {
            user_id: userId,
          },
        }),
        { maxAttempts: 3 }
      );

      customerId = customer.id;
    }

    // Create checkout session with retry logic
    const session = await withRetry(
      async () => await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: plan.stripe_price_id,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/plans?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/plans?canceled=true`,
        metadata: {
          user_id: userId,
          plan_code: planCode,
        },
      }),
      { maxAttempts: 3 }
    );

    return session.url!;
  }

  static async getCustomerPortalUrl(userId: string): Promise<string> {
    const supabase = await createClient();

    // Get Stripe customer ID
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (!subscription?.stripe_customer_id) {
      throw new Error("No subscription found");
    }

    // Create portal session with retry logic
    const session = await withRetry(
      async () => await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/plans`,
      }),
      { maxAttempts: 3 }
    );

    return session.url;
  }

  static async getCurrentSubscription(userId: string) {
    const supabase = await createClient();

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*, plans(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    return subscription;
  }

  static async getMediaLimits(userId: string): Promise<{
    maxPhotos: number;
    maxVideos: number;
  }> {
    const subscription = await this.getCurrentSubscription(userId);

    if (!subscription) {
      // Return free plan limits
      return { maxPhotos: 3, maxVideos: 0 };
    }

    const plan = subscription.plans as any;
    return {
      maxPhotos: plan.max_photos,
      maxVideos: plan.max_videos,
    };
  }

  static async handleCheckoutCompleted(session: any): Promise<void> {
    const supabase = await createClient();
    const userId = session.metadata.user_id;
    const planCode = session.metadata.plan_code;

    // Get plan
    const { data: plan } = await supabase
      .from("plans")
      .select("id")
      .eq("code", planCode)
      .single();

    if (!plan) throw new Error("Plan not found");

    // Get subscription from Stripe with retry logic
    const stripeSubscription: any = await withRetry(
      async () => await stripe.subscriptions.retrieve(
        session.subscription as string
      ),
      { maxAttempts: 3 }
    );

    // Upsert subscription
    await supabase.from("subscriptions").upsert({
      user_id: userId,
      plan_id: plan.id,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      status: "active",
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    });

    // Auto-publish profile if eligible
    await this.checkAndPublishProfile(userId);
  }

  static async handleSubscriptionUpdated(subscription: any): Promise<void> {
    const supabase = await createClient();

    // Find user by customer ID
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", subscription.id)
      .single();

    if (!existingSubscription) return;

    // Update subscription
    await supabase
      .from("subscriptions")
      .update({
        status: subscription.status === "active" ? "active" : subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id);

    // Check if should unpublish
    if (subscription.status !== "active") {
      await this.unpublishProfile(existingSubscription.user_id);
    }
  }

  static async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const supabase = await createClient();

    // Find user by subscription ID
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", subscription.id)
      .single();

    if (!existingSubscription) return;

    // Update to canceled
    await supabase
      .from("subscriptions")
      .update({ status: "canceled" })
      .eq("stripe_subscription_id", subscription.id);

    // Unpublish profile
    await this.unpublishProfile(existingSubscription.user_id);
  }

  static async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    const supabase = await createClient();

    if (!invoice.subscription) return;

    // Update subscription status
    await supabase
      .from("subscriptions")
      .update({ status: "past_due" })
      .eq("stripe_subscription_id", invoice.subscription);

    // Find user and unpublish
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", invoice.subscription)
      .single();

    if (subscription) {
      await this.unpublishProfile(subscription.user_id);
    }
  }

  private static async checkAndPublishProfile(userId: string): Promise<void> {
    const supabase = await createClient();

    // Check if user has completed onboarding
    const { data: user } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", userId)
      .single();

    if (!user?.onboarding_completed) return;

    // Check if has active subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (!subscription) return;

    // Publish profile
    await supabase
      .from("profiles")
      .update({ status: "published" })
      .eq("user_id", userId);
  }

  private static async unpublishProfile(userId: string): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from("profiles")
      .update({ status: "unpublished" })
      .eq("user_id", userId);
  }
}
