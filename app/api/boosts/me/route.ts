import { NextResponse } from "next/server";
import { BoostService } from "@/lib/services/boost.service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const boosts = await BoostService.getUserBoosts(user.id);

    return NextResponse.json({ boosts });
  } catch (error: any) {
    console.error("Error fetching user boosts:", error);
    return NextResponse.json(
      { error: "Failed to fetch boosts" },
      { status: 500 }
    );
  }
}
