import { createClient } from '@/lib/supabase/server';

export class StoryExpirationService {
  /**
   * Expires all stories that have passed their expiration time
   * Returns the number of stories expired
   */
  static async expireStories(): Promise<number> {
    const supabase = await createClient();

    // Find all active stories that have expired
    const { data: expiredStories, error: fetchError } = await supabase
      .from('stories')
      .select('id')
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired stories:', fetchError);
      throw new Error('Failed to fetch expired stories');
    }

    if (!expiredStories || expiredStories.length === 0) {
      return 0;
    }

    // Update status to expired
    const storyIds = expiredStories.map(s => s.id);
    const { error: updateError } = await supabase
      .from('stories')
      .update({ status: 'expired' })
      .in('id', storyIds);

    if (updateError) {
      console.error('Error updating expired stories:', updateError);
      throw new Error('Failed to update expired stories');
    }

    console.log(`Expired ${expiredStories.length} stories`);
    return expiredStories.length;
  }

  /**
   * Calculates expiration time (24 hours from now)
   */
  static calculateExpirationTime(createdAt: Date = new Date()): Date {
    const expiresAt = new Date(createdAt);
    expiresAt.setHours(expiresAt.getHours() + 24);
    return expiresAt;
  }

  /**
   * Checks if a story is expired
   */
  static isExpired(expiresAt: Date): boolean {
    return new Date() > new Date(expiresAt);
  }

  /**
   * Gets time remaining until expiration in seconds
   */
  static getTimeRemaining(expiresAt: Date): number {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / 1000));
  }

  /**
   * Formats time remaining as human-readable string
   */
  static formatTimeRemaining(expiresAt: Date): string {
    const seconds = this.getTimeRemaining(expiresAt);
    
    if (seconds === 0) {
      return 'Expirado';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  }
}
