import { createClient } from '@/lib/supabase/server';

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
}

export class StoryPermissionService {
  /**
   * Checks if user can publish a new story based on their plan
   */
  static async canPublishStory(userId: string): Promise<PermissionCheckResult> {
    const supabase = await createClient();

    // Get user's current subscription and plan
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return {
        allowed: false,
        reason: 'Nenhuma assinatura ativa encontrada'
      };
    }

    const plan = subscription.plan as any;
    const planCode = plan.code as 'free' | 'premium' | 'black';

    // Check plan limits
    const limit = await this.getStoryLimit(planCode);

    if (limit === 0) {
      return {
        allowed: false,
        reason: 'Upgrade para Premium ou Black para publicar stories',
        currentCount: 0,
        limit: 0
      };
    }

    // Count active stories
    const currentCount = await this.getActiveStoriesCount(userId);

    if (currentCount >= limit) {
      return {
        allowed: false,
        reason: 'Limite de stories atingido para seu plano',
        currentCount,
        limit
      };
    }

    return {
      allowed: true,
      currentCount,
      limit
    };
  }

  /**
   * Gets the number of active stories for a user
   */
  static async getActiveStoriesCount(userId: string): Promise<number> {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error counting active stories:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Gets story limit for a plan
   */
  static async getStoryLimit(planCode: 'free' | 'premium' | 'black'): Promise<number> {
    const limits = {
      free: 0,
      premium: 1,
      black: 5
    };

    return limits[planCode];
  }

  /**
   * Checks if user owns a story
   */
  static async isStoryOwner(storyId: string, userId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('stories')
      .select('user_id')
      .eq('id', storyId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.user_id === userId;
  }
}
