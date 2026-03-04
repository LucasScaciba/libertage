import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { VerificationService } from '@/lib/services/verification.service';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { verificationId, action, rejectionReason } = body;

    // Validate inputs
    if (!verificationId) {
      return NextResponse.json(
        { error: 'ID da verificação é obrigatório' },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida. Use "approve" ou "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Motivo da rejeição é obrigatório' },
        { status: 400 }
      );
    }

    // Process review
    if (action === 'approve') {
      await VerificationService.approveVerification(verificationId, user.id);
    } else {
      await VerificationService.rejectVerification(verificationId, user.id, rejectionReason);
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Verificação aprovada' : 'Verificação rejeitada',
    });
  } catch (error: any) {
    console.error('Error reviewing verification:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao revisar verificação' },
      { status: 500 }
    );
  }
}
