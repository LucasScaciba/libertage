import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { VerificationService } from '@/lib/services/verification.service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Get verification status
    const verification = await VerificationService.getVerificationStatus(profile.id);

    if (!verification) {
      return NextResponse.json({
        status: 'not_verified',
      });
    }

    return NextResponse.json({
      status: verification.status,
      verifiedAt: verification.verified_at,
      expiresAt: verification.expires_at,
      rejectionReason: verification.rejection_reason,
      submittedAt: verification.submitted_at,
      documentType: verification.document_type,
    });
  } catch (error: any) {
    console.error('Error getting verification status:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar status de verificação' },
      { status: 500 }
    );
  }
}
