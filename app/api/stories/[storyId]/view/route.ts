import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StoryAnalyticsService } from '@/lib/services/story-analytics.service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ storyId: string }> }
) {
  const params = await context.params;
  
  try {
    const supabase = await createClient();
    const { storyId } = params;

    // Get viewer info
    const { data: { user } } = await supabase.auth.getUser();
    const viewerId = user?.id;

    // Get IP address from headers
    const forwarded = request.headers.get('x-forwarded-for');
    const viewerIp = forwarded ? forwarded.split(',')[0] : 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Record view
    await StoryAnalyticsService.recordView(storyId, viewerId, viewerIp);

    return NextResponse.json({
      success: true,
      message: 'Visualização registrada'
    });

  } catch (error: any) {
    console.error('Error recording view:', error);
    // Don't fail the request if view recording fails
    return NextResponse.json({
      success: true,
      message: 'View recording skipped'
    });
  }
}
