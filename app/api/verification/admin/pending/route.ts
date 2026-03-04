import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { VerificationService } from '@/lib/services/verification.service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication and admin role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Get pending verifications
    const verifications = await VerificationService.getPendingVerifications();

    return NextResponse.json({
      verifications,
    });
  } catch (error: any) {
    console.error('Error getting pending verifications:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar verificações pendentes' },
      { status: 500 }
    );
  }
}
