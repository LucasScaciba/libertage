import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { VerificationService } from '@/lib/services/verification.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { profileId: string } }
) {
  try {
    const { profileId } = params;

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID é obrigatório' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get verification status
    const verification = await VerificationService.getVerificationStatus(profileId);

    if (!verification || verification.status !== 'verified') {
      return NextResponse.json({
        isVerified: false,
      });
    }

    // Check if verification is still valid
    const now = new Date();
    const expiresAt = new Date(verification.expires_at!);

    if (expiresAt <= now) {
      return NextResponse.json({
        isVerified: false,
      });
    }

    return NextResponse.json({
      isVerified: true,
      verifiedAt: verification.verified_at,
    });
  } catch (error: any) {
    console.error('Error getting verification badge:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar badge de verificação' },
      { status: 500 }
    );
  }
}
