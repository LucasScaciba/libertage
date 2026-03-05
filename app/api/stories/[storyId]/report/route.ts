import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ storyId: string }> }
) {
  const params = await context.params;
  
  try {
    const supabase = await createClient();
    const { storyId } = params;

    // Get request body
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Motivo da denúncia é obrigatório' },
        { status: 400 }
      );
    }

    // Get reporter info
    const { data: { user } } = await supabase.auth.getUser();
    const reporterId = user?.id;

    // Get IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const reporterIp = forwarded ? forwarded.split(',')[0] : 
                       request.headers.get('x-real-ip') || 
                       'unknown';

    // Create report
    const { error: createError } = await supabase
      .from('story_reports')
      .insert({
        story_id: storyId,
        reporter_id: reporterId || null,
        reporter_ip: reporterIp,
        reason,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (createError) {
      console.error('Error creating report:', createError);
      return NextResponse.json(
        { success: false, error: 'Erro ao enviar denúncia' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Denúncia enviada com sucesso'
    });

  } catch (error: any) {
    console.error('Error in report endpoint:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao enviar denúncia' },
      { status: 500 }
    );
  }
}
