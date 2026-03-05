import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RateLimiter } from '@/lib/services/rate-limiter';
import { OTPService } from '@/lib/services/otp-service';
import { sendOTPRequestSchema } from '@/lib/utils/phone-validation';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = sendOTPRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error.issues[0]?.message || 'Dados inválidos'
        },
        { status: 400 }
      );
    }

    const { phoneNumber } = validation.data;

    // 3. Check rate limit (5 attempts per day)
    const rateLimiter = new RateLimiter();
    const rateLimit = await rateLimiter.checkAttemptLimit(user.id);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Limite de tentativas atingido. Tente novamente amanhã' 
        },
        { status: 429 }
      );
    }

    // 4. Check cooldown (60 seconds between attempts)
    const cooldown = await rateLimiter.checkCooldown(user.id);

    if (!cooldown.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Aguarde ${cooldown.secondsRemaining} segundos antes de solicitar novo código`,
          cooldownSeconds: cooldown.secondsRemaining
        },
        { status: 429 }
      );
    }

    // 5. Send OTP via Twilio
    const otpService = new OTPService();
    const result = await otpService.sendOTP(phoneNumber);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error?.message || 'Erro ao enviar código' 
        },
        { status: 503 }
      );
    }

    // 6. Update last attempt timestamp
    await rateLimiter.updateLastAttempt(user.id);

    // 7. Return success
    return NextResponse.json({
      success: true,
      message: `Código enviado para ${phoneNumber}`
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}
