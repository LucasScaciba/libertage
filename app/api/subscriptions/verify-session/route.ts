import { AuthServerService } from "@/lib/services/auth-server.service";
import { stripe } from "@/lib/stripe/client";
import { SubscriptionService } from "@/lib/services/subscription.service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await AuthServerService.requireAuth();
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    console.log("=== Verifying Stripe Session ===");
    console.log("Session ID:", sessionId);
    console.log("User ID:", user.id);

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log("Session retrieved:", {
      id: session.id,
      mode: session.mode,
      status: session.status,
      payment_status: session.payment_status,
      metadata: session.metadata,
    });

    // Verify the session belongs to this user
    if (session.metadata?.user_id !== user.id) {
      console.error("Session user mismatch:", {
        sessionUserId: session.metadata?.user_id,
        currentUserId: user.id,
      });
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 403 }
      );
    }

    // Check if payment was successful
    if (session.payment_status !== "paid") {
      console.log("Payment not completed yet:", session.payment_status);
      return NextResponse.json(
        { error: "Payment not completed", status: session.payment_status },
        { status: 400 }
      );
    }

    // If this is a subscription checkout, process it
    if (session.mode === "subscription" && session.subscription) {
      console.log("Processing subscription checkout manually...");
      await SubscriptionService.handleCheckoutCompleted(session);
      console.log("Subscription processed successfully");

      return NextResponse.json({
        success: true,
        message: "Subscription activated",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Session verified",
    });
  } catch (error: any) {
    console.error("Error verifying session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify session" },
      { status: 500 }
    );
  }
}
