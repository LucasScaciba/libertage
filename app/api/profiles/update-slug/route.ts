import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SlugValidator } from "@/lib/services/slug-validator";
import { AuthServerService } from "@/lib/services/auth-server.service";

interface UpdateSlugRequest {
  slug: string;
}

/**
 * PATCH /api/profiles/update-slug
 * 
 * Atualiza o slug do perfil do usuário autenticado
 * 
 * Request body:
 * - slug: string (required) - O novo slug
 * 
 * Response:
 * - success: boolean - Se a atualização foi bem-sucedida
 * - slug: string - O slug atualizado
 * - error: object - Detalhes do erro (se houver)
 */
export async function PATCH(request: NextRequest) {
  console.log('=== UPDATE SLUG ENDPOINT CALLED ===');
  try {
    // Use AuthServerService for consistent authentication
    let user;
    try {
      user = await AuthServerService.requireAuth();
      console.log('User authenticated:', user.id);
    } catch (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Você precisa estar autenticado para atualizar seu slug',
          },
        },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Parse request body
    const body: UpdateSlugRequest = await request.json();
    const { slug } = body;
    console.log('Received slug:', slug);

    // Validate input
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Slug é obrigatório e deve ser uma string',
          },
        },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedSlug = SlugValidator.sanitize(slug);
    console.log('Sanitized slug:', sanitizedSlug);

    // Check if sanitized slug is empty
    if (!sanitizedSlug || sanitizedSlug.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FORMAT',
            message: 'Slug inválido após sanitização. Use apenas letras minúsculas, números e hífens.',
          },
        },
        { status: 400 }
      );
    }

    // Get user's profile
    console.log('Looking for profile with user_id:', user.id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, slug')
      .eq('user_id', user.id)
      .single();

    console.log('Profile query result:', { profile, profileError });

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile query error:', {
        userId: user.id,
        error: profileError,
        errorCode: profileError?.code,
        errorMessage: profileError?.message,
        errorDetails: profileError?.details,
      });
      throw profileError;
    }

    if (!profile) {
      console.error('Profile not found for user:', user.id);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Perfil não encontrado',
          },
        },
        { status: 404 }
      );
    }

    // Validate slug (excluding current profile)
    const validationResult = await SlugValidator.validate(sanitizedSlug, profile.id);

    if (!validationResult.valid) {
      console.error('Slug validation failed:', validationResult);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: validationResult.errors[0]?.code || 'VALIDATION_ERROR',
            message: validationResult.errors[0]?.message || 'Slug inválido',
          },
        },
        { status: 400 }
      );
    }

    // Update slug in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        slug: sanitizedSlug,
        slug_last_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error updating slug:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Erro ao atualizar slug. Tente novamente.',
          },
        },
        { status: 500 }
      );
    }

    console.log('Slug updated successfully:', sanitizedSlug);
    return NextResponse.json({
      success: true,
      slug: sanitizedSlug,
    });
  } catch (error) {
    console.error('Error in update-slug endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao processar requisição. Tente novamente.',
        },
      },
      { status: 500 }
    );
  }
}
