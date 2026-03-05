import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StoryPermissionService } from '@/lib/services/story-permission.service';
import { StoryAnalyticsService } from '@/lib/services/story-analytics.service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ storyId: string }> }
) {
  const params = await context.params;
  
  try {
    const supabase = await createClient();
    const { storyId } = params;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Check ownership
    const isOwner = await StoryPermissionService.isStoryOwner(storyId, user.id);
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Você não tem permissão para ver analytics deste story' },
        { status: 403 }
      );
    }

    // Get analytics
    const analytics = await StoryAnalyticsService.getStoryAnalytics(storyId);

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error: any) {
    console.error('Error in analytics endpoint:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar analytics' },
      { status: 500 }
    );
  }
}
