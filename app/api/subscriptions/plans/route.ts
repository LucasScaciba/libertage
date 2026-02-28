import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: plans, error } = await supabase
      .from("plans")
      .select("*")
      .order("price", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch plans" },
      { status: 500 }
    );
  }
}
