import { AuthServerService } from "@/lib/services/auth-server.service";
import { SubscriptionService } from "@/lib/services/subscription.service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await AuthServerService.requireAuth();
    const { planCode } = await request.json();

    if (!planCode || !["premium", "black"].includes(planCode)) {
      return NextResponse.json(
        { error: "Invalid plan code" },
        { status: 400 }
      );
    }

    const checkoutUrl = await SubscriptionService.createCheckoutSession(
      user.id,
      planCode
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
