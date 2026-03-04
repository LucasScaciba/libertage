import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export interface ProfileCompletenessCheck {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

/**
 * ProfileCompletenessService
 * 
 * Verifica se um perfil está completo o suficiente para ser exibido no catálogo.
 * 
 * Requisitos para aparecer no catálogo:
 * - Nome (display_name)
 * - Slug
 * - Estado (city)
 * - Data de Nascimento (birthdate)
 * - Categorias Atendidas (service_categories)
 * - Pelo menos uma foto
 * - Descrição curta (short_description)
 */
export class ProfileCompletenessService {
  /**
   * Verifica se o perfil está completo para aparecer no catálogo
   */
  static async checkProfileCompleteness(profileId: string): Promise<ProfileCompletenessCheck> {
    const supabase = await createClient();

    // Get profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (!profile) {
      return {
        isComplete: false,
        missingFields: ["Perfil não encontrado"],
        completionPercentage: 0,
      };
    }

    // Get media count
    const { count: mediaCount } = await supabase
      .from("media")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("type", "photo");

    const missingFields: string[] = [];
    const requiredFields = 7; // Total number of required fields
    let completedFields = 0;

    // Check required fields
    if (!profile.display_name || profile.display_name.trim() === "") {
      missingFields.push("Nome");
    } else {
      completedFields++;
    }

    if (!profile.slug || profile.slug.trim() === "") {
      missingFields.push("Slug");
    } else {
      completedFields++;
    }

    if (!profile.city || profile.city.trim() === "") {
      missingFields.push("Estado");
    } else {
      completedFields++;
    }

    if (!profile.birthdate) {
      missingFields.push("Data de Nascimento");
    } else {
      completedFields++;
    }

    if (!profile.service_categories || !Array.isArray(profile.service_categories) || profile.service_categories.length === 0) {
      missingFields.push("Categorias Atendidas");
    } else {
      completedFields++;
    }

    if (!mediaCount || mediaCount === 0) {
      missingFields.push("Pelo menos uma foto");
    } else {
      completedFields++;
    }

    if (!profile.short_description || profile.short_description.trim() === "") {
      missingFields.push("Descrição curta");
    } else {
      completedFields++;
    }

    const completionPercentage = Math.round((completedFields / requiredFields) * 100);
    const isComplete = missingFields.length === 0;

    return {
      isComplete,
      missingFields,
      completionPercentage,
    };
  }

  /**
   * Verifica se o perfil pode ser exibido no catálogo
   * (perfil completo E status não é "unpublished")
   */
  static async canShowInCatalog(profileId: string): Promise<boolean> {
    const supabase = await createClient();

    // Get profile status
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", profileId)
      .single();

    if (!profile || profile.status === "unpublished") {
      return false;
    }

    // Check completeness
    const completeness = await this.checkProfileCompleteness(profileId);
    return completeness.isComplete;
  }

  /**
   * Gera mensagem amigável sobre o que falta para o perfil aparecer no catálogo
   */
  static generateCompletenessMessage(check: ProfileCompletenessCheck): string {
    if (check.isComplete) {
      return "✅ Seu perfil está completo e visível no catálogo!";
    }

    const missingCount = check.missingFields.length;
    const fieldsList = check.missingFields.join(", ");

    if (missingCount === 1) {
      return `⚠️ Falta ${missingCount} informação para seu perfil aparecer no catálogo: ${fieldsList}`;
    }

    return `⚠️ Faltam ${missingCount} informações para seu perfil aparecer no catálogo: ${fieldsList}`;
  }
}
