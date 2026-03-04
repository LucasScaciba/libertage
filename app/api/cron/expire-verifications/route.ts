import { NextRequest, NextResponse } from 'next/server';
import { VerificationService } from '@/lib/services/verification.service';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Expire verifications
    const expiredCount = await VerificationService.expireVerifications();

    console.log(`Expired ${expiredCount} verifications`);

    return NextResponse.json({
      success: true,
      expiredCount,
      message: `${expiredCount} verificações expiradas`,
    });
  } catch (error: any) {
    console.error('Error expiring verifications:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao expirar verificações' },
      { status: 500 }
    );
  }
}
