import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RateLimiter } from '@/lib/services/rate-limiter';
import { OTPService } from '@/lib/services/otp-service';
import { PhoneEncryption } from '@/lib/services/phone-encryption';
import { verifyOTPRequestSchema } from '@/lib/utils/phone-validation';

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
    const validation = verifyOTPRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error.issues[0]?.message || 'Dados inválidos'
        },
        { status: 400 }
      );
    }

    const { phoneNumber, otpCode } = validation.data;

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

    // 4. Verify OTP via Twilio
    const otpService = new OTPService();
    const result = await otpService.verifyOTP(phoneNumber, otpCode);

    if (!result.success) {
      // Increment attempts on service error
      await rateLimiter.incrementAttempts(user.id);
      
      return NextResponse.json(
        { 
          success: false, 
          error: result.error?.message || 'Erro ao verificar código' 
        },
        { status: 400 }
      );
    }

    if (!result.valid) {
      // Increment attempts on invalid OTP
      await rateLimiter.incrementAttempts(user.id);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Código inválido' 
        },
        { status: 400 }
      );
    }

    // 5. OTP is valid - encrypt phone and update user
    const phoneEncryption = new PhoneEncryption();
    const encryptedPhone = await phoneEncryption.encrypt(phoneNumber);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        phone_security: encryptedPhone,
        phone_public: phoneNumber,
        phone_verified_at: new Date().toISOString(),
        phone_attempts_today: 0
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update user phone:', updateError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao salvar telefone validado' 
        },
        { status: 500 }
      );
    }

    // 6. Return success
    return NextResponse.json({
      success: true,
      message: 'Telefone validado com sucesso'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}
