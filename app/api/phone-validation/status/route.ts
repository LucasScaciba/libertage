import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RateLimiter } from '@/lib/services/rate-limiter';

export async function GET(request: NextRequest) {
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

    // 2. Get user's phone validation status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('phone_verified_at, phone_attempts_today, phone_last_attempt_at')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Failed to get user status:', userError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar status' },
        { status: 500 }
      );
    }

    // 3. Calculate cooldown seconds remaining
    const rateLimiter = new RateLimiter();
    const cooldown = await rateLimiter.checkCooldown(user.id);
    const rateLimit = await rateLimiter.checkAttemptLimit(user.id);

    // 4. Return status
    return NextResponse.json({
      phoneVerified: !!userData.phone_verified_at,
      attemptsToday: userData.phone_attempts_today || 0,
      maxAttempts: 5,
      cooldownSeconds: cooldown.secondsRemaining,
      canSendOTP: cooldown.allowed && rateLimit.allowed
    });

  } catch (error) {
    console.error('Get status error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
