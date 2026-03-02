import { AuthServerService } from "@/lib/services/auth-server.service";
import { twilioClient } from "@/lib/twilio/client";
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
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Send SMS via Twilio
    try {
      await twilioClient.messages.create({
        body: `Seu código de verificação é: ${code}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
    } catch (twilioError: any) {
      console.error("Twilio error:", twilioError);
      return NextResponse.json(
        { error: "Failed to send SMS. Please check the phone number." },
        { status: 500 }
      );
    }

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
