import { stripe } from "@/lib/stripe/client";
import { SubscriptionService } from "@/lib/services/subscription.service";
import { BoostService } from "@/lib/services/boost.service";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        console.log("=== Checkout Session Completed ===");
        const session = event.data.object;
        console.log("Session ID:", session.id);
        console.log("Session mode:", session.mode);
        console.log("Session metadata:", session.metadata);
        console.log("Customer:", session.customer);
        console.log("Subscription:", session.subscription);
        
        if (session.mode === "subscription") {
          console.log("Processing subscription checkout...");
          await SubscriptionService.handleCheckoutCompleted(session);
          console.log("Subscription checkout processed successfully");
        } else if (session.mode === "payment" && session.metadata?.boost_id) {
          // Handle boost payment
          const paymentIntent = await stripe.paymentIntents.retrieve(
            session.payment_intent as string
          );
          await BoostService.confirmBoost(
            session.metadata.boost_id,
            paymentIntent.id
          );
        }
        break;

      case "customer.subscription.updated":
        console.log("=== Subscription Updated ===");
        console.log("Subscription ID:", event.data.object.id);
        console.log("Status:", event.data.object.status);
        await SubscriptionService.handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        console.log("=== Subscription Deleted ===");
        await SubscriptionService.handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_failed":
        console.log("=== Invoice Payment Failed ===");
        await SubscriptionService.handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
