import { AuthServerService as AuthServerService } from "@/lib/services/auth-server.service";
import { SubscriptionService } from "@/lib/services/subscription.service";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await AuthServerService.requireAuth();

    const portalUrl = await SubscriptionService.getCustomerPortalUrl(user.id);

    return NextResponse.json({ url: portalUrl });
  } catch (error: any) {
    console.error("Error getting portal URL:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get portal URL" },
      { status: 500 }
    );
  }
}
