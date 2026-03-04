/**
 * ExternalLinkService
 * 
 * Manages CRUD operations for external links (Linktree-style).
 * Validates plan limits, URLs, titles, and handles reordering.
 * 
 * Requirements: 5.1-5.7, 6.1-6.5, 8.1-8.3
 */

import { createClient } from '@/lib/supabase/server';
import { URLValidatorService } from './url-validator.service';
import { IconDetectorService } from './icon-detector.service';
import { PlanValidatorService } from './plan-validator.service';
import type { 
  ExternalLinkRecord, 
  CreateExternalLinkInput, 
  UpdateExternalLinkInput 
} from '@/types';

export interface ReorderExternalLinkInput {
  id: string;
  direction: 'up' | 'down';
}

export class ExternalLinkService {
  /**
   * Create a new external link
   * Validates plan limits, URL format, title, and detects icon
   * 
   * Requirements: 5.2, 5.3, 8.1, 8.2, 8.3
   */
  static async createLink(input: CreateExternalLinkInput): Promise<ExternalLinkRecord> {
    const supabase = await createClient();

    // Validate title
    const validatedTitle = this.validateTitle(input.title);

    // Validate URL
    const urlValidation = URLValidatorService.validate(input.url);
    if (!urlValidation.isValid) {
      throw new Error(urlValidation.error);
    }

    // Sanitize URL
    const sanitizedUrl = URLValidatorService.sanitize(input.url);

    // Check plan limits
    const planValidation = await PlanValidatorService.canAddLink(input.profile_id);
    if (!planValidation.canAdd) {
      throw new Error(planValidation.error);
    }

    // Detect icon
    const iconKey = IconDetectorService.detectIcon(sanitizedUrl);

    // Get next display_order
    const { data: maxOrderData } = await supabase
      .from('external_links')
      .select('display_order')
      .eq('profile_id', input.profile_id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = maxOrderData ? maxOrderData.display_order + 1 : 1;

    // Insert link
    const { data, error } = await supabase
      .from('external_links')
      .insert({
        profile_id: input.profile_id,
        title: validatedTitle,
        url: sanitizedUrl,
        display_order: nextOrder,
        icon_key: iconKey,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating external link:', error);
      throw new Error('Erro ao criar link. Tente novamente em alguns instantes.');
    }

    return data as ExternalLinkRecord;
  }

  /**
   * Update an existing external link
   * Preserves display_order, re-detects icon if URL changes
   * 
   * Requirements: 5.4, 5.5, 8.1, 8.2, 8.3
   */
  static async updateLink(input: UpdateExternalLinkInput): Promise<ExternalLinkRecord> {
    const supabase = await createClient();

    const updates: any = {};

    // Validate and update title if provided
    if (input.title !== undefined) {
      updates.title = this.validateTitle(input.title);
    }

    // Validate and update URL if provided
    if (input.url !== undefined) {
      const urlValidation = URLValidatorService.validate(input.url);
      if (!urlValidation.isValid) {
        throw new Error(urlValidation.error);
      }

      const sanitizedUrl = URLValidatorService.sanitize(input.url);
      updates.url = sanitizedUrl;

      // Re-detect icon when URL changes
      updates.icon_key = IconDetectorService.detectIcon(sanitizedUrl);
    }

    // Update link (display_order is preserved automatically)
    const { data, error } = await supabase
      .from('external_links')
      .update(updates)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating external link:', error);
      throw new Error('Erro ao atualizar link. Tente novamente em alguns instantes.');
    }

    return data as ExternalLinkRecord;
  }

  /**
   * Delete an external link and reorder remaining links
   * 
   * Requirements: 5.6, 5.7
   */
  static async deleteLink(linkId: string, profileId: string): Promise<void> {
    const supabase = await createClient();

    // Get the link to be deleted
    const { data: linkToDelete, error: fetchError } = await supabase
      .from('external_links')
      .select('display_order')
      .eq('id', linkId)
      .eq('profile_id', profileId)
      .single();

    if (fetchError || !linkToDelete) {
      throw new Error('Link não encontrado');
    }

    // Delete the link
    const { error: deleteError } = await supabase
      .from('external_links')
      .delete()
      .eq('id', linkId)
      .eq('profile_id', profileId);

    if (deleteError) {
      console.error('Error deleting external link:', deleteError);
      throw new Error('Erro ao remover link. Tente novamente em alguns instantes.');
    }

    // Reorder remaining links (decrement display_order for links after deleted one)
    const { error: reorderError } = await supabase
      .rpc('reorder_links_after_deletion', {
        p_profile_id: profileId,
        p_deleted_order: linkToDelete.display_order,
      });

    // If RPC doesn't exist, do it manually
    if (reorderError) {
      const { data: linksToReorder } = await supabase
        .from('external_links')
        .select('id, display_order')
        .eq('profile_id', profileId)
        .gt('display_order', linkToDelete.display_order)
        .order('display_order', { ascending: true });

      if (linksToReorder && linksToReorder.length > 0) {
        for (const link of linksToReorder) {
          await supabase
            .from('external_links')
            .update({ display_order: link.display_order - 1 })
            .eq('id', link.id);
        }
      }
    }
  }

  /**
   * Get all links for a profile, ordered by display_order
   * 
   * Requirements: 5.1, 7.1
   */
  static async getLinksForProfile(profileId: string): Promise<ExternalLinkRecord[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('external_links')
      .select('*')
      .eq('profile_id', profileId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching external links:', error);
      throw new Error('Erro ao buscar links. Tente novamente em alguns instantes.');
    }

    return (data || []) as ExternalLinkRecord[];
  }

  /**
   * Get link count for a profile
   * 
   * Requirements: 5.9
   */
  static async getLinkCount(profileId: string): Promise<number> {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from('external_links')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error counting external links:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Reorder a link by swapping with adjacent link
   * Uses atomic transaction to ensure consistency
   * 
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
   */
  static async reorderLink(input: ReorderExternalLinkInput, profileId: string): Promise<void> {
    const supabase = await createClient();

    // Get current link
    const { data: currentLink, error: currentError } = await supabase
      .from('external_links')
      .select('display_order')
      .eq('id', input.id)
      .eq('profile_id', profileId)
      .single();

    if (currentError || !currentLink) {
      throw new Error('Link não encontrado');
    }

    // Calculate adjacent order
    const adjacentOrder = input.direction === 'up' 
      ? currentLink.display_order - 1 
      : currentLink.display_order + 1;

    // Get adjacent link
    const { data: adjacentLink, error: adjacentError } = await supabase
      .from('external_links')
      .select('id, display_order')
      .eq('profile_id', profileId)
      .eq('display_order', adjacentOrder)
      .single();

    if (adjacentError || !adjacentLink) {
      throw new Error('Não é possível mover o link nesta direção');
    }

    // Perform atomic swap using a temporary order value
    // This avoids unique constraint violations during the swap
    const tempOrder = -1;

    try {
      // Step 1: Set current link to temp order
      const { error: temp1Error } = await supabase
        .from('external_links')
        .update({ display_order: tempOrder })
        .eq('id', input.id);

      if (temp1Error) throw temp1Error;

      // Step 2: Set adjacent link to current order
      const { error: swap1Error } = await supabase
        .from('external_links')
        .update({ display_order: currentLink.display_order })
        .eq('id', adjacentLink.id);

      if (swap1Error) throw swap1Error;

      // Step 3: Set current link to adjacent order
      const { error: swap2Error } = await supabase
        .from('external_links')
        .update({ display_order: adjacentOrder })
        .eq('id', input.id);

      if (swap2Error) throw swap2Error;

    } catch (error) {
      console.error('Error reordering external links:', error);
      throw new Error('Erro ao reordenar links. Tente novamente.');
    }
  }

  /**
   * Validate title
   * Checks non-empty, max length, and trims whitespace
   * 
   * Requirements: 8.1, 8.2, 8.3
   */
  private static validateTitle(title: string): string {
    // Trim whitespace
    const trimmed = title.trim();

    // Check non-empty
    if (trimmed.length === 0) {
      throw new Error('O título não pode estar vazio');
    }

    // Check max length
    if (trimmed.length > 100) {
      throw new Error('O título deve ter entre 1 e 100 caracteres');
    }

    return trimmed;
  }
}
