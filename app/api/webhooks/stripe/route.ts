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
        const session = event.data.object;
        if (session.mode === "subscription") {
          await SubscriptionService.handleCheckoutCompleted(session);
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
        await SubscriptionService.handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await SubscriptionService.handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_failed":
        await SubscriptionService.handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
