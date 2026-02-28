import { createClient } from "@/lib/supabase/server";

export interface AnalyticsSummary {
  visitsToday: number;
  visits7Days: number;
  visits30Days: number;
  visits12Months: number;
  clicksByMethod: Record<string, number>;
}

export class AnalyticsService {
  /**
   * Track a profile visit
   */
  static async trackVisit(profileId: string, fingerprint: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("analytics_events")
      .insert({
        profile_id: profileId,
        event_type: "visit",
        visitor_fingerprint: fingerprint,
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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Get visits for different time periods
    const [todayVisits, sevenDayVisits, thirtyDayVisits, twelveMonthVisits, clicks] =
      await Promise.all([
        // Visits today
        supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", profileId)
          .eq("event_type", "visit")
          .gte("created_at", today.toISOString()),

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
}
