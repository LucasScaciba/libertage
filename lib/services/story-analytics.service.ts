import { createClient } from '@/lib/supabase/server';
import { StoryAnalytics } from '@/types';

export class StoryAnalyticsService {
  /**
   * Records a view for a story
   * Only records one view per viewer per day
   */
  static async recordView(
    storyId: string,
    viewerId?: string,
    viewerIp?: string
  ): Promise<void> {
    const supabase = await createClient();

    try {
      // Insert view (will fail silently if duplicate due to unique constraint)
      await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: viewerId || null,
          viewer_ip: viewerIp || null,
          viewed_at: new Date().toISOString()
        });
    } catch (error) {
      // Ignore duplicate view errors
      console.log('View already recorded for today');
    }
  }

  /**
   * Gets analytics for a story
   */
  static async getStoryAnalytics(storyId: string): Promise<StoryAnalytics> {
    const supabase = await createClient();

    // Get total view count
    const { count: viewCount, error: countError } = await supabase
      .from('story_views')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', storyId);

    if (countError) {
      console.error('Error counting views:', countError);
    }

    // Get unique viewers count
    const { data: uniqueViewers, error: uniqueError } = await supabase
      .from('story_views')
      .select('viewer_id, viewer_ip')
      .eq('story_id', storyId);

    if (uniqueError) {
      console.error('Error fetching unique viewers:', uniqueError);
    }

    // Count unique viewers (by ID or IP)
    const uniqueSet = new Set<string>();
    uniqueViewers?.forEach(view => {
      if (view.viewer_id) {
        uniqueSet.add(`user_${view.viewer_id}`);
      } else if (view.viewer_ip) {
        uniqueSet.add(`ip_${view.viewer_ip}`);
      }
    });

    // Get views by day
    const viewsByDay = await this.getViewsByDay(storyId);

    return {
      story_id: storyId,
      view_count: viewCount || 0,
      unique_viewers: uniqueSet.size,
      views_by_day: viewsByDay
    };
  }

  /**
   * Gets views grouped by day
   */
  static async getViewsByDay(storyId: string): Promise<Array<{ date: string; count: number }>> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('story_views')
      .select('viewed_at')
      .eq('story_id', storyId)
      .order('viewed_at', { ascending: true });

    if (error || !data) {
      console.error('Error fetching views by day:', error);
      return [];
    }

    // Group by date
    const viewsByDate = new Map<string, number>();
    data.forEach(view => {
      const date = new Date(view.viewed_at).toISOString().split('T')[0];
      viewsByDate.set(date, (viewsByDate.get(date) || 0) + 1);
    });

    // Convert to array
    return Array.from(viewsByDate.entries()).map(([date, count]) => ({
      date,
      count
    }));
  }

  /**
   * Gets all analytics for a user's stories
   */
  static async getUserStoriesAnalytics(userId: string): Promise<{
    total_stories: number;
    total_views: number;
    active_stories: number;
  }> {
    const supabase = await createClient();

    // Get user's stories
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('id, status')
      .eq('user_id', userId);

    if (storiesError || !stories) {
      console.error('Error fetching user stories:', storiesError);
      return {
        total_stories: 0,
        total_views: 0,
        active_stories: 0
      };
    }

    const storyIds = stories.map(s => s.id);
    const activeCount = stories.filter(s => s.status === 'active').length;

    // Get total views for all stories
    const { count: totalViews, error: viewsError } = await supabase
      .from('story_views')
      .select('*', { count: 'exact', head: true })
      .in('story_id', storyIds);

    if (viewsError) {
      console.error('Error counting total views:', viewsError);
    }

    return {
      total_stories: stories.length,
      total_views: totalViews || 0,
      active_stories: activeCount
    };
  }
}
