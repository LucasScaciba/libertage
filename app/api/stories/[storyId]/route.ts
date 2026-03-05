import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StoryPermissionService } from '@/lib/services/story-permission.service';

export async function DELETE(
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
        { success: false, error: 'Você não tem permissão para deletar este story' },
        { status: 403 }
      );
    }

    // Update status to deleted
    const { error: updateError } = await supabase
      .from('stories')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString()
      })
      .eq('id', storyId);

    if (updateError) {
      console.error('Error deleting story:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erro ao deletar story' },
        { status: 500 }
      );
    }

    // Note: Video file deletion is handled by a background job
    // to avoid blocking the response

    return NextResponse.json({
      success: true,
      message: 'Story deletado com sucesso'
    });

  } catch (error: any) {
    console.error('Error in delete story endpoint:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao deletar story' },
      { status: 500 }
    );
  }
}
