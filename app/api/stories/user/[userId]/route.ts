import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient();
    const { userId } = await context.params;

    console.log('[Stories API] Fetching stories for user:', userId);

    // Fetch user's stories
    const { data: stories, error } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Stories API] Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar stories', details: error },
        { status: 500 }
      );
    }

    console.log('[Stories API] Found stories:', stories?.length || 0);

    return NextResponse.json({
      success: true,
      stories: stories || []
    });

  } catch (error: any) {
    console.error('[Stories API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar stories' },
      { status: 500 }
    );
  }
}
