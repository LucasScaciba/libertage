import { NextResponse } from "next/server";
import { BoostService } from "@/lib/services/boost.service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { profileId, startTime } = body;

    if (!profileId || !startTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify profile ownership
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", profileId)
      .single();

    if (!profile || profile.user_id !== user.id) {
      return NextResponse.json(
        { error: "Profile not found or unauthorized" },
        { status: 403 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    // Create checkout session
    const checkoutUrl = await BoostService.createBoostCheckout(
      profileId,
      start,
      end
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (error: any) {
    console.error("Error creating boost checkout:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout" },
      { status: 500 }
    );
  }
}
