import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Get story data from request
    const body = await request.json();
    const { video_url, thumbnail_url, duration_seconds, file_size_bytes } = body;

    console.log('Received story data:', { video_url, thumbnail_url, duration_seconds, file_size_bytes });

    if (!video_url || !duration_seconds || !file_size_bytes) {
      return NextResponse.json(
        { success: false, error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Check user's subscription and plan
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_id, plans(max_stories)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      console.error('Subscription error:', subError);
      // Default to free plan (0 stories)
      return NextResponse.json(
        { success: false, error: 'Nenhuma assinatura ativa encontrada' },
        { status: 403 }
      );
    }

    const maxStories = (subscription.plans as any)?.max_stories || 0;

    // Get current timestamp
    const now = new Date().toISOString();

    // Count active and non-expired stories
    const { count: activeCount } = await supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', now); // Only count stories that haven't expired yet

    if ((activeCount || 0) >= maxStories) {
      return NextResponse.json(
        { success: false, error: 'Limite de stories atingido para seu plano' },
        { status: 403 }
      );
    }

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Insert story into database
    const { data: story, error: insertError } = await supabase
      .from('stories')
      .insert({
        user_id: user.id,
        video_url,
        thumbnail_url,
        duration_seconds,
        file_size_bytes,
        status: 'active',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting story:', insertError);
      return NextResponse.json(
        { success: false, error: 'Erro ao publicar story' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      story
    });

  } catch (error: any) {
    console.error('Error publishing story:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao publicar story' },
      { status: 500 }
    );
  }
}
