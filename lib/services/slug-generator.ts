import { SlugValidator } from "./slug-validator";

/**
 * SlugGenerator Service
 * 
 * Responsável por gerar slugs únicos a partir de nomes de usuários.
 * 
 * Algoritmo:
 * 1. Converter nome para lowercase
 * 2. Substituir espaços por hífens
 * 3. Remover caracteres especiais e acentos
 * 4. Remover hífens consecutivos
 * 5. Truncar para comprimento máximo
 * 6. Se slug já existe, adicionar sufixo numérico (-2, -3, etc.)
 */
export class SlugGenerator {
  private static readonly MAX_LENGTH = 50;

  /**
   * Remove acentos e caracteres especiais de uma string
   */
  static normalizeString(input: string): string {
    // Remove leading/trailing whitespace
    let normalized = input.trim();

    // Convert to lowercase
    normalized = normalized.toLowerCase();

    // Remove accents/diacritics
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Replace spaces with hyphens
    normalized = normalized.replace(/\s+/g, '-');

    // Remove any characters that aren't alphanumeric or hyphens
    normalized = normalized.replace(/[^a-z0-9-]/g, '');

    // Remove consecutive hyphens
    normalized = normalized.replace(/-+/g, '-');

    // Remove leading/trailing hyphens
    normalized = normalized.replace(/^-+|-+$/g, '');

    // Truncate to max length
    if (normalized.length > this.MAX_LENGTH) {
      normalized = normalized.substring(0, this.MAX_LENGTH);
      // Remove trailing hyphen if truncation created one
      normalized = normalized.replace(/-+$/g, '');
    }

    return normalized;
  }

  /**
   * Gera um slug a partir de um nome (sem verificar unicidade)
   */
  static generateFromName(name: string): string {
    const slug = this.normalizeString(name);

    // Ensure minimum length by adding fallback
    if (slug.length < 4) {
      return `user-${Math.random().toString(36).substring(2, 8)}`;
    }

    return slug;
  }

  /**
   * Gera um slug único verificando colisões e adicionando sufixos numéricos
   * @param baseName - Nome base para gerar o slug
   * @param excludeProfileId - ID do perfil a ser excluído da verificação
   */
  static async generateUnique(
    baseName: string,
    excludeProfileId?: string
  ): Promise<string> {
    let slug = this.generateFromName(baseName);
    let suffix = 1;

    // Check if base slug is available
    const isAvailable = await SlugValidator.checkUniqueness(slug, excludeProfileId);

    if (isAvailable) {
      return slug;
    }

    // If not available, try with numeric suffixes
    while (suffix < 1000) { // Safety limit to prevent infinite loops
      suffix++;
      const candidateSlug = `${slug}-${suffix}`;

      // Ensure the slug with suffix doesn't exceed max length
      if (candidateSlug.length > this.MAX_LENGTH) {
        // Truncate the base slug to make room for suffix
        const suffixLength = suffix.toString().length + 1; // +1 for hyphen
        const maxBaseLength = this.MAX_LENGTH - suffixLength;
        slug = slug.substring(0, maxBaseLength).replace(/-+$/g, '');
      }

      const testSlug = `${slug}-${suffix}`;
      const available = await SlugValidator.checkUniqueness(testSlug, excludeProfileId);

      if (available) {
        return testSlug;
      }
    }

    // Fallback: generate random slug if we couldn't find a unique one
    return `user-${Math.random().toString(36).substring(2, 10)}`;
  }
}
