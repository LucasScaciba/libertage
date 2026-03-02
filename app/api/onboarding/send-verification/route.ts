import { AuthServerService as AuthServerService } from "@/lib/services/auth-server.service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await AuthServerService.requireAuth();
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // TODO: Send SMS via Twilio or other provider
    // For now, we'll just log it (in production, implement actual SMS sending)
    console.log(`Verification code for ${phoneNumber}: ${code}`);

    // Store code in a temporary storage (Redis recommended, or database)
    // For MVP, we'll use a simple in-memory store
    // In production, use Redis with expiration
    global.verificationCodes = global.verificationCodes || {};
    global.verificationCodes[user.id] = {
      code,
      phoneNumber,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending verification:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
