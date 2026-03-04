import { NextRequest, NextResponse } from 'next/server';
import { StoryExpirationService } from '@/lib/services/story-expiration.service';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Expire stories
    const expiredCount = await StoryExpirationService.expireStories();

    return NextResponse.json({
      success: true,
      expired_count: expiredCount,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error in expire-stories cron:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao expirar stories' },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
