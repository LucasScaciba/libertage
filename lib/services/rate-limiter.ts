import { createClient } from '@/lib/supabase/server';

export interface RateLimitResult {
  allowed: boolean;
  attemptsToday: number;
  maxAttempts: number;
}

export interface CooldownResult {
  allowed: boolean;
  secondsRemaining: number;
}

export class RateLimiter {
  private readonly MAX_ATTEMPTS = 5;
  private readonly COOLDOWN_SECONDS = 60;

  /**
   * Checks if user has exceeded daily attempt limit
   * @param userId - User ID to check
   * @returns Rate limit result with allowed status and attempt counts
   */
  async checkAttemptLimit(userId: string): Promise<RateLimitResult> {
    try {
      const supabase = await createClient();
      
      const { data: user, error } = await supabase
        .from('users')
        .select('phone_attempts_today')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(`Failed to check attempt limit: ${error.message}`);
      }

      const attemptsToday = user?.phone_attempts_today || 0;
      const allowed = attemptsToday < this.MAX_ATTEMPTS;

      return {
        allowed,
        attemptsToday,
        maxAttempts: this.MAX_ATTEMPTS
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      throw new Error('Failed to check rate limit');
    }
  }

  /**
   * Checks if user is in cooldown period
   * @param userId - User ID to check
   * @returns Cooldown result with allowed status and seconds remaining
   */
  async checkCooldown(userId: string): Promise<CooldownResult> {
    try {
      const supabase = await createClient();
      
      const { data: user, error } = await supabase
        .from('users')
        .select('phone_last_attempt_at')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(`Failed to check cooldown: ${error.message}`);
      }

      if (!user?.phone_last_attempt_at) {
        return { allowed: true, secondsRemaining: 0 };
      }

      const lastAttempt = new Date(user.phone_last_attempt_at);
      const now = new Date();
      const secondsElapsed = Math.floor((now.getTime() - lastAttempt.getTime()) / 1000);
      const secondsRemaining = Math.max(0, this.COOLDOWN_SECONDS - secondsElapsed);

      return {
        allowed: secondsRemaining === 0,
        secondsRemaining
      };
    } catch (error) {
      console.error('Cooldown check error:', error);
      throw new Error('Failed to check cooldown');
    }
  }

  /**
   * Increments the daily attempt counter for a user
   * @param userId - User ID to increment
   */
  async incrementAttempts(userId: string): Promise<void> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase.rpc('increment_phone_attempts', {
        user_id: userId
      });

      if (error) {
        throw new Error(`Failed to increment attempts: ${error.message}`);
      }
    } catch (error) {
      console.error('Increment attempts error:', error);
      throw new Error('Failed to increment attempts');
    }
  }

  /**
   * Updates the last attempt timestamp for a user
   * @param userId - User ID to update
   */
  async updateLastAttempt(userId: string): Promise<void> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('users')
        .update({ phone_last_attempt_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to update last attempt: ${error.message}`);
      }
    } catch (error) {
      console.error('Update last attempt error:', error);
      throw new Error('Failed to update last attempt timestamp');
    }
  }

  /**
   * Resets the daily attempt counter for a user
   * @param userId - User ID to reset
   */
  async resetDailyAttempts(userId: string): Promise<void> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('users')
        .update({ phone_attempts_today: 0 })
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to reset attempts: ${error.message}`);
      }
    } catch (error) {
      console.error('Reset attempts error:', error);
      throw new Error('Failed to reset daily attempts');
    }
  }
}
