import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ExternalLinkService } from '@/lib/services/external-link.service';

/**
 * PUT /api/external-links/[id]
 * Update an existing external link
 * 
 * Requirements: 5.4, 5.5, 9.1, 9.4, 9.5
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  
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

    // Verify ownership
    const { data: existingLink, error: linkError } = await supabase
      .from('external_links')
      .select('profile_id')
      .eq('id', params.id)
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

    // Parse request body
    const body = await request.json();
    const { title, url } = body;

    // Validate at least one field is provided
    if (!title && !url) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Forneça pelo menos um campo para atualizar (title ou url)' 
        },
        { status: 400 }
      );
    }

    // Update link using service
    const updatedLink = await ExternalLinkService.updateLink({
      id: params.id,
      title,
      url,
    });

    return NextResponse.json(
      { success: true, data: updatedLink },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating external link:', error);
    
    // Return user-friendly error message
    const statusCode = error.message.includes('inválid') ? 400 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro ao atualizar link. Tente novamente em alguns instantes.' 
      },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/external-links/[id]
 * Delete an external link
 * 
 * Requirements: 5.6, 5.7, 9.1
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  
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

    // Verify ownership
    const { data: existingLink, error: linkError } = await supabase
      .from('external_links')
      .select('profile_id')
      .eq('id', params.id)
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

    // Delete link using service
    await ExternalLinkService.deleteLink(params.id, profile.id);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Link removido com sucesso' 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting external link:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro ao remover link. Tente novamente em alguns instantes.' 
      },
      { status: 500 }
    );
  }
}
