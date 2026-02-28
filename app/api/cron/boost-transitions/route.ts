import { NextResponse } from "next/server";
import { BoostService } from "@/lib/services/boost.service";

/**
 * Cron job to handle boost status transitions
 * Should be called every minute via Vercel Cron or similar
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/boost-transitions",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Activate scheduled boosts that have reached their start time
    await BoostService.activateScheduledBoosts();

    // Expire active boosts that have passed their end time
    await BoostService.expireActiveBoosts();

    return NextResponse.json({
      success: true,
      message: "Boost transitions processed",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error processing boost transitions:", error);
    return NextResponse.json(
      { error: "Failed to process boost transitions" },
      { status: 500 }
    );
  }
}
