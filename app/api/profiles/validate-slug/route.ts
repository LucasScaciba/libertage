import { NextRequest, NextResponse } from "next/server";
import { SlugValidator } from "@/lib/services/slug-validator";

interface ValidateSlugRequest {
  slug: string;
  currentSlug?: string;
  profileId?: string;
}

interface ValidateSlugResponse {
  valid: boolean;
  available: boolean;
  errors: Array<{
    code: string;
    message: string;
  }>;
}

/**
 * POST /api/profiles/validate-slug
 * 
 * Valida formato e unicidade de um slug
 * 
 * Request body:
 * - slug: string (required) - O slug a ser validado
 * - currentSlug: string (optional) - Slug atual do perfil (para permitir manter o mesmo)
 * - profileId: string (optional) - ID do perfil sendo editado
 * 
 * Response:
 * - valid: boolean - Se o slug é válido
 * - available: boolean - Se o slug está disponível
 * - errors: array - Lista de erros de validação
 */
export async function POST(request: NextRequest) {
  try {
    const body: ValidateSlugRequest = await request.json();
    const { slug, profileId } = body;

    // Validate input
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        {
          valid: false,
          available: false,
          errors: [
            {
              code: 'INVALID_INPUT',
              message: 'Slug é obrigatório e deve ser uma string',
            },
          ],
        },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedSlug = SlugValidator.sanitize(slug);

    // Validate slug
    const result = await SlugValidator.validate(sanitizedSlug, profileId);

    return NextResponse.json({
      valid: result.valid,
      available: result.available,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Error validating slug:', error);
    return NextResponse.json(
      {
        valid: false,
        available: false,
        errors: [
          {
            code: 'INTERNAL_ERROR',
            message: 'Erro ao validar slug. Tente novamente.',
          },
        ],
      },
      { status: 500 }
    );
  }
}
