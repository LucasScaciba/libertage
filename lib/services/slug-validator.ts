import { createClient } from "@/lib/supabase/server";

export interface SlugValidationError {
  code: 'TOO_SHORT' | 'INVALID_CHARACTERS' | 'ALREADY_EXISTS' | 'INVALID_FORMAT';
  message: string;
}

export interface SlugValidationResult {
  valid: boolean;
  available: boolean;
  errors: SlugValidationError[];
}

/**
 * SlugValidator Service
 * 
 * Responsável por validar formato e unicidade de slugs de perfil.
 * 
 * Regras de validação:
 * - Comprimento mínimo: 4 caracteres
 * - Caracteres permitidos: a-z, 0-9, - (hífen)
 * - Não pode começar ou terminar com hífen
 * - Não pode ter hífens consecutivos
 * - Deve ser único na tabela profiles
 */
export class SlugValidator {
  private static readonly MIN_LENGTH = 4;
  private static readonly MAX_LENGTH = 50;
  private static readonly SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  /**
   * Valida o formato do slug (sem verificar unicidade)
   */
  static validateFormat(slug: string): SlugValidationResult {
    const errors: SlugValidationError[] = [];

    // Check minimum length
    if (slug.length < this.MIN_LENGTH) {
      errors.push({
        code: 'TOO_SHORT',
        message: `Slug deve ter no mínimo ${this.MIN_LENGTH} caracteres`,
      });
    }

    // Check maximum length
    if (slug.length > this.MAX_LENGTH) {
      errors.push({
        code: 'INVALID_FORMAT',
        message: `Slug deve ter no máximo ${this.MAX_LENGTH} caracteres`,
      });
    }

    // Check valid characters and format
    if (!this.SLUG_REGEX.test(slug)) {
      errors.push({
        code: 'INVALID_CHARACTERS',
        message: 'Slug deve conter apenas letras minúsculas, números e hífens',
      });
    }

    return {
      valid: errors.length === 0,
      available: true, // Format validation doesn't check availability
      errors,
    };
  }

  /**
   * Verifica se o slug já existe no banco de dados
   * @param slug - O slug a ser verificado
   * @param excludeProfileId - ID do perfil a ser excluído da verificação (para permitir manter o slug atual)
   */
  static async checkUniqueness(
    slug: string,
    excludeProfileId?: string
  ): Promise<boolean> {
    const supabase = await createClient();

    let query = supabase
      .from("profiles")
      .select("id")
      .eq("slug", slug);

    if (excludeProfileId) {
      query = query.neq("id", excludeProfileId);
    }

    const { data, error } = await query.single();

    if (error) {
      // If no rows found, slug is available
      if (error.code === 'PGRST116') {
        return true;
      }
      throw error;
    }

    // If data exists, slug is taken
    return false;
  }

  /**
   * Sanitiza a entrada removendo caracteres perigosos
   */
  static sanitize(input: string): string {
    // Remove leading/trailing whitespace
    let sanitized = input.trim();

    // Convert to lowercase
    sanitized = sanitized.toLowerCase();

    // Remove any characters that aren't alphanumeric or hyphens
    sanitized = sanitized.replace(/[^a-z0-9-]/g, '');

    // Remove consecutive hyphens
    sanitized = sanitized.replace(/-+/g, '-');

    // Remove leading/trailing hyphens
    sanitized = sanitized.replace(/^-+|-+$/g, '');

    return sanitized;
  }

  /**
   * Validação completa: formato + unicidade
   * @param slug - O slug a ser validado
   * @param excludeProfileId - ID do perfil a ser excluído da verificação
   */
  static async validate(
    slug: string,
    excludeProfileId?: string
  ): Promise<SlugValidationResult> {
    // First, validate format
    const formatResult = this.validateFormat(slug);

    if (!formatResult.valid) {
      return formatResult;
    }

    // Then check uniqueness
    try {
      const isAvailable = await this.checkUniqueness(slug, excludeProfileId);

      if (!isAvailable) {
        return {
          valid: false,
          available: false,
          errors: [
            {
              code: 'ALREADY_EXISTS',
              message: 'Este slug já está em uso. Por favor, escolha outro.',
            },
          ],
        };
      }

      return {
        valid: true,
        available: true,
        errors: [],
      };
    } catch (error) {
      console.error('Error checking slug uniqueness:', error);
      throw error;
    }
  }
}
