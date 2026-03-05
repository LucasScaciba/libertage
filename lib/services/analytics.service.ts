import { createClient } from "@/lib/supabase/server";

export interface AnalyticsSummary {
  visitsToday: number;
  visits7Days: number;
  visits30Days: number;
  visits12Months: number;
  clicksByMethod: Record<string, number>;
}

export interface VisitsByDate {
  date: string;
  mobile: number;
  desktop: number;
  tablet: number;
}

export interface MediaView {
  media_id: string;
  thumbnail_url: string;
  filename: string;
  media_type: 'photo' | 'video';
  view_count: number;
}

export interface SocialClick {
  social_network: string;
  click_count: number;
}

export interface StoryView {
  story_id: string;
  thumbnail_url: string;
  video_url: string;
  view_count: number;
}

export interface VisitByDay {
  day_of_week: number; // 0-6 (Sunday-Saturday)
  visit_count: number;
}

export interface VisitByState {
  state: string;
  visit_count: number;
}

export interface VisibilityRank {
  percentile: number; // 0-100
  category: 'top_10' | 'top_20' | 'top_30' | 'below_30';
  message: string;
}

export interface ContactChannel {
  channel: 'whatsapp' | 'telegram';
  contact_count: number;
}

export class AnalyticsService {
  /**
   * Track a profile visit
   */
  static async trackVisit(
    profileId: string, 
    fingerprint: string, 
    deviceType?: string,
    state?: string
  ): Promise<void> {
    const supabase = await createClient();

    const metadata: Record<string, string> = {};
    if (state) {
      metadata.state = state;
    }

    const { error } = await supabase
      .from("analytics_events")
      .insert({
        profile_id: profileId,
        event_type: "visit",
        visitor_fingerprint: fingerprint,
        device_type: deviceType || null,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
      });

    if (error) {
      console.error("Error tracking visit:", error);
      // Don't throw - analytics failures shouldn't break user experience
    }
  }

  /**
   * Track a contact button click
   */
  static async trackContactClick(
    profileId: string,
    method: string,
    fingerprint: string
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("analytics_events")
      .insert({
        profile_id: profileId,
        event_type: "contact_click",
        contact_method: method,
        visitor_fingerprint: fingerprint,
      });

    if (error) {
      console.error("Error tracking contact click:", error);
      // Don't throw - analytics failures shouldn't break user experience
    }
  }

  /**
   * Get analytics summary for a profile with aggregations by period
   */
  static async getAnalyticsSummary(profileId: string): Promise<AnalyticsSummary> {
    const supabase = await createClient();

    const now = new Date();
    
    // Start of today (midnight)
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Get visits for different time periods
    const [todayVisits, sevenDayVisits, thirtyDayVisits, twelveMonthVisits, clicks] =
      await Promise.all([
        // Visits today (since midnight)
        supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", profileId)
          .eq("event_type", "visit")
          .gte("created_at", startOfToday.toISOString()),

        // Visits last 7 days
        supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", profileId)
          .eq("event_type", "visit")
          .gte("created_at", sevenDaysAgo.toISOString()),

        // Visits last 30 days
        supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", profileId)
          .eq("event_type", "visit")
          .gte("created_at", thirtyDaysAgo.toISOString()),

        // Visits last 12 months
        supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", profileId)
          .eq("event_type", "visit")
          .gte("created_at", twelveMonthsAgo.toISOString()),

        // All contact clicks (for grouping by method)
        supabase
          .from("analytics_events")
          .select("contact_method")
          .eq("profile_id", profileId)
          .eq("event_type", "contact_click"),
      ]);

    // Group clicks by method
    const clicksByMethod: Record<string, number> = {};
    if (clicks.data) {
      for (const click of clicks.data) {
        const method = click.contact_method || "unknown";
        clicksByMethod[method] = (clicksByMethod[method] || 0) + 1;
      }
    }

    return {
      visitsToday: todayVisits.count || 0,
      visits7Days: sevenDayVisits.count || 0,
      visits30Days: thirtyDayVisits.count || 0,
      visits12Months: twelveMonthVisits.count || 0,
      clicksByMethod,
    };
  }

  /**
   * Get visits by date and device type for charts
   */
  static async getVisitsByDate(profileId: string, days: number = 90): Promise<VisitsByDate[]> {
    const supabase = await createClient();

    const now = new Date();
    const startDate = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0); // Start of the first day

    // Try to fetch with device_type first
    let { data, error } = await supabase
      .from("analytics_events")
      .select("created_at, device_type")
      .eq("profile_id", profileId)
      .eq("event_type", "visit")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    // If device_type column doesn't exist, fetch without it
    if (error && error.message?.includes("device_type")) {
      const result = await supabase
        .from("analytics_events")
        .select("created_at")
        .eq("profile_id", profileId)
        .eq("event_type", "visit")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });
      
      // Add device_type as null for compatibility
      data = result.data?.map(item => ({ ...item, device_type: null })) || null;
      error = result.error;
    }

    if (error) {
      console.error("Error fetching visits by date:", error);
      return [];
    }

    // Group by date and device type
    const visitsByDate: Record<string, { mobile: number; desktop: number; tablet: number }> = {};

    for (const visit of data || []) {
      const date = new Date(visit.created_at).toISOString().split("T")[0];
      
      if (!visitsByDate[date]) {
        visitsByDate[date] = { mobile: 0, desktop: 0, tablet: 0 };
      }

      const deviceType = visit.device_type || "desktop"; // Default to desktop if not set
      if (deviceType === "mobile") {
        visitsByDate[date].mobile++;
      } else if (deviceType === "tablet") {
        visitsByDate[date].tablet++;
      } else {
        visitsByDate[date].desktop++;
      }
    }

    // Convert to array and fill missing dates with zeros
    const result: VisitsByDate[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];

      result.push({
        date: dateStr,
        mobile: visitsByDate[dateStr]?.mobile || 0,
        desktop: visitsByDate[dateStr]?.desktop || 0,
        tablet: visitsByDate[dateStr]?.tablet || 0,
      });
    }

    return result;
  }

  /**
   * Track a media view
   */
  static async trackMediaView(
    profileId: string,
    mediaId: string,
    fingerprint: string
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("analytics_events")
      .insert({
        profile_id: profileId,
        event_type: "media_view",
        visitor_fingerprint: fingerprint,
        metadata: { media_id: mediaId },
      });

    if (error) {
      console.error("Error tracking media view:", error);
      // Don't throw - analytics failures shouldn't break user experience
    }
  }

  /**
   * Track a social link click
   */
  static async trackSocialClick(
    profileId: string,
    socialNetwork: string,
    fingerprint: string
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("analytics_events")
      .insert({
        profile_id: profileId,
        event_type: "social_link_click",
        visitor_fingerprint: fingerprint,
        metadata: { social_network: socialNetwork },
      });

    if (error) {
      console.error("Error tracking social click:", error);
      // Don't throw - analytics failures shouldn't break user experience
    }
  }

  /**
   * Track a story view
   */
  static async trackStoryView(
    profileId: string,
    storyId: string,
    fingerprint: string
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("analytics_events")
      .insert({
        profile_id: profileId,
        event_type: "story_view",
        visitor_fingerprint: fingerprint,
        metadata: { story_id: storyId },
      });

    if (error) {
      console.error("Error tracking story view:", error);
      // Don't throw - analytics failures shouldn't break user experience
    }
  }

  /**
   * Get media views with thumbnails (top 10)
   */
  static async getMediaViews(profileId: string): Promise<MediaView[]> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_media_views', {
      p_profile_id: profileId
    });

    if (error) {
      console.error("Error fetching media views:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Get social clicks aggregated by network
   */
  static async getSocialClicks(profileId: string): Promise<SocialClick[]> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_social_clicks', {
      p_profile_id: profileId
    });

    if (error) {
      console.error("Error fetching social clicks:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Get story views with thumbnails (top 10)
   */
  static async getStoryViews(profileId: string): Promise<StoryView[]> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_story_views', {
      p_profile_id: profileId
    });

    if (error) {
      console.error("Error fetching story views:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Get visits by day of week (last 90 days)
   */
  static async getVisitsByDay(profileId: string): Promise<VisitByDay[]> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_visits_by_day', {
      p_profile_id: profileId
    });

    if (error) {
      console.error("Error fetching visits by day:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Get visits by state (last 90 days)
   */
  static async getVisitsByState(profileId: string): Promise<VisitByState[]> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_visits_by_state', {
      p_profile_id: profileId
    });

    if (error) {
      console.error("Error fetching visits by state:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Get visibility rank (percentile and category)
   */
  static async getVisibilityRank(profileId: string): Promise<VisibilityRank | null> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_visibility_rank', {
      p_profile_id: profileId
    });

    if (error) {
      console.error("Error fetching visibility rank:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0];
  }

  /**
   * Get contact channels with click counts
   */
  static async getContactChannels(profileId: string): Promise<ContactChannel[]> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_contact_channels', {
      p_profile_id: profileId
    });

    if (error) {
      console.error("Error fetching contact channels:", error);
      return [];
    }

    return data || [];
  }
}
