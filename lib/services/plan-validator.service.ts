/**
 * PlanValidatorService
 * 
 * Validates plan limits for external links.
 * Checks if a profile can add more links based on their subscription plan.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { createClient } from '@/lib/supabase/server';

export interface PlanValidationResult {
  canAdd: boolean;
  currentCount: number;
  limit: number | null;
  planCode: string;
  error?: string;
}

export class PlanValidatorService {
  /**
   * Plan limits configuration
   */
  private static readonly PLAN_LIMITS: Record<string, number | null> = {
    free: 3,
    premium: 10,
    black: null, // null means unlimited
  };

  /**
   * Check if profile can add more links based on plan
   */
  static async canAddLink(profileId: string): Promise<PlanValidationResult> {
    const supabase = await createClient();

    // Get profile with user_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    // Get current plan
    const planCode = await this.getCurrentPlan(profile.user_id);
    const limit = this.getLimitForPlan(planCode);

    // Get current link count
    const { count, error: countError } = await supabase
      .from('external_links')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId);

    if (countError) {
      throw new Error('Failed to get link count');
    }

    const currentCount = count || 0;

    // Check if can add
    const canAdd = limit === null || currentCount < limit;

    // Generate error message if limit exceeded
    let error: string | undefined;
    if (!canAdd) {
      const planNames: Record<string, string> = {
        free: 'Free',
        premium: 'Premium',
        black: 'Black',
      };
      error = `Você atingiu o limite de ${limit} links do plano ${planNames[planCode]}. Faça upgrade para adicionar mais links.`;
    }

    return {
      canAdd,
      currentCount,
      limit,
      planCode,
      error,
    };
  }

  /**
   * Get link limit for a plan
   * Returns null for unlimited plans
   */
  static getLimitForPlan(planCode: string): number | null {
    if (planCode in this.PLAN_LIMITS) {
      return this.PLAN_LIMITS[planCode];
    }
    return this.PLAN_LIMITS.free;
  }

  /**
   * Get current plan for profile's user
   * Returns 'free' as default if no active subscription
   */
  private static async getCurrentPlan(userId: string): Promise<string> {
    const supabase = await createClient();

    // Get active subscription with plan details
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plans(code)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription || !subscription.plans) {
      return 'free';
    }

    const plan = subscription.plans as any;
    return plan.code || 'free';
  }
}
