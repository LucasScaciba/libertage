import { AuthServerService } from "@/lib/services/auth-server.service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Type declaration for global verification codes storage
declare global {
  var verificationCodes: Record<string, {
    code: string;
    phoneNumber: string;
    expiresAt: number;
  }> | undefined;
}

export async function POST(request: Request) {
  try {
    const user = await AuthServerService.requireAuth();
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    // Check verification code
    const storedData = global.verificationCodes?.[user.id];

    if (!storedData) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    if (Date.now() > storedData.expiresAt) {
      delete global.verificationCodes[user.id];
      return NextResponse.json(
        { error: "Verification code expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (storedData.code !== code) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Update user with verified phone
    const supabase = await createClient();
    const { error } = await supabase
      .from("users")
      .update({
        phone_number: storedData.phoneNumber,
        phone_verified_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) throw error;

    // Clean up verification code
    delete global.verificationCodes[user.id];

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying phone:", error);
    return NextResponse.json(
      { error: "Failed to verify phone number" },
      { status: 500 }
    );
  }
}
