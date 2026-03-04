import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ExternalLinkService } from '@/lib/services/external-link.service';

/**
 * POST /api/external-links/reorder
 * Reorder a link by swapping with adjacent link
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 9.1
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { id, direction } = body;

    // Validate required fields
    if (!id || !direction) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID e direção são obrigatórios' 
        },
        { status: 400 }
      );
    }

    // Validate direction
    if (direction !== 'up' && direction !== 'down') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Direção inválida. Use "up" ou "down"' 
        },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existingLink, error: linkError } = await supabase
      .from('external_links')
      .select('profile_id')
      .eq('id', id)
      .single();

    if (linkError || !existingLink) {
      return NextResponse.json(
        { success: false, error: 'Link não encontrado' },
        { status: 404 }
      );
    }

    if (existingLink.profile_id !== profile.id) {
      return NextResponse.json(
        { success: false, error: 'Você não tem permissão para modificar este link' },
        { status: 403 }
      );
    }

    // Reorder link using service
    await ExternalLinkService.reorderLink(
      { id, direction },
      profile.id
    );

    return NextResponse.json(
      { 
        success: true, 
        message: 'Link reordenado com sucesso' 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error reordering external link:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro ao reordenar links. Tente novamente.' 
      },
      { status: 500 }
    );
  }
}
