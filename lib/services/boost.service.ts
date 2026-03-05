import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { Profile } from "@/types";
import { withRetry } from "@/lib/utils/retry";
import { logger } from "@/lib/utils/logger";

const BOOST_DURATION_HOURS = 2;
const MAX_CONCURRENT_BOOSTS = 15;
const BOOST_PRICE_CENTS = 5000; // R$ 50.00

export class BoostService {
  /**
   * Generate boost context key from profile data
   * Format: "city:region:category"
   */
  static getBoostContext(profile: Profile): string {
    return `${profile.city}:${profile.region}:${profile.category}`;
  }

  /**
   * Check if boost capacity is available for the given time window
   */
  static async checkAvailability(
    context: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    const supabase = await createClient();

    // Count concurrent active/scheduled boosts in the time window
    const { count } = await supabase
      .from("boosts")
      .select("*", { count: "exact", head: true })
      .eq("boost_context", context)
      .in("status", ["scheduled", "active"])
      .or(
        `and(start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()})`
      );

    return (count ?? 0) < MAX_CONCURRENT_BOOSTS;
  }

  /**
   * Get next available time slots if capacity is full
   * Returns array of start times for the next 5 available slots
   */
  static async getNextAvailableSlots(
    context: string,
    preferredStart: Date
  ): Promise<Date[]> {
    const supabase = await createClient();
    const slots: Date[] = [];
    let currentStart = new Date(preferredStart);

    // Check slots in 2-hour increments
    while (slots.length < 5) {
      const currentEnd = new Date(
        currentStart.getTime() + BOOST_DURATION_HOURS * 60 * 60 * 1000
      );

      const isAvailable = await this.checkAvailability(
        context,
        currentStart,
        currentEnd
      );

      if (isAvailable) {
        slots.push(new Date(currentStart));
      }

      // Move to next 2-hour slot
      currentStart = new Date(currentStart.getTime() + 2 * 60 * 60 * 1000);
    }

    return slots;
  }

  /**
   * Create Stripe Checkout session for boost purchase
   */
  static async createBoostCheckout(
    profileId: string,
    startTime: Date,
    endTime: Date
  ): Promise<string> {
    const supabase = await createClient();

    // Get profile and user info
    const { data: profile } = await supabase
      .from("profiles")
      .select("*, users!inner(id, email, name)")
      .eq("id", profileId)
      .single();

    if (!profile) {
      throw new Error("Profile not found");
    }

    const context = this.getBoostContext(profile as any);

    // Check availability
    const isAvailable = await this.checkAvailability(context, startTime, endTime);
    if (!isAvailable) {
      throw new Error("Boost capacity full for selected time window");
    }

    // Create pending boost record
    const { data: boost, error: boostError } = await supabase
      .from("boosts")
      .insert({
        profile_id: profileId,
        boost_context: context,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: "scheduled",
        amount_paid: BOOST_PRICE_CENTS,
      })
      .select()
      .single();

    if (boostError) {
      console.error('[BoostService] Error creating boost record:', boostError);
      throw new Error(`Failed to create boost record: ${boostError.message}`);
    }

    if (!boost) {
      throw new Error("Failed to create boost record: No data returned");
    }

    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", (profile as any).users.id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await withRetry(
        async () => await stripe.customers.create({
          email: (profile as any).users.email,
          name: (profile as any).users.name,
          metadata: {
            user_id: (profile as any).users.id,
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
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: "Profile Boost - 2 Hours",
                description: `Boost for ${startTime.toLocaleString()} - ${endTime.toLocaleString()}`,
              },
              unit_amount: BOOST_PRICE_CENTS,
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/boosts?boost_success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/boosts?boost_canceled=true`,
        metadata: {
          boost_id: boost.id,
          profile_id: profileId,
          boost_context: context,
        },
      }),
      { maxAttempts: 3 }
    );

    return session.url!;
  }

  /**
   * Confirm boost after successful payment
   */
  static async confirmBoost(
    boostId: string,
    paymentIntentId: string
  ): Promise<void> {
    const supabase = await createClient();

    // Get boost details
    const { data: boost } = await supabase
      .from("boosts")
      .select("*")
      .eq("id", boostId)
      .single();

    if (!boost) {
      throw new Error("Boost not found");
    }

    // Check if capacity is still available
    const isAvailable = await this.checkAvailability(
      boost.boost_context,
      new Date(boost.start_time),
      new Date(boost.end_time)
    );

    if (!isAvailable) {
      // Refund the payment
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: "requested_by_customer",
      });

      // Cancel the boost
      await supabase
        .from("boosts")
        .update({ status: "canceled" })
        .eq("id", boostId);

      throw new Error("Boost capacity no longer available - payment refunded");
    }

    // Confirm the boost
    await supabase
      .from("boosts")
      .update({
        stripe_payment_intent_id: paymentIntentId,
        status: "scheduled",
      })
      .eq("id", boostId);
  }

  /**
   * Activate scheduled boosts when start time arrives
   * Should be called by cron job every minute
   */
  static async activateScheduledBoosts(): Promise<void> {
    const supabase = await createClient();
    const now = new Date();

    await supabase
      .from("boosts")
      .update({ status: "active" })
      .eq("status", "scheduled")
      .lte("start_time", now.toISOString());
  }

  /**
   * Expire active boosts when end time passes
   * Should be called by cron job every minute
   */
  static async expireActiveBoosts(): Promise<void> {
    const supabase = await createClient();
    const now = new Date();

    await supabase
      .from("boosts")
      .update({ status: "expired" })
      .eq("status", "active")
      .lte("end_time", now.toISOString());
  }

  /**
   * Get user's boosts
   */
  static async getUserBoosts(userId: string) {
    const supabase = await createClient();

    const { data: boosts } = await supabase
      .from("boosts")
      .select("*, profiles!inner(user_id, display_name, slug)")
      .eq("profiles.user_id", userId)
      .order("start_time", { ascending: false });

    return boosts;
  }
}
