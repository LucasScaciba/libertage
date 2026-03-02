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
    console.log("📞 Starting phone verification process...");
    
    const user = await AuthServerService.requireAuth();
    console.log(`👤 User authenticated: ${user.id}`);
    
    const { phoneNumber } = await request.json();
    console.log(`📱 Phone number received: ${phoneNumber}`);

    if (!phoneNumber) {
      console.log("❌ No phone number provided");
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Validate Brazilian phone format
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    console.log(`🔍 Clean number: ${cleanNumber} (length: ${cleanNumber.length})`);
    
    if (!cleanNumber.startsWith("55") || cleanNumber.length !== 13) {
      console.log("❌ Invalid phone format");
      return NextResponse.json(
        { error: "Número de telefone inválido. Use o formato: +55 (11) 99999-9999" },
        { status: 400 }
      );
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔐 Generated code: ${code}`);

    // Check if Twilio is configured
    const twilioConfigured = !!(
      twilioClient &&
      process.env.TWILIO_PHONE_NUMBER
    );
    console.log(`🔧 Twilio configured: ${twilioConfigured}`);

    if (twilioConfigured) {
      // Send SMS via Twilio
      try {
        console.log("📤 Attempting to send SMS via Twilio...");
        await twilioClient!.messages.create({
          body: `Seu código de verificação Libertage é: ${code}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phoneNumber,
        });
        console.log(`✅ SMS sent successfully to ${phoneNumber}`);
      } catch (twilioError: any) {
        console.error("❌ Twilio error:", twilioError);
        return NextResponse.json(
          { error: "Falha ao enviar SMS. Verifique o número de telefone." },
          { status: 500 }
        );
      }
    } else {
      // Development mode: Log code to console
      console.log("=".repeat(50));
      console.log("📱 CÓDIGO DE VERIFICAÇÃO (DEV MODE)");
      console.log("=".repeat(50));
      console.log(`Telefone: ${phoneNumber}`);
      console.log(`Código: ${code}`);
      console.log("=".repeat(50));
      console.log("⚠️  Configure Twilio para enviar SMS em produção");
      console.log("=".repeat(50));
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
    console.log(`💾 Code stored for user ${user.id}`);

    const response = { 
      success: true,
      devMode: !twilioConfigured,
      // Always return code in dev mode or when Twilio is not configured
      ...(!twilioConfigured ? { code } : {})
    };
    console.log("✅ Returning success response:", response);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("❌ Error sending verification:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: "Falha ao enviar código de verificação" },
      { status: 500 }
    );
  }
}
